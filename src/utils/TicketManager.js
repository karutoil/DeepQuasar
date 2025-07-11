const { 
    ChannelType, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder
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
            return interaction.reply({
                embeds: [Utils.createErrorEmbed(
                    'Rate Limited',
                    `You can only create ${config.rateLimiting.maxTicketsPerUser} tickets every ${config.rateLimiting.cooldownMinutes} minutes.`
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
            await interaction.reply({
                embeds: [Utils.createSuccessEmbed(
                    'Ticket Created',
                    `Your ticket has been created! Check <#${ticket.channelId}>`
                )],
                ephemeral: true
            });
        }
    }

    /**
     * Create a new ticket
     */
    async createTicket(interaction, ticketType, responses, config) {
        try {
            const guild = interaction.guild;
            const user = interaction.user;

            // Generate ticket ID
            const ticketId = this.generateTicketId(config);
            
            // Generate channel name
            const channelName = this.generateChannelName(user, ticketId, config);

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
            console.error('Error creating ticket:', error);
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    embeds: [Utils.createErrorEmbed('Error', 'Failed to create ticket. Please try again.')],
                    ephemeral: true
                });
            }
            
            return null;
        }
    }

    /**
     * Send welcome message to ticket channel
     */
    async sendTicketWelcomeMessage(channel, ticket, config) {
        const embed = Utils.createEmbed({
            title: `🎫 Ticket #${ticket.ticketId}`,
            description: `**Type:** ${ticket.type}\n**User:** <@${ticket.userId}>\n**Created:** <t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>`,
            color: 0x5865F2,
            fields: [
                {
                    name: '📝 Reason',
                    value: ticket.reason,
                    inline: false
                }
            ]
        });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket_close_${ticket.ticketId}`)
                    .setLabel('Close Ticket')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`ticket_assign_${ticket.ticketId}`)
                    .setLabel('Assign to Me')
                    .setEmoji('👤')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`ticket_transcript_${ticket.ticketId}`)
                    .setLabel('Generate Transcript')
                    .setEmoji('📄')
                    .setStyle(ButtonStyle.Secondary)
            );

        await channel.send({
            content: `👋 Welcome <@${ticket.userId}>! A staff member will be with you shortly.`,
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
            const embed = Utils.createEmbed({
                title: '🔒 Ticket Closed',
                description: `This ticket has been closed by ${interaction.user}`,
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

            // Send DM notification
            if (config.dmNotifications.onClose) {
                const user = await this.client.users.fetch(ticket.userId);
                await this.sendDMNotification(user, 'closed', ticket);
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
     */
    async handleAssignTicket(interaction, ticket, config) {
        if (!this.hasPermission(interaction.member, 'canAssign', config)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Permission', 'You cannot assign tickets.')],
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
                await channel.setTopic(`Ticket #${ticket.ticketId} - Assigned to ${interaction.user.displayName || interaction.user.username}`);
            }

            // Log event
            await this.logTicketEvent('assign', ticket, interaction.user, config);

            const embed = Utils.createSuccessEmbed(
                'Ticket Assigned',
                `Ticket #${ticket.ticketId} has been assigned to you.`
            );

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error assigning ticket:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to assign ticket.')],
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
    async logTicketEvent(eventType, ticket, user, config) {
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
                reopen: 0x57F287,
                autoclose: 0xFEE75C
            };

            const embed = Utils.createEmbed({
                title: `🎫 Ticket ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`,
                description: `**Ticket ID:** #${ticket.ticketId}\n**User:** <@${ticket.userId}>\n**Action by:** ${user}\n**Type:** ${ticket.type}`,
                color: colors[eventType] || 0x99AAB5,
                timestamp: true
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
     * Handle assign ticket
     */
    async handleAssignTicket(interaction, ticket, config) {
        if (!this.hasPermission(interaction.member, 'canAssign', config)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Permission', 'You cannot assign tickets.')],
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
                await channel.setTopic(`Ticket #${ticket.ticketId} - Assigned to ${interaction.user.displayName || interaction.user.username}`);
            }

            // Log event
            await this.logTicketEvent('assign', ticket, interaction.user, config);

            const embed = Utils.createSuccessEmbed(
                'Ticket Assigned',
                `Ticket #${ticket.ticketId} has been assigned to you.`
            );

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error assigning ticket:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to assign ticket.')],
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
}

module.exports = TicketManager;
