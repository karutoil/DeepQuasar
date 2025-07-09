const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const ModerationSettings = require('../../schemas/ModerationSettings');
const ModerationUtils = require('../../utils/ModerationUtils');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Moderation',
    permissions: [PermissionFlagsBits.Administrator],
    data: new SlashCommandBuilder()
        .setName('setup-moderation')
        .setDescription('Configure basic moderation system settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('init')
                .setDescription('Initialize moderation system with default settings')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('modlog')
                .setDescription('Set the moderation log channel')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel for moderation logs')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('muterole')
                .setDescription('Set or create the mute role')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to use for muting (leave empty to create new)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('automod')
                .setDescription('Configure auto-moderation settings')
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('Enable auto-moderation')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('mute-warnings')
                        .setDescription('Warnings before auto-mute (1-10)')
                        .setMinValue(1)
                        .setMaxValue(10)
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option
                        .setName('kick-warnings')
                        .setDescription('Warnings before auto-kick (1-15)')
                        .setMinValue(1)
                        .setMaxValue(15)
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option
                        .setName('ban-warnings')
                        .setDescription('Warnings before auto-ban (1-20)')
                        .setMinValue(1)
                        .setMaxValue(20)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current moderation settings')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Check permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && 
                !Utils.isServerOwner(interaction) && 
                !Utils.isBotOwner(interaction)) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed(
                        'Permission Denied',
                        'You need Administrator permissions to configure moderation settings.'
                    )],
                    ephemeral: true
                });
            }

            const subcommand = interaction.options.getSubcommand();
            const guildId = interaction.guild.id;

            switch (subcommand) {
                case 'init':
                    await this.handleInit(interaction, guildId);
                    break;
                case 'modlog':
                    await this.handleModLog(interaction, guildId);
                    break;
                case 'muterole':
                    await this.handleMuteRole(interaction, guildId);
                    break;
                case 'automod':
                    await this.handleAutoMod(interaction, guildId);
                    break;
                case 'view':
                    await this.handleView(interaction, guildId);
                    break;
            }
        } catch (error) {
            console.error('Error in setup-moderation command:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed(
                    'Setup Error',
                    'An error occurred while configuring moderation settings. Please try again.'
                )],
                ephemeral: true
            });
        }
    },

    async handleInit(interaction, guildId) {
        await interaction.deferReply({ ephemeral: true });

        const settings = await ModerationUtils.getModerationSettings(guildId);
        
        const embed = Utils.createSuccessEmbed(
            'Moderation System Initialized',
            'The moderation system has been set up with default settings.'
        );

        embed.addFields([
            {
                name: 'Discord Permissions Used',
                value: [
                    '• **Manage Messages** - Required for `/warn`, `/strike`',
                    '• **Kick Members** - Required for `/kick`',
                    '• **Ban Members** - Required for `/ban`, `/unban`, `/softban`',
                    '• **Moderate Members** - Required for `/mute`, `/unmute`',
                    '• **Manage Channels** - Required for `/lock`, `/unlock`, `/slowmode`'
                ].join('\n'),
                inline: false
            },
            {
                name: 'Next Steps',
                value: [
                    '• Set a moderation log channel: `/setup-moderation modlog`',
                    '• Configure mute role: `/setup-moderation muterole`',
                    '• Enable auto-moderation: `/setup-moderation automod`'
                ].join('\n'),
                inline: false
            }
        ]);

        await interaction.editReply({ embeds: [embed] });
    },

    async handleModLog(interaction, guildId) {
        const channel = interaction.options.getChannel('channel');
        
        const settings = await ModerationUtils.getModerationSettings(guildId);
        settings.modLogChannel = channel.id;
        await settings.save();

        await interaction.reply({
            embeds: [Utils.createSuccessEmbed(
                'Moderation Log Set',
                `Moderation actions will now be logged to ${channel}.`
            )],
            ephemeral: true
        });
    },

    async handleMuteRole(interaction, guildId) {
        await interaction.deferReply({ ephemeral: true });
        
        const role = interaction.options.getRole('role');
        const settings = await ModerationUtils.getModerationSettings(guildId);

        if (role) {
            settings.muteRoleId = role.id;
            await settings.save();

            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed(
                    'Mute Role Set',
                    `${role} will be used for muting members.`
                )]
            });
        } else {
            // Create new mute role
            const muteRole = await ModerationUtils.getMuteRole(interaction.guild, settings);
            
            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed(
                    'Mute Role Created',
                    `Created ${muteRole} and configured permissions in all channels.`
                )]
            });
        }
    },

    async handleAutoMod(interaction, guildId) {
        const enabled = interaction.options.getBoolean('enabled');
        const muteWarns = interaction.options.getInteger('mute-warnings');
        const kickWarns = interaction.options.getInteger('kick-warnings');
        const banWarns = interaction.options.getInteger('ban-warnings');

        const settings = await ModerationUtils.getModerationSettings(guildId);
        
        settings.autoActions.enabled = enabled;
        if (muteWarns !== null) settings.autoActions.muteOnWarns = muteWarns;
        if (kickWarns !== null) settings.autoActions.kickOnWarns = kickWarns;
        if (banWarns !== null) settings.autoActions.banOnWarns = banWarns;
        
        await settings.save();

        const embed = Utils.createSuccessEmbed(
            'Auto-Moderation Updated',
            `Auto-moderation has been ${enabled ? 'enabled' : 'disabled'}.`
        );

        if (enabled) {
            embed.addFields([
                {
                    name: 'Auto-Action Thresholds',
                    value: [
                        `• Mute: ${settings.autoActions.muteOnWarns} warnings`,
                        `• Kick: ${settings.autoActions.kickOnWarns} warnings`,
                        `• Ban: ${settings.autoActions.banOnWarns} warnings`
                    ].join('\n'),
                    inline: false
                }
            ]);
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleView(interaction, guildId) {
        const settings = await ModerationUtils.getModerationSettings(guildId);

        const embed = Utils.createInfoEmbed(
            'Moderation Settings',
            'Current configuration for this server'
        );

        // Modlog channel
        const modLogChannel = settings.modLogChannel ? 
            `<#${settings.modLogChannel}>` : 'Not configured';

        // Mute role
        const muteRole = settings.muteRoleId ? 
            `<@&${settings.muteRoleId}>` : 'Not configured';

        embed.addFields([
            {
                name: 'Moderation Log',
                value: modLogChannel,
                inline: true
            },
            {
                name: 'Mute Role',
                value: muteRole,
                inline: true
            },
            {
                name: 'Auto-Moderation',
                value: settings.autoActions.enabled ? 'Enabled' : 'Disabled',
                inline: true
            },
            {
                name: 'Permission System',
                value: 'Uses Discord\'s built-in permission system',
                inline: false
            }
        ]);

        if (settings.autoActions.enabled) {
            embed.addFields([
                {
                    name: 'Auto-Action Thresholds',
                    value: [
                        `• Mute: ${settings.autoActions.muteOnWarns} warnings`,
                        `• Kick: ${settings.autoActions.kickOnWarns} warnings`,
                        `• Ban: ${settings.autoActions.banOnWarns} warnings`
                    ].join('\n'),
                    inline: false
                }
            ]);
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
