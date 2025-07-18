const { 
    ChannelType, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    StringSelectMenuBuilder,
    InteractionType
} = require('discord.js');
const Ticket = require('../schemas/Ticket');
const TicketConfig = require('../schemas/TicketConfig');
const TranscriptGenerator = require('./TranscriptGenerator');
const Utils = require('./utils');
const crypto = require('crypto');
const ms = require('ms');

class TicketManager {
    constructor(client) {
        this.client = client;
        this.transcriptGenerator = new TranscriptGenerator();
        this.activeRateLimits = new Map(); // userId -> timestamp
        this.autoCloseTimers = new Map(); // ticketId -> timeoutId
        
        // Start auto-close scheduler
        this.startAutoCloseScheduler();
    }

    /**
     * Get or create ticket configuration for a guild
     */
    async getConfig(guildId) {
        let config = await TicketConfig.findOne({ guildId });
        let configNeedsSave = false;
        
        if (!config) {
            config = new TicketConfig({
                guildId
            });
            
            // Ensure modalConfig is initialized as a Map
            if (!config.modalConfig) {
                config.modalConfig = new Map();
            }
            
            // Set up default modal configurations
            config.modalConfig.set('support', {
                title: 'Support Request',
                questions: [{
                    id: 'reason',
                    label: 'What do you need help with?',
                    placeholder: 'Please describe your issue in detail...',
                    required: true,
                    maxLength: 1000,
                    minLength: 10,
                    style: 'Paragraph'
                }]
            });
            
            config.modalConfig.set('bug', {
                title: 'Bug Report',
                questions: [{
                    id: 'description',
                    label: 'Bug Description',
                    placeholder: 'Describe the bug you encountered...',
                    required: true,
                    maxLength: 1000,
                    minLength: 10,
                    style: 'Paragraph'
                }, {
                    id: 'steps',
                    label: 'Steps to Reproduce',
                    placeholder: '1. First step\n2. Second step\n3. Bug occurs',
                    required: true,
                    maxLength: 500,
                    minLength: 10,
                    style: 'Paragraph'
                }]
            });
            
            config.modalConfig.set('partnership', {
                title: 'Partnership Request',
                questions: [{
                    id: 'details',
                    label: 'Partnership Details',
                    placeholder: 'Tell us about your server/project and partnership proposal...',
                    required: true,
                    maxLength: 1000,
                    minLength: 50,
                    style: 'Paragraph'
                }]
            });
            configNeedsSave = true;
        }

        // Ensure ticketId counter is correct and not duplicated
        if (!config.naming) config.naming = {};
        if (!config.naming.counter || config.naming.counter <= 1) {
            const nextCounter = await this.getNextAvailableTicketNumber();
            config.naming.counter = nextCounter;
            configNeedsSave = true;
        }

        if (configNeedsSave) {
            await config.save();
        } else {

            // Check if existing config has modal configs, if not, add them
            if (!config.modalConfig || config.modalConfig.size === 0) {
                console.log('Existing config missing modal configurations, adding defaults...');
                
                if (!config.modalConfig) {
                    config.modalConfig = new Map();
                }
                
                config.modalConfig.set('support', {
                    title: 'Support Request',
                    questions: [{
                        id: 'reason',
                        label: 'What do you need help with?',
                        placeholder: 'Please describe your issue in detail...',
                        required: true,
                        maxLength: 1000,
                        minLength: 10,
                        style: 'Paragraph'
                    }]
                });
                
                config.modalConfig.set('bug', {
                    title: 'Bug Report',
                    questions: [{
                        id: 'description',
                        label: 'Bug Description',
                        placeholder: 'Describe the bug you encountered...',
                        required: true,
                        maxLength: 1000,
                        minLength: 10,
                        style: 'Paragraph'
                    }, {
                        id: 'steps',
                        label: 'Steps to Reproduce',
                        placeholder: '1. First step\n2. Second step\n3. Bug occurs',
                        required: true,
                        maxLength: 500,
                        minLength: 10,
                        style: 'Paragraph'
                    }]
                });
                
                config.modalConfig.set('partnership', {
                    title: 'Partnership Request',
                    questions: [{
                        id: 'details',
                        label: 'Partnership Details',
                        placeholder: 'Tell us about your server/project and partnership proposal...',
                        required: true,
                        maxLength: 1000,
                        minLength: 50,
                        style: 'Paragraph'
                    }]
                });
                
                await config.save();
            }
        }
        
        return config;
    }

    /**
     * Create a ticket panel
     */
    async createPanel(guild, channel, options = {}) {
        const config = await this.getConfig(guild.id);
        
        const panelId = crypto.randomUUID();
        const embed = Utils.createEmbed({
            title: options.title || '🎫 Support Tickets',
            description: options.description || 'Click a button below to create a support ticket.',
            color: options.color || 0x5865F2,
            footer: { text: `Panel ID: ${panelId}` }
        });

        const buttons = options.buttons || [
            {
                customId: `ticket_create_support`,
                label: 'General Support',
                emoji: '🛠️',
                style: 'Primary',
                ticketType: 'support',
                description: 'Get help with general questions'
            },
            {
                customId: `ticket_create_bug`,
                label: 'Bug Report',
                emoji: '🐛',
                style: 'Danger',
                ticketType: 'bug',
                description: 'Report a bug or issue'
            },
            {
                customId: `ticket_create_partnership`,
                label: 'Partnership',
                emoji: '🤝',
                style: 'Success',
                ticketType: 'partnership',
                description: 'Discuss partnership opportunities'
            }
        ];

        const rows = this.createButtonRows(buttons);
        const message = await channel.send({ embeds: [embed], components: rows });

        // Save panel to config
        config.panels.push({
            panelId,
            channelId: channel.id,
            messageId: message.id,
            title: options.title || '🎫 Support Tickets',
            description: options.description || 'Click a button below to create a support ticket.',
            color: options.color || '#5865F2',
            buttons: buttons.map(btn => ({
                customId: btn.customId,
                label: btn.label,
                emoji: btn.emoji,
                style: btn.style,
                ticketType: btn.ticketType,
                description: btn.description
            }))
        });

        await config.save();

        return { panelId, message, config };
    }

    /**
     * Handle ticket creation button press
     */
    async handleTicketButton(interaction) {
        const ticketType = interaction.customId.replace('ticket_create_', '');
        const config = await this.getConfig(interaction.guild.id);

        // Check rate limiting
        if (await this.isRateLimited(interaction.user.id, config)) {
            const lastTicket = this.activeRateLimits.get(interaction.user.id);
            const cooldownMs = config.rateLimiting.cooldownMinutes * 60 * 1000;
            const retryAfter = lastTicket ? Math.ceil((cooldownMs - (Date.now() - lastTicket)) / 1000) : null;
            const retryTimestamp = lastTicket ? `<t:${Math.floor((lastTicket + cooldownMs) / 1000)}:R>` : '';
            return interaction.reply({
                embeds: [Utils.createErrorEmbed(
                    'Rate Limited',
                    `You can only create ${config.rateLimiting.maxTicketsPerUser} tickets every ${config.rateLimiting.cooldownMinutes} minutes.` +
                    (retryAfter ? `\nPlease try again in ${retryAfter} seconds (${retryTimestamp}).` : '')
                )],
                ephemeral: true
            });
        }

        // Check if user has too many open tickets
        const openTickets = await Ticket.find({
            guildId: interaction.guild.id,
            userId: interaction.user.id,
            status: 'open'
        });

        if (openTickets.length >= config.settings.maxOpenTicketsPerUser) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed(
                    'Too Many Open Tickets',
                    `You can only have ${config.settings.maxOpenTicketsPerUser} open tickets at a time. Please close some existing tickets first.`
                )],
                ephemeral: true
            });
        }

        // Show modal for ticket creation
        await this.showTicketModal(interaction, ticketType, config);
    }

    /**
     * Show modal for ticket creation
     */
    async showTicketModal(interaction, ticketType, config) {
        console.log('Showing modal for ticket type:', ticketType);
        console.log('Available modal configs:', Array.from(config.modalConfig.keys()));
        
        const modalConfig = config.modalConfig.get(ticketType);
        
        if (!modalConfig) {
            console.log('Modal config not found for:', ticketType);
            console.log('Full modalConfig Map:', config.modalConfig);
            
            // Create a default modal config if none exists
            const defaultModalConfig = {
                title: `${ticketType.charAt(0).toUpperCase() + ticketType.slice(1)} Request`,
                questions: [{
                    id: 'reason',
                    label: 'Please describe your request',
                    placeholder: 'Provide details about your request...',
                    required: true,
                    maxLength: 1000,
                    minLength: 10,
                    style: 'Paragraph'
                }]
            };
            
            // Save it to the config
            config.modalConfig.set(ticketType, defaultModalConfig);
            await config.save();
            
            // Use the default config
            return this.createAndShowModal(interaction, ticketType, defaultModalConfig);
        }

        return this.createAndShowModal(interaction, ticketType, modalConfig);
    }

    /**
     * Create and show the modal
     */
    async createAndShowModal(interaction, ticketType, modalConfig) {
        const modal = new ModalBuilder()
            .setCustomId(`ticket_modal_${ticketType}`)
            .setTitle(modalConfig.title);

        modalConfig.questions.forEach(question => {
            const textInput = new TextInputBuilder()
                .setCustomId(question.id)
                .setLabel(question.label)
                .setStyle(question.style === 'Short' ? TextInputStyle.Short : TextInputStyle.Paragraph)
                .setRequired(question.required)
                .setMaxLength(question.maxLength)
                .setMinLength(question.minLength);

            if (question.placeholder) {
                textInput.setPlaceholder(question.placeholder);
            }

            modal.addComponents(new ActionRowBuilder().addComponents(textInput));
        });

        await interaction.showModal(modal);
    }

    /**
     * Handle modal submission and create ticket
     */
    async handleModalSubmit(interaction) {
        const ticketType = interaction.customId.replace('ticket_modal_', '');
        const config = await this.getConfig(interaction.guild.id);

        // Collect responses
        const responses = {};
        const modalConfig = config.modalConfig.get(ticketType);
        
        modalConfig.questions.forEach(question => {
            responses[question.id] = interaction.fields.getTextInputValue(question.id);
        });

        // Create the ticket
        const ticket = await this.createTicket(interaction, ticketType, responses, config);
        
        if (ticket) {
            // Create a button to jump to the ticket channel
            const jumpButton = new ButtonBuilder()
                .setLabel('Go to Ticket')
                .setEmoji('🎫')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${ticket.channelId}`);

            const actionRow = new ActionRowBuilder()
                .addComponents(jumpButton);

            const successEmbed = Utils.createEmbed({
                title: '🎉 Ticket Created Successfully!',
                description: `Your **${ticketType}** ticket has been created and assigned ID **#${ticket.ticketId}**.\n\n` +
                           `📋 **Channel:** <#${ticket.channelId}>\n` +
                           `⏱️ **Expected Response:** Within 24 hours\n` +
                           `👥 **Status:** Awaiting staff claim\n\n` +
                           `Click the button below to go directly to your ticket!`,
                color: 0x57F287,
                footer: { text: `Ticket ID: ${ticket.ticketId} • Created at ${new Date().toLocaleTimeString()}` }
            });

            await interaction.reply({
                embeds: [successEmbed],
                components: [actionRow],
                ephemeral: true
            });
        }
    }

    /**
     * Create a new ticket
     * Retries up to 5 times if a duplicate ticketId is detected.
     */
    async createTicket(interaction, ticketType, responses, config) {
        const guild = interaction.guild;
        const user = interaction.user;
        let lastError = null;

        for (let attempt = 0; attempt < 5; attempt++) {
            // Generate ticket ID
            const ticketId = this.generateTicketId(config);

            // Generate channel name
            const channelName = this.generateChannelName(user, ticketId, config);

            try {
                // Create the ticket channel
                const channel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: config.channels.openCategory,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                                PermissionFlagsBits.AttachFiles,
                                PermissionFlagsBits.EmbedLinks
                            ]
                        },
                        // Add staff roles
                        ...config.staffRoles
                            .filter(role => role.permissions.canView)
                            .map(role => ({
                                id: role.roleId,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory,
                                    PermissionFlagsBits.AttachFiles,
                                    PermissionFlagsBits.EmbedLinks,
                                    PermissionFlagsBits.ManageMessages
                                ]
                            }))
                    ]
                });

                // Create ticket in database
                const reason = this.combineResponses(responses);
                const ticket = new Ticket({
                    ticketId,
                    guildId: guild.id,
                    channelId: channel.id,
                    userId: user.id,
                    username: user.displayName || user.username,
                    type: ticketType,
                    reason,
                    status: 'open'
                });

                await ticket.save();

                // Send initial message
                await this.sendTicketWelcomeMessage(channel, ticket, config);

                // Set up auto-close if enabled
                if (config.autoClose.enabled) {
                    this.scheduleAutoClose(ticket, config);
                }

                // Log ticket creation
                await this.logTicketEvent('create', ticket, user, config);

                // Send DM notification
                if (config.dmNotifications.onOpen) {
                    await this.sendDMNotification(user, 'opened', ticket);
                }

                // Ping staff if enabled
                if (config.settings.pingStaffOnCreate && config.staffRoles.length > 0) {
                    const staffMentions = config.staffRoles
                        .map(role => `<@&${role.roleId}>`)
                        .join(' ');

                    await channel.send(`📢 ${staffMentions} - New ${ticketType} ticket created!`);
                }

                // Update rate limiting
                this.updateRateLimit(user.id);

                return ticket;
            } catch (error) {
                lastError = error;
                // If duplicate key error, try again with a new ticketId
                if (error.code === 11000 && error.keyPattern && error.keyPattern.ticketId) {
                    // Wait a tiny bit to avoid hammering
                    await new Promise(res => setTimeout(res, 50));
                    continue;
                } else if (error.code === 50013 || (error.message && error.message.includes('Missing Permissions'))) {
                    // DiscordAPIError: Missing Permissions
                    await interaction.followUp({
                        embeds: [Utils.createErrorEmbed('Permission Error', 'I do not have permission to create channels or set permissions. Please check my role and permissions.')],
                        flags: 64 // MessageFlags.Ephemeral
                    });
                    break;
                } else {
                    console.error('Error creating ticket:', error);
                    break;
                }
            }
        }

        if (lastError && lastError.code === 11000 && lastError.keyPattern && lastError.keyPattern.ticketId) {
            await interaction.followUp({
                embeds: [Utils.createErrorEmbed('Ticket Creation Failed', 'Failed to create ticket after multiple attempts due to duplicate ticket IDs. This may be a database or configuration issue. Please contact support or try again later.')],
                flags: 64 // MessageFlags.Ephemeral
            });
        } else if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                embeds: [Utils.createErrorEmbed('Ticket Creation Failed', `Failed to create ticket. Reason: ${lastError?.message || 'Unknown error'}`)],
                flags: 64 // MessageFlags.Ephemeral
            });
        }
        if (lastError) {
            console.error('Final error creating ticket:', lastError);
        }
        return null;
    }

    /**
     * Send welcome message to ticket channel
     */
    async sendTicketWelcomeMessage(channel, ticket, config) {
        const assignedText = ticket.assignedTo.userId ? 
            `\n**Assigned to:** <@${ticket.assignedTo.userId}>` : 
            '\n**Status:** Unclaimed - awaiting staff response';

        const embed = Utils.createEmbed({
            title: `🎫 Ticket #${ticket.ticketId}`,
            description: `**Type:** ${ticket.type}\n**User:** <@${ticket.userId}>\n**Created:** <t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>${assignedText}`,
            color: ticket.assignedTo.userId ? 0x57F287 : 0xFEE75C,
            fields: [
                {
                    name: '📝 Request Details',
                    value: ticket.reason,
                    inline: false
                },
                {
                    name: '⏱️ What to Expect',
                    value: '• **Response Time:** Within 24 hours (usually much faster!)\n' +
                           '• **Assignment:** A staff member will claim your ticket shortly\n' +
                           '• **Updates:** You\'ll be notified of any status changes\n' +
                           '• **Transcript:** You\'ll receive a full transcript when closed',
                    inline: false
                },
                {
                    name: '💡 Tips',
                    value: '• Feel free to add more details or screenshots\n' +
                           '• For urgent issues, ping staff members\n' +
                           '• Use `/mytickets` to view all your tickets\n' +
                           '• This channel will remain accessible until closed',
                    inline: false
                }
            ],
            footer: { text: 'Thank you for contacting support! We\'re here to help.' }
        });

        // Create different button sets based on assignment status
        const claimButton = new ButtonBuilder()
            .setCustomId(`ticket_claim_${ticket.ticketId}`)
            .setLabel('Claim Ticket')
            .setEmoji('✋')
            .setStyle(ButtonStyle.Success);

        const assignButton = new ButtonBuilder()
                .setCustomId(`ticket_assign_${ticket.ticketId}`)
                .setLabel('Reassign')
                .setEmoji('👤')
                .setStyle(ButtonStyle.Secondary);
        const actionRow = new ActionRowBuilder()
            .addComponents(
                ticket.assignedTo.userId ? assignButton : claimButton,
                new ButtonBuilder()
                    .setCustomId(`ticket_close_${ticket.ticketId}`)
                    .setLabel('Close Ticket')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`ticket_transcript_${ticket.ticketId}`)
                    .setLabel('Generate Transcript')
                    .setEmoji('📄')
                    .setStyle(ButtonStyle.Secondary)
            );

        const welcomeContent = ticket.assignedTo.userId ? 
            `👋 **Welcome <@${ticket.userId}>!** Your ticket has been claimed by <@${ticket.assignedTo.userId}> and they'll be helping you today.` :
            `👋 **Welcome <@${ticket.userId}>!** Your ticket has been created successfully. A staff member will claim and respond to your ticket shortly.\n\n` +
            `🔔 **You will be notified when:** A staff member claims your ticket, provides updates, or closes your ticket.`;

        await channel.send({
            content: welcomeContent,
            embeds: [embed],
            components: [actionRow]
        });
    }

    /**
     * Handle ticket action buttons
     */
    async handleTicketAction(interaction) {
        const [action, ticketId] = interaction.customId.replace('ticket_', '').split('_');
        const ticket = await Ticket.findOne({ ticketId });

        if (!ticket) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Ticket not found.')],
                ephemeral: true
            });
        }

        const config = await this.getConfig(interaction.guild.id);

        switch (action) {
            case 'close':
                await this.handleCloseTicket(interaction, ticket, config);
                break;
            case 'assign':
                await this.handleAssignTicket(interaction, ticket, config);
                break;
            case 'claim':
                await this.handleClaimTicket(interaction, ticket, config);
                break;
            case 'transcript':
                await this.handleGenerateTranscript(interaction, ticket, config);
                break;
            case 'delete':
                await this.handleDeleteTicket(interaction, ticket, config);
                break;
            case 'reopen':
                await this.handleReopenTicket(interaction, ticket, config);
                break;
            default:
                await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Error', 'Unknown action.')],
                    ephemeral: true
                });
        }
    }

    /**
     * Handle close ticket
     */
    async handleCloseTicket(interaction, ticket, config) {
        if (!this.hasPermission(interaction.member, 'canClose', config) && 
            interaction.user.id !== ticket.userId) {
            
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Permission', 'You cannot close this ticket.')],
                ephemeral: true
            });
        }

        const modal = new ModalBuilder()
            .setCustomId(`ticket_close_reason_${ticket.ticketId}`)
            .setTitle('Close Ticket');

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Reason for closing (optional)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(500)
            .setPlaceholder('Enter the reason for closing this ticket...');

        modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
        await interaction.showModal(modal);
    }

    /**
     * Process close ticket with reason
     */
    async processCloseTicket(interaction, ticket, reason, config) {
        try {
            const channel = interaction.guild.channels.cache.get(ticket.channelId);
            
            if (!channel) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Error', 'Ticket channel not found.')],
                    ephemeral: true
                });
            }

            // Update ticket status
            ticket.status = 'closed';
            ticket.closedBy = {
                userId: interaction.user.id,
                username: interaction.user.displayName || interaction.user.username,
                reason: reason || 'No reason provided',
                closedAt: new Date()
            };
            
            await ticket.save();

            // Move to closed category if configured
            if (config.channels.closedCategory) {
                await channel.setParent(config.channels.closedCategory);
                
                // Remove user permissions
                await channel.permissionOverwrites.edit(ticket.userId, {
                    ViewChannel: false
                });
            }

            // Update channel with close message
            const closerName = interaction.member?.displayName || interaction.user.username || interaction.user.tag || interaction.user.id;
            const embed = Utils.createEmbed({
                title: '🔒 Ticket Closed',
                description: `This ticket has been closed by ${closerName} (${interaction.user.id})`,
                color: 0x57F287,
                fields: [
                    {
                        name: 'Reason',
                        value: reason || 'No reason provided',
                        inline: false
                    }
                ]
            });

            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket_reopen_${ticket.ticketId}`)
                        .setLabel('Reopen Ticket')
                        .setEmoji('🔓')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`ticket_delete_${ticket.ticketId}`)
                        .setLabel('Delete Ticket')
                        .setEmoji('🗑️')
                        .setStyle(ButtonStyle.Danger)
                );

            await channel.send({ embeds: [embed], components: [actionRow] });

            // Clear auto-close timer
            if (this.autoCloseTimers.has(ticket.ticketId)) {
                clearTimeout(this.autoCloseTimers.get(ticket.ticketId));
                this.autoCloseTimers.delete(ticket.ticketId);
            }

            // Log event
            await this.logTicketEvent('close', ticket, interaction.user, config);

            // Generate and send transcript to user via DM
            if (config.dmNotifications.onClose) {
                try {
                    const user = await this.client.users.fetch(ticket.userId);
                    
                    // Generate transcript
                    const transcript = await this.transcriptGenerator.generateTranscript(
                        ticket, 
                        channel, 
                        config.transcripts.format
                    );

                    // Send transcript via DM
                    const transcriptEmbed = Utils.createEmbed({
                        title: `📄 Ticket #${ticket.ticketId} Transcript`,
                        description: `Your ticket has been closed. Here's a complete transcript of the conversation for your records.`,
                        color: 0x5865F2,
                        fields: [
                            { name: 'Ticket ID', value: `#${ticket.ticketId}`, inline: true },
                            { name: 'Type', value: ticket.type, inline: true },
                            { name: 'Closed By', value: `${closerName} (${interaction.user.id})`, inline: true },
                            { name: 'Close Reason', value: reason || 'No reason provided', inline: false }
                        ],
                        footer: { text: 'Keep this transcript for your records' }
                    });

                    await user.send({ 
                        embeds: [transcriptEmbed], 
                        files: [transcript.file] 
                    });
                } catch (dmError) {
                    console.log(`Could not send transcript to user ${ticket.userId}:`, dmError.message);
                    // Still send the regular DM notification without transcript
                    const user = await this.client.users.fetch(ticket.userId);
                    await this.sendDMNotification(user, 'closed', ticket);
                }
            }

            // Also post transcript to log channel if configured
            if (config.channels.modLogChannel) {
                try {
                    const logChannel = interaction.guild.channels.cache.get(config.channels.modLogChannel);
                    if (logChannel) {
                        const transcript = await this.transcriptGenerator.generateTranscript(
                            ticket, 
                            channel, 
                            config.transcripts.format
                        );

                        const logEmbed = Utils.createEmbed({
                            title: `📄 Ticket #${ticket.ticketId} Closed - Transcript Generated`,
                            description: `Ticket closed by ${closerName} (${interaction.user.id}) with reason: ${reason || 'No reason provided'}`,
                            color: 0xFEE75C,
                            footer: { text: 'Automatic transcript generation' }
                        });

                        await logChannel.send({ 
                            embeds: [logEmbed], 
                            files: [transcript.file] 
                        });
                    }
                } catch (logError) {
                    console.error('Error sending transcript to log channel:', logError);
                }
            }

            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Ticket Closed', 'The ticket has been closed successfully.')],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error closing ticket:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to close ticket.')],
                ephemeral: true
            });
        }
    }

    /**
     * Handle assign ticket
     * Now shows a staff selection modal.
     */
    async handleAssignTicket(interaction, ticket, config) {
        if (!this.hasPermission(interaction.member, 'canAssign', config)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Permission', 'You cannot assign tickets.')],
                ephemeral: true
            });
        }

        // Show staff selection modal
        await this.showAssignStaffModal(interaction, ticket, config);
    }

    /**
     * Show a select menu modal to pick a staff member to assign the ticket to.
     */
    async showAssignStaffModal(interaction, ticket, config) {
        // Get all staff members with the support role(s)
        const staffRoleIds = config.staffRoles
            .filter(role => role.permissions.canAssign || role.permissions.canClose || role.permissions.canView)
            .map(role => role.roleId);

        // Fetch all guild members if not cached
        let staffMembers;
        if (interaction.guild.members.cache.size < interaction.guild.memberCount) {
            // Not all members cached, fetch all
            staffMembers = await interaction.guild.members.fetch();
        } else {
            staffMembers = interaction.guild.members.cache;
        }

        // Filter to staff
        staffMembers = staffMembers.filter(member =>
            member.roles.cache.some(role => staffRoleIds.includes(role.id))
        );

        if (!staffMembers.size) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Staff', 'No staff members found with the support role.')],
                ephemeral: true
            });
        }

        // Build select menu options
        const options = staffMembers.map(member => ({
            label: member.displayName || member.user.username,
            value: member.id,
            description: member.user.tag,
            emoji: '👤'
        })).slice(0, 25); // Discord max options

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`assign_staff_select_${ticket.ticketId}`)
            .setPlaceholder('Select a staff member to assign')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: 'Select a staff member to assign this ticket to:',
            components: [row],
            ephemeral: true
        });
    }

    /**
     * Handle claim ticket (enhanced assign system)
     */
    async handleClaimTicket(interaction, ticket, config) {
        if (!this.hasPermission(interaction.member, 'canAssign', config)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Permission', 'You cannot claim tickets.')],
                ephemeral: true
            });
        }

        // Check if ticket is already claimed
        if (ticket.assignedTo.userId) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Already Claimed', 
                    `This ticket is already claimed by <@${ticket.assignedTo.userId}>. Use the "Reassign" button if you need to reassign it.`)],
                ephemeral: true
            });
        }

        try {
            // Update ticket assignment
            ticket.assignedTo = {
                userId: interaction.user.id,
                username: interaction.user.displayName || interaction.user.username,
                assignedAt: new Date(),
                note: null
            };

            await ticket.save();

            // Update channel topic
            const channel = interaction.guild.channels.cache.get(ticket.channelId);
            if (channel) {
                await channel.setTopic(`Ticket #${ticket.ticketId} - Claimed by ${interaction.user.displayName || interaction.user.username}`);
                
                // Update the welcome message with new button layout
                await this.updateWelcomeMessage(channel, ticket, config);
            }

            // Log event
            await this.logTicketEvent('claim', ticket, interaction.user, config);

            // Send notification in the channel
            const claimEmbed = Utils.createEmbed({
                title: '✋ Ticket Claimed',
                description: `${interaction.user} has claimed this ticket and will be handling your request.`,
                color: 0x57F287,
                footer: { text: 'You can expect a response shortly!' }
            });

            await channel.send({ embeds: [claimEmbed] });

            await interaction.reply({ 
                embeds: [Utils.createSuccessEmbed('Ticket Claimed', 
                    `You have successfully claimed ticket #${ticket.ticketId}.`)], 
                ephemeral: true 
            });

        } catch (error) {
            console.error('Error claiming ticket:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to claim ticket.')],
                ephemeral: true
            });
        }
    }

    /**
     * Handle generate transcript
     */
    async handleGenerateTranscript(interaction, ticket, config) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const channel = interaction.guild.channels.cache.get(ticket.channelId);
            if (!channel) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Channel Not Found', 'Ticket channel no longer exists.')]
                });
            }

            const transcript = await this.transcriptGenerator.generateTranscript(
                ticket, 
                channel, 
                config.transcripts.format
            );

            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed(
                    'Transcript Generated',
                    `Transcript for ticket #${ticket.ticketId} has been generated.`
                )],
                files: [transcript.file]
            });

        } catch (error) {
            console.error('Error generating transcript:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to generate transcript.')]
            });
        }
    }

    /**
     * Handle delete ticket
     */
    async handleDeleteTicket(interaction, ticket, config) {
        if (!this.hasPermission(interaction.member, 'canDelete', config)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Permission', 'You cannot delete tickets.')],
                ephemeral: true
            });
        }

        // Create confirmation dialog
        const confirmEmbed = new EmbedBuilder()
            .setTitle('⚠️ Confirm Ticket Deletion')
            .setDescription(`Are you sure you want to delete ticket **#${ticket.ticketId}**?\n\n**This action cannot be undone!**\n\nThe ticket channel will be deleted and a transcript will be saved.`)
            .setColor(0xFF6B6B)
            .addFields(
                { name: 'Ticket ID', value: `#${ticket.ticketId}`, inline: true },
                { name: 'Created By', value: `<@${ticket.userId}>`, inline: true },
                { name: 'Type', value: ticket.type || 'Unknown', inline: true }
            )
            .setFooter({ text: 'This action will permanently delete the ticket channel.' });

        const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm_delete_${ticket.ticketId}`)
            .setLabel('Delete Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🗑️');

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_delete')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌');

        const row = new ActionRowBuilder()
            .addComponents(confirmButton, cancelButton);

        await interaction.reply({
            embeds: [confirmEmbed],
            components: [row],
            ephemeral: true
        });

        // After deletion, DM the user or provide a final confirmation in the channel if possible
        // This should be handled in the actual delete logic (button handler)
    }

    /**
     * Handle reopen ticket
     */
    async handleReopenTicket(interaction, ticket, config) {
        if (!this.hasPermission(interaction.member, 'canReopen', config)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Permission', 'You cannot reopen tickets.')],
                ephemeral: true
            });
        }

        if (ticket.status !== 'closed') {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Ticket Not Closed', 'This ticket is not closed.')],
                ephemeral: true
            });
        }

        try {
            const channel = interaction.guild.channels.cache.get(ticket.channelId);
            
            if (!channel) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Channel Not Found', 'Ticket channel no longer exists.')],
                    ephemeral: true
                });
            }

            // Update ticket status
            ticket.status = 'open';
            ticket.reopenedBy = {
                userId: interaction.user.id,
                username: interaction.user.displayName || interaction.user.username,
                reopenedAt: new Date(),
                reason: 'Reopened via button'
            };
            ticket.lastActivity = new Date();

            await ticket.save();

            // Move back to open category
            if (config.channels.openCategory) {
                await channel.setParent(config.channels.openCategory);
                
                // Re-add user permissions
                await channel.permissionOverwrites.edit(ticket.userId, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    AttachFiles: true,
                    EmbedLinks: true
                });
            }

            // Send reopen message
            const embed = Utils.createEmbed({
                title: '🔓 Ticket Reopened',
                description: `This ticket has been reopened by ${interaction.user}`,
                color: 0x57F287
            });

            await channel.send({ embeds: [embed] });

            // Find and delete the close message with reopen/delete buttons
            try {
                const messages = await channel.messages.fetch({ limit: 50 });
                const closeMessage = messages.find(msg => 
                    msg.author.id === this.client.user.id && 
                    msg.embeds.length > 0 && 
                    msg.embeds[0].title === '🔒 Ticket Closed' &&
                    msg.components.length > 0
                );
                
                if (closeMessage) {
                    await closeMessage.delete();
                }
            } catch (error) {
                console.error('Error deleting close message:', error);
            }

            // Log event
            await this.logTicketEvent('reopen', ticket, interaction.user, config);

            // Send DM notification
            if (config.dmNotifications.onOpen) {
                const user = await this.client.users.fetch(ticket.userId);
                await this.sendDMNotification(user, 'reopened', ticket);
            }

            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Ticket Reopened', `Ticket #${ticket.ticketId} has been reopened.`)],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error reopening ticket:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to reopen ticket.')],
                ephemeral: true
            });
        }
    }

    /**
     * Generate ticket ID
     */
    generateTicketId(config) {
        const counter = config.naming.counter;
        config.naming.counter++;
        config.save(); // Don't await to avoid blocking
        return counter.toString().padStart(4, '0');
    }

    /**
     * Get the next available ticket number (max existing ticketId + 1)
     */
    async getNextAvailableTicketNumber() {
        // Find the highest ticketId in the database (as a number)
        const latest = await Ticket.findOne({}).sort({ ticketId: -1 }).lean();
        if (latest && latest.ticketId && !isNaN(Number(latest.ticketId))) {
            return Number(latest.ticketId) + 1;
        }
        return 1;
    }

    /**
     * Generate channel name based on pattern
     */
    generateChannelName(user, ticketId, config) {
        const username = (user.displayName || user.username).toLowerCase().replace(/[^a-z0-9]/g, '');
        
        switch (config.naming.pattern) {
            case 'ticket-username':
                return `ticket-${username}`;
            case 'ticket-####':
                return `ticket-${ticketId}`;
            case 'username-ticket':
                return `${username}-ticket`;
            case '####-ticket':
                return `${ticketId}-ticket`;
            case 'custom':
                return (config.naming.customPattern || 'ticket-{username}')
                    .replace('{username}', username)
                    .replace('{id}', ticketId);
            default:
                return `ticket-${username}`;
        }
    }

    /**
     * Combine modal responses into a reason string
     */
    combineResponses(responses) {
        return Object.entries(responses)
            .map(([key, value]) => `**${key}:** ${value}`)
            .join('\n\n');
    }

    /**
     * Create button rows (max 5 buttons per row)
     */
    createButtonRows(buttons) {
        const rows = [];
        
        for (let i = 0; i < buttons.length; i += 5) {
            const row = new ActionRowBuilder();
            const rowButtons = buttons.slice(i, i + 5);
            
            rowButtons.forEach(btn => {
                const button = new ButtonBuilder()
                    .setCustomId(btn.customId)
                    .setLabel(btn.label)
                    .setStyle(ButtonStyle[btn.style]);
                
                if (btn.emoji) {
                    button.setEmoji(btn.emoji);
                }
                
                row.addComponents(button);
            });
            
            rows.push(row);
        }
        
        return rows;
    }

    /**
     * Check if user is rate limited
     */
    async isRateLimited(userId, config) {
        if (!config.rateLimiting.enabled) return false;
        
        const lastTicket = this.activeRateLimits.get(userId);
        if (!lastTicket) return false;
        
        const cooldownMs = config.rateLimiting.cooldownMinutes * 60 * 1000;
        return (Date.now() - lastTicket) < cooldownMs;
    }

    /**
     * Update rate limit for user
     */
    updateRateLimit(userId) {
        this.activeRateLimits.set(userId, Date.now());
        
        // Clean up old entries
        setTimeout(() => {
            this.activeRateLimits.delete(userId);
        }, 60 * 60 * 1000); // 1 hour
    }

    /**
     * Check if member has permission
     */
    hasPermission(member, permission, config) {
        // Guild administrators always have permission
        if (member.permissions.has(PermissionFlagsBits.Administrator)) {
            return true;
        }
        
        // Check staff roles
        return config.staffRoles.some(staffRole => 
            member.roles.cache.has(staffRole.roleId) && 
            staffRole.permissions[permission]
        );
    }

    /**
     * Schedule auto-close for a ticket
     */
    scheduleAutoClose(ticket, config) {
        const timeoutMs = config.autoClose.inactivityHours * 60 * 60 * 1000;
        
        const timeoutId = setTimeout(async () => {
            try {
                const currentTicket = await Ticket.findOne({ ticketId: ticket.ticketId });
                if (currentTicket && currentTicket.status === 'open') {
                    const guild = this.client.guilds.cache.get(ticket.guildId);
                    if (guild) {
                        const channel = guild.channels.cache.get(ticket.channelId);
                        if (channel) {
                            // Auto-close the ticket
                            await this.autoCloseTicket(currentTicket, config, guild);
                        }
                    }
                }
            } catch (error) {
                console.error('Error auto-closing ticket:', error);
            }
            
            this.autoCloseTimers.delete(ticket.ticketId);
        }, timeoutMs);
        
        this.autoCloseTimers.set(ticket.ticketId, timeoutId);
    }

    /**
     * Auto-close a ticket due to inactivity
     */
    async autoCloseTicket(ticket, config, guild) {
        try {
            const channel = guild.channels.cache.get(ticket.channelId);
            if (!channel) return;

            // Update ticket
            ticket.status = 'closed';
            ticket.closedBy = {
                userId: this.client.user.id,
                username: 'Auto-Close System',
                reason: `Automatically closed due to ${config.autoClose.inactivityHours} hours of inactivity`,
                closedAt: new Date()
            };
            
            await ticket.save();

            // Move to closed category
            if (config.channels.closedCategory) {
                await channel.setParent(config.channels.closedCategory);
                await channel.permissionOverwrites.edit(ticket.userId, {
                    ViewChannel: false
                });
            }

            // Send close message
            const embed = Utils.createWarningEmbed(
                'Ticket Auto-Closed',
                `This ticket has been automatically closed due to ${config.autoClose.inactivityHours} hours of inactivity.`
            );

            await channel.send({ embeds: [embed] });

            // Log event
            await this.logTicketEvent('autoclose', ticket, this.client.user, config);

        } catch (error) {
            console.error('Error in auto-close:', error);
        }
    }

    /**
     * Start the auto-close scheduler
     */
    startAutoCloseScheduler() {
        setInterval(async () => {
            try {
                const configs = await TicketConfig.find({ 'autoClose.enabled': true });
                
                for (const config of configs) {
                    const cutoffTime = new Date(Date.now() - (config.autoClose.inactivityHours * 60 * 60 * 1000));
                    
                    const inactiveTickets = await Ticket.find({
                        guildId: config.guildId,
                        status: 'open',
                        lastActivity: { $lt: cutoffTime },
                        autoCloseScheduled: { $exists: false }
                    });

                    for (const ticket of inactiveTickets) {
                        if (!this.autoCloseTimers.has(ticket.ticketId)) {
                            this.scheduleAutoClose(ticket, config);
                        }
                    }
                }
            } catch (error) {
                console.error('Error in auto-close scheduler:', error);
            }
        }, 60 * 60 * 1000); // Check every hour
    }

    /**
     * Log ticket events
     */
    async logTicketEvent(eventType, ticket, user, config, additionalInfo = null) {
        if (!config.logging.enabled || !config.logging.events[`ticket${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`]) {
            return;
        }

        const logChannel = config.channels.modLogChannel;
        if (!logChannel) return;

        try {
            const guild = this.client.guilds.cache.get(ticket.guildId);
            const channel = guild?.channels.cache.get(logChannel);
            if (!channel) return;

            const colors = {
                create: 0x57F287,
                close: 0xFEE75C,
                delete: 0xED4245,
                assign: 0x5865F2,
                claim: 0x57F287,
                reopen: 0x57F287,
                autoclose: 0xFEE75C,
                priority: 0xFF9500,
                tag: 0x9B59B6
            };

            const eventEmojis = {
                create: '🆕',
                close: '🔒',
                delete: '🗑️',
                assign: '👤',
                claim: '✋',
                reopen: '🔓',
                autoclose: '⏰',
                priority: '⚡',
                tag: '�️'
            };

            // Try to resolve user display name and tag for logs
            let userDisplay = typeof user === 'string'
                ? user
                : (user.displayName || user.username || user.tag || user.id);
            if (typeof user !== 'string' && user.id) {
                userDisplay = `${userDisplay} (${user.id})`;
            }

            let description = `**Ticket ID:** #${ticket.ticketId}\n**User:** ${ticket.username ? `${ticket.username} (${ticket.userId})` : `<@${ticket.userId}>`}\n**Action by:** ${userDisplay}\n**Type:** ${ticket.type}`;
            
            // Add event-specific information
            switch (eventType) {
                case 'claim':
                    description += `\n**Claimed by:** ${userDisplay}`;
                    if (ticket.assignedTo.assignedAt) {
                        description += `\n**Claimed at:** <t:${Math.floor(ticket.assignedTo.assignedAt.getTime() / 1000)}:F>`;
                    }
                    break;
                case 'assign':
                    if (ticket.assignedTo.userId) {
                        description += `\n**Assigned to:** ${ticket.assignedTo.username ? `${ticket.assignedTo.username} (${ticket.assignedTo.userId})` : `<@${ticket.assignedTo.userId}>`}`;
                    }
                    break;
                case 'close':
                case 'delete':
                    if (additionalInfo) {
                        description += `\n**Reason:** ${additionalInfo}`;
                    }
                    break;
                case 'priority':
                    if (additionalInfo) {
                        description += `\n**Priority changed to:** ${additionalInfo}`;
                    }
                    break;
                case 'tag':
                    if (additionalInfo) {
                        description += `\n**Tags updated:** ${additionalInfo}`;
                    }
                    break;
            }

            description += `\n**Channel:** <#${ticket.channelId}>`;

            const embed = Utils.createEmbed({
                title: `${eventEmojis[eventType] || '🎫'} Ticket ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`,
                description,
                color: colors[eventType] || 0x99AAB5,
                timestamp: true,
                footer: { text: `Ticket System Log • Event: ${eventType}` }
            });

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging ticket event:', error);
        }
    }

    /**
     * Send DM notification to user
     */
    async sendDMNotification(user, action, ticket) {
        try {
            const embed = Utils.createEmbed({
                title: `🎫 Ticket ${action.charAt(0).toUpperCase() + action.slice(1)}`,
                description: `Your ticket #${ticket.ticketId} has been ${action}.`,
                color: action === 'opened' ? 0x57F287 : 0xFEE75C
            });

            await user.send({ embeds: [embed] });
        } catch (error) {
            // User might have DMs disabled, ignore error
            console.log(`Could not send DM to user ${user.id}:`, error.message);
        }
    }

    /**
     * Update the welcome message when ticket status changes
     */
    async updateWelcomeMessage(channel, ticket, config) {
        try {
            // Find the welcome message (usually the first bot message in the channel)
            const messages = await channel.messages.fetch({ limit: 10 });
            const welcomeMessage = messages.find(msg => 
                msg.author.id === this.client.user.id && 
                msg.embeds.length > 0 && 
                msg.embeds[0].title?.includes(`Ticket #${ticket.ticketId}`)
            );

            if (!welcomeMessage) return;

            const assignedText = ticket.assignedTo.userId ? 
                `\n**Assigned to:** <@${ticket.assignedTo.userId}>` : 
                '\n**Status:** Unclaimed - awaiting staff response';

            const embed = Utils.createEmbed({
                title: `🎫 Ticket #${ticket.ticketId}`,
                description: `**Type:** ${ticket.type}\n**User:** <@${ticket.userId}>\n**Created:** <t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>${assignedText}`,
                color: ticket.assignedTo.userId ? 0x57F287 : 0xFEE75C,
                fields: [
                    {
                        name: '📝 Request Details',
                        value: ticket.reason,
                        inline: false
                    },
                    {
                        name: '⏱️ What to Expect',
                        value: '• **Response Time:** Within 24 hours (usually much faster!)\n' +
                               '• **Assignment:** A staff member will claim your ticket shortly\n' +
                               '• **Updates:** You\'ll be notified of any status changes\n' +
                               '• **Transcript:** You\'ll receive a full transcript when closed',
                        inline: false
                    },
                    {
                        name: '💡 Tips',
                        value: '• Feel free to add more details or screenshots\n' +
                               '• For urgent issues, ping staff members\n' +
                               '• Use `/mytickets` to view all your tickets\n' +
                               '• This channel will remain accessible until closed',
                        inline: false
                    }
                ],
                footer: { text: 'Thank you for contacting support! We\'re here to help.' }
            });

            // Create different button sets based on assignment status
            const claimButton = new ButtonBuilder()
                .setCustomId(`ticket_claim_${ticket.ticketId}`)
                .setLabel('Claim Ticket')
                .setEmoji('✋')
                .setStyle(ButtonStyle.Success);

            const assignButton = new ButtonBuilder()
                .setCustomId(`ticket_assign_${ticket.ticketId}`)
                .setLabel('Reassign')
                .setEmoji('👤')
                .setStyle(ButtonStyle.Secondary);

            const actionRow = new ActionRowBuilder()
                .addComponents(
                    ticket.assignedTo.userId ? assignButton : claimButton,
                    new ButtonBuilder()
                        .setCustomId(`ticket_close_${ticket.ticketId}`)
                        .setLabel('Close Ticket')
                        .setEmoji('🔒')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`ticket_transcript_${ticket.ticketId}`)
                        .setLabel('Generate Transcript')
                        .setEmoji('📄')
                        .setStyle(ButtonStyle.Secondary)
                );

            const welcomeContent = ticket.assignedTo.userId ? 
                `👋 **Welcome <@${ticket.userId}>!** Your ticket has been claimed by <@${ticket.assignedTo.userId}> and they'll be helping you today.` :
                `👋 **Welcome <@${ticket.userId}>!** Your ticket has been created successfully. A staff member will claim and respond to your ticket shortly.\n\n` +
                `🔔 **You will be notified when:** A staff member claims your ticket, provides updates, or closes your ticket.`;

            await welcomeMessage.edit({
                content: welcomeContent,
                embeds: [embed],
                components: [actionRow]
            });

        } catch (error) {
            console.error('Error updating welcome message:', error);
        }
    }
}

module.exports = TicketManager;
