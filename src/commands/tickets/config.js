const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const TicketConfig = require('../../schemas/TicketConfig');
const Utils = require('../../utils/utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('Configure the ticket system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Initial setup for the ticket system')
                .addChannelOption(option =>
                    option
                        .setName('open_category')
                        .setDescription('Category for open tickets')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true))
                .addChannelOption(option =>
                    option
                        .setName('closed_category')
                        .setDescription('Category for closed tickets')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true))
                .addChannelOption(option =>
                    option
                        .setName('log_channel')
                        .setDescription('Channel for ticket logs')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup-automatic')
                .setDescription('Automated setup - creates all channels, categories, and roles automatically')
                .addStringOption(option =>
                    option
                        .setName('staff_role_name')
                        .setDescription('Name for the staff role (default: "Ticket Staff")')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('View current configuration'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('channels')
                .setDescription('Configure ticket channels')
                .addChannelOption(option =>
                    option
                        .setName('open_category')
                        .setDescription('Category for open tickets')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(false))
                .addChannelOption(option =>
                    option
                        .setName('closed_category')
                        .setDescription('Category for closed tickets')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(false))
                .addChannelOption(option =>
                    option
                        .setName('log_channel')
                        .setDescription('Channel for ticket logs')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false))
                .addChannelOption(option =>
                    option
                        .setName('archive_channel')
                        .setDescription('Channel for ticket archives')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('staff')
                .setDescription('Manage staff roles')
                .addStringOption(option =>
                    option
                        .setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add Role', value: 'add' },
                            { name: 'Remove Role', value: 'remove' },
                            { name: 'List Roles', value: 'list' }
                        ))
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Staff role')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('settings')
                .setDescription('Configure ticket settings')
                .addIntegerOption(option =>
                    option
                        .setName('max_open_per_user')
                        .setDescription('Maximum open tickets per user')
                        .setMinValue(1)
                        .setMaxValue(20)
                        .setRequired(false))
                .addIntegerOption(option =>
                    option
                        .setName('rate_limit_tickets')
                        .setDescription('Maximum tickets per cooldown period')
                        .setMinValue(1)
                        .setMaxValue(10)
                        .setRequired(false))
                .addIntegerOption(option =>
                    option
                        .setName('rate_limit_minutes')
                        .setDescription('Rate limit cooldown in minutes')
                        .setMinValue(5)
                        .setMaxValue(1440)
                        .setRequired(false))
                .addBooleanOption(option =>
                    option
                        .setName('ping_staff_on_create')
                        .setDescription('Ping staff when tickets are created')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option
                        .setName('dm_notifications')
                        .setDescription('Send DM notifications to users')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('autoclose')
                .setDescription('Configure auto-close settings')
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('Enable auto-close')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option
                        .setName('hours')
                        .setDescription('Hours of inactivity before auto-close')
                        .setMinValue(1)
                        .setMaxValue(168)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('transcripts')
                .setDescription('Configure transcript settings')
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('Enable transcripts')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('format')
                        .setDescription('Transcript format')
                        .addChoices(
                            { name: 'HTML', value: 'html' },
                            { name: 'Text', value: 'txt' },
                            { name: 'JSON', value: 'json' }
                        )
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('naming')
                .setDescription('Configure ticket naming')
                .addStringOption(option =>
                    option
                        .setName('pattern')
                        .setDescription('Naming pattern')
                        .addChoices(
                            { name: 'ticket-username', value: 'ticket-username' },
                            { name: 'ticket-####', value: 'ticket-####' },
                            { name: 'username-ticket', value: 'username-ticket' },
                            { name: '####-ticket', value: '####-ticket' }
                        )
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('tags')
                .setDescription('Manage ticket tags')
                .addStringOption(option =>
                    option
                        .setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add Tag', value: 'add' },
                            { name: 'Remove Tag', value: 'remove' },
                            { name: 'List Tags', value: 'list' }
                        ))
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Tag name')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('Tag description')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('color')
                        .setDescription('Tag color (hex code)')
                        .setRequired(false))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'setup':
                await this.setupTicketSystem(interaction);
                break;
            case 'setup-automatic':
                await this.automatedSetup(interaction);
                break;
            case 'config':
                await this.showConfig(interaction);
                break;
            case 'channels':
                await this.configureChannels(interaction);
                break;
            case 'staff':
                await this.manageStaff(interaction);
                break;
            case 'settings':
                await this.configureSettings(interaction);
                break;
            case 'autoclose':
                await this.configureAutoClose(interaction);
                break;
            case 'transcripts':
                await this.configureTranscripts(interaction);
                break;
            case 'naming':
                await this.configureNaming(interaction);
                break;
            case 'tags':
                await this.manageTags(interaction);
                break;
        }
    },

    async setupTicketSystem(interaction) {
        const openCategory = interaction.options.getChannel('open_category');
        const closedCategory = interaction.options.getChannel('closed_category');
        const logChannel = interaction.options.getChannel('log_channel');

        try {
            await interaction.deferReply({ ephemeral: true });

            // Create or update configuration
            let config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config) {
                config = new TicketConfig({ guildId: interaction.guild.id });
            }

            config.channels.openCategory = openCategory.id;
            config.channels.closedCategory = closedCategory.id;
            config.channels.modLogChannel = logChannel.id;

            await config.save();

            const embed = Utils.createSuccessEmbed(
                'Ticket System Setup Complete',
                `✅ Open Category: ${openCategory}\n` +
                `✅ Closed Category: ${closedCategory}\n` +
                `✅ Log Channel: ${logChannel}\n\n` +
                `You can now create ticket panels using \`/panel create\``
            );

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error setting up ticket system:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Setup Failed', 'Failed to set up ticket system. Please try again.')]
            });
        }
    },

    async automatedSetup(interaction) {
        const staffRoleName = interaction.options.getString('staff_role_name') || 'Ticket Staff';

        try {
            await interaction.deferReply({ ephemeral: true });

            const guild = interaction.guild;
            
            // Create or update configuration
            let config = await TicketConfig.findOne({ guildId: guild.id });
            
            if (!config) {
                config = new TicketConfig({ guildId: guild.id });
            }

            // Step 1: Create staff role
            const staffRole = await guild.roles.create({
                name: staffRoleName,
                color: 0x5865F2,
                hoist: true,
                mentionable: true,
                permissions: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.EmbedLinks,
                    PermissionFlagsBits.ManageMessages,
                    PermissionFlagsBits.UseExternalEmojis
                ],
                reason: 'Automated ticket system setup'
            });

            // Step 2: Create categories
            const openCategory = await guild.channels.create({
                name: '📂 Open Tickets',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: staffRole.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks,
                            PermissionFlagsBits.ManageMessages
                        ]
                    }
                ],
                reason: 'Automated ticket system setup'
            });

            const closedCategory = await guild.channels.create({
                name: '📁 Closed Tickets',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: staffRole.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks,
                            PermissionFlagsBits.ManageMessages
                        ]
                    }
                ],
                reason: 'Automated ticket system setup'
            });

            // Step 3: Create log channel
            const logChannel = await guild.channels.create({
                name: 'ticket-logs',
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: staffRole.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }
                ],
                reason: 'Automated ticket system setup'
            });

            // Step 4: Update configuration
            config.channels.openCategory = openCategory.id;
            config.channels.closedCategory = closedCategory.id;
            config.channels.modLogChannel = logChannel.id;

            // Add staff role to configuration
            if (!config.staffRoles.some(role => role.roleId === staffRole.id)) {                    config.staffRoles.push({
                        roleId: staffRole.id,
                        roleName: staffRole.name,
                        permissions: {
                            canView: true,
                            canClose: true,
                            canAssign: true,
                            canDelete: true,
                            canReopen: true,
                            canManagePanel: true
                        }
                    });
            }

            await config.save();

            // Step 5: Send welcome message to log channel
            const welcomeEmbed = Utils.createEmbed({
                title: '🎫 Ticket System Setup Complete!',
                description: 'The automated setup has been completed successfully. Your ticket system is now ready to use!',
                color: 0x57F287,
                fields: [
                    { name: '📂 Open Category', value: openCategory.toString(), inline: true },
                    { name: '📁 Closed Category', value: closedCategory.toString(), inline: true },
                    { name: '📋 Log Channel', value: logChannel.toString(), inline: true },
                    { name: '👥 Staff Role', value: staffRole.toString(), inline: true },
                    { name: '🚀 Next Steps', value: 'Use `/panel create` to create your first ticket panel!', inline: false }
                ],
                footer: { text: 'DeepQuasar Ticket System' }
            });

            await logChannel.send({ embeds: [welcomeEmbed] });

            const successEmbed = Utils.createSuccessEmbed(
                '🎉 Automated Setup Complete!',
                `✅ **Staff Role:** ${staffRole}\n` +
                `✅ **Open Category:** ${openCategory}\n` +
                `✅ **Closed Category:** ${closedCategory}\n` +
                `✅ **Log Channel:** ${logChannel}\n\n` +
                `🚀 **Your ticket system is ready!** Use \`/panel create\` to create your first ticket panel.\n\n` +
                `💡 **Tip:** Assign the ${staffRole} role to your support team members.`
            );

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error in automated setup:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Automated Setup Failed', 
                    `Failed to set up ticket system automatically: ${error.message}\n\n` +
                    'Please ensure the bot has sufficient permissions to create roles, channels, and categories.'
                )]
            });
        }
    },

    async showConfig(interaction) {
        try {
            const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('No Configuration', 'Ticket system is not configured. Use `/tickets setup` to get started.')],
                    ephemeral: true
                });
            }

            const openCategory = interaction.guild.channels.cache.get(config.channels.openCategory);
            const closedCategory = interaction.guild.channels.cache.get(config.channels.closedCategory);
            const logChannel = interaction.guild.channels.cache.get(config.channels.modLogChannel);
            const archiveChannel = interaction.guild.channels.cache.get(config.channels.archiveChannel);

            const embed = Utils.createEmbed({
                title: '🎫 Ticket System Configuration',
                color: 0x5865F2,
                fields: [
                    {
                        name: '📁 Channels',
                        value: `**Open Category:** ${openCategory || 'Not set'}\n` +
                               `**Closed Category:** ${closedCategory || 'Not set'}\n` +
                               `**Log Channel:** ${logChannel || 'Not set'}\n` +
                               `**Archive Channel:** ${archiveChannel || 'Not set'}`,
                        inline: false
                    },
                    {
                        name: '👥 Staff Roles',
                        value: config.staffRoles.length > 0 
                            ? config.staffRoles.map(role => {
                                const roleObj = interaction.guild.roles.cache.get(role.roleId);
                                return roleObj ? roleObj.toString() : 'Unknown Role';
                            }).join('\n')
                            : 'No staff roles configured',
                        inline: true
                    },
                    {
                        name: '⚙️ Settings',
                        value: `**Max Open Per User:** ${config.settings.maxOpenTicketsPerUser}\n` +
                               `**Rate Limit:** ${config.rateLimiting.maxTicketsPerUser} tickets per ${config.rateLimiting.cooldownMinutes} minutes\n` +
                               `**Ping Staff:** ${config.settings.pingStaffOnCreate ? 'Yes' : 'No'}\n` +
                               `**DM Notifications:** ${config.dmNotifications.onOpen ? 'Yes' : 'No'}`,
                        inline: true
                    },
                    {
                        name: '🔄 Auto-Close',
                        value: config.autoClose.enabled 
                            ? `Enabled (${config.autoClose.inactivityHours} hours)`
                            : 'Disabled',
                        inline: true
                    },
                    {
                        name: '📄 Transcripts',
                        value: config.transcripts.enabled 
                            ? `Enabled (${config.transcripts.format.toUpperCase()})`
                            : 'Disabled',
                        inline: true
                    },
                    {
                        name: '🏷️ Tags',
                        value: config.tags.length > 0 
                            ? `${config.tags.length} tags configured`
                            : 'No tags configured',
                        inline: true
                    },
                    {
                        name: '📋 Panels',
                        value: `${config.panels.length} panels created`,
                        inline: true
                    }
                ]
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error showing config:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to load configuration.')],
                ephemeral: true
            });
        }
    },

    async configureChannels(interaction) {
        const openCategory = interaction.options.getChannel('open_category');
        const closedCategory = interaction.options.getChannel('closed_category');
        const logChannel = interaction.options.getChannel('log_channel');
        const archiveChannel = interaction.options.getChannel('archive_channel');

        try {
            let config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('No Configuration', 'Please run `/tickets setup` first.')],
                    ephemeral: true
                });
            }

            let changes = [];

            if (openCategory) {
                config.channels.openCategory = openCategory.id;
                changes.push(`✅ Open Category: ${openCategory}`);
            }

            if (closedCategory) {
                config.channels.closedCategory = closedCategory.id;
                changes.push(`✅ Closed Category: ${closedCategory}`);
            }

            if (logChannel) {
                config.channels.modLogChannel = logChannel.id;
                changes.push(`✅ Log Channel: ${logChannel}`);
            }

            if (archiveChannel) {
                config.channels.archiveChannel = archiveChannel.id;
                changes.push(`✅ Archive Channel: ${archiveChannel}`);
            }

            if (changes.length === 0) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('No Changes', 'Please specify at least one channel to update.')],
                    ephemeral: true
                });
            }

            await config.save();

            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Channels Updated', changes.join('\n'))],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error configuring channels:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to update channels.')],
                ephemeral: true
            });
        }
    },

    async manageStaff(interaction) {
        const action = interaction.options.getString('action');
        const role = interaction.options.getRole('role');

        try {
            let config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config) {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({
                        embeds: [Utils.createErrorEmbed('No Configuration', 'Please run `/tickets setup` first.')],
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        embeds: [Utils.createErrorEmbed('No Configuration', 'Please run `/tickets setup` first.')],
                        ephemeral: true
                    });
                }
                return;
            }

            switch (action) {
                case 'add':
                    if (!role) {
                        if (interaction.replied || interaction.deferred) {
                            await interaction.editReply({
                                embeds: [Utils.createErrorEmbed('Missing Role', 'Please specify a role to add.')],
                                ephemeral: true
                            });
                        } else {
                            await interaction.reply({
                                embeds: [Utils.createErrorEmbed('Missing Role', 'Please specify a role to add.')],
                                ephemeral: true
                            });
                        }
                        return;
                    }

                    if (config.staffRoles.some(staffRole => staffRole.roleId === role.id)) {
                        if (interaction.replied || interaction.deferred) {
                            await interaction.editReply({
                                embeds: [Utils.createErrorEmbed('Role Exists', 'This role is already a staff role.')],
                                ephemeral: true
                            });
                        } else {
                            await interaction.reply({
                                embeds: [Utils.createErrorEmbed('Role Exists', 'This role is already a staff role.')],
                                ephemeral: true
                            });
                        }
                        return;
                    }

                    config.staffRoles.push({
                        roleId: role.id,
                        roleName: role.name,
                        permissions: {
                            canView: true,
                            canAssign: true,
                            canClose: true,
                            canDelete: false,
                            canReopen: true,
                            canManagePanel: false
                        }
                    });

                    await config.save();

                    if (interaction.replied || interaction.deferred) {
                        await interaction.editReply({
                            embeds: [Utils.createSuccessEmbed('Staff Role Added', `${role} has been added as a staff role.`)],
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            embeds: [Utils.createSuccessEmbed('Staff Role Added', `${role} has been added as a staff role.`)],
                            ephemeral: true
                        });
                    }
                    break;

                case 'remove':
                    if (!role) {
                        if (interaction.replied || interaction.deferred) {
                            await interaction.editReply({
                                embeds: [Utils.createErrorEmbed('Missing Role', 'Please specify a role to remove.')],
                                ephemeral: true
                            });
                        } else {
                            await interaction.reply({
                                embeds: [Utils.createErrorEmbed('Missing Role', 'Please specify a role to remove.')],
                                ephemeral: true
                            });
                        }
                        return;
                    }

                    const roleIndex = config.staffRoles.findIndex(staffRole => staffRole.roleId === role.id);
                    if (roleIndex === -1) {
                        if (interaction.replied || interaction.deferred) {
                            await interaction.editReply({
                                embeds: [Utils.createErrorEmbed('Role Not Found', 'This role is not a staff role.')],
                                ephemeral: true
                            });
                        } else {
                            await interaction.reply({
                                embeds: [Utils.createErrorEmbed('Role Not Found', 'This role is not a staff role.')],
                                ephemeral: true
                            });
                        }
                        return;
                    }

                    config.staffRoles.splice(roleIndex, 1);
                    await config.save();

                    if (interaction.replied || interaction.deferred) {
                        await interaction.editReply({
                            embeds: [Utils.createSuccessEmbed('Staff Role Removed', `${role} has been removed as a staff role.`)],
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            embeds: [Utils.createSuccessEmbed('Staff Role Removed', `${role} has been removed as a staff role.`)],
                            ephemeral: true
                        });
                    }
                    break;

                case 'list':
                    const staffList = config.staffRoles.length > 0 
                        ? config.staffRoles.map(staffRole => {
                            const roleObj = interaction.guild.roles.cache.get(staffRole.roleId);
                            const permissions = Object.entries(staffRole.permissions)
                                .filter(([, value]) => value)
                                .map(([key]) => key.replace('can', '').toLowerCase())
                                .join(', ');
                            return `${roleObj || 'Unknown Role'} - ${permissions}`;
                        }).join('\n')
                        : 'No staff roles configured';

                    if (interaction.replied || interaction.deferred) {
                        await interaction.editReply({
                            embeds: [Utils.createEmbed({
                                title: '👥 Staff Roles',
                                description: staffList,
                                color: 0x5865F2
                            })],
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            embeds: [Utils.createEmbed({
                                title: '👥 Staff Roles',
                                description: staffList,
                                color: 0x5865F2
                            })],
                            ephemeral: true
                        });
                    }
                    break;
            }

        } catch (error) {
            console.error('Error managing staff:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Error', 'Failed to manage staff roles.')],
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Error', 'Failed to manage staff roles.')],
                    ephemeral: true
                });
            }
        }
    },

    async configureSettings(interaction) {
        const maxOpenPerUser = interaction.options.getInteger('max_open_per_user');
        const rateLimitTickets = interaction.options.getInteger('rate_limit_tickets');
        const rateLimitMinutes = interaction.options.getInteger('rate_limit_minutes');
        const pingStaff = interaction.options.getBoolean('ping_staff_on_create');
        const dmNotifications = interaction.options.getBoolean('dm_notifications');

        try {
            let config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('No Configuration', 'Please run `/tickets setup` first.')],
                    ephemeral: true
                });
            }

            let changes = [];

            if (maxOpenPerUser !== null) {
                config.settings.maxOpenTicketsPerUser = maxOpenPerUser;
                changes.push(`✅ Max open tickets per user: ${maxOpenPerUser}`);
            }

            if (rateLimitTickets !== null) {
                config.rateLimiting.maxTicketsPerUser = rateLimitTickets;
                changes.push(`✅ Rate limit tickets: ${rateLimitTickets}`);
            }

            if (rateLimitMinutes !== null) {
                config.rateLimiting.cooldownMinutes = rateLimitMinutes;
                changes.push(`✅ Rate limit cooldown: ${rateLimitMinutes} minutes`);
            }

            if (pingStaff !== null) {
                config.settings.pingStaffOnCreate = pingStaff;
                changes.push(`✅ Ping staff on create: ${pingStaff ? 'Enabled' : 'Disabled'}`);
            }

            if (dmNotifications !== null) {
                config.dmNotifications.onOpen = dmNotifications;
                config.dmNotifications.onClose = dmNotifications;
                changes.push(`✅ DM notifications: ${dmNotifications ? 'Enabled' : 'Disabled'}`);
            }

            if (changes.length === 0) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('No Changes', 'Please specify at least one setting to update.')],
                    ephemeral: true
                });
            }

            await config.save();

            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Settings Updated', changes.join('\n'))],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error configuring settings:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to update settings.')],
                ephemeral: true
            });
        }
    },

    async configureAutoClose(interaction) {
        const enabled = interaction.options.getBoolean('enabled');
        const hours = interaction.options.getInteger('hours');

        try {
            let config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('No Configuration', 'Please run `/tickets setup` first.')],
                    ephemeral: true
                });
            }

            config.autoClose.enabled = enabled;
            
            if (hours !== null) {
                config.autoClose.inactivityHours = hours;
            }

            await config.save();

            const status = enabled 
                ? `Enabled (${config.autoClose.inactivityHours} hours of inactivity)`
                : 'Disabled';

            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Auto-Close Updated', `Auto-close is now: ${status}`)],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error configuring auto-close:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to update auto-close settings.')],
                ephemeral: true
            });
        }
    },

    async configureTranscripts(interaction) {
        const enabled = interaction.options.getBoolean('enabled');
        const format = interaction.options.getString('format');

        try {
            let config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('No Configuration', 'Please run `/tickets setup` first.')],
                    ephemeral: true
                });
            }

            config.transcripts.enabled = enabled;
            
            if (format) {
                config.transcripts.format = format;
            }

            await config.save();

            const status = enabled 
                ? `Enabled (${config.transcripts.format.toUpperCase()} format)`
                : 'Disabled';

            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Transcripts Updated', `Transcripts are now: ${status}`)],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error configuring transcripts:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to update transcript settings.')],
                ephemeral: true
            });
        }
    },

    async configureNaming(interaction) {
        const pattern = interaction.options.getString('pattern');

        try {
            let config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('No Configuration', 'Please run `/tickets setup` first.')],
                    ephemeral: true
                });
            }

            config.naming.pattern = pattern;
            await config.save();

            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Naming Pattern Updated', `Ticket naming pattern set to: ${pattern}`)],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error configuring naming:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to update naming pattern.')],
                ephemeral: true
            });
        }
    },

    async manageTags(interaction) {
        const action = interaction.options.getString('action');
        const name = interaction.options.getString('name');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color');

        try {
            let config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('No Configuration', 'Please run `/tickets setup` first.')],
                    ephemeral: true
                });
            }

            switch (action) {
                case 'add':
                    if (!name) {
                        return interaction.reply({
                            embeds: [Utils.createErrorEmbed('Missing Name', 'Please specify a tag name.')],
                            ephemeral: true
                        });
                    }

                    if (config.tags.some(tag => tag.name === name)) {
                        return interaction.reply({
                            embeds: [Utils.createErrorEmbed('Tag Exists', 'A tag with this name already exists.')],
                            ephemeral: true
                        });
                    }

                    const newTag = { name };
                    if (description) newTag.description = description;
                    if (color) newTag.color = color;

                    config.tags.push(newTag);
                    await config.save();

                    await interaction.reply({
                        embeds: [Utils.createSuccessEmbed('Tag Added', `Tag "${name}" has been added.`)],
                        ephemeral: true
                    });
                    break;

                case 'remove':
                    if (!name) {
                        return interaction.reply({
                            embeds: [Utils.createErrorEmbed('Missing Name', 'Please specify a tag name.')],
                            ephemeral: true
                        });
                    }

                    const tagIndex = config.tags.findIndex(tag => tag.name === name);
                    if (tagIndex === -1) {
                        return interaction.reply({
                            embeds: [Utils.createErrorEmbed('Tag Not Found', 'No tag found with that name.')],
                            ephemeral: true
                        });
                    }

                    config.tags.splice(tagIndex, 1);
                    await config.save();

                    await interaction.reply({
                        embeds: [Utils.createSuccessEmbed('Tag Removed', `Tag "${name}" has been removed.`)],
                        ephemeral: true
                    });
                    break;

                case 'list':
                    const tagList = config.tags.length > 0 
                        ? config.tags.map(tag => `• **${tag.name}**${tag.description ? ` - ${tag.description}` : ''}`).join('\n')
                        : 'No tags configured';

                    await interaction.reply({
                        embeds: [Utils.createEmbed({
                            title: '🏷️ Available Tags',
                            description: tagList,
                            color: 0x5865F2
                        })],
                        ephemeral: true
                    });
                    break;
            }

        } catch (error) {
            console.error('Error managing tags:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to manage tags.')],
                ephemeral: true
            });
        }
    }
};
