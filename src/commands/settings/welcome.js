const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configure welcome and leave messages for the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommandGroup(group =>
            group
                .setName('setup')
                .setDescription('Set up welcome and leave systems')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('welcome')
                        .setDescription('Set up welcome messages')
                        .addChannelOption(option =>
                            option
                                .setName('channel')
                                .setDescription('Channel to send welcome messages')
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true)
                        )
                        .addBooleanOption(option =>
                            option
                                .setName('enabled')
                                .setDescription('Enable or disable welcome messages')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option
                                .setName('message')
                                .setDescription('Custom welcome message (use placeholders like {user.mention}, {guild.name})')
                                .setRequired(false)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('leave')
                        .setDescription('Set up leave messages')
                        .addChannelOption(option =>
                            option
                                .setName('channel')
                                .setDescription('Channel to send leave messages')
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true)
                        )
                        .addBooleanOption(option =>
                            option
                                .setName('enabled')
                                .setDescription('Enable or disable leave messages')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option
                                .setName('message')
                                .setDescription('Custom leave message (use placeholders like {user.tag}, {guild.name})')
                                .setRequired(false)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('dm')
                        .setDescription('Set up DM welcome messages')
                        .addBooleanOption(option =>
                            option
                                .setName('enabled')
                                .setDescription('Enable or disable DM welcome messages')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option
                                .setName('message')
                                .setDescription('Custom DM welcome message')
                                .setRequired(false)
                        )
                )
        )
        .addSubcommandGroup(group =>
            group
                .setName('config')
                .setDescription('Configure welcome and leave message settings')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('welcome')
                        .setDescription('Configure welcome message settings')
                        .addBooleanOption(option =>
                            option
                                .setName('embed')
                                .setDescription('Use embed format for welcome messages')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option
                                .setName('color')
                                .setDescription('Embed color (hex format, e.g., #57F287)')
                                .setRequired(false)
                        )
                        .addBooleanOption(option =>
                            option
                                .setName('mention-user')
                                .setDescription('Mention the user in welcome messages')
                                .setRequired(false)
                        )
                        .addBooleanOption(option =>
                            option
                                .setName('show-account-age')
                                .setDescription('Show account creation date')
                                .setRequired(false)
                        )
                        .addBooleanOption(option =>
                            option
                                .setName('show-join-position')
                                .setDescription('Show member join position')
                                .setRequired(false)
                        )
                        .addBooleanOption(option =>
                            option
                                .setName('show-inviter')
                                .setDescription('Show who invited the user')
                                .setRequired(false)
                        )
                        .addIntegerOption(option =>
                            option
                                .setName('delete-after')
                                .setDescription('Delete message after X seconds (0 = never delete)')
                                .setMinValue(0)
                                .setMaxValue(3600)
                                .setRequired(false)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('leave')
                        .setDescription('Configure leave message settings')
                        .addBooleanOption(option =>
                            option
                                .setName('embed')
                                .setDescription('Use embed format for leave messages')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option
                                .setName('color')
                                .setDescription('Embed color (hex format, e.g., #ED4245)')
                                .setRequired(false)
                        )
                        .addBooleanOption(option =>
                            option
                                .setName('show-account-age')
                                .setDescription('Show account creation date')
                                .setRequired(false)
                        )
                        .addBooleanOption(option =>
                            option
                                .setName('show-join-date')
                                .setDescription('Show when user joined the server')
                                .setRequired(false)
                        )
                        .addBooleanOption(option =>
                            option
                                .setName('show-time-in-server')
                                .setDescription('Show how long user was in server')
                                .setRequired(false)
                        )
                        .addIntegerOption(option =>
                            option
                                .setName('delete-after')
                                .setDescription('Delete message after X seconds (0 = never delete)')
                                .setMinValue(0)
                                .setMaxValue(3600)
                                .setRequired(false)
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('View current welcome and leave system configuration')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Test welcome and leave messages')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Type of message to test')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Welcome', value: 'welcome' },
                            { name: 'Leave', value: 'leave' },
                            { name: 'DM Welcome', value: 'dm' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('placeholders')
                .setDescription('View available message placeholders')
        ),

    async execute(interaction) {
        try {
            // Check permissions
            const permissionCheck = await Utils.checkPermissions(interaction, ['ManageGuild']);
            if (!permissionCheck.hasPermission) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Permission Denied', permissionCheck.reason)],
                    ephemeral: true
                });
            }

            const subcommandGroup = interaction.options.getSubcommandGroup();
            const subcommand = interaction.options.getSubcommand();

            // Get guild data
            const guildData = await Utils.getGuildData(interaction.guildId, interaction.guild.name);
            if (!guildData) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Database Error', 'Could not fetch server configuration.')],
                    ephemeral: true
                });
            }

            if (subcommandGroup === 'setup') {
                return this.handleSetup(interaction, subcommand, guildData);
            } else if (subcommandGroup === 'config') {
                return this.handleConfig(interaction, subcommand, guildData);
            } else if (subcommand === 'status') {
                return this.handleStatus(interaction, guildData);
            } else if (subcommand === 'test') {
                return this.handleTest(interaction, guildData);
            } else if (subcommand === 'placeholders') {
                return this.handlePlaceholders(interaction);
            }

        } catch (error) {
            console.error('Error in welcome command:', error);
            
            const errorEmbed = Utils.createErrorEmbed(
                'Command Error',
                'An error occurred while executing the command.'
            );

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleSetup(interaction, type, guildData) {
        const Guild = require('../../schemas/Guild');

        if (type === 'welcome') {
            const channel = interaction.options.getChannel('channel');
            const enabled = interaction.options.getBoolean('enabled') ?? true;
            const message = interaction.options.getString('message');

            // Update guild data
            guildData.welcomeSystem.welcome.channelId = channel.id;
            guildData.welcomeSystem.welcome.enabled = enabled;
            
            if (message) {
                guildData.welcomeSystem.welcome.message = message;
            }

            await guildData.save();

            const embed = Utils.createSuccessEmbed(
                'Welcome System Configured',
                [
                    `✅ **Channel:** ${channel}`,
                    `✅ **Status:** ${enabled ? 'Enabled' : 'Disabled'}`,
                    message ? `✅ **Custom Message:** Set` : '✅ **Message:** Using default'
                ].join('\n')
            );

            return interaction.reply({ embeds: [embed] });

        } else if (type === 'leave') {
            const channel = interaction.options.getChannel('channel');
            const enabled = interaction.options.getBoolean('enabled') ?? true;
            const message = interaction.options.getString('message');

            // Update guild data
            guildData.welcomeSystem.leave.channelId = channel.id;
            guildData.welcomeSystem.leave.enabled = enabled;
            
            if (message) {
                guildData.welcomeSystem.leave.message = message;
            }

            await guildData.save();

            const embed = Utils.createSuccessEmbed(
                'Leave System Configured',
                [
                    `✅ **Channel:** ${channel}`,
                    `✅ **Status:** ${enabled ? 'Enabled' : 'Disabled'}`,
                    message ? `✅ **Custom Message:** Set` : '✅ **Message:** Using default'
                ].join('\n')
            );

            return interaction.reply({ embeds: [embed] });

        } else if (type === 'dm') {
            const enabled = interaction.options.getBoolean('enabled');
            const message = interaction.options.getString('message');

            // Update guild data
            guildData.welcomeSystem.dmWelcome.enabled = enabled;
            
            if (message) {
                guildData.welcomeSystem.dmWelcome.message = message;
            }

            await guildData.save();

            const embed = Utils.createSuccessEmbed(
                'DM Welcome System Configured',
                [
                    `✅ **Status:** ${enabled ? 'Enabled' : 'Disabled'}`,
                    message ? `✅ **Custom Message:** Set` : '✅ **Message:** Using default'
                ].join('\n')
            );

            return interaction.reply({ embeds: [embed] });
        }
    },

    async handleConfig(interaction, type, guildData) {
        if (type === 'welcome') {
            const embed = interaction.options.getBoolean('embed');
            const color = interaction.options.getString('color');
            const mentionUser = interaction.options.getBoolean('mention-user');
            const showAccountAge = interaction.options.getBoolean('show-account-age');
            const showJoinPosition = interaction.options.getBoolean('show-join-position');
            const showInviter = interaction.options.getBoolean('show-inviter');
            const deleteAfter = interaction.options.getInteger('delete-after');

            const changes = [];

            if (embed !== null) {
                guildData.welcomeSystem.welcome.embedEnabled = embed;
                changes.push(`**Embed:** ${embed ? 'Enabled' : 'Disabled'}`);
            }

            if (color) {
                // Validate hex color
                if (!/^#[0-9A-F]{6}$/i.test(color)) {
                    return interaction.reply({
                        embeds: [Utils.createErrorEmbed('Invalid Color', 'Please provide a valid hex color (e.g., #57F287).')],
                        ephemeral: true
                    });
                }
                guildData.welcomeSystem.welcome.embedColor = color;
                changes.push(`**Color:** ${color}`);
            }

            if (mentionUser !== null) {
                guildData.welcomeSystem.welcome.mentionUser = mentionUser;
                changes.push(`**Mention User:** ${mentionUser ? 'Yes' : 'No'}`);
            }

            if (showAccountAge !== null) {
                guildData.welcomeSystem.welcome.showAccountAge = showAccountAge;
                changes.push(`**Show Account Age:** ${showAccountAge ? 'Yes' : 'No'}`);
            }

            if (showJoinPosition !== null) {
                guildData.welcomeSystem.welcome.showJoinPosition = showJoinPosition;
                changes.push(`**Show Join Position:** ${showJoinPosition ? 'Yes' : 'No'}`);
            }

            if (showInviter !== null) {
                guildData.welcomeSystem.welcome.showInviter = showInviter;
                changes.push(`**Show Inviter:** ${showInviter ? 'Yes' : 'No'}`);
            }

            if (deleteAfter !== null) {
                guildData.welcomeSystem.welcome.deleteAfter = deleteAfter;
                changes.push(`**Delete After:** ${deleteAfter ? `${deleteAfter} seconds` : 'Never'}`);
            }

            if (changes.length === 0) {
                return interaction.reply({
                    embeds: [Utils.createWarningEmbed('No Changes', 'Please specify at least one setting to change.')],
                    ephemeral: true
                });
            }

            await guildData.save();

            const responseEmbed = Utils.createSuccessEmbed(
                'Welcome Configuration Updated',
                changes.join('\n')
            );

            return interaction.reply({ embeds: [responseEmbed] });

        } else if (type === 'leave') {
            const embed = interaction.options.getBoolean('embed');
            const color = interaction.options.getString('color');
            const showAccountAge = interaction.options.getBoolean('show-account-age');
            const showJoinDate = interaction.options.getBoolean('show-join-date');
            const showTimeInServer = interaction.options.getBoolean('show-time-in-server');
            const deleteAfter = interaction.options.getInteger('delete-after');

            const changes = [];

            if (embed !== null) {
                guildData.welcomeSystem.leave.embedEnabled = embed;
                changes.push(`**Embed:** ${embed ? 'Enabled' : 'Disabled'}`);
            }

            if (color) {
                // Validate hex color
                if (!/^#[0-9A-F]{6}$/i.test(color)) {
                    return interaction.reply({
                        embeds: [Utils.createErrorEmbed('Invalid Color', 'Please provide a valid hex color (e.g., #ED4245).')],
                        ephemeral: true
                    });
                }
                guildData.welcomeSystem.leave.embedColor = color;
                changes.push(`**Color:** ${color}`);
            }

            if (showAccountAge !== null) {
                guildData.welcomeSystem.leave.showAccountAge = showAccountAge;
                changes.push(`**Show Account Age:** ${showAccountAge ? 'Yes' : 'No'}`);
            }

            if (showJoinDate !== null) {
                guildData.welcomeSystem.leave.showJoinDate = showJoinDate;
                changes.push(`**Show Join Date:** ${showJoinDate ? 'Yes' : 'No'}`);
            }

            if (showTimeInServer !== null) {
                guildData.welcomeSystem.leave.showTimeInServer = showTimeInServer;
                changes.push(`**Show Time in Server:** ${showTimeInServer ? 'Yes' : 'No'}`);
            }

            if (deleteAfter !== null) {
                guildData.welcomeSystem.leave.deleteAfter = deleteAfter;
                changes.push(`**Delete After:** ${deleteAfter ? `${deleteAfter} seconds` : 'Never'}`);
            }

            if (changes.length === 0) {
                return interaction.reply({
                    embeds: [Utils.createWarningEmbed('No Changes', 'Please specify at least one setting to change.')],
                    ephemeral: true
                });
            }

            await guildData.save();

            const responseEmbed = Utils.createSuccessEmbed(
                'Leave Configuration Updated',
                changes.join('\n')
            );

            return interaction.reply({ embeds: [responseEmbed] });
        }
    },

    async handleStatus(interaction, guildData) {
        const welcomeConfig = guildData.welcomeSystem.welcome;
        const leaveConfig = guildData.welcomeSystem.leave;
        const dmConfig = guildData.welcomeSystem.dmWelcome;

        const embed = Utils.createInfoEmbed('Welcome System Status', null);

        // Welcome system status
        const welcomeChannel = welcomeConfig.channelId ? 
            interaction.guild.channels.cache.get(welcomeConfig.channelId) : null;

        embed.addFields({
            name: '🎉 Welcome Messages',
            value: [
                `**Status:** ${welcomeConfig.enabled ? '✅ Enabled' : '❌ Disabled'}`,
                `**Channel:** ${welcomeChannel ? `${welcomeChannel}` : '❌ Not set'}`,
                `**Embed:** ${welcomeConfig.embedEnabled ? 'Yes' : 'No'}`,
                `**Color:** ${welcomeConfig.embedColor}`,
                `**Mention User:** ${welcomeConfig.mentionUser ? 'Yes' : 'No'}`,
                `**Show Account Age:** ${welcomeConfig.showAccountAge ? 'Yes' : 'No'}`,
                `**Show Join Position:** ${welcomeConfig.showJoinPosition ? 'Yes' : 'No'}`,
                `**Show Inviter:** ${welcomeConfig.showInviter ? 'Yes' : 'No'}`,
                `**Delete After:** ${welcomeConfig.deleteAfter ? `${welcomeConfig.deleteAfter}s` : 'Never'}`
            ].join('\n'),
            inline: false
        });

        // Leave system status  
        const leaveChannel = leaveConfig.channelId ? 
            interaction.guild.channels.cache.get(leaveConfig.channelId) : null;

        embed.addFields({
            name: '👋 Leave Messages',
            value: [
                `**Status:** ${leaveConfig.enabled ? '✅ Enabled' : '❌ Disabled'}`,
                `**Channel:** ${leaveChannel ? `${leaveChannel}` : '❌ Not set'}`,
                `**Embed:** ${leaveConfig.embedEnabled ? 'Yes' : 'No'}`,
                `**Color:** ${leaveConfig.embedColor}`,
                `**Show Account Age:** ${leaveConfig.showAccountAge ? 'Yes' : 'No'}`,
                `**Show Join Date:** ${leaveConfig.showJoinDate ? 'Yes' : 'No'}`,
                `**Show Time in Server:** ${leaveConfig.showTimeInServer ? 'Yes' : 'No'}`,
                `**Delete After:** ${leaveConfig.deleteAfter ? `${leaveConfig.deleteAfter}s` : 'Never'}`
            ].join('\n'),
            inline: false
        });

        // DM welcome status
        embed.addFields({
            name: '💌 DM Welcome',
            value: [
                `**Status:** ${dmConfig.enabled ? '✅ Enabled' : '❌ Disabled'}`,
                `**Embed:** ${dmConfig.embedEnabled ? 'Yes' : 'No'}`,
                `**Color:** ${dmConfig.embedColor}`
            ].join('\n'),
            inline: false
        });

        return interaction.reply({ embeds: [embed] });
    },

    async handleTest(interaction, guildData) {
        const type = interaction.options.getString('type');
        const WelcomeSystem = require('../../utils/WelcomeSystem');

        if (type === 'welcome') {
            if (!guildData.welcomeSystem.welcome.enabled) {
                return interaction.reply({
                    embeds: [Utils.createWarningEmbed('Welcome System Disabled', 'Enable welcome messages first using `/welcome setup welcome`.')],
                    ephemeral: true
                });
            }

            const welcomeData = await WelcomeSystem.createWelcomeMessage(interaction.member, guildData, null);
            welcomeData.content = `**🧪 Test Welcome Message**\n${welcomeData.content || ''}`;
            
            if (welcomeData.embeds && welcomeData.embeds[0]) {
                welcomeData.embeds[0].setTitle('🧪 Test Welcome Message');
            }

            return interaction.reply(welcomeData);

        } else if (type === 'leave') {
            if (!guildData.welcomeSystem.leave.enabled) {
                return interaction.reply({
                    embeds: [Utils.createWarningEmbed('Leave System Disabled', 'Enable leave messages first using `/welcome setup leave`.')],
                    ephemeral: true
                });
            }

            const leaveData = await WelcomeSystem.createLeaveMessage(interaction.member, guildData);
            leaveData.content = `**🧪 Test Leave Message**\n${leaveData.content || ''}`;
            
            if (leaveData.embeds && leaveData.embeds[0]) {
                leaveData.embeds[0].setTitle('🧪 Test Leave Message');
            }

            return interaction.reply(leaveData);

        } else if (type === 'dm') {
            if (!guildData.welcomeSystem.dmWelcome.enabled) {
                return interaction.reply({
                    embeds: [Utils.createWarningEmbed('DM Welcome System Disabled', 'Enable DM welcome messages first using `/welcome setup dm`.')],
                    ephemeral: true
                });
            }

            const dmConfig = guildData.welcomeSystem.dmWelcome;
            const message = WelcomeSystem.replacePlaceholders(dmConfig.message, interaction.member, interaction.guild);

            if (!dmConfig.embedEnabled) {
                return interaction.reply({
                    content: `**🧪 Test DM Welcome Message**\n${message}`,
                    ephemeral: true
                });
            }

            const embed = Utils.createInfoEmbed(`🧪 Test DM Welcome - ${interaction.guild.name}`, message)
                .setColor(dmConfig.embedColor || '#5865F2')
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }));

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    async handlePlaceholders(interaction) {
        const embed = Utils.createInfoEmbed('Available Placeholders', 'Use these placeholders in your welcome and leave messages:');

        embed.addFields([
            {
                name: '👤 User Placeholders',
                value: [
                    '`{user.mention}` - Mentions the user (@User)',
                    '`{user.tag}` - User#1234',
                    '`{user.username}` - Username only',
                    '`{user.displayName}` - Display name in server',
                    '`{user.id}` - User ID'
                ].join('\n'),
                inline: false
            },
            {
                name: '🏠 Server Placeholders',
                value: [
                    '`{guild.name}` - Server name',
                    '`{guild.memberCount}` - Current member count',
                    '`{guild.id}` - Server ID'
                ].join('\n'),
                inline: false
            },
            {
                name: '💌 Invite Placeholders (Welcome only)',
                value: [
                    '`{inviter.tag}` - Who invited the user',
                    '`{inviter.mention}` - Mention who invited',
                    '`{invite.code}` - Invite code used',
                    '`{invite.uses}` - Number of times invite was used'
                ].join('\n'),
                inline: false
            },
            {
                name: 'Example Messages',
                value: [
                    '**Welcome:** `Welcome {user.mention} to **{guild.name}**! You are member #{guild.memberCount}!`',
                    '**Leave:** `{user.tag} has left us. We now have {guild.memberCount} members.`',
                    '**DM:** `Welcome to **{guild.name}**! Thanks for joining our community!`'
                ].join('\n\n'),
                inline: false
            }
        ]);

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
