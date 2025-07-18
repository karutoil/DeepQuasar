const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const Utils = require('../../../utils/utils');

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
        .addSubcommandGroup(group =>
            group
                .setName('custom')
                .setDescription('Create custom embeds for welcome and leave messages')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('welcome')
                        .setDescription('Create a custom welcome embed with interactive builder')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('leave')
                        .setDescription('Create a custom leave embed with interactive builder')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('dm')
                        .setDescription('Create a custom DM welcome embed with interactive builder')
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
            } else if (subcommandGroup === 'custom') {
                return this.handleCustomEmbed(interaction, subcommand, guildData);
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
        const Guild = require('../../../schemas/Guild');

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
                `**Custom Embed:** ${welcomeConfig.customEmbed?.enabled ? '✅ Enabled' : '❌ Using Default'}`,
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
                `**Custom Embed:** ${leaveConfig.customEmbed?.enabled ? '✅ Enabled' : '❌ Using Default'}`,
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
                `**Custom Embed:** ${dmConfig.customEmbed?.enabled ? '✅ Enabled' : '❌ Using Default'}`,
                `**Color:** ${dmConfig.embedColor}`
            ].join('\n'),
            inline: false
        });

        return interaction.reply({ embeds: [embed] });
    },

    async handleTest(interaction, guildData) {
        const type = interaction.options.getString('type');
        const WelcomeSystem = require('../../../utils/WelcomeSystem');

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
                    '`{user.id}` - User ID',
                    '`{user.avatar}` - User avatar URL',
                    '`{user.banner}` - User banner URL'
                ].join('\n'),
                inline: false
            },
            {
                name: '🏠 Server Placeholders',
                value: [
                    '`{guild.name}` - Server name',
                    '`{guild.memberCount}` - Current member count (1st, 2nd, 3rd, etc.)',
                    '`{guild.id}` - Server ID',
                    '`{guild.icon}` - Server icon URL',
                    '`{guild.banner}` - Server banner URL',
                    '`{guild.description}` - Server description',
                    '`{guild.boostLevel}` - Server boost level',
                    '`{guild.boostCount}` - Number of boosts'
                ].join('\n'),
                inline: false
            },
            {
                name: '⏰ Time Placeholders',
                value: [
                    '`{time}` - Current time',
                    '`{date}` - Current date',
                    '`{timestamp}` - Discord timestamp (long)',
                    '`{timestamp.short}` - Discord timestamp (short)',
                    '`{account.created}` - Account creation timestamp'
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
                name: '📊 Extended Placeholders',
                value: [
                    '`{account.age}` - How old the account is',
                    '`{join.position}` - Member join position (#1st, #2nd, #3rd, etc.)',
                    '`{join.date}` - When they joined (timestamp)',
                    '`{time.in.server}` - Time spent in server (leave only)'
                ].join('\n'),
                inline: false
            },
            {
                name: 'Example Messages',
                value: [
                    '**Welcome:** `Welcome {user.mention} to **{guild.name}**! You are our {guild.memberCount} member!`',
                    '**Leave:** `{user.tag} has left us. We now have {guild.memberCount} members.`',
                    '**DM:** `Welcome to **{guild.name}**! Thanks for joining our community!`'
                ].join('\n\n'),
                inline: false
            }
        ]);

        return interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleCustomEmbed(interaction, type, guildData) {
        const EmbedBuilderHandler = require('../../../utils/EmbedBuilderHandler');
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

        try {
            // Create a special session for welcome embed building
            const session = EmbedBuilderHandler.getSession(interaction.user.id);
            
            // Set the context for placeholder replacement
            session.welcomeContext = {
                type: type, // 'welcome', 'leave', or 'dm'
                guildData: guildData,
                isWelcomeBuilder: true
            };

            // Load existing custom embed if it exists
            const configPath = type === 'welcome' ? guildData.welcomeSystem.welcome.customEmbed :
                             type === 'leave' ? guildData.welcomeSystem.leave.customEmbed :
                             guildData.welcomeSystem.dmWelcome.customEmbed;

            if (configPath && configPath.enabled && configPath.embedData) {
                // Load existing custom embed
                session.embedData = { ...configPath.embedData };
                session.messageContent = configPath.embedData.messageContent || '';
            } else {
                // Start with empty embed
                session.embedData = EmbedBuilderHandler.createEmptyEmbedData();
                session.messageContent = '';
                
                // Set some defaults based on type
                if (type === 'welcome') {
                    session.embedData.title = '🎉 Welcome to {guild.name}!';
                    session.embedData.description = 'Welcome {user.mention} to **{guild.name}**!\n\nYou are our **{guild.memberCount}** member!';
                    session.embedData.color = 0x57F287;
                } else if (type === 'leave') {
                    session.embedData.title = '👋 Member Left';
                    session.embedData.description = '**{user.tag}** has left the server.\n\nWe now have **{guild.memberCount}** members.';
                    session.embedData.color = 0xED4245;
                } else if (type === 'dm') {
                    session.embedData.title = 'Welcome to {guild.name}!';
                    session.embedData.description = 'Welcome to **{guild.name}**! 🎉\n\nThanks for joining our community!';
                    session.embedData.color = 0x5865F2;
                }
            }

            // Create initial embed with placeholders info
            const placeholderEmbed = new EmbedBuilder()
                .setTitle(`🎨 Custom ${type.charAt(0).toUpperCase() + type.slice(1)} Embed Builder`)
                .setDescription(
                    `**Create a custom embed for ${type} messages**\n\n` +
                    '**Available Placeholders:**\n' +
                    this.getPlaceholdersList(type) + '\n\n' +
                    '**Note:** All placeholders will be automatically replaced when the embed is sent.\n' +
                    'Use the embed builder below to design your custom message.'
                )
                .setColor(0x5865F2)
                .setFooter({ text: 'Use placeholders in your embed content - they will be replaced automatically' });

            // Create preview embed with placeholders replaced for demonstration
            const previewEmbed = this.createWelcomePreviewEmbed(session.embedData, interaction.member, interaction.guild, type);

            // Create custom components for welcome embed builder
            const components = await this.createWelcomeBuilderComponents(interaction.guild.id, type);

            // Prepare message content if available
            let messageContent = undefined;
            if (session.messageContent && session.messageContent.trim()) {
                const processedContent = this.replacePlaceholdersPreview(
                    session.messageContent, 
                    interaction.member, 
                    interaction.guild, 
                    { inviter: { tag: 'Inviter#1234', id: '123456789' }, code: 'abc123', uses: 5 }
                );
                messageContent = `📝 **Content Preview:** ${processedContent}`;
            }

            const message = await interaction.reply({
                content: messageContent,
                embeds: [placeholderEmbed, previewEmbed],
                components: components,
                ephemeral: true
            });

            // Store message reference for updates
            session.messageRef = message;

        } catch (error) {
            console.error('Error in handleCustomEmbed:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Builder Error', 'Failed to launch custom embed builder.')],
                ephemeral: true
            });
        }
    },

    getPlaceholdersList(type) {
        const userPlaceholders = [
            '`{user.mention}` - @User',
            '`{user.tag}` - User#1234',
            '`{user.username}` - Username',
            '`{user.displayName}` - Display name',
            '`{user.id}` - User ID',
            '`{user.avatar}` - Avatar URL',
            '`{user.banner}` - Banner URL'
        ];

        const guildPlaceholders = [
            '`{guild.name}` - Server name',
            '`{guild.memberCount}` - Member count (1st, 2nd, 3rd, etc.)',
            '`{guild.id}` - Server ID',
            '`{guild.icon}` - Server icon URL',
            '`{guild.banner}` - Server banner URL',
            '`{guild.description}` - Server description',
            '`{guild.boostLevel}` - Boost level',
            '`{guild.boostCount}` - Boost count'
        ];

        const timePlaceholders = [
            '`{time}` - Current time',
            '`{date}` - Current date',
            '`{timestamp}` - Discord timestamp',
            '`{timestamp.short}` - Short timestamp',
            '`{account.created}` - Account creation'
        ];

        let placeholders = [
            '**👤 User:**', ...userPlaceholders,
            '**🏠 Server:**', ...guildPlaceholders,
            '**⏰ Time:**', ...timePlaceholders
        ];

        if (type === 'welcome') {
            const invitePlaceholders = [
                '`{inviter.tag}` - Who invited',
                '`{inviter.mention}` - @Inviter',
                '`{invite.code}` - Invite code',
                '`{invite.uses}` - Times used',
                '`{account.age}` - Account age',
                '`{join.position}` - Join position (#1st, #2nd, #3rd, etc.)'
            ];
            placeholders.push('**💌 Welcome Only:**', ...invitePlaceholders);
        } else if (type === 'leave') {
            const leavePlaceholders = [
                '`{account.age}` - Account age',
                '`{join.date}` - When they joined',
                '`{time.in.server}` - Time in server'
            ];
            placeholders.push('**👋 Leave Only:**', ...leavePlaceholders);
        }

        return placeholders.join('\n');
    },

    createWelcomePreviewEmbed(embedData, member, guild, type) {
        const EmbedBuilderHandler = require('../../../utils/EmbedBuilderHandler');
        const WelcomeSystem = require('../../../utils/WelcomeSystem');
        
        // Create a copy of embed data with placeholders replaced
        const previewData = JSON.parse(JSON.stringify(embedData));
        
        // Create fake inviter data for preview
        const fakeInviter = {
            inviter: { tag: 'Inviter#1234', id: '123456789' },
            code: 'abc123',
            uses: 5
        };

        // Replace placeholders in all text fields
        if (previewData.title) {
            previewData.title = this.replacePlaceholdersPreview(previewData.title, member, guild, fakeInviter);
        }
        if (previewData.description) {
            previewData.description = this.replacePlaceholdersPreview(previewData.description, member, guild, fakeInviter);
        }
        if (previewData.author && previewData.author.name) {
            previewData.author.name = this.replacePlaceholdersPreview(previewData.author.name, member, guild, fakeInviter);
        }
        if (previewData.footer && previewData.footer.text) {
            previewData.footer.text = this.replacePlaceholdersPreview(previewData.footer.text, member, guild, fakeInviter);
        }
        if (previewData.fields && Array.isArray(previewData.fields)) {
            previewData.fields.forEach(field => {
                if (field.name) field.name = this.replacePlaceholdersPreview(field.name, member, guild, fakeInviter);
                if (field.value) field.value = this.replacePlaceholdersPreview(field.value, member, guild, fakeInviter);
            });
        }

        // Replace placeholders in URL fields as well
        if (previewData.url) {
            previewData.url = this.replacePlaceholdersPreview(previewData.url, member, guild, fakeInviter);
        }
        if (previewData.thumbnail && previewData.thumbnail.url) {
            previewData.thumbnail.url = this.replacePlaceholdersPreview(previewData.thumbnail.url, member, guild, fakeInviter);
        }
        if (previewData.image && previewData.image.url) {
            previewData.image.url = this.replacePlaceholdersPreview(previewData.image.url, member, guild, fakeInviter);
        }
        if (previewData.author && previewData.author.iconURL) {
            previewData.author.iconURL = this.replacePlaceholdersPreview(previewData.author.iconURL, member, guild, fakeInviter);
        }
        if (previewData.author && previewData.author.url) {
            previewData.author.url = this.replacePlaceholdersPreview(previewData.author.url, member, guild, fakeInviter);
        }
        if (previewData.footer && previewData.footer.iconURL) {
            previewData.footer.iconURL = this.replacePlaceholdersPreview(previewData.footer.iconURL, member, guild, fakeInviter);
        }

        const preview = EmbedBuilderHandler.createPreviewEmbed(previewData);
        
        // Add preview indicator
        if (preview.data.title) {
            preview.setTitle(`🔍 Preview: ${preview.data.title}`);
        } else {
            preview.setTitle(`🔍 ${type.charAt(0).toUpperCase() + type.slice(1)} Preview`);
        }

        return preview;
    },

    replacePlaceholdersPreview(text, member, guild, inviter = null) {
        if (!text) return '';

        const now = new Date();
        const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
        const joinedDaysAgo = member.joinedAt ? Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24)) : 0;

        return text
            .replace(/\{user\.mention\}/g, member.toString())
            .replace(/\{user\.tag\}/g, member.user.tag)
            .replace(/\{user\.username\}/g, member.user.username)
            .replace(/\{user\.displayName\}/g, member.displayName)
            .replace(/\{user\.id\}/g, member.user.id)
            .replace(/\{user\.avatar\}/g, member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .replace(/\{user\.banner\}/g, member.user.bannerURL({ dynamic: true, size: 1024 }) || '')
            .replace(/\{guild\.name\}/g, guild.name)
            .replace(/\{guild\.memberCount\.ordinal\}/g, this.getOrdinalSuffix(guild.memberCount))
            .replace(/\{guild\.memberCount\}/g, this.getOrdinalSuffix(guild.memberCount))
            .replace(/\{guild\.id\}/g, guild.id)
            .replace(/\{guild\.icon\}/g, guild.iconURL({ dynamic: true, size: 1024 }) || '')
            .replace(/\{guild\.banner\}/g, guild.bannerURL({ dynamic: true, size: 1024 }) || '')
            .replace(/\{guild\.description\}/g, guild.description || 'No description')
            .replace(/\{guild\.boostLevel\}/g, guild.premiumTier.toString())
            .replace(/\{guild\.boostCount\}/g, guild.premiumSubscriptionCount?.toString() || '0')
            .replace(/\{time\}/g, now.toLocaleTimeString())
            .replace(/\{date\}/g, now.toLocaleDateString())
            .replace(/\{timestamp\}/g, `<t:${Math.floor(now.getTime() / 1000)}:F>`)
            .replace(/\{timestamp\.short\}/g, `<t:${Math.floor(now.getTime() / 1000)}:f>`)
            .replace(/\{account\.created\}/g, `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`)
            .replace(/\{inviter\.tag\}/g, inviter?.inviter?.tag || 'Unknown')
            .replace(/\{inviter\.mention\}/g, inviter?.inviter ? `<@${inviter.inviter.id}>` : 'Unknown')
            .replace(/\{invite\.code\}/g, inviter?.code || 'Unknown')
            .replace(/\{invite\.uses\}/g, inviter?.uses?.toString() || 'Unknown')
            .replace(/\{account\.age\}/g, `${accountAge} days ago`)
            .replace(/\{join\.position\}/g, `#${this.getOrdinalSuffix(guild.memberCount)}`)
            .replace(/\{join\.date\}/g, member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Unknown')
            .replace(/\{time\.in\.server\}/g, joinedDaysAgo > 0 ? `${joinedDaysAgo} days` : 'Less than a day');
    },

    /**
     * Convert number to ordinal format (1st, 2nd, 3rd, etc.)
     * @param {number} num - The number to convert
     */
    getOrdinalSuffix(num) {
        const number = parseInt(num);
        if (isNaN(number)) return num.toString();
        
        const lastDigit = number % 10;
        const lastTwoDigits = number % 100;
        
        // Special cases for 11th, 12th, 13th
        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
            return number + 'th';
        }
        
        // Regular cases
        switch (lastDigit) {
            case 1:
                return number + 'st';
            case 2:
                return number + 'nd';
            case 3:
                return number + 'rd';
            default:
                return number + 'th';
        }
    },

    async createWelcomeBuilderComponents(guildId, type) {
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        // Main content controls - 5 buttons (max)
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('welcome_embed_content')
                    .setLabel('Content')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('welcome_embed_title')
                    .setLabel('Title')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welcome_embed_description')
                    .setLabel('Description')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welcome_embed_color')
                    .setLabel('Color')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welcome_embed_author')
                    .setLabel('Author')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Visual elements - 5 buttons (max)
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('welcome_embed_footer')
                    .setLabel('Footer')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welcome_embed_thumbnail')
                    .setLabel('Thumbnail')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welcome_embed_image')
                    .setLabel('Image')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welcome_embed_timestamp')
                    .setLabel('Timestamp')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welcome_embed_add_field')
                    .setLabel('Add Field')
                    .setStyle(ButtonStyle.Primary)
            );

        // Field and utility controls - 5 buttons (max)
        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('welcome_embed_edit_field')
                    .setLabel('Edit Field')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('welcome_embed_placeholders')
                    .setLabel('Show Placeholders')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welcome_embed_test')
                    .setLabel('Test Embed')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welcome_embed_save')
                    .setLabel('Save & Enable')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('welcome_embed_disable')
                    .setLabel('Use Default')
                    .setStyle(ButtonStyle.Danger)
            );

        // Final actions - 1 button
        const row4 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('welcome_embed_cancel')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

        return [row1, row2, row3, row4];
    }
};
