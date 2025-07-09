const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const LFGSettings = require('../../schemas/LFGSettings');
const LFGUtils = require('../../utils/LFGUtils');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'LFG',
    permissions: [PermissionFlagsBits.Administrator],
    data: new SlashCommandBuilder()
        .setName('lfg-setup')
        .setDescription('Configure LFG system settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('init')
                .setDescription('Initialize LFG system with default settings')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('trigger-mode')
                .setDescription('Set how LFG posts are triggered')
                .addStringOption(option =>
                    option
                        .setName('mode')
                        .setDescription('Trigger mode')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Slash Commands Only', value: 'slash' },
                            { name: 'Message Detection Only', value: 'message' },
                            { name: 'Both', value: 'both' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('roles')
                .setDescription('Configure LFG role settings')
                .addStringOption(option =>
                    option
                        .setName('setting')
                        .setDescription('Role setting to configure')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Set LFG Role (auto-assign)', value: 'lfg-role' },
                            { name: 'Set Required Role', value: 'required-role' },
                            { name: 'Toggle Auto-Assign', value: 'auto-assign' }
                        )
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to set')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('cooldown')
                .setDescription('Configure posting cooldown')
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('Enable/disable cooldown')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('minutes')
                        .setDescription('Cooldown duration in minutes')
                        .setMinValue(1)
                        .setMaxValue(60)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('embed-style')
                .setDescription('Customize embed appearance')
                .addStringOption(option =>
                    option
                        .setName('color')
                        .setDescription('Embed color (hex code, e.g., #5865F2)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('footer')
                        .setDescription('Footer text')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('audit-log')
                .setDescription('Configure audit logging')
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('Enable/disable audit logging')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Audit log channel')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('expiration')
                .setDescription('Configure post expiration')
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('Enable/disable post expiration')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('minutes')
                        .setDescription('Expiration time in minutes')
                        .setMinValue(5)
                        .setMaxValue(1440)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('features')
                .setDescription('Toggle LFG features')
                .addStringOption(option =>
                    option
                        .setName('feature')
                        .setDescription('Feature to toggle')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Voice Channel Embeds', value: 'voice-embeds' },
                            { name: 'DM Style Embeds', value: 'dm-embeds' },
                            { name: 'Edit Posts', value: 'edit-posts' },
                            { name: 'Delete Posts', value: 'delete-posts' }
                        )
                )
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('Enable/disable the feature')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current LFG configuration')
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const subcommand = interaction.options.getSubcommand();
            const settings = await LFGUtils.getGuildSettings(interaction.guild.id);

            // Migrate legacy channel data from string format to object format
            await this.migrateLegacyChannelData(settings);

            switch (subcommand) {
                case 'init':
                    await this.handleInit(interaction, settings);
                    break;
                case 'trigger-mode':
                    await this.handleTriggerMode(interaction, settings);
                    break;
                case 'roles':
                    await this.handleRoles(interaction, settings);
                    break;
                case 'cooldown':
                    await this.handleCooldown(interaction, settings);
                    break;
                case 'embed-style':
                    await this.handleEmbedStyle(interaction, settings);
                    break;
                case 'audit-log':
                    await this.handleAuditLog(interaction, settings);
                    break;
                case 'expiration':
                    await this.handleExpiration(interaction, settings);
                    break;
                case 'features':
                    await this.handleFeatures(interaction, settings);
                    break;
                case 'view':
                    await this.handleView(interaction, settings);
                    break;
            }

        } catch (error) {
            console.error('Error in LFG setup command:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Configuration Error',
                    'An error occurred while updating the configuration.'
                )]
            });
        }
    },

    async handleInit(interaction, settings) {
        const LFGUtils = require('../../utils/LFGUtils');
        
        // Get default game presets
        const defaultPresets = LFGUtils.getDefaultGamePresets();
        
        // Reset to default settings with game presets included
        await LFGSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {
                triggerMode: 'slash',
                monitorChannels: [],
                gamePresets: defaultPresets, // Include default game presets
                cooldown: {
                    enabled: true,
                    duration: 300000
                },
                embed: {
                    color: '#5865F2'
                },
                features: {
                    voiceChannelEmbeds: true,
                    dmEmbeds: true,
                    editPosts: true,
                    deletePosts: true
                },
                messageTriggers: {
                    keywords: ['lfg', 'looking for group', 'looking for']
                }
            },
            { upsert: true }
        );

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed(
                'LFG System Initialized',
                `LFG system has been initialized with default settings including **${defaultPresets.length} game presets**.\n\nUse \`/lfg-setup view\` to see current configuration or \`/lfg-channels add\` to set up channels with default games.`
            )]
        });
    },

    async handleTriggerMode(interaction, settings) {
        const mode = interaction.options.getString('mode');
        
        settings.triggerMode = mode;
        await settings.save();

        const modeNames = {
            'slash': 'Slash Commands Only',
            'message': 'Message Detection Only',
            'both': 'Both Slash Commands and Message Detection'
        };

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed(
                'Trigger Mode Updated',
                `LFG trigger mode set to: **${modeNames[mode]}**`
            )]
        });
    },

    async handleRoles(interaction, settings) {
        const setting = interaction.options.getString('setting');
        const role = interaction.options.getRole('role');

        switch (setting) {
            case 'lfg-role':
                if (!role) {
                    return await interaction.editReply({
                        embeds: [Utils.createErrorEmbed('Missing Role', 'Please specify a role to set as the LFG role.')]
                    });
                }

                settings.lfgRole.roleId = role.id;
                await settings.save();

                await interaction.editReply({
                    embeds: [Utils.createSuccessEmbed('LFG Role Set', `${role} will be assigned to users who post LFG messages.`)]
                });
                break;

            case 'required-role':
                if (!role) {
                    settings.lfgRole.requireRole = null;
                    await settings.save();

                    await interaction.editReply({
                        embeds: [Utils.createSuccessEmbed('Required Role Removed', 'No role is now required to post LFG messages.')]
                    });
                } else {
                    settings.lfgRole.requireRole = role.id;
                    await settings.save();

                    await interaction.editReply({
                        embeds: [Utils.createSuccessEmbed('Required Role Set', `Users must have ${role} to post LFG messages.`)]
                    });
                }
                break;

            case 'auto-assign':
                settings.lfgRole.autoAssign = !settings.lfgRole.autoAssign;
                await settings.save();

                await interaction.editReply({
                    embeds: [Utils.createSuccessEmbed(
                        'Auto-Assign Updated',
                        `LFG role auto-assignment is now **${settings.lfgRole.autoAssign ? 'enabled' : 'disabled'}**.`
                    )]
                });
                break;
        }
    },

    async handleCooldown(interaction, settings) {
        const enabled = interaction.options.getBoolean('enabled');
        const minutes = interaction.options.getInteger('minutes');

        settings.cooldown.enabled = enabled;
        
        if (minutes) {
            settings.cooldown.duration = minutes * 60 * 1000; // Convert to milliseconds
        }

        await settings.save();

        let description = `Cooldown is now **${enabled ? 'enabled' : 'disabled'}**.`;
        if (enabled && minutes) {
            description += `\nCooldown duration: **${minutes} minute(s)**`;
        } else if (enabled) {
            description += `\nCooldown duration: **${Math.floor(settings.cooldown.duration / 60000)} minute(s)**`;
        }

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed('Cooldown Updated', description)]
        });
    },

    async handleEmbedStyle(interaction, settings) {
        const color = interaction.options.getString('color');
        const footer = interaction.options.getString('footer');

        if (color) {
            // Validate hex color
            if (!/^#[0-9A-F]{6}$/i.test(color)) {
                return await interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Invalid Color', 'Please provide a valid hex color code (e.g., #5865F2).')]
                });
            }
            settings.embed.color = color;
        }

        if (footer !== null) {
            settings.embed.footerText = footer;
        }

        await settings.save();

        let description = 'Embed style updated:';
        if (color) description += `\n• Color: ${color}`;
        if (footer !== null) description += `\n• Footer: ${footer || 'Removed'}`;

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed('Embed Style Updated', description)]
        });
    },

    async handleAuditLog(interaction, settings) {
        const enabled = interaction.options.getBoolean('enabled');
        const channel = interaction.options.getChannel('channel');

        settings.auditLog.enabled = enabled;

        if (channel) {
            settings.auditLog.channelId = channel.id;
        }

        await settings.save();

        let description = `Audit logging is now **${enabled ? 'enabled' : 'disabled'}**.`;
        if (enabled && channel) {
            description += `\nLogs will be sent to ${channel}`;
        } else if (enabled && settings.auditLog.channelId) {
            description += `\nLogs will be sent to <#${settings.auditLog.channelId}>`;
        }

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed('Audit Log Updated', description)]
        });
    },

    async handleExpiration(interaction, settings) {
        const enabled = interaction.options.getBoolean('enabled');
        const minutes = interaction.options.getInteger('minutes');

        settings.expiration.enabled = enabled;

        if (minutes) {
            settings.expiration.duration = minutes * 60 * 1000; // Convert to milliseconds
        }

        await settings.save();

        let description = `Post expiration is now **${enabled ? 'enabled' : 'disabled'}**.`;
        if (enabled && minutes) {
            description += `\nPosts will expire after **${minutes} minute(s)**`;
        } else if (enabled) {
            description += `\nPosts will expire after **${Math.floor(settings.expiration.duration / 60000)} minute(s)**`;
        }

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed('Expiration Updated', description)]
        });
    },

    async handleChannels(interaction, settings) {
        const action = interaction.options.getString('action');
        const channel = interaction.options.getChannel('channel');

        switch (action) {
            case 'add':
                if (!channel) {
                    return await interaction.editReply({
                        embeds: [Utils.createErrorEmbed('Missing Channel', 'Please specify a channel to add.')]
                    });
                }

                // Check if channel is already in allowedChannels (handle both string and object formats)
                const existingChannel = settings.allowedChannels.find(ch => 
                    typeof ch === 'string' ? ch === channel.id : ch.channelId === channel.id
                );

                if (existingChannel) {
                    return await interaction.editReply({
                        embeds: [Utils.createWarningEmbed('Already Added', `${channel} is already in the allowed channels list.`)]
                    });
                }

                // If there are game presets, show selection menu for default game
                if (settings.gamePresets && settings.gamePresets.length > 0) {
                    await this.showGameSelectionForChannel(interaction, settings, channel);
                } else {
                    // No game presets, add channel without default game
                    settings.allowedChannels.push({
                        channelId: channel.id,
                        defaultGame: null
                    });
                    await settings.save();

                    await interaction.editReply({
                        embeds: [Utils.createSuccessEmbed(
                            'Channel Added', 
                            `${channel} has been added to allowed channels.\n\n💡 **Tip:** Set up game presets with \`/lfg-presets\` to enable default games for channels.`
                        )]
                    });
                }
                break;

            case 'remove':
                if (!channel) {
                    return await interaction.editReply({
                        embeds: [Utils.createErrorEmbed('Missing Channel', 'Please specify a channel to remove.')]
                    });
                }

                // Find and remove channel (handle both string and object formats)
                const channelIndex = settings.allowedChannels.findIndex(ch => 
                    typeof ch === 'string' ? ch === channel.id : ch.channelId === channel.id
                );

                if (channelIndex === -1) {
                    return await interaction.editReply({
                        embeds: [Utils.createWarningEmbed('Not Found', `${channel} is not in the allowed channels list.`)]
                    });
                }

                settings.allowedChannels.splice(channelIndex, 1);
                await settings.save();

                await interaction.editReply({
                    embeds: [Utils.createSuccessEmbed('Channel Removed', `${channel} has been removed from allowed channels.`)]
                });
                break;

            case 'clear':
                settings.allowedChannels = [];
                await settings.save();

                await interaction.editReply({
                    embeds: [Utils.createSuccessEmbed('Channels Cleared', 'All channel restrictions have been removed. LFG posts are now allowed in all channels.')]
                });
                break;

            case 'list':
                if (settings.allowedChannels.length === 0) {
                    await interaction.editReply({
                        embeds: [Utils.createEmbed({
                            title: 'Allowed Channels',
                            description: 'No channel restrictions are set. LFG posts are allowed in all channels.',
                            color: '#FEE75C'
                        })]
                    });
                } else {
                    const channelList = settings.allowedChannels.map(ch => {
                        const channelId = typeof ch === 'string' ? ch : ch.channelId;
                        const defaultGame = typeof ch === 'object' && ch.defaultGame ? ` (Default: ${ch.defaultGame})` : '';
                        return `<#${channelId}>${defaultGame}`;
                    }).join('\n');

                    await interaction.editReply({
                        embeds: [Utils.createEmbed({
                            title: 'Allowed Channels',
                            description: channelList,
                            color: '#5865F2'
                        })]
                    });
                }
                break;
        }
    },

    async handleFeatures(interaction, settings) {
        const feature = interaction.options.getString('feature');
        const enabled = interaction.options.getBoolean('enabled');

        const featureMap = {
            'voice-embeds': 'voiceChannelEmbeds',
            'dm-embeds': 'dmEmbeds',
            'edit-posts': 'editPosts',
            'delete-posts': 'deletePosts'
        };

        const featureNames = {
            'voice-embeds': 'Voice Channel Embeds',
            'dm-embeds': 'DM Style Embeds',
            'edit-posts': 'Edit Posts',
            'delete-posts': 'Delete Posts'
        };

        const featureKey = featureMap[feature];
        settings.features[featureKey] = enabled;
        await settings.save();

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed(
                'Feature Updated',
                `**${featureNames[feature]}** is now **${enabled ? 'enabled' : 'disabled'}**.`
            )]
        });
    },

    async handleView(interaction, settings) {
        const embed = Utils.createEmbed({
            title: '⚙️ LFG System Configuration',
            color: settings.embed.color || '#5865F2',
            fields: [
                {
                    name: '🔧 Trigger Mode',
                    value: settings.triggerMode.charAt(0).toUpperCase() + settings.triggerMode.slice(1),
                    inline: true
                },
                {
                    name: '⏱️ Cooldown',
                    value: settings.cooldown.enabled ? 
                        `${Math.floor(settings.cooldown.duration / 60000)} minutes` : 'Disabled',
                    inline: true
                },
                {
                    name: '⏳ Post Expiration',
                    value: settings.expiration.enabled ? 
                        `${Math.floor(settings.expiration.duration / 60000)} minutes` : 'Disabled',
                    inline: true
                },
                {
                    name: '📝 Audit Logging',
                    value: settings.auditLog.enabled ? 
                        (settings.auditLog.channelId ? `<#${settings.auditLog.channelId}>` : 'Enabled (no channel set)') : 
                        'Disabled',
                    inline: true
                },
                {
                    name: '👥 Roles',
                    value: [
                        settings.lfgRole.roleId ? `LFG Role: <@&${settings.lfgRole.roleId}>` : null,
                        settings.lfgRole.requireRole ? `Required Role: <@&${settings.lfgRole.requireRole}>` : null,
                        `Auto-assign: ${settings.lfgRole.autoAssign ? 'Yes' : 'No'}`
                    ].filter(Boolean).join('\n') || 'No roles configured',
                    inline: true
                },
                {
                    name: '🎨 Embed Style',
                    value: `Color: ${settings.embed.color || '#5865F2'}\nFooter: ${settings.embed.footerText || 'None'}`,
                    inline: true
                },
                {
                    name: '� Channel Configuration',
                    value: `Use \`/lfg-channels\` to manage channel settings.\n\n**Whitelist:** ${settings.allowedChannels.length > 0 ? 
                        settings.allowedChannels.map(ch => {
                            const channelId = typeof ch === 'string' ? ch : ch.channelId;
                            const defaultGame = typeof ch === 'object' && ch.defaultGame ? ` (${ch.defaultGame})` : '';
                            return `<#${channelId}>${defaultGame}`;
                        }).slice(0, 2).join(', ') + (settings.allowedChannels.length > 2 ? `\n+${settings.allowedChannels.length - 2} more` : '') : 
                        'All channels'}\n\n**Auto-convert:** ${settings.monitorChannels.length > 0 ? 
                        settings.monitorChannels.slice(0, 2).map(id => `<#${id}>`).join(', ') + (settings.monitorChannels.length > 2 ? `\n+${settings.monitorChannels.length - 2} more` : '') : 
                        'None'}`,
                    inline: false
                },
                {
                    name: '🎮 Game Presets',
                    value: settings.gamePresets && settings.gamePresets.length > 0 ? 
                        `${settings.gamePresets.length} preset(s) configured\n${settings.gamePresets.slice(0, 3).map(p => `• ${p.icon || '🎮'} ${p.name}`).join('\n')}${settings.gamePresets.length > 3 ? `\n• ... and ${settings.gamePresets.length - 3} more` : ''}` :
                        'None (use `/lfg-presets load-defaults`)',
                    inline: false
                },
                {
                    name: '📝 Allowed Channels',
                    value: settings.allowedChannels.length > 0 ? 
                        settings.allowedChannels.map(ch => {
                            const channelId = typeof ch === 'string' ? ch : ch.channelId;
                            const defaultGame = typeof ch === 'object' && ch.defaultGame ? ` (Default: ${ch.defaultGame})` : '';
                            return `<#${channelId}>${defaultGame}`;
                        }).join('\n') : 
                        'All channels',
                    inline: false
                },
                {
                    name: '✨ Features',
                    value: [
                        `Voice Embeds: ${settings.features.voiceChannelEmbeds ? '✅' : '❌'}`,
                        `DM Embeds: ${settings.features.dmEmbeds ? '✅' : '❌'}`,
                        `Edit Posts: ${settings.features.editPosts ? '✅' : '❌'}`,
                        `Delete Posts: ${settings.features.deletePosts ? '✅' : '❌'}`
                    ].join('\n'),
                    inline: false
                }
            ]
        });

        await interaction.editReply({ embeds: [embed] });
    },

    async showGameSelectionForChannel(interaction, settings, channel) {
        const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

        const gameOptions = [
            {
                label: 'No Default Game',
                description: 'Don\'t set a default game for this channel',
                value: 'none',
                emoji: '❌'
            },
            ...settings.gamePresets.slice(0, 24).map(preset => ({
                label: preset.name,
                description: `Set ${preset.name} as default for this channel`,
                value: preset.name,
                emoji: preset.icon || '🎮'
            }))
        ];

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`lfg_setup_channel_game_${channel.id}`)
            .setPlaceholder('Choose a default game for this channel (optional)')
            .addOptions(gameOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.editReply({
            embeds: [Utils.createEmbed({
                title: '🎮 Set Default Game',
                description: `Select a default game for ${channel}.\n\nThis game will be automatically selected when users create LFG posts in this channel.\n\n**Note:** Users can still choose a different game when posting.`,
                color: '#5865F2'
            })],
            components: [row]
        });
    },

    /**
     * Migrate legacy channel data from string format to object format
     */
    async migrateLegacyChannelData(settings) {
        // Check if we have legacy string-based channels
        const hasLegacyChannels = settings.allowedChannels.some(ch => typeof ch === 'string');
        
        if (hasLegacyChannels) {
            settings.allowedChannels = settings.allowedChannels.map(ch => {
                if (typeof ch === 'string') {
                    return {
                        channelId: ch,
                        defaultGame: null
                    };
                }
                return ch;
            });
            await settings.save();
        }
        
        return settings;
    },
};
