const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const Ticket = require('../../schemas/Ticket');
const TicketConfig = require('../../schemas/TicketConfig');
const Utils = require('../../utils/utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Manage tickets')
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close a ticket')
                .addStringOption(option =>
                    option
                        .setName('ticket_id')
                        .setDescription('Ticket ID to close (leave empty for current channel)')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for closing')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('assign')
                .setDescription('Assign a ticket to yourself or another staff member')
                .addStringOption(option =>
                    option
                        .setName('ticket_id')
                        .setDescription('Ticket ID to assign (leave empty for current channel)')
                        .setRequired(false))
                .addUserOption(option =>
                    option
                        .setName('staff_member')
                        .setDescription('Staff member to assign to (leave empty to assign to yourself)')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('note')
                        .setDescription('Assignment note')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reopen')
                .setDescription('Reopen a closed ticket')
                .addStringOption(option =>
                    option
                        .setName('ticket_id')
                        .setDescription('Ticket ID to reopen (leave empty for current channel)')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for reopening')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a ticket permanently')
                .addStringOption(option =>
                    option
                        .setName('ticket_id')
                        .setDescription('Ticket ID to delete (leave empty for current channel)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('transcript')
                .setDescription('Generate a transcript for a ticket')
                .addStringOption(option =>
                    option
                        .setName('ticket_id')
                        .setDescription('Ticket ID (leave empty for current channel)')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('format')
                        .setDescription('Transcript format')
                        .setRequired(false)
                        .addChoices(
                            { name: 'HTML', value: 'html' },
                            { name: 'Text', value: 'txt' },
                            { name: 'JSON', value: 'json' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('tag')
                .setDescription('Add or remove tags from a ticket')
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
                        .setName('tag')
                        .setDescription('Tag name')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('ticket_id')
                        .setDescription('Ticket ID (leave empty for current channel)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('priority')
                .setDescription('Set ticket priority')
                .addStringOption(option =>
                    option
                        .setName('level')
                        .setDescription('Priority level')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Low', value: 'low' },
                            { name: 'Normal', value: 'normal' },
                            { name: 'High', value: 'high' },
                            { name: 'Urgent', value: 'urgent' }
                        ))
                .addStringOption(option =>
                    option
                        .setName('ticket_id')
                        .setDescription('Ticket ID (leave empty for current channel)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List tickets')
                .addStringOption(option =>
                    option
                        .setName('status')
                        .setDescription('Filter by status')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Open', value: 'open' },
                            { name: 'Closed', value: 'closed' },
                            { name: 'All', value: 'all' }
                        ))
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Filter by user')
                        .setRequired(false))
                .addUserOption(option =>
                    option
                        .setName('assigned_to')
                        .setDescription('Filter by assigned staff member')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('priority')
                        .setDescription('Filter by priority')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Low', value: 'low' },
                            { name: 'Normal', value: 'normal' },
                            { name: 'High', value: 'high' },
                            { name: 'Urgent', value: 'urgent' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Get detailed information about a ticket')
                .addStringOption(option =>
                    option
                        .setName('ticket_id')
                        .setDescription('Ticket ID (leave empty for current channel)')
                        .setRequired(false))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Check if user has permission for ticket actions
        const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
        if (!config && !['list', 'info'].includes(subcommand)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Configuration', 'Ticket system is not configured for this server. Please contact an administrator.')],
                flags: MessageFlags.Ephemeral
            });
        }

        const ticketManager = interaction.client.ticketManager;

        switch (subcommand) {
            case 'close':
                await this.closeTicket(interaction, ticketManager, config);
                break;
            case 'assign':
                await this.assignTicket(interaction, ticketManager, config);
                break;
            case 'reopen':
                await this.reopenTicket(interaction, ticketManager, config);
                break;
            case 'delete':
                await this.deleteTicket(interaction, ticketManager, config);
                break;
            case 'transcript':
                await this.generateTranscript(interaction, ticketManager, config);
                break;
            case 'tag':
                await this.manageTag(interaction, ticketManager, config);
                break;
            case 'priority':
                await this.setPriority(interaction, ticketManager, config);
                break;
            case 'list':
                await this.listTickets(interaction, ticketManager, config);
                break;
            case 'info':
                await this.showTicketInfo(interaction, ticketManager, config);
                break;
        }
    },

    async closeTicket(interaction, ticketManager, config) {
        const ticketId = interaction.options.getString('ticket_id');
        const reason = interaction.options.getString('reason');

        let ticket;
        
        if (ticketId) {
            ticket = await Ticket.findOne({ ticketId, guildId: interaction.guild.id });
        } else {
            // Try to find ticket by current channel
            ticket = await Ticket.findOne({ channelId: interaction.channel.id, guildId: interaction.guild.id });
        }

        if (!ticket) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Ticket Not Found', 'No ticket found with that ID or in this channel. It may have been deleted or you lack permission to view it.')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (ticket.status !== 'open') {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Ticket Already Closed', 'This ticket is already closed.')],
                flags: MessageFlags.Ephemeral
            });
        }

        // Check permissions
        if (!ticketManager.hasPermission(interaction.member, 'canClose', config) && 
            interaction.user.id !== ticket.userId) {
            
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Permission', 'You cannot close this ticket.')],
                flags: MessageFlags.Ephemeral
            });
        }

        await ticketManager.processCloseTicket(interaction, ticket, reason, config);
    },

    async assignTicket(interaction, ticketManager, config) {
        const ticketId = interaction.options.getString('ticket_id');

        let ticket;
        if (ticketId) {
            ticket = await Ticket.findOne({ ticketId, guildId: interaction.guild.id });
        } else {
            ticket = await Ticket.findOne({ channelId: interaction.channel.id, guildId: interaction.guild.id });
        }

        if (!ticket) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Ticket Not Found', 'No ticket found with that ID or in this channel. It may have been deleted or you lack permission to view it.')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (!ticketManager.hasPermission(interaction.member, 'canAssign', config)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Permission', 'You cannot assign tickets. If you believe this is an error, please contact an administrator.')],
                flags: MessageFlags.Ephemeral
            });
        }

        // Show staff selection modal
        await ticketManager.showAssignStaffModal(interaction, ticket, config);
    },

    async reopenTicket(interaction, ticketManager, config) {
        const ticketId = interaction.options.getString('ticket_id');
        const reason = interaction.options.getString('reason');

        let ticket;
        
        if (ticketId) {
            ticket = await Ticket.findOne({ ticketId, guildId: interaction.guild.id });
        } else {
            ticket = await Ticket.findOne({ channelId: interaction.channel.id, guildId: interaction.guild.id });
        }

        if (!ticket) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Ticket Not Found', 'No ticket found with that ID or in this channel. It may have been deleted or you lack permission to view it.')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (ticket.status !== 'closed') {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Ticket Not Closed', 'This ticket is not closed.')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (!ticketManager.hasPermission(interaction.member, 'canReopen', config)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Permission', 'You cannot reopen tickets.')],
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            const channel = interaction.guild.channels.cache.get(ticket.channelId);
            
            if (!channel) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Channel Not Found', 'Ticket channel no longer exists.')],
                    flags: MessageFlags.Ephemeral
                });
            }

            // Update ticket status
            ticket.status = 'open';
            ticket.reopenedBy = {
                userId: interaction.user.id,
                username: interaction.user.displayName || interaction.user.username,
                reopenedAt: new Date(),
                reason: reason || 'No reason provided'
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
                color: 0x57F287,
                fields: [
                    {
                        name: 'Reason',
                        value: reason || 'No reason provided',
                        inline: false
                    }
                ]
            });

            await channel.send({ embeds: [embed] });

            // Log event
            await ticketManager.logTicketEvent('reopen', ticket, interaction.user, config);

            // Send DM notification
            if (config.dmNotifications.onOpen) {
                const user = await interaction.client.users.fetch(ticket.userId);
                await ticketManager.sendDMNotification(user, 'reopened', ticket);
            }

            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Ticket Reopened', `Ticket #${ticket.ticketId} has been reopened.`)],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error reopening ticket:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to reopen ticket.')],
                flags: MessageFlags.Ephemeral
            });
        }
    },

    async deleteTicket(interaction, ticketManager, config) {
        const ticketId = interaction.options.getString('ticket_id');

        let ticket;
        
        if (ticketId) {
            ticket = await Ticket.findOne({ ticketId, guildId: interaction.guild.id });
        } else {
            ticket = await Ticket.findOne({ channelId: interaction.channel.id, guildId: interaction.guild.id });
        }

        if (!ticket) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Ticket Not Found', 'No ticket found with that ID or in this channel.')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (!ticketManager.hasPermission(interaction.member, 'canDelete', config)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Permission', 'You cannot delete tickets. If you believe this is an error, please contact an administrator.')],
                flags: MessageFlags.Ephemeral
            });
        }

        // Confirmation
        const confirmEmbed = Utils.createWarningEmbed(
            'Confirm Deletion',
            `Are you sure you want to permanently delete ticket #${ticket.ticketId}?\nThis action cannot be undone.`
        );

        const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_delete_${ticket.ticketId}`)
                    .setLabel('Delete Ticket')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_delete')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ 
            embeds: [confirmEmbed], 
            components: [confirmRow], 
            flags: MessageFlags.Ephemeral
        });

        // After deletion, DM the user or provide a final confirmation in the channel if possible (handled in the actual delete logic)
    },

    async generateTranscript(interaction, ticketManager, config) {
        const ticketId = interaction.options.getString('ticket_id');
        const format = interaction.options.getString('format') || 'html';

        let ticket;
        
        if (ticketId) {
            ticket = await Ticket.findOne({ ticketId, guildId: interaction.guild.id });
        } else {
            ticket = await Ticket.findOne({ channelId: interaction.channel.id, guildId: interaction.guild.id });
        }

        if (!ticket) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Ticket Not Found', 'No ticket found with that ID or in this channel.')],
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const channel = interaction.guild.channels.cache.get(ticket.channelId);
            if (!channel) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Channel Not Found', 'Ticket channel no longer exists.')]
                });
            }

            const transcript = await ticketManager.transcriptGenerator.generateTranscript(
                ticket, 
                channel, 
                format
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
    },

    async manageTag(interaction, ticketManager, config) {
        const action = interaction.options.getString('action');
        const tag = interaction.options.getString('tag');
        const ticketId = interaction.options.getString('ticket_id');

        let ticket;
        
        if (ticketId) {
            ticket = await Ticket.findOne({ ticketId, guildId: interaction.guild.id });
        } else {
            ticket = await Ticket.findOne({ channelId: interaction.channel.id, guildId: interaction.guild.id });
        }

        if (!ticket && action !== 'list') {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Ticket Not Found', 'No ticket found with that ID or in this channel.')],
                flags: MessageFlags.Ephemeral
            });
        }

        switch (action) {
            case 'add':
                if (!tag) {
                    return interaction.reply({
                        embeds: [Utils.createErrorEmbed('Missing Tag', 'Please specify a tag to add.')],
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (ticket.tags.includes(tag)) {
                    return interaction.reply({
                        embeds: [Utils.createErrorEmbed('Tag Exists', 'This tag is already on the ticket.')],
                        flags: MessageFlags.Ephemeral
                    });
                }

                ticket.tags.push(tag);
                await ticket.save();

                await interaction.reply({
                    embeds: [Utils.createSuccessEmbed('Tag Added', `Added tag "${tag}" to ticket #${ticket.ticketId}.`)],
                    ephemeral: true
                });
                break;

            case 'remove':
                if (!tag) {
                    return interaction.reply({
                        embeds: [Utils.createErrorEmbed('Missing Tag', 'Please specify a tag to remove.')],
                        flags: MessageFlags.Ephemeral
                    });
                }

                const tagIndex = ticket.tags.indexOf(tag);
                if (tagIndex === -1) {
                    return interaction.reply({
                        embeds: [Utils.createErrorEmbed('Tag Not Found', 'This tag is not on the ticket.')],
                        flags: MessageFlags.Ephemeral
                    });
                }

                ticket.tags.splice(tagIndex, 1);
                await ticket.save();

                await interaction.reply({
                    embeds: [Utils.createSuccessEmbed('Tag Removed', `Removed tag "${tag}" from ticket #${ticket.ticketId}.`)],
                    ephemeral: true
                });
                break;

            case 'list':
                if (ticket) {
                    const tags = ticket.tags.length > 0 ? ticket.tags.join(', ') : 'No tags';
                    await interaction.reply({
                        embeds: [Utils.createEmbed({
                            title: `🏷️ Tags for Ticket #${ticket.ticketId}`,
                            description: tags,
                            color: 0x5865F2
                        })],
                        ephemeral: true
                    });
                } else {
                    // List all available tags from config
                    const availableTags = config.tags.map(t => `• ${t.name}${t.description ? ` - ${t.description}` : ''}`).join('\n');
                    
                    await interaction.reply({
                        embeds: [Utils.createEmbed({
                            title: '🏷️ Available Tags',
                            description: availableTags || 'No tags configured',
                            color: 0x5865F2
                        })],
                        ephemeral: true
                    });
                }
                break;
        }
    },

    async setPriority(interaction, ticketManager, config) {
        const level = interaction.options.getString('level');
        const ticketId = interaction.options.getString('ticket_id');

        let ticket;
        
        if (ticketId) {
            ticket = await Ticket.findOne({ ticketId, guildId: interaction.guild.id });
        } else {
            ticket = await Ticket.findOne({ channelId: interaction.channel.id, guildId: interaction.guild.id });
        }

        if (!ticket) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Ticket Not Found', 'No ticket found with that ID or in this channel.')],
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            if (ticket.priority === level) {
                return interaction.reply({
                    embeds: [Utils.createWarningEmbed(
                        'No Change',
                        `Ticket #${ticket.ticketId} is already set to ${level.toUpperCase()}.`
                    )],
                    ephemeral: true
                });
            }

            ticket.priority = level;
            await ticket.save();

            const priorityEmojis = {
                low: '🟢',
                normal: '🟡',
                high: '🟠',
                urgent: '🔴'
            };

            await interaction.reply({
                embeds: [Utils.createSuccessEmbed(
                    'Priority Updated',
                    `Ticket #${ticket.ticketId} priority set to ${priorityEmojis[level]} ${level.toUpperCase()}`
                )],
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error('Error setting priority:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', `Failed to set ticket priority: ${error.message}`)],
                ephemeral: true
            });
        }
    },

    async listTickets(interaction, ticketManager, config) {
        const status = interaction.options.getString('status') || 'open';
        const user = interaction.options.getUser('user');
        const assignedTo = interaction.options.getUser('assigned_to');
        const priority = interaction.options.getString('priority');

        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Build query
            const query = { guildId: interaction.guild.id };
            
            if (status !== 'all') {
                query.status = status;
            }
            
            if (user) {
                query.userId = user.id;
            }
            
            if (assignedTo) {
                query['assignedTo.userId'] = assignedTo.id;
            }
            
            if (priority) {
                query.priority = priority;
            }

            const tickets = await Ticket.find(query)
                .sort({ createdAt: -1 })
                .limit(25); // Limit to prevent spam

            if (tickets.length === 0) {
                return interaction.editReply({
                    embeds: [Utils.createEmbed({
                        title: '🎫 No Tickets Found',
                        description: 'No tickets match your criteria.',
                        color: 0x99AAB5
                    })]
                });
            }

            const priorityEmojis = {
                low: '🟢',
                normal: '🟡',
                high: '🟠',
                urgent: '🔴'
            };

            const statusEmojis = {
                open: '🟢',
                closed: '🔴',
                deleted: '⚫'
            };

            const ticketList = tickets.map(ticket => {
                const assignedText = ticket.assignedTo.userId ? 
                    ` • Assigned to <@${ticket.assignedTo.userId}>` : '';
                const tagsText = ticket.tags.length > 0 ? 
                    ` • Tags: ${ticket.tags.join(', ')}` : '';
                
                return `${statusEmojis[ticket.status]} **#${ticket.ticketId}** ${priorityEmojis[ticket.priority]} - <@${ticket.userId}>\n` +
                       `\`${ticket.type}\` • <t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>${assignedText}${tagsText}`;
            }).join('\n\n');

            const embed = Utils.createEmbed({
                title: `🎫 Tickets (${tickets.length}${tickets.length === 25 ? '+' : ''})`,
                description: ticketList,
                color: 0x5865F2,
                footer: { text: `Status: ${status} • Showing latest 25 tickets` }
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error listing tickets:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to list tickets.')]
            });
        }
    },

    async showTicketInfo(interaction, ticketManager, config) {
        const ticketId = interaction.options.getString('ticket_id');

        let ticket;
        
        if (ticketId) {
            ticket = await Ticket.findOne({ ticketId, guildId: interaction.guild.id });
        } else {
            ticket = await Ticket.findOne({ channelId: interaction.channel.id, guildId: interaction.guild.id });
        }

        if (!ticket) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Ticket Not Found', 'No ticket found with that ID or in this channel.')],
                flags: MessageFlags.Ephemeral
            });
        }

        const priorityEmojis = {
            low: '🟢',
            normal: '🟡',
            high: '🟠',
            urgent: '🔴'
        };

        const statusEmojis = {
            open: '🟢',
            closed: '🔴',
            deleted: '⚫'
        };

        const fields = [
            {
                name: '👤 User',
                value: ticket.username ? `${ticket.username} (${ticket.userId})` : `<@${ticket.userId}>`,
                inline: true
            },
            {
                name: '📝 Type',
                value: ticket.type,
                inline: true
            },
            {
                name: '📊 Status',
                value: `${statusEmojis[ticket.status]} ${ticket.status.toUpperCase()}`,
                inline: true
            },
            {
                name: '🎯 Priority',
                value: `${priorityEmojis[ticket.priority]} ${ticket.priority.toUpperCase()}`,
                inline: true
            },
            {
                name: '📅 Created',
                value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:F>`,
                inline: true
            },
            {
                name: '⏰ Last Activity',
                value: `<t:${Math.floor(ticket.lastActivity.getTime() / 1000)}:R>`,
                inline: true
            }
        ];

        if (ticket.assignedTo.userId) {
            fields.push({
                name: '👨‍💼 Assigned To',
                value: ticket.assignedTo.username
                    ? `${ticket.assignedTo.username} (${ticket.assignedTo.userId})\n<t:${Math.floor(ticket.assignedTo.assignedAt.getTime() / 1000)}:R>`
                    : `<@${ticket.assignedTo.userId}>\n<t:${Math.floor(ticket.assignedTo.assignedAt.getTime() / 1000)}:R>`,
                inline: true
            });
        }

        if (ticket.tags.length > 0) {
            fields.push({
                name: '🏷️ Tags',
                value: ticket.tags.join(', '),
                inline: true
            });
        }

        if (ticket.status === 'closed' && ticket.closedBy.userId) {
            fields.push({
                name: '🔒 Closed By',
                value: (ticket.closedBy.username
                    ? `${ticket.closedBy.username} (${ticket.closedBy.userId})`
                    : `<@${ticket.closedBy.userId}>`)
                    + `\n<t:${Math.floor(ticket.closedBy.closedAt.getTime() / 1000)}:R>\n**Reason:** ${ticket.closedBy.reason}`,
                inline: false
            });
        }

        const embed = Utils.createEmbed({
            title: `🎫 Ticket #${ticket.ticketId} Information`,
            description: `**Reason:**\n${ticket.reason}`,
            color: 0x5865F2,
            fields: fields
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
