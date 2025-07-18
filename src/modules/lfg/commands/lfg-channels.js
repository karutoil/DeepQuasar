const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const LFGSettings = require('../../schemas/LFGSettings');
const LFGUtils = require('../../utils/LFGUtils');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'LFG',
    permissions: [PermissionFlagsBits.Administrator],
    data: new SlashCommandBuilder()
        .setName('lfg-channels')
        .setDescription('Manage LFG channel settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a channel for LFG posts')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to add for LFG posts')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Type of LFG channel')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Whitelist (slash commands allowed)', value: 'whitelist' },
                            { name: 'Auto-convert (ALL messages become LFG posts)', value: 'monitor' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a channel from LFG settings')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to remove')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all configured LFG channels')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear all channel configurations')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Type of channels to clear')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Whitelist channels', value: 'whitelist' },
                            { name: 'Auto-convert channels', value: 'monitor' },
                            { name: 'All channels', value: 'all' }
                        )
                )
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const subcommand = interaction.options.getSubcommand();
            const settings = await LFGUtils.getGuildSettings(interaction.guild.id);

            // Migrate legacy data
            await this.migrateLegacyChannelData(settings);

            switch (subcommand) {
                case 'add':
                    await this.handleAdd(interaction, settings);
                    break;
                case 'remove':
                    await this.handleRemove(interaction, settings);
                    break;
                case 'list':
                    await this.handleList(interaction, settings);
                    break;
                case 'clear':
                    await this.handleClear(interaction, settings);
                    break;
            }

        } catch (error) {
            console.error('Error in LFG channels command:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Configuration Error',
                    'An error occurred while updating the channel configuration.'
                )]
            });
        }
    },

    async migrateLegacyChannelData(settings) {
        let needsSave = false;

        // Migrate allowedChannels from string array to object array
        if (settings.allowedChannels && settings.allowedChannels.length > 0) {
            const needsMigration = settings.allowedChannels.some(channel => typeof channel === 'string');
            
            if (needsMigration) {
                settings.allowedChannels = settings.allowedChannels.map(channel => 
                    typeof channel === 'string' 
                        ? { channelId: channel, defaultGame: null }
                        : channel
                );
                needsSave = true;
            }
        }

        if (needsSave) {
            await settings.save();
        }
    },

    async handleAdd(interaction, settings) {
        const channel = interaction.options.getChannel('channel');
        const type = interaction.options.getString('type');

        if (type === 'whitelist') {
            await this.addWhitelistChannel(interaction, settings, channel);
        } else if (type === 'monitor') {
            await this.addMonitorChannel(interaction, settings, channel);
        }
    },

    async addWhitelistChannel(interaction, settings, channel) {
        // Check if channel is already in whitelist
        const existingChannel = settings.allowedChannels.find(ch => 
            typeof ch === 'string' ? ch === channel.id : ch.channelId === channel.id
        );

        if (existingChannel) {
            return await interaction.editReply({
                embeds: [Utils.createWarningEmbed('Already Added', `${channel} is already in the whitelist.`)]
            });
        }

        // If there are game presets, show selection menu for default game
        if (settings.gamePresets && settings.gamePresets.length > 0) {
            await this.showGameSelectionForChannel(interaction, settings, channel, 'whitelist');
        } else {
            // No game presets, add channel without default game
            settings.allowedChannels.push({
                channelId: channel.id,
                defaultGame: null
            });
            await settings.save();

            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed(
                    'Whitelist Channel Added', 
                    `${channel} has been added to the whitelist.\n\n💡 **Tip:** Set up game presets with \`/lfg-presets\` to enable default games for channels.`
                )]
            });
        }
    },

    async addMonitorChannel(interaction, settings, channel) {
        if (settings.monitorChannels.includes(channel.id)) {
            return await interaction.editReply({
                embeds: [Utils.createWarningEmbed('Already Added', `${channel} is already being monitored.`)]
            });
        }

        // If there are game presets, show selection menu for default game
        if (settings.gamePresets && settings.gamePresets.length > 0) {
            await this.showGameSelectionForChannel(interaction, settings, channel, 'monitor');
        } else {
            // No game presets, just add to monitor channels
            settings.monitorChannels.push(channel.id);
            await settings.save();

            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed(
                    'Auto-Convert Channel Added', 
                    `${channel} will now convert ALL messages into LFG posts.\n\n💡 **Tip:** Set up game presets with \`/lfg-presets\` to enable default games for channels.`
                )]
            });
        }
    },

    async showGameSelectionForChannel(interaction, settings, channel, channelType) {
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
            .setCustomId(`lfg_channel_game_${channelType}_${channel.id}`)
            .setPlaceholder('Choose a default game for this channel (optional)')
            .addOptions(gameOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const typeDescription = channelType === 'whitelist' 
            ? 'Users can use `/lfg` in this channel.'
            : 'ALL messages in this channel will become LFG posts.';

        await interaction.editReply({
            embeds: [Utils.createEmbed({
                title: '🎮 Set Default Game',
                description: `Setting up ${channel} as a **${channelType}** channel.\n\n${typeDescription}\n\nSelect a default game for this channel. This game will be automatically selected when users create LFG posts here.\n\n**Note:** Users can still choose a different game when posting.`,
                color: '#5865F2'
            })],
            components: [row]
        });
    },

    async handleRemove(interaction, settings) {
        const channel = interaction.options.getChannel('channel');

        // Remove from both whitelist and monitor channels
        let removedFrom = [];

        // Check whitelist
        const whitelistIndex = settings.allowedChannels.findIndex(ch => 
            typeof ch === 'string' ? ch === channel.id : ch.channelId === channel.id
        );
        if (whitelistIndex !== -1) {
            settings.allowedChannels.splice(whitelistIndex, 1);
            removedFrom.push('whitelist');
        }

        // Check monitor channels
        const monitorIndex = settings.monitorChannels.indexOf(channel.id);
        if (monitorIndex !== -1) {
            settings.monitorChannels.splice(monitorIndex, 1);
            removedFrom.push('auto-convert');
        }

        if (removedFrom.length === 0) {
            return await interaction.editReply({
                embeds: [Utils.createWarningEmbed('Not Found', `${channel} is not configured for LFG.`)]
            });
        }

        await settings.save();

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed(
                'Channel Removed', 
                `${channel} has been removed from: ${removedFrom.join(', ')}.`
            )]
        });
    },

    async handleList(interaction, settings) {
        const whitelistChannels = settings.allowedChannels.length > 0 
            ? settings.allowedChannels.map(ch => {
                const channelId = typeof ch === 'string' ? ch : ch.channelId;
                const defaultGame = typeof ch === 'object' && ch.defaultGame ? ` (Default: ${ch.defaultGame})` : '';
                return `<#${channelId}>${defaultGame}`;
            }).join('\n')
            : 'None';

        const monitorChannels = settings.monitorChannels.length > 0
            ? settings.monitorChannels.map(id => `<#${id}>`).join('\n')
            : 'None';

        await interaction.editReply({
            embeds: [Utils.createEmbed({
                title: '📋 LFG Channel Configuration',
                fields: [
                    {
                        name: '📝 Whitelist Channels',
                        value: whitelistChannels === 'None' 
                            ? 'All channels (no restrictions)' 
                            : whitelistChannels,
                        inline: false
                    },
                    {
                        name: '📢 Auto-Convert Channels',
                        value: monitorChannels,
                        inline: false
                    }
                ],
                color: '#5865F2'
            })]
        });
    },

    async handleClear(interaction, settings) {
        const type = interaction.options.getString('type');

        switch (type) {
            case 'whitelist':
                settings.allowedChannels = [];
                await settings.save();
                await interaction.editReply({
                    embeds: [Utils.createSuccessEmbed(
                        'Whitelist Cleared', 
                        'All channel restrictions have been removed. LFG posts are now allowed in all channels.'
                    )]
                });
                break;

            case 'monitor':
                settings.monitorChannels = [];
                await settings.save();
                await interaction.editReply({
                    embeds: [Utils.createSuccessEmbed(
                        'Auto-Convert Cleared', 
                        'No channels will auto-convert messages to LFG posts.'
                    )]
                });
                break;

            case 'all':
                settings.allowedChannels = [];
                settings.monitorChannels = [];
                await settings.save();
                await interaction.editReply({
                    embeds: [Utils.createSuccessEmbed(
                        'All Channels Cleared', 
                        'All LFG channel configurations have been reset.'
                    )]
                });
                break;
        }
    },

    getDefaultGamePresets() {
        return LFGUtils.getDefaultGamePresets();
    }
};
