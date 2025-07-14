const Utils = require('../utils/utils');
const EmbedBuilderHandler = require('../utils/EmbedBuilderHandler');
const LFGInteractionHandler = require('./lfg/LFGInteractionHandler');

// Temp VC interaction handlers
async function handleTempVCModal(interaction, client) {
    if (!client.tempVCManager) {
        return interaction.reply({
            content: '❌ Temp VC system is not available.',
            ephemeral: true
        });
    }

    try {
        await client.tempVCManager.controlHandlers.handleModalSubmission(interaction);
        
    } catch (error) {
        client.logger.error('Error handling temp VC modal:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ An error occurred while processing your submission.',
                ephemeral: true
            });
        }
    }
}

async function handleModalSubmit(interaction, client) {
    try {
        // Handle LFG modal submissions first
        const lfgHandled = await LFGInteractionHandler.handleModalSubmission(interaction);
        if (lfgHandled) return;

        const customId = interaction.customId;
        
        // Handle embed builder modals
        if (customId.startsWith('embed_modal_')) {
            const handled = await EmbedBuilderHandler.handleModalSubmit(interaction);
            if (handled) return;
        }

        // Handle welcome embed builder modals
        if (customId.startsWith('welcome_modal_')) {
            const WelcomeEmbedHandler = require('../utils/WelcomeEmbedHandler');
            const handled = await WelcomeEmbedHandler.handleWelcomeModalSubmit(interaction);
            if (handled) return;
        }
        
        // Handle ticket creation modals
        if (customId.startsWith('ticket_modal_')) {
            const ticketManager = client.ticketManager;
            await ticketManager.handleModalSubmit(interaction);
            return;
        }

        // Handle ticket close reason modals
        if (customId.startsWith('ticket_close_reason_')) {
            const ticketId = customId.replace('ticket_close_reason_', '');
            const reason = interaction.fields.getTextInputValue('reason');
            
            const Ticket = require('../schemas/Ticket');
            const TicketConfig = require('../schemas/TicketConfig');
            
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
            return;
        }

        // Handle canned response edit modals
        if (customId.startsWith('edit_canned_response_')) {
            const responseName = customId.replace('edit_canned_response_', '');
            const newContent = interaction.fields.getTextInputValue('content');
            
            const TicketConfig = require('../schemas/TicketConfig');
            
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
            return;
        }

        // Handle panel customizer modals
        if (customId.startsWith('panel_')) {
            await handlePanelCustomizerModal(interaction, client);
            return;
        }
        // Handle edit button modals (label, emoji, type)
        if (
            customId.startsWith('edit_button_label_') ||
            customId.startsWith('edit_button_emoji_') ||
            customId.startsWith('edit_button_type_')
        ) {
            await handlePanelCustomizerModal(interaction, client);
            return;
        }

        // Handle temp VC modals
        if (customId.startsWith('tempvc_')) {
            await handleTempVCModal(interaction, client);
            return;
        }

        // Handle other modals...
        
    } catch (error) {
        console.error('Error handling modal submit:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'An error occurred while processing your submission.')],
                ephemeral: true
            });
        }
    }
}

async function handlePanelCustomizerModal(interaction, client) {
    const TicketConfig = require('../schemas/TicketConfig');
    
    try {
        await interaction.deferReply({ ephemeral: true });
        
        const config = await TicketConfig.findOne({ guildId: interaction.guildId });
        if (!config) {
            return interaction.editReply({
                embeds: [Utils.createErrorEmbed('Configuration Error', 'Ticket system is not configured for this server.')]
            });
        }

        const customId = interaction.customId;
        
        // Extract panel ID if present (format: action_edit_panelId)
        let panelId = null;
        let action = '';
        
        if (customId.includes('_')) {
            const parts = customId.split('_');
            if (parts.length >= 4) {
                // Format: panel_action_edit_panelId
                action = `${parts[1]}_${parts[2]}`;
                panelId = parts[3];
            } else {
                // Format: panel_action_edit (global)
                action = `${parts[1]}_${parts[2]}`;
            }
        }
        
        // Find the panel if panelId is provided
        let panel = null;
        if (panelId) {
            panel = config.panels.find(p => p.panelId === panelId);
            if (!panel) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Panel Not Found', 'The panel could not be found.')]
                });
            }
        }
        
        if (action === 'title_edit') {
            const newTitle = interaction.fields.getTextInputValue('panel_title');
            
            if (panel) {
                // Update specific panel
                panel.title = newTitle;
                await config.save();
                
                // Update the actual panel message
                await updatePanelMessage(interaction, panel, config);
                
                await interaction.editReply({
                    embeds: [Utils.createSuccessEmbed(
                        '✅ Panel Title Updated',
                        `Panel title has been updated to: **${newTitle}**`
                    )]
                });
            } else {
                // Update global config
                config.panelTitle = newTitle;
                await config.save();
                
                await interaction.editReply({
                    embeds: [Utils.createSuccessEmbed(
                        '✅ Title Updated',
                        `Panel title has been updated to: **${newTitle}**`
                    )]
                });
            }
            
        } else if (action === 'description_edit') {
            const newDescription = interaction.fields.getTextInputValue('panel_description');
            
            if (panel) {
                // Update specific panel
                panel.description = newDescription;
                await config.save();
                
                // Update the actual panel message
                await updatePanelMessage(interaction, panel, config);
                
                await interaction.editReply({
                    embeds: [Utils.createSuccessEmbed(
                        '✅ Panel Description Updated',
                        `Panel description has been updated.`
                    )]
                });
            } else {
                // Update global config
                config.panelDescription = newDescription;
                await config.save();
                
                await interaction.editReply({
                    embeds: [Utils.createSuccessEmbed(
                        '✅ Description Updated',
                        `Panel description has been updated.`
                    )]
                });
            }
            
        } else if (action === 'color_edit') {
            const colorInput = interaction.fields.getTextInputValue('panel_color');
            
            // Parse hex color
            let colorValue;
            const cleanInput = colorInput.replace('#', '');
            
            if (!/^[0-9A-F]{6}$/i.test(cleanInput)) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Invalid Color',
                        'Please provide a valid hex color code (e.g., #5865F2 or 5865F2)'
                    )]
                });
            }
            
            if (panel) {
                // Update specific panel
                panel.color = `#${cleanInput}`;
                await config.save();
                
                // Update the actual panel message
                await updatePanelMessage(interaction, panel, config);
                
                colorValue = parseInt(cleanInput, 16);
                await interaction.editReply({
                    embeds: [Utils.createSuccessEmbed(
                        '✅ Panel Color Updated',
                        `Panel color has been updated to: **#${cleanInput.toUpperCase()}**`
                    ).setColor(colorValue)]
                });
            } else {
                // Update global config
                colorValue = parseInt(cleanInput, 16);
                config.panelColor = colorValue;
                await config.save();
                
                await interaction.editReply({
                    embeds: [Utils.createSuccessEmbed(
                        '✅ Color Updated',
                        `Panel color has been updated to: **#${cleanInput.toUpperCase()}**`
                    ).setColor(colorValue)]
                });
            }
        } else if (action === 'button_label_edit') {
            const newLabel = interaction.fields.getTextInputValue('button_label');
            config.buttonLabel = newLabel;
            await config.save();
            
            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed(
                    '✅ Button Label Updated',
                    `Button label has been updated to: **${newLabel}**`
                )]
            });
            
        } else if (action === 'button_emoji_edit') {
            const newEmoji = interaction.fields.getTextInputValue('button_emoji');
            config.buttonEmoji = newEmoji || null;
            await config.save();
            
            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed(
                    '✅ Button Emoji Updated',
                    newEmoji ? `Button emoji has been updated to: ${newEmoji}` : 'Button emoji has been removed.'
                )]
            });
        } else if (customId.startsWith('edit_button_label_')) {
            await handleEditButtonModalSubmit(interaction, config, customId, 'label');
        } else if (customId.startsWith('edit_button_emoji_')) {
            await handleEditButtonModalSubmit(interaction, config, customId, 'emoji');
        } else if (customId.startsWith('edit_button_type_')) {
            await handleEditButtonModalSubmit(interaction, config, customId, 'type');
        }
        
    } catch (error) {
        client.logger.error('Error in panel customizer modal handler:', error);
        const errorEmbed = Utils.createErrorEmbed(
            'Customization Error',
            'An error occurred while saving your customization.'
        );
        
        if (interaction.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

async function handleEditButtonModalSubmit(interaction, config, customId, fieldType) {
    try {
        // Extract panel ID and button index from customId
        // Format: edit_button_label_panelId_buttonIndex
        const parts = customId.split('_');
        console.log('[DEBUG] handleEditButtonModalSubmit:', { customId, parts });
        if (parts.length < 5) {
            console.error('[ERROR] Invalid customId format in handleEditButtonModalSubmit:', { customId, parts });
            if (!interaction.replied && !interaction.deferred) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Error', 'Internal error: Invalid modal custom ID format. Please contact an admin.')],
                    ephemeral: true
                });
            } else {
                return interaction.followUp({
                    embeds: [Utils.createErrorEmbed('Error', 'Internal error: Invalid modal custom ID format. Please contact an admin.')],
                    ephemeral: true
                });
            }
        }
        
        const panelId = parts[3];
        const buttonIndex = parseInt(parts[4]);
        console.log('[DEBUG] Parsed panelId and buttonIndex:', { panelId, buttonIndex });
        
        const panel = config.panels.find(p => p.panelId === panelId);
        if (!panel) {
            console.error('[ERROR] Panel not found in handleEditButtonModalSubmit:', { panelId, panels: config.panels.map(p => p.panelId) });
            if (!interaction.replied && !interaction.deferred) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Button Not Found', 'The panel for this button could not be found.')],
                    ephemeral: true
                });
            } else {
                return interaction.followUp({
                    embeds: [Utils.createErrorEmbed('Button Not Found', 'The panel for this button could not be found.')],
                    ephemeral: true
                });
            }
        }
        if (!panel.buttons[buttonIndex]) {
            console.error('[ERROR] Button index not found in handleEditButtonModalSubmit:', { buttonIndex, buttons: panel.buttons.length });
            if (!interaction.replied && !interaction.deferred) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Button Not Found', 'The button could not be found.')],
                    ephemeral: true
                });
            } else {
                return interaction.followUp({
                    embeds: [Utils.createErrorEmbed('Button Not Found', 'The button could not be found.')],
                    ephemeral: true
                });
            }
        }

        let newValue, fieldName, successMessage;
        
        switch (fieldType) {
            case 'label':
                newValue = interaction.fields.getTextInputValue('button_label');
                panel.buttons[buttonIndex].label = newValue;
                fieldName = 'Label';
                successMessage = `Button label has been updated to: **${newValue}**`;
                break;
                
            case 'emoji':
                newValue = interaction.fields.getTextInputValue('button_emoji');
                panel.buttons[buttonIndex].emoji = newValue || null;
                fieldName = 'Emoji';
                successMessage = newValue ? 
                    `Button emoji has been updated to: ${newValue}` : 
                    'Button emoji has been removed.';
                break;
                
            case 'type':
                newValue = interaction.fields.getTextInputValue('ticket_type');
                panel.buttons[buttonIndex].ticketType = newValue;
                fieldName = 'Ticket Type';
                successMessage = `Ticket type has been updated to: **${newValue}**`;
                break;
                
            default:
                throw new Error('Unknown field type');
        }
        
        // Save the configuration
        await config.save();
        
        // Update the actual panel message if needed
        await updatePanelMessage(interaction, panel, config);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                embeds: [Utils.createSuccessEmbed(
                    `✅ Button ${fieldName} Updated`,
                    `${successMessage}\n\nUse the panel customizer to continue editing buttons.`
                )],
                ephemeral: true
            });
        } else {
            await interaction.followUp({
                embeds: [Utils.createSuccessEmbed(
                    `✅ Button ${fieldName} Updated`,
                    `${successMessage}\n\nUse the panel customizer to continue editing buttons.`
                )],
                ephemeral: true
            });
        }
        
    } catch (error) {
        console.error(`Error handling ${fieldType} modal submit:`, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', `Failed to update button ${fieldType}.`)],
                ephemeral: true
            });
        } else {
            await interaction.followUp({
                embeds: [Utils.createErrorEmbed('Error', `Failed to update button ${fieldType}.`)],
                ephemeral: true
            });
        }
    }
}

async function updatePanelMessage(interaction, panel, config) {
    try {
        const channel = interaction.guild.channels.cache.get(panel.channelId);
        if (!channel) return;

        const message = await channel.messages.fetch(panel.messageId).catch(() => null);
        if (!message) return;

        // Only edit if the bot is the author
        if (message.author.id !== interaction.client.user.id) {
            console.warn('[WARN] Tried to edit a message not authored by the bot:', {
                messageId: message.id,
                authorId: message.author.id,
                botId: interaction.client.user.id
            });
            // Optionally, inform the user (if not already replied)
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Panel Message Not Editable', 'The panel message cannot be updated because it was not created by the bot. Please recreate the panel using the bot.')],
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    embeds: [Utils.createErrorEmbed('Panel Message Not Editable', 'The panel message cannot be updated because it was not created by the bot. Please recreate the panel using the bot.')],
                    ephemeral: true
                });
            }
            return;
        }

        // Create the panel embed
        const embed = Utils.createEmbed({
            title: panel.title,
            description: panel.description,
            color: parseInt(panel.color.replace('#', ''), 16) || 0x5865F2,
            footer: { text: `Panel ID: ${panel.panelId}` }
        });

        // Create button components using TicketManager
        const ticketManager = interaction.client.ticketManager;
        const components = ticketManager ? ticketManager.createButtonRows(panel.buttons) : [];
        
        await message.edit({ embeds: [embed], components });
    } catch (error) {
        console.error('Error updating panel message:', error);
        // Optionally, inform the user if not already replied
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Panel Update Error', 'Failed to update the panel message. Please check bot permissions.')],
                ephemeral: true
            });
        } else {
            await interaction.followUp({
                embeds: [Utils.createErrorEmbed('Panel Update Error', 'Failed to update the panel message. Please check bot permissions.')],
                ephemeral: true
            });
        }
    }
}

module.exports = { handleModalSubmit };