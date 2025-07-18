const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const ModLog = require('../../../schemas/ModLog');
const ModLogManager = require('../../../utils/ModLogManager');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'General',
    data: new SlashCommandBuilder()
        .setName('modlog')
        .setDescription('Configure moderation logging settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Enable modlog and set default channel')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Default channel for modlog events')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable moderation logging')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('View current modlog configuration')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('configure')
                .setDescription('Configure individual event settings')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('setchannel')
                .setDescription('Set specific channel for an event type')
                .addStringOption(option =>
                    option
                        .setName('event')
                        .setDescription('Event type to configure')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel for this event (leave empty to use default)')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Toggle an event type on/off')
                .addStringOption(option =>
                    option
                        .setName('event')
                        .setDescription('Event type to toggle')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const eventTypes = ModLogManager.getEventTypes();
        
        const filtered = eventTypes
            .filter(event => ModLogManager.getEventDisplayName(event).toLowerCase().includes(focusedValue.toLowerCase()))
            .slice(0, 25)
            .map(event => ({
                name: ModLogManager.getEventDisplayName(event),
                value: event
            }));

        await interaction.respond(filtered);
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'setup':
                    await this.handleSetup(interaction);
                    break;
                case 'disable':
                    await this.handleDisable(interaction);
                    break;
                case 'status':
                    await this.handleStatus(interaction);
                    break;
                case 'configure':
                    await this.handleConfigure(interaction);
                    break;
                case 'setchannel':
                    await this.handleSetChannel(interaction);
                    break;
                case 'toggle':
                    await this.handleToggle(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error in modlog command:', error);
            const embed = Utils.createErrorEmbed('Error', 'An error occurred while processing the command.');
            
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    },

    async handleSetup(interaction) {
        const channel = interaction.options.getChannel('channel');

        // Permissions check for setup/configuration
        const botMember = interaction.guild.members.me;
        if (!botMember) {
            const embed = Utils.createErrorEmbed('Setup Failed', 'Bot is not present in this guild.');
            return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        const permissions = channel.permissionsFor(botMember);
        if (!permissions.has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
            const embed = Utils.createErrorEmbed(
                'Missing Permissions',
                `Bot needs **Send Messages** and **Embed Links** permissions in ${channel} to log events.`
            );
            return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        let modLog = await ModLog.findOne({ guildId: interaction.guild.id });
        if (!modLog) {
            modLog = new ModLog({ guildId: interaction.guild.id });
        }

        modLog.enabled = true;
        modLog.defaultChannel = channel.id;
        await modLog.save();

        await modLog.logConfigChange(`Modlog enabled. Default channel set to ${channel.id}`);

        const embed = Utils.createSuccessEmbed(
            'Modlog Setup Complete',
            `Moderation logging has been enabled!\n\n` +
            `**Default Channel:** ${channel}\n` +
            `**Status:** All events enabled by default\n\n` +
            `Use \`/modlog configure\` to customize individual event settings.`
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },

    async handleDisable(interaction) {
        const modLog = await ModLog.findOne({ guildId: interaction.guild.id });
        if (!modLog || !modLog.enabled) {
            const embed = Utils.createErrorEmbed('Not Enabled', 'Moderation logging is not currently enabled.');
            return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        modLog.enabled = false;
        await modLog.save();

        await modLog.logConfigChange('Modlog disabled.');

        // Notify admins/log channel on disable
        const defaultChannel = interaction.guild.channels.cache.get(modLog.defaultChannel);
        if (defaultChannel && defaultChannel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) {
            await defaultChannel.send({
                embeds: [Utils.createWarningEmbed('Modlog Disabled', 'Moderation logging has been disabled for this server.')]
            });
        }

        const embed = Utils.createSuccessEmbed(
            'Modlog Disabled',
            'Moderation logging has been disabled for this server.'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },

    async handleStatus(interaction) {
        const modLog = await ModLog.findOne({ guildId: interaction.guild.id });
        
        if (!modLog || !modLog.enabled) {
            const embed = Utils.createErrorEmbed(
                'Modlog Not Configured', 
                'Moderation logging is not enabled. Use `/modlog setup` to get started.'
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const defaultChannel = interaction.guild.channels.cache.get(modLog.defaultChannel);
        
        const embed = Utils.createInfoEmbed('Modlog Status', '')
            .addFields(
                {
                    name: '📊 General Settings',
                    value: [
                        `**Status:** ${modLog.enabled ? '✅ Enabled' : '❌ Disabled'}`,
                        `**Default Channel:** ${defaultChannel ? defaultChannel.toString() : 'Not set'}`
                    ].join('\n'),
                    inline: false
                }
            );

        // Count enabled events by category
        const categories = {
            'Member Events': ['memberJoin', 'memberLeave', 'memberUpdate', 'memberBan', 'memberUnban', 'memberKick', 'memberTimeout'],
            'Message Events': ['messageDelete', 'messageUpdate', 'messageBulkDelete', 'messageReactionAdd', 'messageReactionRemove'],
            'Channel Events': ['channelCreate', 'channelDelete', 'channelUpdate', 'channelPinsUpdate'],
            'Role Events': ['roleCreate', 'roleDelete', 'roleUpdate'],
            'Guild Events': ['guildUpdate', 'emojiCreate', 'emojiDelete', 'emojiUpdate', 'stickerCreate', 'stickerDelete', 'stickerUpdate'],
            'Voice Events': ['voiceStateUpdate'],
            'Other Events': ['userUpdate', 'presenceUpdate', 'inviteCreate', 'inviteDelete', 'threadCreate', 'threadDelete', 'threadUpdate']
        };

        const fields = [];
        for (const [categoryName, events] of Object.entries(categories)) {
            const enabledCount = events.filter(event => modLog.events[event]?.enabled).length;
            const totalCount = events.length;
            
            fields.push({
                name: categoryName,
                value: `${enabledCount}/${totalCount} enabled`,
                inline: true
            });
        }
        
        embed.addFields(fields);

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },

    async handleConfigure(interaction) {
        await interaction.deferReply();

        const modLog = await ModLog.getOrCreate(interaction.guild.id);
        
        if (!modLog.enabled) {
            const embed = Utils.createErrorEmbed(
                'Modlog Not Enabled', 
                'Please use `/modlog setup` first to enable moderation logging.'
            );
            return await interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const embed = Utils.createInfoEmbed(
            'Modlog Configuration',
            'Select a category to configure event settings:'
        );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('modlog_category_select')
            .setPlaceholder('Choose a category to configure')
            .addOptions([
                {
                    label: 'Member Events',
                    description: 'Join, leave, ban, kick, timeout, etc.',
                    value: 'member',
                    emoji: '👥'
                },
                {
                    label: 'Message Events',
                    description: 'Delete, edit, bulk delete, reactions',
                    value: 'message',
                    emoji: '💬'
                },
                {
                    label: 'Channel Events',
                    description: 'Create, delete, update channels',
                    value: 'channel',
                    emoji: '📋'
                },
                {
                    label: 'Role Events',
                    description: 'Create, delete, update roles',
                    value: 'role',
                    emoji: '🎭'
                },
                {
                    label: 'Guild Events',
                    description: 'Server updates, emojis, stickers',
                    value: 'guild',
                    emoji: '🏠'
                },
                {
                    label: 'Voice Events',
                    description: 'Voice channel join/leave/move',
                    value: 'voice',
                    emoji: '🔊'
                },
                {
                    label: 'Other Events',
                    description: 'Invites, threads, integrations, etc.',
                    value: 'other',
                    emoji: '⚙️'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.editReply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
    },

    async handleSetChannel(interaction) {
        const eventType = interaction.options.getString('event');
        const channel = interaction.options.getChannel('channel');

        const modLog = await ModLog.getOrCreate(interaction.guild.id);

        if (!modLog.enabled) {
            const embed = Utils.createErrorEmbed(
                'Modlog Not Enabled', 
                'Please use `/modlog setup` first to enable moderation logging.'
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Validate event type
        if (!modLog.events[eventType]) {
            const embed = Utils.createErrorEmbed('Invalid Event', 'The specified event type is not valid.');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Permissions check for channel
        if (channel) {
            const botMember = interaction.guild.members.me;
            if (!botMember) {
                const embed = Utils.createErrorEmbed('Setup Failed', 'Bot is not present in this guild.');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            const permissions = channel.permissionsFor(botMember);
            if (!permissions.has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
                const embed = Utils.createErrorEmbed(
                    'Missing Permissions',
                    `Bot needs **Send Messages** and **Embed Links** permissions in ${channel} to log events.`
                );
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        // Feedback for already-set channel
        const prevChannel = modLog.events[eventType].channel;
        if (prevChannel === (channel ? channel.id : null)) {
            const embed = Utils.createWarningEmbed(
                'No Change',
                `The channel for **${ModLogManager.getEventDisplayName(eventType)}** is already set to ${channel ? channel.toString() : 'Default channel'}.`
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        modLog.events[eventType].channel = channel ? channel.id : null;
        await modLog.save();

        await modLog.logConfigChange(`Channel for event ${eventType} set to ${channel ? channel.id : 'default'}`);

        const displayName = ModLogManager.getEventDisplayName(eventType);
        const channelText = channel ? channel.toString() : 'Default channel';

        const embed = Utils.createSuccessEmbed(
            'Channel Updated',
            `**Event:** ${displayName}\n**Channel:** ${channelText}`
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },

    async handleToggle(interaction) {
        const eventType = interaction.options.getString('event');

        const modLog = await ModLog.getOrCreate(interaction.guild.id);

        if (!modLog.enabled) {
            const embed = Utils.createErrorEmbed(
                'Modlog Not Enabled', 
                'Please use `/modlog setup` first to enable moderation logging.'
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Validate event type
        if (!modLog.events[eventType]) {
            const embed = Utils.createErrorEmbed('Invalid Event', 'The specified event type is not valid.');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Feedback for already-set state
        const currentState = modLog.events[eventType].enabled;
        if (interaction.options.getBoolean('enabled') === currentState) {
            const embed = Utils.createWarningEmbed(
                'No Change',
                `The event **${ModLogManager.getEventDisplayName(eventType)}** is already ${currentState ? 'enabled' : 'disabled'}.`
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        modLog.events[eventType].enabled = !currentState;
        await modLog.save();

        await modLog.logConfigChange(`Event ${eventType} toggled to ${!currentState ? 'enabled' : 'disabled'}`);

        const displayName = ModLogManager.getEventDisplayName(eventType);
        const newState = !currentState ? 'enabled' : 'disabled';

        const embed = Utils.createSuccessEmbed(
            'Event Toggled',
            `**Event:** ${displayName}\n**Status:** ${newState}`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
