const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, ButtonStyle } = require('discord.js');
const SelfRole = require('../../schemas/SelfRole');

module.exports = {
    category: 'Settings',
    permissions: [PermissionFlagsBits.ManageGuild],
    data: new SlashCommandBuilder()
        .setName('selfrole')
        .setDescription('Manage self-assignable roles with buttons')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new self-role message')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to send the self-role message')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('title')
                        .setDescription('Title for the self-role embed')
                        .setRequired(true)
                        .setMaxLength(256)
                )
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('Description for the self-role embed')
                        .setRequired(true)
                        .setMaxLength(4096)
                )
                .addStringOption(option =>
                    option
                        .setName('color')
                        .setDescription('Hex color for the embed (e.g., #ff0000)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-role')
                .setDescription('Add a role to an existing self-role message')
                .addStringOption(option =>
                    option
                        .setName('message-id')
                        .setDescription('ID of the self-role message')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to add')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('label')
                        .setDescription('Button label for this role')
                        .setRequired(true)
                        .setMaxLength(80)
                )
                .addStringOption(option =>
                    option
                        .setName('emoji')
                        .setDescription('Emoji for the button (optional)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('style')
                        .setDescription('Button style')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Primary (Blue)', value: 'Primary' },
                            { name: 'Secondary (Gray)', value: 'Secondary' },
                            { name: 'Success (Green)', value: 'Success' },
                            { name: 'Danger (Red)', value: 'Danger' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('Role description (shown in embed)')
                        .setRequired(false)
                        .setMaxLength(100)
                )
                .addIntegerOption(option =>
                    option
                        .setName('position')
                        .setDescription('Button position (0 = first)')
                        .setRequired(false)
                        .setMinValue(0)
                        .setMaxValue(24)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-role')
                .setDescription('Remove a role from a self-role message')
                .addStringOption(option =>
                    option
                        .setName('message-id')
                        .setDescription('ID of the self-role message')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to remove')  
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing self-role message')
                .addStringOption(option =>
                    option
                        .setName('message-id')
                        .setDescription('ID of the self-role message')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('title')
                        .setDescription('New title for the embed')
                        .setRequired(false)
                        .setMaxLength(256)
                )
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('New description for the embed')
                        .setRequired(false)
                        .setMaxLength(4096)
                )
                .addStringOption(option =>
                    option
                        .setName('color')
                        .setDescription('New hex color for the embed')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('settings')
                .setDescription('Configure self-role message settings')
                .addStringOption(option =>
                    option
                        .setName('message-id')
                        .setDescription('ID of the self-role message')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('max-roles-per-user')
                        .setDescription('Maximum roles a user can have from this message (0 = unlimited)')
                        .setRequired(false)
                        .setMinValue(0)
                        .setMaxValue(25)
                )
                .addBooleanOption(option =>
                    option
                        .setName('allow-role-removal')
                        .setDescription('Allow users to remove roles they have')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option
                        .setName('ephemeral-response')
                        .setDescription('Make role assignment responses only visible to the user')
                        .setRequired(false)
                )
                .addChannelOption(option =>
                    option
                        .setName('log-channel')
                        .setDescription('Channel to log role assignments/removals')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all self-role messages in this server')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a self-role message')
                .addStringOption(option =>
                    option
                        .setName('message-id')
                        .setDescription('ID of the self-role message to delete')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View self-role statistics')
                .addStringOption(option =>
                    option
                        .setName('message-id')
                        .setDescription('ID of specific message (optional, shows all if not provided)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('cleanup')
                .setDescription('Remove invalid/deleted roles from all self-role messages')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const selfRoleManager = interaction.client.selfRoleManager;

        if (!selfRoleManager) {
            return await interaction.reply({
                content: '❌ Self-role manager is not initialized.',
                ephemeral: true
            });
        }

        try {
            switch (subcommand) {
                case 'create':
                    await this.handleCreate(interaction, selfRoleManager);
                    break;
                case 'add-role':
                    await this.handleAddRole(interaction, selfRoleManager);
                    break;
                case 'remove-role':
                    await this.handleRemoveRole(interaction, selfRoleManager);
                    break;
                case 'edit':
                    await this.handleEdit(interaction, selfRoleManager);
                    break;
                case 'settings':
                    await this.handleSettings(interaction, selfRoleManager);
                    break;
                case 'list':
                    await this.handleList(interaction, selfRoleManager);
                    break;
                case 'delete':
                    await this.handleDelete(interaction, selfRoleManager);
                    break;
                case 'stats':
                    await this.handleStats(interaction, selfRoleManager);
                    break;
                case 'cleanup':
                    await this.handleCleanup(interaction, selfRoleManager);
                    break;
                default:
                    await interaction.reply({
                        content: '❌ Unknown subcommand.',
                        ephemeral: true
                    });
            }
        } catch (error) {
            interaction.client.logger.error('Error in selfrole command:', error);
            const errorMessage = '❌ An error occurred while processing your request.';
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.editReply({ content: errorMessage });
            }
        }
    },

    async handleCreate(interaction, selfRoleManager) {
        const channel = interaction.options.getChannel('channel');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color') || '#0099ff';

        // Validate color format
        if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
            return await interaction.reply({
                content: '❌ Invalid color format. Please use hex format like #ff0000',
                ephemeral: true
            });
        }

        // Check channel permissions
        if (!channel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
            return await interaction.reply({
                content: '❌ I don\'t have permission to send messages in that channel.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const data = {
            title,
            description,
            color,
            roles: [],
            settings: {
                maxRolesPerUser: null,
                allowRoleRemoval: true,
                ephemeralResponse: true,
                logChannel: null
            },
            createdBy: {
                userId: interaction.user.id,
                username: interaction.user.username
            }
        };

        const result = await selfRoleManager.createSelfRoleMessage(
            interaction.guild.id,
            channel.id,
            data
        );

        if (result.success) {
            await interaction.editReply({
                content: `✅ Self-role message created successfully in ${channel}!\n\n` +
                        `**Message ID:** \`${result.message.id}\`\n` +
                        `Use \`/selfrole add-role\` to add roles to this message.`
            });
        } else {
            await interaction.editReply({
                content: `❌ Failed to create self-role message: ${result.error}`
            });
        }
    },

    async handleAddRole(interaction, selfRoleManager) {
        const messageId = interaction.options.getString('message-id');
        const role = interaction.options.getRole('role');
        const label = interaction.options.getString('label');
        const emoji = interaction.options.getString('emoji');
        const style = interaction.options.getString('style') || 'Primary';
        const description = interaction.options.getString('description');
        const position = interaction.options.getInteger('position') || 0;

        await interaction.deferReply({ ephemeral: true });

        // Check if role is manageable
        if (!role.editable) {
            return await interaction.editReply({
                content: '❌ I cannot manage this role. Make sure my role is higher than the target role.'
            });
        }

        // Check if role is @everyone
        if (role.id === interaction.guild.id) {
            return await interaction.editReply({
                content: '❌ Cannot add @everyone role to self-roles.'
            });
        }

        const selfRoleData = await SelfRole.findOne({ messageId, guildId: interaction.guild.id });
        if (!selfRoleData) {
            return await interaction.editReply({
                content: '❌ Self-role message not found. Make sure the message ID is correct.'
            });
        }

        // Check if role already exists
        if (selfRoleData.roles.some(r => r.roleId === role.id)) {
            return await interaction.editReply({
                content: '❌ This role is already added to the self-role message.'
            });
        }

        // Check if we're at the limit (25 buttons max)
        if (selfRoleData.roles.length >= 25) {
            return await interaction.editReply({
                content: '❌ Cannot add more roles. Maximum of 25 buttons per self-role message.'
            });
        }

        const roleData = {
            roleId: role.id,
            roleName: role.name,
            emoji,
            label,
            description,
            style,
            position,
            maxAssignments: null,
            currentAssignments: 0,
            requiredRole: null,
            conflictingRoles: []
        };

        try {
            selfRoleData.addRole(roleData);
            selfRoleData.lastModified = {
                by: {
                    userId: interaction.user.id,
                    username: interaction.user.username
                },
                at: new Date()
            };
            await selfRoleData.save();
            await selfRoleManager.updateSelfRoleMessage(selfRoleData);

            await interaction.editReply({
                content: `✅ Successfully added **${role.name}** to the self-role message!`
            });
        } catch (error) {
            await interaction.editReply({
                content: `❌ Failed to add role: ${error.message}`
            });
        }
    },

    async handleRemoveRole(interaction, selfRoleManager) {
        const messageId = interaction.options.getString('message-id');
        const role = interaction.options.getRole('role');

        await interaction.deferReply({ ephemeral: true });

        const selfRoleData = await SelfRole.findOne({ messageId, guildId: interaction.guild.id });
        if (!selfRoleData) {
            return await interaction.editReply({
                content: '❌ Self-role message not found.'
            });
        }

        try {
            selfRoleData.removeRole(role.id);
            selfRoleData.lastModified = {
                by: {
                    userId: interaction.user.id,
                    username: interaction.user.username
                },
                at: new Date()
            };
            await selfRoleData.save();
            await selfRoleManager.updateSelfRoleMessage(selfRoleData);

            await interaction.editReply({
                content: `✅ Successfully removed **${role.name}** from the self-role message!`
            });
        } catch (error) {
            await interaction.editReply({
                content: `❌ Failed to remove role: ${error.message}`
            });
        }
    },

    async handleEdit(interaction, selfRoleManager) {
        const messageId = interaction.options.getString('message-id');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color');

        await interaction.deferReply({ ephemeral: true });

        if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
            return await interaction.editReply({
                content: '❌ Invalid color format. Please use hex format like #ff0000'
            });
        }

        const selfRoleData = await SelfRole.findOne({ messageId, guildId: interaction.guild.id });
        if (!selfRoleData) {
            return await interaction.editReply({
                content: '❌ Self-role message not found.'
            });
        }

        let changes = [];
        if (title) {
            selfRoleData.title = title;
            changes.push('title');
        }
        if (description) {
            selfRoleData.description = description;
            changes.push('description');
        }
        if (color) {
            selfRoleData.color = color;
            changes.push('color');
        }

        if (changes.length === 0) {
            return await interaction.editReply({
                content: '❌ No changes specified.'
            });
        }

        selfRoleData.lastModified = {
            by: {
                userId: interaction.user.id,
                username: interaction.user.username
            },
            at: new Date()
        };

        await selfRoleData.save();
        await selfRoleManager.updateSelfRoleMessage(selfRoleData);

        await interaction.editReply({
            content: `✅ Successfully updated ${changes.join(', ')} for the self-role message!`
        });
    },

    async handleSettings(interaction, selfRoleManager) {
        const messageId = interaction.options.getString('message-id');
        const maxRoles = interaction.options.getInteger('max-roles-per-user');
        const allowRemoval = interaction.options.getBoolean('allow-role-removal');
        const ephemeral = interaction.options.getBoolean('ephemeral-response');
        const logChannel = interaction.options.getChannel('log-channel');

        await interaction.deferReply({ ephemeral: true });

        const selfRoleData = await SelfRole.findOne({ messageId, guildId: interaction.guild.id });
        if (!selfRoleData) {
            return await interaction.editReply({
                content: '❌ Self-role message not found.'
            });
        }

        let changes = [];
        if (maxRoles !== null) {
            selfRoleData.settings.maxRolesPerUser = maxRoles || null;
            changes.push(`max roles per user: ${maxRoles || 'unlimited'}`);
        }
        if (allowRemoval !== null) {
            selfRoleData.settings.allowRoleRemoval = allowRemoval;
            changes.push(`role removal: ${allowRemoval ? 'enabled' : 'disabled'}`);
        }
        if (ephemeral !== null) {
            selfRoleData.settings.ephemeralResponse = ephemeral;
            changes.push(`ephemeral responses: ${ephemeral ? 'enabled' : 'disabled'}`);
        }
        if (logChannel) {
            if (!logChannel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
                return await interaction.editReply({
                    content: '❌ I don\'t have permission to send messages in that log channel.'
                });
            }
            selfRoleData.settings.logChannel = logChannel.id;
            changes.push(`log channel: ${logChannel}`);
        }

        if (changes.length === 0) {
            return await interaction.editReply({
                content: '❌ No settings specified.'
            });
        }

        selfRoleData.lastModified = {
            by: {
                userId: interaction.user.id,
                username: interaction.user.username
            },
            at: new Date()
        };

        await selfRoleData.save();

        await interaction.editReply({
            content: `✅ Successfully updated settings:\n${changes.map(c => `• ${c}`).join('\n')}`
        });
    },

    async handleList(interaction, selfRoleManager) {
        await interaction.deferReply({ ephemeral: true });

        const selfRoles = await selfRoleManager.getSelfRoleMessages(interaction.guild.id);
        
        if (selfRoles.length === 0) {
            return await interaction.editReply({
                content: '📝 No self-role messages found in this server.'
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('📋 Self-Role Messages')
            .setColor('#0099ff')
            .setDescription(`Found ${selfRoles.length} self-role message(s)`)
            .setTimestamp();

        for (const [index, selfRole] of selfRoles.entries()) {
            const channel = interaction.guild.channels.cache.get(selfRole.channelId);
            const channelName = channel ? `#${channel.name}` : 'Unknown Channel';
            
            embed.addFields({
                name: `${index + 1}. ${selfRole.title}`,
                value: `**ID:** \`${selfRole.messageId}\`\n` +
                       `**Channel:** ${channelName}\n` +
                       `**Roles:** ${selfRole.roles.length}\n` +
                       `**Created:** <t:${Math.floor(selfRole.createdAt.getTime() / 1000)}:R>`,
                inline: true
            });
        }

        await interaction.editReply({ embeds: [embed] });
    },

    async handleDelete(interaction, selfRoleManager) {
        const messageId = interaction.options.getString('message-id');

        await interaction.deferReply({ ephemeral: true });

        const result = await selfRoleManager.deleteSelfRoleMessage(messageId);
        
        if (result.success) {
            await interaction.editReply({
                content: '✅ Self-role message deleted successfully!'
            });
        } else {
            await interaction.editReply({
                content: `❌ Failed to delete self-role message: ${result.error}`
            });
        }
    },

    async handleStats(interaction, selfRoleManager) {
        const messageId = interaction.options.getString('message-id');

        await interaction.deferReply({ ephemeral: true });

        const stats = await selfRoleManager.getSelfRoleStats(interaction.guild.id, messageId);
        
        if (!stats) {
            return await interaction.editReply({
                content: '📊 No statistics available.'
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('📊 Self-Role Statistics')
            .setColor('#0099ff')
            .setTimestamp();

        if (messageId) {
            embed.setDescription(`Statistics for message ID: \`${messageId}\``);
        } else {
            embed.setDescription('Server-wide self-role statistics');
            embed.addFields(
                { name: '📝 Total Messages', value: stats.totalMessages.toString(), inline: true },
                { name: '🎭 Total Roles', value: stats.totalRoles.toString(), inline: true }
            );
        }

        embed.addFields(
            { name: '🔄 Total Interactions', value: stats.totalInteractions.toString(), inline: true },
            { name: '👥 Unique Users', value: stats.uniqueUsers.toString(), inline: true }
        );

        // Show most popular roles
        const popularRoles = Object.entries(stats.mostPopularRoles)
            .sort(([,a], [,b]) => b.assigned - a.assigned)
            .slice(0, 5);

        if (popularRoles.length > 0) {
            const roleList = popularRoles.map(([roleId, data]) => {
                const role = interaction.guild.roles.cache.get(roleId);
                const roleName = role ? role.name : 'Unknown Role';
                return `${roleName}: ${data.assigned} assigned, ${data.removed} removed`;
            }).join('\n');

            embed.addFields({
                name: '🏆 Most Popular Roles',
                value: roleList,
                inline: false
            });
        }

        await interaction.editReply({ embeds: [embed] });
    },

    async handleCleanup(interaction, selfRoleManager) {
        await interaction.deferReply({ ephemeral: true });

        const cleanedCount = await selfRoleManager.cleanupInvalidRoles(interaction.guild.id);
        
        await interaction.editReply({
            content: `✅ Cleanup completed! Removed ${cleanedCount} invalid role(s) from self-role messages.`
        });
    }
};
