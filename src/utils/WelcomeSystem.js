const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const Utils = require('./utils');
const Guild = require('../schemas/Guild');

class WelcomeSystem {
    /**
     * Handle member join event
     * @param {GuildMember} member - The member who joined
     * @param {Client} client - Discord client
     */
    static async handleMemberJoin(member, client) {
        try {
            client.logger?.debug(`Handling member join for ${member.user.tag} in ${member.guild.name}`);
            
            const guildData = await Utils.getGuildData(member.guild.id, member.guild.name);
            
            if (!guildData) {
                client.logger?.warn(`No guild data found for ${member.guild.name} (${member.guild.id})`);
                return;
            }
            
            if (!guildData.welcomeSystem?.welcome?.enabled) {
                client.logger?.debug(`Welcome system disabled for ${member.guild.name}`);
                return;
            }

            const welcomeConfig = guildData.welcomeSystem.welcome;
            
            // Get welcome channel
            const welcomeChannel = member.guild.channels.cache.get(welcomeConfig.channelId);
            if (!welcomeChannel) {
                client.logger?.warn(`Welcome channel not found for ${member.guild.name}. Channel ID: ${welcomeConfig.channelId}`);
                return;
            }

            // Get inviter information
            const inviter = await this.getInviter(member, client);

            // Create welcome message/embed
            const welcomeData = await this.createWelcomeMessage(member, guildData, inviter);

            // Send welcome message
            const sentMessage = await welcomeChannel.send(welcomeData);
            client.logger?.info(`Sent welcome message for ${member.user.tag} in ${member.guild.name} to #${welcomeChannel.name}`);

            // Delete after specified time if configured
            if (welcomeConfig.deleteAfter > 0) {
                setTimeout(async () => {
                    try {
                        await sentMessage.delete();
                        client.logger?.debug(`Deleted welcome message for ${member.user.tag} after ${welcomeConfig.deleteAfter}s`);
                    } catch (error) {
                        // Message might already be deleted
                    }
                }, welcomeConfig.deleteAfter * 1000);
            }

            // Send DM welcome if enabled
            if (guildData.welcomeSystem.dmWelcome.enabled) {
                await this.sendDMWelcome(member, guildData);
            }

        } catch (error) {
            client.logger?.error(`Error handling member join for ${member.user.tag} in ${member.guild.name}:`, error);
        }
    }

    /**
     * Handle member leave event
     * @param {GuildMember} member - The member who left
     * @param {Client} client - Discord client
     */
    static async handleMemberLeave(member, client) {
        try {
            client.logger?.debug(`Handling member leave for ${member.user.tag} in ${member.guild.name}`);
            
            const guildData = await Utils.getGuildData(member.guild.id);
            
            if (!guildData) {
                client.logger?.warn(`No guild data found for ${member.guild.name} (${member.guild.id})`);
                return;
            }
            
            if (!guildData.welcomeSystem?.leave?.enabled) {
                client.logger?.debug(`Leave system disabled for ${member.guild.name}`);
                return;
            }

            const leaveConfig = guildData.welcomeSystem.leave;
            
            // Get leave channel
            const leaveChannel = member.guild.channels.cache.get(leaveConfig.channelId);
            if (!leaveChannel) {
                client.logger?.warn(`Leave channel not found for ${member.guild.name}. Channel ID: ${leaveConfig.channelId}`);
                return;
            }

            // Create leave message/embed
            const leaveData = await this.createLeaveMessage(member, guildData);

            // Send leave message
            const sentMessage = await leaveChannel.send(leaveData);
            client.logger?.info(`Sent leave message for ${member.user.tag} in ${member.guild.name} to #${leaveChannel.name}`);

            // Delete after specified time if configured
            if (leaveConfig.deleteAfter > 0) {
                setTimeout(async () => {
                    try {
                        await sentMessage.delete();
                        client.logger?.debug(`Deleted leave message for ${member.user.tag} after ${leaveConfig.deleteAfter}s`);
                    } catch (error) {
                        // Message might already be deleted
                    }
                }, leaveConfig.deleteAfter * 1000);
            }

        } catch (error) {
            client.logger?.error(`Error handling member leave for ${member.user.tag} in ${member.guild.name}:`, error);
        }
    }

    /**
     * Create welcome message/embed
     * @param {GuildMember} member - The member who joined
     * @param {Object} guildData - Guild configuration data
     * @param {Object} inviter - Inviter information
     */
    static async createWelcomeMessage(member, guildData, inviter) {
        const welcomeConfig = guildData.welcomeSystem.welcome;
        
        // Replace placeholders in message
        const message = this.replacePlaceholders(welcomeConfig.message, member, member.guild, inviter);

        if (!welcomeConfig.embedEnabled) {
            return {
                content: welcomeConfig.mentionUser ? `${member.user} ${message}` : message
            };
        }

        // Create embed
        const embed = new EmbedBuilder()
            .setColor(welcomeConfig.embedColor || '#57F287')
            .setTitle('🎉 Welcome to the Server!')
            .setDescription(message)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setTimestamp();

        // Add user information fields
        const fields = [];

        // Basic user info
        fields.push({
            name: '👤 User Information',
            value: [
                `**Username:** ${member.user.tag}`,
                `**Display Name:** ${member.displayName}`,
                `**ID:** ${member.user.id}`,
                `**Bot:** ${member.user.bot ? 'Yes' : 'No'}`
            ].join('\n'),
            inline: true
        });

        // Account age
        if (welcomeConfig.showAccountAge) {
            const accountAge = this.getAccountAge(member.user.createdAt);
            fields.push({
                name: '📅 Account Created',
                value: [
                    `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
                    `*${accountAge} ago*`
                ].join('\n'),
                inline: true
            });
        }

        // Join position
        if (welcomeConfig.showJoinPosition) {
            const joinPosition = member.guild.memberCount;
            fields.push({
                name: '📊 Member Count',
                value: [
                    `**Join Position:** #${joinPosition}`,
                    `**Total Members:** ${member.guild.memberCount}`
                ].join('\n'),
                inline: true
            });
        }

        // Inviter information
        if (welcomeConfig.showInviter && inviter) {
            fields.push({
                name: '💌 Invited By',
                value: [
                    `**User:** ${inviter.inviter.tag}`,
                    `**Invite Code:** ${inviter.code}`,
                    `**Uses:** ${inviter.uses || 'Unknown'}`
                ].join('\n'),
                inline: true
            });
        }

        // Server information
        fields.push({
            name: '🏠 Server Information',
            value: [
                `**Server:** ${member.guild.name}`,
                `**Created:** <t:${Math.floor(member.guild.createdTimestamp / 1000)}:R>`,
                `**Owner:** ${member.guild.ownerId ? `<@${member.guild.ownerId}>` : 'Unknown'}`
            ].join('\n'),
            inline: false
        });

        embed.addFields(fields);

        // Set server icon as footer
        if (member.guild.iconURL()) {
            embed.setFooter({
                text: member.guild.name,
                iconURL: member.guild.iconURL({ dynamic: true })
            });
        }

        return {
            content: welcomeConfig.mentionUser ? `${member.user}` : undefined,
            embeds: [embed]
        };
    }

    /**
     * Create leave message/embed
     * @param {GuildMember} member - The member who left
     * @param {Object} guildData - Guild configuration data
     */
    static async createLeaveMessage(member, guildData) {
        const leaveConfig = guildData.welcomeSystem.leave;
        
        // Replace placeholders in message
        const message = this.replacePlaceholders(leaveConfig.message, member, member.guild);

        if (!leaveConfig.embedEnabled) {
            return { content: message };
        }

        // Create embed
        const embed = new EmbedBuilder()
            .setColor(leaveConfig.embedColor || '#ED4245')
            .setTitle('👋 Member Left')
            .setDescription(message)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setTimestamp();

        // Add user information fields
        const fields = [];

        // Basic user info
        fields.push({
            name: '👤 User Information',
            value: [
                `**Username:** ${member.user.tag}`,
                `**Display Name:** ${member.displayName}`,
                `**ID:** ${member.user.id}`
            ].join('\n'),
            inline: true
        });

        // Account age
        if (leaveConfig.showAccountAge) {
            const accountAge = this.getAccountAge(member.user.createdAt);
            fields.push({
                name: '📅 Account Created',
                value: [
                    `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
                    `*${accountAge} ago*`
                ].join('\n'),
                inline: true
            });
        }

        // Join date and time in server
        if (leaveConfig.showJoinDate && member.joinedAt) {
            fields.push({
                name: '📈 Joined Server',
                value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`,
                inline: true
            });
        }

        if (leaveConfig.showTimeInServer && member.joinedAt) {
            const timeInServer = Date.now() - member.joinedTimestamp;
            const timeFormatted = Utils.formatDuration(timeInServer);
            fields.push({
                name: '⏱️ Time in Server',
                value: timeFormatted,
                inline: true
            });
        }

        // Server stats
        fields.push({
            name: '📊 Server Stats',
            value: [
                `**Members Left:** ${member.guild.memberCount}`,
                `**Server:** ${member.guild.name}`
            ].join('\n'),
            inline: false
        });

        embed.addFields(fields);

        // Set server icon as footer
        if (member.guild.iconURL()) {
            embed.setFooter({
                text: member.guild.name,
                iconURL: member.guild.iconURL({ dynamic: true })
            });
        }

        return { embeds: [embed] };
    }

    /**
     * Send DM welcome message to user
     * @param {GuildMember} member - The member who joined
     * @param {Object} guildData - Guild configuration data
     */
    static async sendDMWelcome(member, guildData) {
        try {
            const dmConfig = guildData.welcomeSystem.dmWelcome;
            const message = this.replacePlaceholders(dmConfig.message, member, member.guild);

            if (!dmConfig.embedEnabled) {
                await member.send({ content: message });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(dmConfig.embedColor || '#5865F2')
                .setTitle(`Welcome to ${member.guild.name}!`)
                .setDescription(message)
                .setThumbnail(member.guild.iconURL({ dynamic: true }))
                .setTimestamp();

            await member.send({ embeds: [embed] });

        } catch (error) {
            // User might have DMs disabled, ignore error
        }
    }

    /**
     * Get inviter information for a member
     * @param {GuildMember} member - The member who joined
     * @param {Client} client - Discord client
     */
    static async getInviter(member, client) {
        try {
            // Get cached invites before member joined
            const cachedInvites = client.inviteCache?.get(member.guild.id) || new Map();
            
            // Get current invites
            const currentInvites = await member.guild.invites.fetch();
            
            // Compare to find which invite was used
            for (const [code, currentInvite] of currentInvites) {
                const cachedInvite = cachedInvites.get(code);
                
                if (cachedInvite && currentInvite.uses > cachedInvite.uses) {
                    // Update cache
                    if (!client.inviteCache) client.inviteCache = new Map();
                    if (!client.inviteCache.has(member.guild.id)) {
                        client.inviteCache.set(member.guild.id, new Map());
                    }
                    client.inviteCache.get(member.guild.id).set(code, {
                        uses: currentInvite.uses,
                        inviter: currentInvite.inviter
                    });

                    return {
                        code: currentInvite.code,
                        inviter: currentInvite.inviter,
                        uses: currentInvite.uses
                    };
                }
            }

            // Update cache with current invites
            if (!client.inviteCache) client.inviteCache = new Map();
            if (!client.inviteCache.has(member.guild.id)) {
                client.inviteCache.set(member.guild.id, new Map());
            }
            
            for (const [code, invite] of currentInvites) {
                client.inviteCache.get(member.guild.id).set(code, {
                    uses: invite.uses,
                    inviter: invite.inviter
                });
            }

            return null;

        } catch (error) {
            return null;
        }
    }

    /**
     * Replace placeholders in messages
     * @param {string} text - Text with placeholders
     * @param {GuildMember} member - Member object
     * @param {Guild} guild - Guild object
     * @param {Object} inviter - Inviter information
     */
    static replacePlaceholders(text, member, guild, inviter = null) {
        if (!text) return '';

        return text
            .replace(/\{user\.mention\}/g, member.toString())
            .replace(/\{user\.tag\}/g, member.user.tag)
            .replace(/\{user\.username\}/g, member.user.username)
            .replace(/\{user\.displayName\}/g, member.displayName)
            .replace(/\{user\.id\}/g, member.user.id)
            .replace(/\{guild\.name\}/g, guild.name)
            .replace(/\{guild\.memberCount\}/g, guild.memberCount.toString())
            .replace(/\{guild\.id\}/g, guild.id)
            .replace(/\{inviter\.tag\}/g, inviter?.inviter?.tag || 'Unknown')
            .replace(/\{inviter\.mention\}/g, inviter?.inviter ? `<@${inviter.inviter.id}>` : 'Unknown')
            .replace(/\{invite\.code\}/g, inviter?.code || 'Unknown')
            .replace(/\{invite\.uses\}/g, inviter?.uses?.toString() || 'Unknown');
    }

    /**
     * Get account age in a human readable format
     * @param {Date} createdAt - Account creation date
     */
    static getAccountAge(createdAt) {
        const now = new Date();
        const diffInMilliseconds = now - createdAt;
        
        const years = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24 * 365));
        const months = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24 * 30));
        const days = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
        const minutes = Math.floor(diffInMilliseconds / (1000 * 60));

        if (years > 0) {
            return `${years} year${years !== 1 ? 's' : ''}`;
        } else if (months > 0) {
            return `${months} month${months !== 1 ? 's' : ''}`;
        } else if (days > 0) {
            return `${days} day${days !== 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Initialize invite cache for a guild
     * @param {Guild} guild - Discord guild
     * @param {Client} client - Discord client
     */
    static async initializeInviteCache(guild, client) {
        try {
            const invites = await guild.invites.fetch();
            
            if (!client.inviteCache) client.inviteCache = new Map();
            if (!client.inviteCache.has(guild.id)) {
                client.inviteCache.set(guild.id, new Map());
            }

            for (const [code, invite] of invites) {
                client.inviteCache.get(guild.id).set(code, {
                    uses: invite.uses,
                    inviter: invite.inviter
                });
            }

        } catch (error) {
            // Guild might not have MANAGE_GUILD permission
        }
    }
}

module.exports = WelcomeSystem;
