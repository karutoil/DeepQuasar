const Utils = require('../../../utils/utils');

async function handlePanelCustomizerModal(interaction, client) {
    const customId = interaction.customId;
    const TicketConfig = require('../../../schemas/TicketConfig');
    
    try {
        const config = await TicketConfig.findOne({ guildId: interaction.guildId });
        if (!config) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Configuration Error', 'Ticket system is not configured for this server.')],
                ephemeral: true
            });
        }

        // Handle different panel modal types
        if (customId.startsWith('panel_title_edit_')) {
            const panelId = customId.replace('panel_title_edit_', '');
            const newTitle = interaction.fields.getTextInputValue('panel_title');
            
            const panel = config.panels.find(p => p.panelId === panelId);
            if (panel) {
                panel.title = newTitle;
                await config.save();
                
                await interaction.reply({
                    embeds: [Utils.createSuccessEmbed('Panel Title Updated', `Title updated to: "${newTitle}"`)],
                    ephemeral: true
                });
            }
            return;
        }

        if (customId.startsWith('panel_description_edit_')) {
            const panelId = customId.replace('panel_description_edit_', '');
            const newDescription = interaction.fields.getTextInputValue('panel_description');
            
            const panel = config.panels.find(p => p.panelId === panelId);
            if (panel) {
                panel.description = newDescription;
                await config.save();
                
                await interaction.reply({
                    embeds: [Utils.createSuccessEmbed('Panel Description Updated', `Description updated successfully.`)],
                    ephemeral: true
                });
            }
            return;
        }

        if (customId.startsWith('edit_button_label_')) {
            const [, , , panelId, buttonIndex] = customId.split('_');
            const newLabel = interaction.fields.getTextInputValue('button_label');
            
            const panel = config.panels.find(p => p.panelId === panelId);
            if (panel && panel.buttons[parseInt(buttonIndex)]) {
                panel.buttons[parseInt(buttonIndex)].label = newLabel;
                await config.save();
                
                await interaction.reply({
                    embeds: [Utils.createSuccessEmbed('Button Label Updated', `Label updated to: "${newLabel}"`)],
                    ephemeral: true
                });
            }
            return;
        }

        if (customId.startsWith('edit_button_emoji_')) {
            const [, , , panelId, buttonIndex] = customId.split('_');
            const newEmoji = interaction.fields.getTextInputValue('button_emoji');
            
            const panel = config.panels.find(p => p.panelId === panelId);
            if (panel && panel.buttons[parseInt(buttonIndex)]) {
                panel.buttons[parseInt(buttonIndex)].emoji = newEmoji;
                await config.save();
                
                await interaction.reply({
                    embeds: [Utils.createSuccessEmbed('Button Emoji Updated', `Emoji updated successfully.`)],
                    ephemeral: true
                });
            }
            return;
        }

        if (customId.startsWith('edit_button_type_')) {
            const [, , , panelId, buttonIndex] = customId.split('_');
            const newType = interaction.fields.getTextInputValue('ticket_type');
            
            const panel = config.panels.find(p => p.panelId === panelId);
            if (panel && panel.buttons[parseInt(buttonIndex)]) {
                panel.buttons[parseInt(buttonIndex)].ticketType = newType;
                await config.save();
                
                await interaction.reply({
                    embeds: [Utils.createSuccessEmbed('Ticket Type Updated', `Type updated to: "${newType}"`)],
                    ephemeral: true
                });
            }
            return;
        }

        // Default response for unhandled panel modals
        await interaction.reply({
            embeds: [Utils.createInfoEmbed('Panel Customization', 'Panel customization completed.')],
            ephemeral: true
        });

    } catch (error) {
        console.error('Error handling panel customizer modal:', error);
        await interaction.reply({
            embeds: [Utils.createErrorEmbed('Error', 'Failed to process panel customization.')],
            ephemeral: true
        });
    }
}

class TicketsModalHandler {
    static async handleModalSubmit(interaction, client) {
        const customId = interaction.customId;
        
        try {
            // Handle ticket creation modals
            if (customId.startsWith('ticket_modal_')) {
                const ticketManager = client.ticketManager;
                await ticketManager.handleModalSubmit(interaction);
                return true;
            }

            // Handle ticket close reason modals
            if (customId.startsWith('ticket_close_reason_')) {
                const ticketId = customId.replace('ticket_close_reason_', '');
                const reason = interaction.fields.getTextInputValue('reason');
                
                const Ticket = require('../../../schemas/Ticket');
                const TicketConfig = require('../../../schemas/TicketConfig');
                
                const ticket = await Ticket.findOne({ ticketId });
                if (!ticket) {
                    return interaction.reply({
                        embeds: [Utils.createErrorEmbed('Error', 'Ticket not found.')],
                        ephemeral: true
                    });
                }

                const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
                const ticketManager = client.ticketManager;
                
                await ticketManager.processCloseTicket(interaction, ticket, reason, config);
                return true;
            }

            // Handle canned response edit modals
            if (customId.startsWith('edit_canned_response_')) {
                const responseName = customId.replace('edit_canned_response_', '');
                const newContent = interaction.fields.getTextInputValue('content');
                
                const TicketConfig = require('../../../schemas/TicketConfig');
                
                try {
                    const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
                    
                    if (!config || !config.cannedResponses || !config.cannedResponses.has(responseName)) {
                        return interaction.reply({
                            embeds: [Utils.createErrorEmbed('Not Found', 'Canned response not found.')],
                            ephemeral: true
                        });
                    }

                    const response = config.cannedResponses.get(responseName);
                    response.content = newContent;
                    response.lastEditedBy = interaction.user.id;
                    response.lastEditedAt = new Date();
                    
                    config.cannedResponses.set(responseName, response);
                    await config.save();

                    await interaction.reply({
                        embeds: [Utils.createSuccessEmbed(
                            'Canned Response Updated',
                            `Successfully updated canned response "${responseName}".`
                        )],
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error updating canned response:', error);
                    await interaction.reply({
                        embeds: [Utils.createErrorEmbed('Error', 'Failed to update canned response.')],
                        ephemeral: true
                    });
                }
                return true;
            }

            // Handle panel customizer modals
            if (customId.startsWith('panel_') || customId.startsWith('edit_button_')) {
                await handlePanelCustomizerModal(interaction, client);
                return true;
            }

            return false;
        } catch (error) {
            client.logger.error(`Error handling tickets modal submit ${customId}:`, error);
            const embed = Utils.createErrorEmbed(
                'Tickets Modal Error',
                'An error occurred while processing this tickets modal submission.'
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

module.exports = TicketsModalHandler;