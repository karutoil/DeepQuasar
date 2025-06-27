const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const TempVC = require('../../schemas/TempVC');
const TempVCInstance = require('../../schemas/TempVCInstance');
const Utils = require('../../utils/utils');
const ProfanityFilter = require('../../utils/ProfanityFilter');

module.exports = {
    category: 'Settings',
    data: new SlashCommandBuilder()
        .setName('tempvc')
        .setDescription('Configure the temporary voice channel system')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Initial setup for the temp VC system')
                .addChannelOption(option =>
                    option
                        .setName('join-channel')
                        .setDescription('Voice channel users join to create a temp VC')
                        .addChannelTypes(ChannelType.GuildVoice)
                        .setRequired(true))
                .addChannelOption(option =>
                    option
                        .setName('category')
                        .setDescription('Category where temp VCs will be created')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true))
                .addChannelOption(option =>
                    option
                        .setName('log-channel')
                        .setDescription('Channel for temp VC logs (optional)')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Enable or disable the temp VC system')
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('Enable or disable the temp VC system')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('View current configuration'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('settings')
                .setDescription('Configure temp VC settings')
                .addStringOption(option =>
                    option
                        .setName('channel-name')
                        .setDescription('Default channel name template')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option
                        .setName('user-limit')
                        .setDescription('Default user limit (0 = no limit)')
                        .setMinValue(0)
                        .setMaxValue(99)
                        .setRequired(false))
                .addIntegerOption(option =>
                    option
                        .setName('bitrate')
                        .setDescription('Default bitrate in kbps')
                        .setMinValue(8)
                        .setMaxValue(384)
                        .setRequired(false))
                .addBooleanOption(option =>
                    option
                        .setName('locked')
                        .setDescription('Create channels locked by default')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option
                        .setName('hidden')
                        .setDescription('Create channels hidden by default')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('permissions')
                .setDescription('Configure who can create temp VCs')
                .addStringOption(option =>
                    option
                        .setName('mode')
                        .setDescription('Permission mode')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Everyone', value: 'everyone' },
                            { name: 'Specific Roles', value: 'role' },
                            { name: 'Specific Users', value: 'specific' }
                        ))
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to allow/deny')
                        .setRequired(false))
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to allow/deny')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('action')
                        .setDescription('Action to perform')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Allow', value: 'allow' },
                            { name: 'Deny', value: 'deny' },
                            { name: 'Clear', value: 'clear' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('advanced')
                .setDescription('Configure advanced settings')
                .addIntegerOption(option =>
                    option
                        .setName('max-channels')
                        .setDescription('Max channels per user')
                        .setMinValue(1)
                        .setMaxValue(10)
                        .setRequired(false))
                .addIntegerOption(option =>
                    option
                        .setName('cooldown')
                        .setDescription('Cooldown between creations (minutes)')
                        .setMinValue(0)
                        .setMaxValue(60)
                        .setRequired(false))
                .addBooleanOption(option =>
                    option
                        .setName('auto-delete')
                        .setDescription('Auto-delete empty channels')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option
                        .setName('delete-delay')
                        .setDescription('Minutes to wait before deleting empty channels')
                        .setMinValue(0)
                        .setMaxValue(60)
                        .setRequired(false))
                .addBooleanOption(option =>
                    option
                        .setName('control-panel')
                        .setDescription('Send control panel to channels')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('panel-style')
                        .setDescription('Control panel style')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Buttons', value: 'buttons' },
                            { name: 'Select Menu', value: 'select' },
                            { name: 'Both', value: 'both' }
                        ))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'setup':
                    await this.handleSetup(interaction);
                    break;
                case 'toggle':
                    await this.handleToggle(interaction);
                    break;
                case 'config':
                    await this.handleConfig(interaction);
                    break;
                case 'settings':
                    await this.handleSettings(interaction);
                    break;
                case 'permissions':
                    await this.handlePermissions(interaction);
                    break;
                case 'advanced':
                    await this.handleAdvanced(interaction);
                    break;
                default:
                    await interaction.reply({
                        embeds: [Utils.createErrorEmbed('Error', 'Unknown subcommand')],
                        ephemeral: true
                    });
            }
        } catch (error) {
            console.error('Error in tempvc command:', error);
            const embed = Utils.createErrorEmbed('Error', 'An error occurred while processing the command.');
            
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    },

    async handleSetup(interaction) {
        const joinChannel = interaction.options.getChannel('join-channel');
        const category = interaction.options.getChannel('category');
        const logChannel = interaction.options.getChannel('log-channel');

        // Validate permissions
        const botMember = interaction.guild.members.me;
        const joinChannelPerms = joinChannel.permissionsFor(botMember);
        const categoryPerms = category.permissionsFor(botMember);

        if (!joinChannelPerms.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect])) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Permission Error', 'I need View Channel and Connect permissions in the join channel.')],
                ephemeral: true
            });
        }

        if (!categoryPerms.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles])) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Permission Error', 'I need View Channel, Manage Channels, and Manage Roles permissions in the category.')],
                ephemeral: true
            });
        }

        // Create or update configuration
        let config = await TempVC.findByGuildId(interaction.guild.id);
        if (!config) {
            config = await TempVC.createDefault(interaction.guild.id);
        }

        config.enabled = true;
        config.joinToCreateChannelId = joinChannel.id;
        config.tempVCCategoryId = category.id;
        
        if (logChannel) {
            config.advanced.logChannelId = logChannel.id;
        }

        await config.save();

        const embed = Utils.createSuccessEmbed(
            'Temp VC System Setup Complete',
            [
                `✅ **Join Channel:** ${joinChannel}`,
                `✅ **Category:** ${category}`,
                logChannel ? `✅ **Log Channel:** ${logChannel}` : '',
                '',
                '🎉 The temp VC system is now active!',
                'Users can join the specified channel to create their own temporary voice channel.'
            ].filter(line => line !== '').join('\n')
        );

        await interaction.reply({ embeds: [embed] });
    },

    async handleToggle(interaction) {
        const enabled = interaction.options.getBoolean('enabled');

        let config = await TempVC.findByGuildId(interaction.guild.id);
        if (!config) {
            config = await TempVC.createDefault(interaction.guild.id);
        }

        config.enabled = enabled;
        await config.save();

        const embed = enabled 
            ? Utils.createSuccessEmbed('Temp VC Enabled', 'The temporary voice channel system is now enabled.')
            : Utils.createWarningEmbed('Temp VC Disabled', 'The temporary voice channel system is now disabled.');

        await interaction.reply({ embeds: [embed] });
    },

    async handleConfig(interaction) {
        const config = await TempVC.findByGuildId(interaction.guild.id);
        
        if (!config) {
            return interaction.reply({
                embeds: [Utils.createWarningEmbed('Not Configured', 'The temp VC system has not been set up yet. Use `/tempvc setup` to get started.')],
                ephemeral: true
            });
        }

        const guild = interaction.guild;
        const joinChannel = config.joinToCreateChannelId ? guild.channels.cache.get(config.joinToCreateChannelId) : null;
        const category = config.tempVCCategoryId ? guild.channels.cache.get(config.tempVCCategoryId) : null;
        const logChannel = config.advanced.logChannelId ? guild.channels.cache.get(config.advanced.logChannelId) : null;

        // Get active channels count
        const activeChannels = await TempVCInstance.findByGuildId(guild.id);

        const embed = new EmbedBuilder()
            .setTitle('🎙️ Temp VC Configuration')
            .setColor(config.enabled ? 0x57F287 : 0xED4245)
            .addFields(
                {
                    name: '📊 Status',
                    value: [
                        `**Enabled:** ${config.enabled ? '✅ Yes' : '❌ No'}`,
                        `**Active Channels:** ${activeChannels.length}`,
                        `**Join Channel:** ${joinChannel ? joinChannel.toString() : '❌ Not set'}`,
                        `**Category:** ${category ? category.toString() : '❌ Not set'}`,
                        `**Log Channel:** ${logChannel ? logChannel.toString() : 'None'}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⚙️ Default Settings',
                    value: [
                        `**Channel Name:** ${config.defaultSettings.channelName}`,
                        `**User Limit:** ${config.defaultSettings.userLimit || 'No limit'}`,
                        `**Bitrate:** ${config.defaultSettings.bitrate / 1000} kbps`,
                        `**Locked by Default:** ${config.defaultSettings.locked ? 'Yes' : 'No'}`,
                        `**Hidden by Default:** ${config.defaultSettings.hidden ? 'Yes' : 'No'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🔒 Permissions',
                    value: [
                        `**Who Can Create:** ${config.permissions.whoCanCreate}`,
                        `**Allowed Roles:** ${config.permissions.allowedRoles.length}`,
                        `**Allowed Users:** ${config.permissions.allowedUsers.length}`,
                        `**Blacklisted Roles:** ${config.permissions.blacklistedRoles.length}`,
                        `**Blacklisted Users:** ${config.permissions.blacklistedUsers.length}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🔧 Advanced Settings',
                    value: [
                        `**Max Channels Per User:** ${config.advanced.maxChannelsPerUser}`,
                        `**Creation Cooldown:** ${config.advanced.cooldownMinutes} minutes`,
                        `**Auto Delete:** ${config.autoDelete.enabled ? 'Yes' : 'No'}`,
                        `**Delete Delay:** ${config.autoDelete.delayMinutes} minutes`,
                        `**Control Panel:** ${config.advanced.sendControlPanel ? 'Yes' : 'No'}`,
                        `**Panel Style:** ${config.advanced.panelStyle}`
                    ].join('\n'),
                    inline: false
                }
            )
            .setTimestamp();

        // Add naming templates
        if (config.namingTemplates.length > 0) {
            const templates = config.namingTemplates
                .map(t => `**${t.name}:** \`${t.template}\``)
                .join('\n');
            
            embed.addFields({
                name: '📝 Naming Templates',
                value: templates.length > 1000 ? 'Too many to display' : templates,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    },

    async handleSettings(interaction) {
        let config = await TempVC.findByGuildId(interaction.guild.id);
        if (!config) {
            config = await TempVC.createDefault(interaction.guild.id);
        }

        const channelName = interaction.options.getString('channel-name');
        const userLimit = interaction.options.getInteger('user-limit');
        const bitrate = interaction.options.getInteger('bitrate');
        const locked = interaction.options.getBoolean('locked');
        const hidden = interaction.options.getBoolean('hidden');

        let changes = [];

        if (channelName !== null) {
            // Strip placeholders to check the static parts of the template
            const cleanChannelName = channelName.replace(/\{.*?\}/g, '');
            if (ProfanityFilter.contains(cleanChannelName)) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Invalid Name', 'The channel name template contains inappropriate language. Please choose another name.')],
                    ephemeral: true
                });
            }

            config.defaultSettings.channelName = channelName;
            changes.push(`**Channel Name:** ${channelName}`);
        }

        if (userLimit !== null) {
            config.defaultSettings.userLimit = userLimit;
            changes.push(`**User Limit:** ${userLimit || 'No limit'}`);
        }

        if (bitrate !== null) {
            config.defaultSettings.bitrate = bitrate * 1000; // Convert to bits
            changes.push(`**Bitrate:** ${bitrate} kbps`);
        }

        if (locked !== null) {
            config.defaultSettings.locked = locked;
            changes.push(`**Locked by Default:** ${locked ? 'Yes' : 'No'}`);
        }

        if (hidden !== null) {
            config.defaultSettings.hidden = hidden;
            changes.push(`**Hidden by Default:** ${hidden ? 'Yes' : 'No'}`);
        }

        if (changes.length === 0) {
            return interaction.reply({
                embeds: [Utils.createWarningEmbed('No Changes', 'No settings were provided to update.')],
                ephemeral: true
            });
        }

        await config.save();

        const embed = Utils.createSuccessEmbed(
            'Settings Updated',
            `The following settings have been updated:\n\n${changes.join('\n')}`
        );

        await interaction.reply({ embeds: [embed] });
    },

    async handlePermissions(interaction) {
        let config = await TempVC.findByGuildId(interaction.guild.id);
        if (!config) {
            config = await TempVC.createDefault(interaction.guild.id);
        }

        const mode = interaction.options.getString('mode');
        const role = interaction.options.getRole('role');
        const user = interaction.options.getUser('user');
        const action = interaction.options.getString('action');

        // Update permission mode
        config.permissions.whoCanCreate = mode;
        let message = `**Permission Mode:** ${mode}`;

        // Handle role/user actions
        if ((role || user) && action) {
            if (role) {
                switch (action) {
                    case 'allow':
                        if (mode === 'role' && !config.permissions.allowedRoles.includes(role.id)) {
                            config.permissions.allowedRoles.push(role.id);
                            message += `\n**Added Role:** ${role.name} to allowed list`;
                        }
                        // Remove from blacklist if exists
                        config.permissions.blacklistedRoles = config.permissions.blacklistedRoles.filter(id => id !== role.id);
                        break;
                    case 'deny':
                        if (!config.permissions.blacklistedRoles.includes(role.id)) {
                            config.permissions.blacklistedRoles.push(role.id);
                            message += `\n**Added Role:** ${role.name} to blacklist`;
                        }
                        // Remove from allowed if exists
                        config.permissions.allowedRoles = config.permissions.allowedRoles.filter(id => id !== role.id);
                        break;
                    case 'clear':
                        config.permissions.allowedRoles = config.permissions.allowedRoles.filter(id => id !== role.id);
                        config.permissions.blacklistedRoles = config.permissions.blacklistedRoles.filter(id => id !== role.id);
                        message += `\n**Removed Role:** ${role.name} from all lists`;
                        break;
                }
            }

            if (user) {
                switch (action) {
                    case 'allow':
                        if (mode === 'specific' && !config.permissions.allowedUsers.includes(user.id)) {
                            config.permissions.allowedUsers.push(user.id);
                            message += `\n**Added User:** ${user.tag} to allowed list`;
                        }
                        // Remove from blacklist if exists
                        config.permissions.blacklistedUsers = config.permissions.blacklistedUsers.filter(id => id !== user.id);
                        break;
                    case 'deny':
                        if (!config.permissions.blacklistedUsers.includes(user.id)) {
                            config.permissions.blacklistedUsers.push(user.id);
                            message += `\n**Added User:** ${user.tag} to blacklist`;
                        }
                        // Remove from allowed if exists
                        config.permissions.allowedUsers = config.permissions.allowedUsers.filter(id => id !== user.id);
                        break;
                    case 'clear':
                        config.permissions.allowedUsers = config.permissions.allowedUsers.filter(id => id !== user.id);
                        config.permissions.blacklistedUsers = config.permissions.blacklistedUsers.filter(id => id !== user.id);
                        message += `\n**Removed User:** ${user.tag} from all lists`;
                        break;
                }
            }
        } else if (action === 'clear') {
            // Clear all permissions
            config.permissions.allowedRoles = [];
            config.permissions.allowedUsers = [];
            config.permissions.blacklistedRoles = [];
            config.permissions.blacklistedUsers = [];
            message += '\n**Cleared:** All permission lists';
        }

        await config.save();

        const embed = Utils.createSuccessEmbed('Permissions Updated', message);
        await interaction.reply({ embeds: [embed] });
    },

    async handleAdvanced(interaction) {
        let config = await TempVC.findByGuildId(interaction.guild.id);
        if (!config) {
            config = await TempVC.createDefault(interaction.guild.id);
        }

        const maxChannels = interaction.options.getInteger('max-channels');
        const cooldown = interaction.options.getInteger('cooldown');
        const autoDelete = interaction.options.getBoolean('auto-delete');
        const deleteDelay = interaction.options.getInteger('delete-delay');
        const controlPanel = interaction.options.getBoolean('control-panel');
        const panelStyle = interaction.options.getString('panel-style');

        let changes = [];

        if (maxChannels !== null) {
            config.advanced.maxChannelsPerUser = maxChannels;
            changes.push(`**Max Channels Per User:** ${maxChannels}`);
        }

        if (cooldown !== null) {
            config.advanced.cooldownMinutes = cooldown;
            changes.push(`**Creation Cooldown:** ${cooldown} minutes`);
        }

        if (autoDelete !== null) {
            config.autoDelete.enabled = autoDelete;
            changes.push(`**Auto Delete:** ${autoDelete ? 'Enabled' : 'Disabled'}`);
        }

        if (deleteDelay !== null) {
            config.autoDelete.delayMinutes = deleteDelay;
            changes.push(`**Delete Delay:** ${deleteDelay} minutes`);
        }

        if (controlPanel !== null) {
            config.advanced.sendControlPanel = controlPanel;
            changes.push(`**Control Panel:** ${controlPanel ? 'Enabled' : 'Disabled'}`);
        }

        if (panelStyle !== null) {
            config.advanced.panelStyle = panelStyle;
            changes.push(`**Panel Style:** ${panelStyle}`);
        }

        if (changes.length === 0) {
            return interaction.reply({
                embeds: [Utils.createWarningEmbed('No Changes', 'No settings were provided to update.')],
                ephemeral: true
            });
        }

        await config.save();

        const embed = Utils.createSuccessEmbed(
            'Advanced Settings Updated',
            `The following settings have been updated:\n\n${changes.join('\n')}`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
