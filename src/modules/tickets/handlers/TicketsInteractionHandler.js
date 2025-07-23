const Utils = require('../../../utils/utils');

async function handleTicketDeleteConfirmation(interaction, client) {
    try {
        const ticketId = interaction.customId.replace('confirm_delete_', '');
        const Ticket = require('../../../schemas/Ticket');
        const TicketConfig = require('../../../schemas/TicketConfig');
        
        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) {
            return interaction.update({
                embeds: [Utils.createErrorEmbed('Error', 'Ticket not found.')],
                components: []
            });
        }

        const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
        const ticketManager = client.ticketManager;

        // Generate transcript before deletion if enabled
        if (config.transcripts.enabled) {
            const channel = interaction.guild.channels.cache.get(ticket.channelId);
            if (channel) {
                try {
                    const transcript = await ticketManager.transcriptGenerator.generateTranscript(
                        ticket, 
                        channel, 
                        config.transcripts.format
                    );
                    
                    // Send to mod log or archive channel
                    const logChannel = config.channels.modLogChannel || config.channels.archiveChannel;
                    if (logChannel) {
                        const logChannelObj = interaction.guild.channels.cache.get(logChannel);
                        if (logChannelObj) {
                            await logChannelObj.send({
                                embeds: [Utils.createEmbed({
                                    title: `🗑️ Ticket #${ticket.ticketId} Deleted`,
                                    description: `Ticket deleted by ${interaction.user}\nTranscript attached below.`,
                                    color: 0xED4245
                                })],
                                files: [transcript.file]
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error generating transcript before deletion:', error);
                }
            }
        }

        // Delete the channel
        const channel = interaction.guild.channels.cache.get(ticket.channelId);
        if (channel) {
            await channel.delete('Ticket deleted by ' + interaction.user.tag);
        }

        // Update ticket status in database
        ticket.status = 'deleted';
        await ticket.save();

        // Log event
        await ticketManager.logTicketEvent('delete', ticket, interaction.user, config);

        // If the interaction is in the same channel being deleted, we can't reply
        // The channel deletion will handle the interaction
        
    } catch (error) {
        console.error('Error deleting ticket:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.update({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to delete ticket.')],
                components: []
            });
        }
    }
}

async function handlePanelCustomizerButton(interaction, client) {
    const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
    const TicketConfig = require('../../../schemas/TicketConfig');
    
    try {
        const config = await TicketConfig.findOne({ guildId: interaction.guildId });
        if (!config) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Configuration Error', 'Ticket system is not configured for this server.')],
                ephemeral: true
            });
        }

        const customId = interaction.customId;
        
        // Extract panel ID if present (format: panel_edit_action_panelId)
        let panelId = null;
        let action = '';
        let buttonIndex = null;
        
        if (customId.includes('_') && customId !== 'panel_customizer_back' && customId !== 'panel_button_edit_back') {
            const parts = customId.split('_');
            
            if (parts.length >= 3) {
                // Handle different formats
                if (parts[1] === 'manage' && parts[2] === 'buttons' && parts.length >= 4) {
                    action = 'manage_buttons';
                    panelId = parts[3];
                } else if (parts[1] === 'preview' && parts.length >= 3) {
                    action = 'preview';
                    panelId = parts[2];
                } else if (parts[1] === 'save' && parts[2] === 'changes' && parts.length >= 4) {
                    action = 'save_changes';
                    panelId = parts[3];
                } else if (parts[1] === 'edit' && parts[2] === 'button' && parts.length >= 6) {
                    action = `edit_button_${parts[3]}`;
                    panelId = parts[4];
                    buttonIndex = parseInt(parts[5]);
                } else if (parts[1] === 'remove' && parts[2] === 'button' && parts.length >= 5) {
                    action = 'remove_button';
                    panelId = parts[3];
                    buttonIndex = parseInt(parts[4]);
                } else if (parts[0] === 'confirm' && parts[1] === 'remove' && parts[2] === 'button' && parts.length >= 5) {
                    action = 'confirm_remove_button';
                    panelId = parts[3];
                    buttonIndex = parseInt(parts[4]);
                } else if (parts[1] === 'edit' && parts.length >= 4) {
                    action = parts[2];
                    panelId = parts[3];
                } else if ((parts[1] === 'add' || parts[1] === 'edit' || parts[1] === 'remove') && parts.length >= 4) {
                    action = `${parts[1]}_${parts[2]}`;
                    panelId = parts[3];
                } else if (parts.length === 3 && parts[1] === 'edit') {
                    action = parts[2];
                }
            }
        }
        
        // Handle panel delete confirmation
        if (customId.startsWith('panel_delete_confirm_')) {
            const panelId = customId.replace('panel_delete_confirm_', '');
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
            const panel = config.panels.find(p => p.panelId === panelId);
            if (!panel) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Panel Not Found', 'The panel could not be found.')],
                    ephemeral: true
                });
            }
            const embed = new EmbedBuilder()
                .setTitle('🗑️ Confirm Panel Deletion')
                .setDescription(`Are you sure you want to delete this panel?

**Panel:** ${panel.title}
**ID:** \`${panel.panelId}\`

⚠️ **This action cannot be undone!**`)
                .setColor(0xED4245);
            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`panel_delete_execute_${panelId}`)
                        .setLabel('Yes, Delete Panel')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🗑️'),
                    new ButtonBuilder()
                        .setCustomId(`panel_customizer_back_${panelId}`)
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('❌')
                );
            await interaction.reply({
                embeds: [embed],
                components: [confirmRow],
                ephemeral: true
            });
            return;
        }

        // Handle panel delete execution
        if (customId.startsWith('panel_delete_execute_')) {
            const panelId = customId.replace('panel_delete_execute_', '');
            const panelIndex = config.panels.findIndex(p => p.panelId === panelId);
            if (panelIndex === -1) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Panel Not Found', 'The panel could not be found.')],
                    ephemeral: true
                });
            }
            const panel = config.panels[panelIndex];
            // Delete the message in the channel
            try {
                const channel = interaction.guild.channels.cache.get(panel.channelId);
                if (channel) {
                    const message = await channel.messages.fetch(panel.messageId).catch(() => null);
                    if (message) await message.delete();
                }
            } catch (e) {}
            // Remove from config
            config.panels.splice(panelIndex, 1);
            await config.save();
            await interaction.update({
                embeds: [Utils.createSuccessEmbed('Panel Deleted', 'The ticket panel has been deleted successfully.')],
                components: []
            });
            return;
        }

        // Handle actions that require showing modals (don't defer these)
        const modalActions = ['title', 'description', 'color', 'label', 'emoji', 'edit_button_label', 'edit_button_emoji', 'edit_button_type'];
        if (modalActions.includes(action)) {
            // Find the panel if panelId is provided
            let panel = null;
            if (panelId) {
                panel = config.panels.find(p => p.panelId === panelId);
                if (!panel) {
                    return interaction.reply({
                        embeds: [Utils.createErrorEmbed('Panel Not Found', 'The panel could not be found.')],
                        ephemeral: true
                    });
                }
            }
            
            // Handle specific modal actions here (simplified for brevity)
            await interaction.reply({
                embeds: [Utils.createInfoEmbed('Feature Coming Soon', 'This panel customization feature is being implemented.')],
                ephemeral: true
            });
            return;
        }
        
        // For all other actions, defer the reply first
        await interaction.deferReply({ ephemeral: true });
        
        // Handle other panel customizer actions
        await interaction.editReply({
            embeds: [Utils.createInfoEmbed('Panel Customizer', 'Panel customization features are being implemented.')]
        });
        
    } catch (error) {
        client.logger.error('Error in panel customizer button handler:', error);
        const errorEmbed = Utils.createErrorEmbed(
            'Customizer Error',
            'An error occurred while processing the panel customization.'
        );
        
        if (interaction.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

class TicketsInteractionHandler {
    static async handleButtonInteraction(interaction, client) {
        const customId = interaction.customId;
        
        try {
            // Handle dashboard buttons
            if ([
                'dashboard_panels',
                'dashboard_staff',
                'dashboard_settings',
                'dashboard_logs',
                'dashboard_analytics',
                'dashboard_refresh'
            ].includes(customId)) {
                await interaction.deferUpdate();
                
                if (customId === 'dashboard_panels') {
                    const panelCommand = client.commands.get('panel');
                    if (panelCommand && typeof panelCommand.listPanels === 'function') {
                        await panelCommand.listPanels(interaction);
                    } else {
                        await interaction.followUp({
                            embeds: [Utils.createErrorEmbed('Handler Error', 'Panel command handler not found.')],
                            ephemeral: true
                        });
                    }
                    return true;
                }
                
                if (customId === 'dashboard_staff') {
                    const configCommand = client.commands.get('tickets');
                    if (configCommand && typeof configCommand.manageStaff === 'function') {
                        interaction.options = {
                            getString: (name) => name === 'action' ? 'list' : null,
                            getRole: () => null
                        };
                        await configCommand.manageStaff(interaction);
                    } else {
                        await interaction.followUp({
                            embeds: [Utils.createErrorEmbed('Handler Error', 'Staff management handler not found.')],
                            ephemeral: true
                        });
                    }
                    return true;
                }
                
                if (customId === 'dashboard_settings') {
                    const configCommand = client.commands.get('tickets');
                    if (configCommand && typeof configCommand.showConfig === 'function') {
                        await configCommand.showConfig(interaction);
                    } else {
                        await interaction.followUp({
                            embeds: [Utils.createErrorEmbed('Handler Error', 'Settings handler not found.')],
                            ephemeral: true
                        });
                    }
                    return true;
                }
                
                if (customId === 'dashboard_logs') {
                    await interaction.followUp({
                        embeds: [Utils.createInfoEmbed(
                            'Ticket Logs',
                            'Log viewing is not yet implemented. Check your configured log channel for ticket events.'
                        )],
                        ephemeral: true
                    });
                    return true;
                }
                
                if (customId === 'dashboard_analytics') {
                    const dashboardCommand = client.commands.get('dashboard');
                    if (dashboardCommand && typeof dashboardCommand.getTicketAnalytics === 'function') {
                        const analytics = await dashboardCommand.getTicketAnalytics(interaction.guild.id);

                        let topAgentsText = 'No agent assignments found';
                        if (analytics.topAgents && analytics.topAgents.length > 0) {
                            topAgentsText = analytics.topAgents.map((agent, idx) => {
                                const member = interaction.guild.members.cache.get(agent.userId);
                                const name = member ? member.displayName : `<@${agent.userId}>`;
                                return `**${idx + 1}.** ${name} — ${agent.count} tickets`;
                            }).join('\n');
                        }

                        const analyticsEmbed = Utils.createEmbed({
                            title: '📊 Ticket Analytics',
                            color: 0x2ecc71,
                            fields: [
                                {
                                    name: 'Current Ticket Status',
                                    value:
                                        `🟢 **Open:** ${analytics.statusCounts.open}\n` +
                                        `🔴 **Closed:** ${analytics.statusCounts.closed}\n` +
                                        `⚫ **Deleted:** ${analytics.statusCounts.deleted}\n` +
                                        `📁 **Archived:** ${analytics.statusCounts.archived}\n` +
                                        `🗑️ **Total Deleted (Soft):** ${analytics.totalSoftDeleted || 0}`,
                                    inline: false
                                },
                                {
                                    name: 'Top Agents (Assigned Tickets)',
                                    value: topAgentsText,
                                    inline: false
                                }
                            ],
                            footer: { text: 'Analytics based on recent 100 tickets' }
                        });

                        await interaction.followUp({
                            embeds: [analyticsEmbed],
                            ephemeral: true
                        });
                    } else {
                        await interaction.followUp({
                            embeds: [Utils.createInfoEmbed(
                                'Ticket Analytics',
                                'Analytics dashboard is not available. Please check the main dashboard for statistics.'
                            )],
                            ephemeral: true
                        });
                    }
                    return true;
                }
                
                if (customId === 'dashboard_refresh') {
                    const dashboardCommand = client.commands.get('dashboard');
                    if (dashboardCommand) {
                        await dashboardCommand.execute(interaction);
                    }
                    return true;
                }
                
                return true;
            }

            // Handle ticket buttons
            if (customId.startsWith('ticket_')) {
                try {
                    const ticketManager = client.ticketManager;
                    
                    if (interaction.customId.startsWith('ticket_create_')) {
                        await ticketManager.handleTicketButton(interaction);
                    } else {
                        await ticketManager.handleTicketAction(interaction);
                    }
                } catch (error) {
                    console.error('Error handling ticket button:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            embeds: [Utils.createErrorEmbed('Error', 'An error occurred while processing your request.')],
                            ephemeral: true
                        });
                    }
                }
                return true;
            }

            // Handle ticket confirmation buttons
            if (customId.startsWith('confirm_delete_')) {
                await handleTicketDeleteConfirmation(interaction, client);
                return true;
            }

            if (customId === 'cancel_delete') {
                await interaction.update({
                    embeds: [Utils.createEmbed({
                        title: '❌ Cancelled',
                        description: 'Ticket deletion has been cancelled.',
                        color: 0x99AAB5
                    })],
                    components: []
                });
                return true;
            }

            // Handle panel customizer buttons
            if (
                customId.startsWith('panel_edit_') ||
                customId.startsWith('panel_button_') ||
                customId.startsWith('panel_manage_') ||
                customId.startsWith('panel_preview_') ||
                customId.startsWith('panel_save_') ||
                customId.startsWith('panel_remove_') ||
                customId.startsWith('confirm_remove_button_') ||
                customId.startsWith('panel_add_button_') ||
                customId.startsWith('panel_select_button_') ||
                customId === 'panel_customizer_back' ||
                customId.startsWith('panel_customizer_back_') ||
                customId === 'panel_button_edit_back' ||
                customId.startsWith('panel_delete_confirm_')
            ) {
                await handlePanelCustomizerButton(interaction, client);
                return true;
            }

            return false;
        } catch (error) {
            client.logger.error(`Error handling tickets button interaction ${customId}:`, error);
            const embed = Utils.createErrorEmbed(
                'Tickets Button Error',
                'An error occurred while processing this tickets button interaction.'
            );

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            return true;
        }
    }
}

module.exports = TicketsInteractionHandler;