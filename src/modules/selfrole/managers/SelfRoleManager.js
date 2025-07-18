const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const SelfRole = require('../../../schemas/SelfRole');
const logger = require('../../../utils/logger');

class SelfRoleManager {
    constructor(client) {
        this.client = client;
        // Don't setup interaction handlers directly - let the button handler route to us
    }

    async handleSelfRoleInteraction(interaction) {
        try {
            const [, action, messageId, roleId] = interaction.customId.split('_');
            
            if (action !== 'toggle') return;

            await interaction.deferReply({ ephemeral: true });

            const selfRoleData = await SelfRole.findOne({ messageId });
            if (!selfRoleData) {
                return await interaction.editReply({
                    content: '❌ Self-role configuration not found. This message may be outdated.',
                    ephemeral: true
                });
            }

            const role = selfRoleData.roles.find(r => r.roleId === roleId);
            if (!role) {
                return await interaction.editReply({
                    content: '❌ Role not found in configuration.',
                    ephemeral: true
                });
            }

            const member = interaction.member;
            const guildRole = interaction.guild.roles.cache.get(roleId);

            if (!guildRole) {
                return await interaction.editReply({
                    content: '❌ Role no longer exists in this server.',
                    ephemeral: true
                });
            }

            const hasRole = member.roles.cache.has(roleId);
            
            if (hasRole) {
                // Remove role
                if (!selfRoleData.settings.allowRoleRemoval) {
                    return await interaction.editReply({
                        content: '❌ Role removal is disabled for this self-role menu.',
                        ephemeral: true
                    });
                }

                try {
                    await member.roles.remove(guildRole, 'Self-role removal');
                    selfRoleData.decrementRoleAssignment(roleId);
                    selfRoleData.updateUserStats(member.id);
                    await selfRoleData.save();

                    await interaction.editReply({
                        content: `✅ Successfully removed the **${guildRole.name}** role!`,
                        ephemeral: selfRoleData.settings.ephemeralResponse
                    });

                    await this.logRoleAction(interaction.guild, member, guildRole, 'removed', selfRoleData);
                } catch (error) {
                    logger.error('Error removing self-role:', error);
                    await interaction.editReply({
                        content: '❌ Failed to remove role. I may not have sufficient permissions.',
                        ephemeral: true
                    });
                }
            } else {
                // Add role
                const canAssign = selfRoleData.canUserAssignRole(member.id, roleId, member.roles.cache);
                if (!canAssign.allowed) {
                    return await interaction.editReply({
                        content: `❌ Cannot assign role: ${canAssign.reason}`,
                        ephemeral: true
                    });
                }

                try {
                    await member.roles.add(guildRole, 'Self-role assignment');
                    selfRoleData.incrementRoleAssignment(roleId);
                    selfRoleData.updateUserStats(member.id);
                    await selfRoleData.save();

                    await interaction.editReply({
                        content: `✅ Successfully assigned the **${guildRole.name}** role!`,
                        ephemeral: selfRoleData.settings.ephemeralResponse
                    });

                    await this.logRoleAction(interaction.guild, member, guildRole, 'assigned', selfRoleData);
                } catch (error) {
                    logger.error('Error assigning self-role:', error);
                    await interaction.editReply({
                        content: '❌ Failed to assign role. I may not have sufficient permissions.',
                        ephemeral: true
                    });
                }
            }

            // Update the original message if needed (refresh button states, etc.)
            await this.updateSelfRoleMessage(selfRoleData);

        } catch (error) {
            logger.error('Error handling self-role interaction:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred while processing your request.',
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: '❌ An error occurred while processing your request.',
                    ephemeral: true
                });
            }
        }
    }

    async createSelfRoleMessage(guildId, channelId, data) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) throw new Error('Channel not found');

            const embed = this.buildSelfRoleEmbed(data);
            const components = this.buildSelfRoleComponents(data, null);

            const message = await channel.send({
                embeds: [embed],
                components
            });

            // Save to database
            const selfRoleData = new SelfRole({
                guildId,
                messageId: message.id,
                channelId,
                title: data.title,
                description: data.description,
                color: data.color || '#0099ff',
                roles: data.roles || [],
                settings: data.settings || {},
                createdBy: data.createdBy
            });

            await selfRoleData.save();
            return { success: true, message, data: selfRoleData };

        } catch (error) {
            logger.error('Error creating self-role message:', error);
            return { success: false, error: error.message };
        }
    }

    async updateSelfRoleMessage(selfRoleData) {
        try {
            const channel = await this.client.channels.fetch(selfRoleData.channelId);
            if (!channel) return;

            const message = await channel.messages.fetch(selfRoleData.messageId);
            if (!message) return;

            const embed = this.buildSelfRoleEmbed(selfRoleData);
            const components = this.buildSelfRoleComponents(selfRoleData, message.id);

            await message.edit({
                embeds: [embed],
                components
            });

        } catch (error) {
            logger.error('Error updating self-role message:', error);
        }
    }

    buildSelfRoleEmbed(data) {
        const embed = new EmbedBuilder()
            .setTitle(data.title)
            .setDescription(data.description)
            .setColor(data.color || '#0099ff')
            .setTimestamp();

        if (data.roles && data.roles.length > 0) {
            const roleList = data.roles
                .sort((a, b) => a.position - b.position)
                .map(role => {
                    let roleText = `${role.emoji || '•'} **${role.label}**`;
                    if (role.description) roleText += ` - ${role.description}`;
                    if (role.maxAssignments) {
                        roleText += ` (${role.currentAssignments}/${role.maxAssignments})`;
                    }
                    return roleText;
                })
                .join('\n');

            embed.addFields({
                name: '📋 Available Roles',
                value: roleList || 'No roles configured',
                inline: false
            });

            if (data.settings) {
                const settingsText = [];
                if (data.settings.maxRolesPerUser) {
                    settingsText.push(`Max roles per user: ${data.settings.maxRolesPerUser}`);
                }
                if (!data.settings.allowRoleRemoval) {
                    settingsText.push('Role removal disabled');
                }
                if (data.settings.requireConfirmation) {
                    settingsText.push('Confirmation required');
                }

                if (settingsText.length > 0) {
                    embed.addFields({
                        name: '⚙️ Settings',
                        value: settingsText.join('\n'),
                        inline: true
                    });
                }
            }
        }

        embed.setFooter({
            text: 'Click the buttons below to toggle roles • Self-Role System'
        });

        return embed;
    }

    buildSelfRoleComponents(data, messageId) {
        if (!data.roles || data.roles.length === 0) return [];

        const components = [];
        const sortedRoles = data.roles.sort((a, b) => a.position - b.position);
        
        // Discord allows max 5 buttons per row, max 5 rows
        for (let i = 0; i < sortedRoles.length; i += 5) {
            const row = new ActionRowBuilder();
            const rowRoles = sortedRoles.slice(i, i + 5);

            for (const role of rowRoles) {
                const button = new ButtonBuilder()
                    .setCustomId(`selfrole_toggle_${messageId || 'temp'}_${role.roleId}`)
                    .setLabel(role.label)
                    .setStyle(this.getButtonStyle(role.style));

                if (role.emoji) {
                    // Check if emoji is custom or unicode
                    if (role.emoji.match(/^<:\w+:\d+>$/)) {
                        const emojiId = role.emoji.match(/:(\d+)>/)[1];
                        button.setEmoji(emojiId);
                    } else {
                        button.setEmoji(role.emoji);
                    }
                }

                // Disable button if role is at max capacity
                if (role.maxAssignments && role.currentAssignments >= role.maxAssignments) {
                    button.setDisabled(true);
                }

                row.addComponents(button);
            }

            components.push(row);
        }

        return components;
    }

    getButtonStyle(style) {
        switch (style) {
            case 'Primary': return ButtonStyle.Primary;
            case 'Secondary': return ButtonStyle.Secondary;
            case 'Success': return ButtonStyle.Success;
            case 'Danger': return ButtonStyle.Danger;
            default: return ButtonStyle.Primary;
        }
    }

    async deleteSelfRoleMessage(messageId) {
        try {
            const selfRoleData = await SelfRole.findOne({ messageId });
            if (!selfRoleData) return { success: false, error: 'Self-role configuration not found' };

            const channel = await this.client.channels.fetch(selfRoleData.channelId);
            if (channel) {
                try {
                    const message = await channel.messages.fetch(messageId);
                    if (message) await message.delete();
                } catch (error) {
                    // Message might already be deleted
                    logger.warn('Could not delete self-role message:', error.message);
                }
            }

            await SelfRole.deleteOne({ messageId });
            return { success: true };

        } catch (error) {
            logger.error('Error deleting self-role message:', error);
            return { success: false, error: error.message };
        }
    }

    async getSelfRoleMessages(guildId) {
        try {
            return await SelfRole.find({ guildId }).sort({ createdAt: -1 });
        } catch (error) {
            logger.error('Error fetching self-role messages:', error);
            return [];
        }
    }

    async getSelfRoleStats(guildId, messageId = null) {
        try {
            const query = messageId ? { guildId, messageId } : { guildId };
            const selfRoles = await SelfRole.find(query);

            if (selfRoles.length === 0) return null;

            const stats = {
                totalMessages: selfRoles.length,
                totalRoles: selfRoles.reduce((sum, sr) => sum + sr.roles.length, 0),
                totalInteractions: selfRoles.reduce((sum, sr) => sum + sr.statistics.totalInteractions, 0),
                uniqueUsers: new Set(),
                mostPopularRoles: {},
                recentActivity: []
            };

            selfRoles.forEach(sr => {
                sr.statistics.uniqueUsers.forEach(user => stats.uniqueUsers.add(user.userId));
                sr.statistics.roleAssignments.forEach(role => {
                    if (!stats.mostPopularRoles[role.roleId]) {
                        stats.mostPopularRoles[role.roleId] = { assigned: 0, removed: 0 };
                    }
                    stats.mostPopularRoles[role.roleId].assigned += role.assigned;
                    stats.mostPopularRoles[role.roleId].removed += role.removed;
                });
            });

            stats.uniqueUsers = stats.uniqueUsers.size;

            return stats;
        } catch (error) {
            logger.error('Error getting self-role stats:', error);
            return null;
        }
    }

    async logRoleAction(guild, member, role, action, selfRoleData) {
        if (!selfRoleData.settings.logChannel) return;

        try {
            const logChannel = guild.channels.cache.get(selfRoleData.settings.logChannel);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setTitle(`Self-Role ${action.charAt(0).toUpperCase() + action.slice(1)}`)
                .setColor(action === 'assigned' ? '#00ff00' : '#ff6b6b')
                .addFields(
                    { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
                    { name: 'Role', value: `${role.name} (${role.id})`, inline: true },
                    { name: 'Action', value: action, inline: true },
                    { name: 'Message ID', value: selfRoleData.messageId, inline: true }
                )
                .setTimestamp()
                .setThumbnail(member.user.displayAvatarUrl());

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            logger.error('Error logging self-role action:', error);
        }
    }

    async cleanupInvalidRoles(guildId) {
        try {
            const selfRoles = await SelfRole.find({ guildId });
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return;

            let cleanedCount = 0;

            for (const selfRole of selfRoles) {
                let hasChanges = false;
                const validRoles = [];

                for (const role of selfRole.roles) {
                    const guildRole = guild.roles.cache.get(role.roleId);
                    if (guildRole) {
                        validRoles.push(role);
                    } else {
                        hasChanges = true;
                        cleanedCount++;
                    }
                }

                if (hasChanges) {
                    selfRole.roles = validRoles;
                    await selfRole.save();
                    await this.updateSelfRoleMessage(selfRole);
                }
            }

            return cleanedCount;
        } catch (error) {
            logger.error('Error cleaning up invalid roles:', error);
            return 0;
        }
    }
}

module.exports = SelfRoleManager;
