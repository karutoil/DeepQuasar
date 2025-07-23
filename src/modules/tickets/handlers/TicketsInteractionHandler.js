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
            
            switch (action) {
                case 'title':
                    await showTitleEditModal(interaction, config, panel);
                    break;
                case 'description':
                    await showDescriptionEditModal(interaction, config, panel);
                    break;
                case 'color':
                    await showColorEditModal(interaction, config, panel);
                    break;
                case 'label':
                    await showButtonLabelModal(interaction, config);
                    break;
                case 'emoji':
                    await showButtonEmojiModal(interaction, config);
                    break;
                case 'edit_button_label':
                    await handleEditButtonLabel(interaction, config, panelId, buttonIndex);
                    break;
                case 'edit_button_emoji':
                    await handleEditButtonEmoji(interaction, config, panelId, buttonIndex);
                    break;
                case 'edit_button_type':
                    await handleEditButtonType(interaction, config, panelId, buttonIndex);
                    break;
            }
            return;
        }
        
        // For all other actions, defer the reply first
        await interaction.deferReply({ ephemeral: true });
        
        if (customId === 'panel_customizer_back' || customId.startsWith('panel_customizer_back_')) {
            // Go back to main panel customizer - need to find the panel
            let targetPanelId = panelId;
            
            if (!targetPanelId && customId.includes('_')) {
                // Extract panelId from customId like panel_customizer_back_panelId
                const parts = customId.split('_');
                if (parts.length >= 4) {
                    targetPanelId = parts[3];
                }
            }
            
            if (targetPanelId) {
                const panel = config.panels.find(p => p.panelId === targetPanelId);
                if (panel) {
                    const panelCommand = require('../../../commands/tickets/panel');
                    // Use interaction.editReply to update the message
                    await panelCommand.showPanelCustomizer(interaction, panel, config);
                    return;
                }
            }
            
            // Fallback: show available panels or error
            if (config.panels && config.panels.length > 0) {
                await interaction.editReply({
                    embeds: [Utils.createEmbed({
                        title: '🎛️ Select a Panel to Customize',
                        description: `Available panels:\n\n${config.panels.map(p => `• **${p.title}** (ID: \`${p.panelId}\`)`).join('\n')}\n\nUse \`/panel customize <panel_id>\` to customize a specific panel.`,
                        color: 0x5865F2
                    })],
                    components: []
                });
            } else {
                await interaction.editReply({
                    embeds: [Utils.createErrorEmbed('No Panels Found', 'No panels are available to customize. Create a panel first using `/panel create`.')],
                    components: []
                });
            }
            return;
        }
        
        if (customId === 'panel_button_edit_back') {
            // Go back to button edit interface
            await showButtonEditInterface(interaction, config, panelId);
            return;
        }
        
        switch (action) {
            case 'manage_buttons':
                await handleManageButtons(interaction, config, panelId);
                break;
            case 'preview':
                await handleRefreshPreview(interaction, config, panelId);
                break;
            case 'save_changes':
                await handleSaveAndPublish(interaction, config, panelId);
                break;
            case 'buttons':
                await showButtonEditInterface(interaction, config, panelId);
                break;
            case 'style':
                await showButtonStyleSelector(interaction, config);
                break;
            case 'remove_button':
                await handleRemoveButton(interaction, config, panelId, buttonIndex);
                break;
            case 'confirm_remove_button':
                await handleConfirmRemoveButton(interaction, config, panelId, buttonIndex, client);
                break;
            default:
                await interaction.editReply({
                    embeds: [Utils.createInfoEmbed('Panel Customizer', `Action "${action}" is not implemented yet.`)]
                });
                break;
        }
        
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

async function showTitleEditModal(interaction, config, panel = null) {
    const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
    
    const modal = new ModalBuilder()
        .setCustomId(panel ? `panel_title_edit_${panel.panelId}` : 'panel_title_edit')
        .setTitle('Edit Panel Title');

    const currentTitle = panel ? panel.title : (config.panelTitle || 'Support Tickets');

    const titleInput = new TextInputBuilder()
        .setCustomId('panel_title')
        .setLabel('Panel Title')
        .setStyle(TextInputStyle.Short)
        .setValue(currentTitle)
        .setMaxLength(256)
        .setRequired(true);

    const row = new ActionRowBuilder().addComponents(titleInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
}

async function showDescriptionEditModal(interaction, config, panel = null) {
    const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
    
    const modal = new ModalBuilder()
        .setCustomId(panel ? `panel_description_edit_${panel.panelId}` : 'panel_description_edit')
        .setTitle('Edit Panel Description');

    const currentDescription = panel ? panel.description : (config.panelDescription || 'Click the button below to create a support ticket.');

    const descriptionInput = new TextInputBuilder()
        .setCustomId('panel_description')
        .setLabel('Panel Description')
        .setStyle(TextInputStyle.Paragraph)
        .setValue(currentDescription)
        .setMaxLength(4000)
        .setRequired(true);

    const row = new ActionRowBuilder().addComponents(descriptionInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
}

async function showColorEditModal(interaction, config, panel = null) {
    const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
    
    const modal = new ModalBuilder()
        .setCustomId(panel ? `panel_color_edit_${panel.panelId}` : 'panel_color_edit')
        .setTitle('Edit Panel Color');

    let currentColor;
    if (panel) {
        currentColor = panel.color;
    } else {
        currentColor = config.panelColor ? `#${config.panelColor.toString(16).padStart(6, '0')}` : '#5865F2';
    }

    const colorInput = new TextInputBuilder()
        .setCustomId('panel_color')
        .setLabel('Panel Color (hex code)')
        .setStyle(TextInputStyle.Short)
        .setValue(currentColor)
        .setPlaceholder('#5865F2 or 5865F2')
        .setMaxLength(7)
        .setRequired(true);

    const row = new ActionRowBuilder().addComponents(colorInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
}

async function showButtonEditInterface(interaction, config, panelId = null) {
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
    
    const embed = new EmbedBuilder()
        .setTitle('🎛️ Panel Button Customization')
        .setDescription('Customize the ticket creation button appearance and text.')
        .setColor(config.panelColor || 0x5865F2)
        .addFields([
            {
                name: '🏷️ Current Button Label',
                value: `\`${config.buttonLabel || 'Create Ticket'}\``,
                inline: true
            },
            {
                name: '🎨 Current Button Style', 
                value: getButtonStyleName(config.buttonStyle),
                inline: true
            },
            {
                name: '❓ Current Button Emoji',
                value: config.buttonEmoji || 'None',
                inline: true
            }
        ]);

    const labelRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('panel_button_label')
                .setLabel('Edit Label')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🏷️')
        );

    const styleRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('panel_button_style')
                .setLabel('Change Style')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🎨')
        );

    const emojiRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('panel_button_emoji')
                .setLabel('Edit Emoji')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('❓')
        );

    const backRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(panelId ? `panel_customizer_back_${panelId}` : 'panel_customizer_back')
                .setLabel('Back to Panel Editor')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('⬅️')
        );

    await interaction.editReply({
        embeds: [embed],
        components: [labelRow, styleRow, emojiRow, backRow]
    });
}

function getButtonStyleName(style) {
    // Handle both numeric (Discord.js) and string (schema) formats
    const styleMap = {
        1: 'Primary (Blue)',
        2: 'Secondary (Gray)',  
        3: 'Success (Green)',
        4: 'Danger (Red)',
        'Primary': 'Primary (Blue)',
        'Secondary': 'Secondary (Gray)',
        'Success': 'Success (Green)',
        'Danger': 'Danger (Red)'
    };
    return styleMap[style] || 'Primary (Blue)';
}

function convertStyleToSchema(discordStyle) {
    // Convert numeric Discord.js style to schema string
    const conversion = {
        1: 'Primary',
        2: 'Secondary',
        3: 'Success',
        4: 'Danger'
    };
    return conversion[discordStyle] || 'Primary';
}

function convertStyleToDiscord(schemaStyle) {
    // Convert schema string to numeric Discord.js style
    const conversion = {
        'Primary': 1,
        'Secondary': 2,
        'Success': 3,
        'Danger': 4
    };
    return conversion[schemaStyle] || 1;
}

async function showButtonLabelModal(interaction, config) {
    const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
    
    const modal = new ModalBuilder()
        .setCustomId('panel_button_label_edit')
        .setTitle('Edit Button Label');

    const labelInput = new TextInputBuilder()
        .setCustomId('button_label')
        .setLabel('Button Label')
        .setStyle(TextInputStyle.Short)
        .setValue(config.buttonLabel || 'Create Ticket')
        .setMaxLength(80)
        .setRequired(true);

    const row = new ActionRowBuilder().addComponents(labelInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
}

async function showButtonStyleSelector(interaction, config) {
    const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
    const embed = new EmbedBuilder()
        .setTitle('🎨 Select Button Style')
        .setDescription('Choose the style for your ticket creation button.')
        .setColor(config.panelColor || 0x5865F2)
        .addFields([
            { name: 'Current Style', value: getButtonStyleName(config.buttonStyle), inline: true }
        ]);

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('panel_button_style_select')
        .setPlaceholder('Choose a button style...')
        .addOptions([
            {
                label: 'Primary (Blue)',
                description: 'Blue button style - most prominent',
                value: '1',
                default: config.buttonStyle === 1
            },
            {
                label: 'Secondary (Gray)',
                description: 'Gray button style - neutral appearance',
                value: '2',
                default: config.buttonStyle === 2
            },
            {
                label: 'Success (Green)',
                description: 'Green button style - positive action',
                value: '3',
                default: config.buttonStyle === 3
            },
            {
                label: 'Danger (Red)',
                description: 'Red button style - caution/important',
                value: '4',
                default: config.buttonStyle === 4
            }
        ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    const backRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('panel_button_edit_back')
                .setLabel('Back')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️')
        );

    await interaction.editReply({
        embeds: [embed],
        components: [row, backRow]
    });
}

async function showButtonEmojiModal(interaction, config) {
    const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
    
    const modal = new ModalBuilder()
        .setCustomId('panel_button_emoji_edit')
        .setTitle('Edit Button Emoji');

    const emojiInput = new TextInputBuilder()
        .setCustomId('button_emoji')
        .setLabel('Button Emoji')
        .setStyle(TextInputStyle.Short)
        .setValue(config.buttonEmoji || '')
        .setPlaceholder('🎫 or leave empty for no emoji')
        .setMaxLength(10)
        .setRequired(false);

    const row = new ActionRowBuilder().addComponents(emojiInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
}

async function handleManageButtons(interaction, config, panelId) {
    try {
        const panel = config.panels.find(p => p.panelId === panelId);
        if (!panel) {
            return interaction.editReply({
                embeds: [Utils.createErrorEmbed('Panel Not Found', 'The panel could not be found.')]
            });
        }

        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setTitle('🔘 Manage Panel Buttons')
            .setDescription(`Managing buttons for panel: **${panel.title}**\n\nCurrent buttons: ${panel.buttons.length}`)
            .setColor(parseInt(panel.color.replace('#', ''), 16) || 0x5865F2);

        if (panel.buttons.length > 0) {
            embed.addFields(
                panel.buttons.map((btn, index) => ({
                    name: `Button ${index + 1}: ${btn.label}`,
                    value: `Style: ${getButtonStyleName(btn.style)}${btn.emoji ? ` | Emoji: ${btn.emoji}` : ''}\nType: ${btn.ticketType}`,
                    inline: true
                }))
            );

            // Add a select menu to choose which button to edit
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`panel_select_button_${panelId}`)
                .setPlaceholder('Select a button to edit...')
                .addOptions(
                    panel.buttons.map((btn, index) => ({
                        label: `${btn.label} (${btn.ticketType})`,
                        description: `Edit button ${index + 1}`,
                        value: `${index}`,
                        emoji: btn.emoji || '🎫'
                    }))
                );

            const selectRow = new ActionRowBuilder().addComponents(selectMenu);

            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`panel_add_button_${panelId}`)
                        .setLabel('Add Button')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('➕')
                );

            const backRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`panel_customizer_back_${panelId}`)
                        .setLabel('Back to Panel Editor')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⬅️')
                );

            await interaction.editReply({
                embeds: [embed],
                components: [selectRow, actionRow, backRow]
            });
        } else {
            // No buttons exist, just show add button
            embed.addFields({
                name: 'No Buttons Found',
                value: 'This panel has no buttons configured. Add a button to get started.',
                inline: false
            });

            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`panel_add_button_${panelId}`)
                        .setLabel('Add First Button')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('➕')
                );

            const backRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`panel_customizer_back_${panelId}`)
                        .setLabel('Back to Panel Editor')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⬅️')
                );

            await interaction.editReply({
                embeds: [embed],
                components: [actionRow, backRow]
            });
        }
    } catch (error) {
        console.error('Error in handleManageButtons:', error);
        await interaction.editReply({
            embeds: [Utils.createErrorEmbed('Error', 'Failed to load button management interface.')]
        });
    }
}

async function handleRefreshPreview(interaction, config, panelId) {
    try {
        const panel = config.panels.find(p => p.panelId === panelId);
        if (!panel) {
            return interaction.editReply({
                embeds: [Utils.createErrorEmbed('Panel Not Found', 'The panel could not be found.')]
            });
        }

        // Re-show the panel customizer with updated preview
        const panelCommand = require('../../../commands/tickets/panel');
        await panelCommand.showPanelCustomizer(interaction, panel, config);
        
        // Send a follow-up to confirm refresh
        await interaction.followUp({
            content: '🔄 **Preview refreshed!** The live preview has been updated with the latest changes.',
            ephemeral: true
        });
    } catch (error) {
        console.error('Error in handleRefreshPreview:', error);
        await interaction.editReply({
            embeds: [Utils.createErrorEmbed('Error', 'Failed to refresh preview.')]
        });
    }
}

async function handleSaveAndPublish(interaction, config, panelId) {
    try {
        const panel = config.panels.find(p => p.panelId === panelId);
        if (!panel) {
            return interaction.editReply({
                embeds: [Utils.createErrorEmbed('Panel Not Found', 'The panel could not be found.')]
            });
        }

        // Update the actual panel message
        const channel = interaction.guild.channels.cache.get(panel.channelId);
        if (!channel) {
            return interaction.editReply({
                embeds: [Utils.createErrorEmbed('Channel Not Found', 'The panel channel could not be found.')]
            });
        }

        const message = await channel.messages.fetch(panel.messageId).catch(() => null);
        if (!message) {
            return interaction.editReply({
                embeds: [Utils.createErrorEmbed('Message Not Found', 'The panel message could not be found.')]
            });
        }

        // Create the panel embed
        const embed = Utils.createEmbed({
            title: panel.title,
            description: panel.description,
            color: parseInt(panel.color.replace('#', ''), 16) || 0x5865F2,
            footer: { text: `Panel ID: ${panel.panelId}` }
        });

        // Create button components
        const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
        const rows = [];
        let currentRow = new ActionRowBuilder();
        let buttonCount = 0;

        for (const button of panel.buttons) {
            if (buttonCount === 5) {
                rows.push(currentRow);
                currentRow = new ActionRowBuilder();
                buttonCount = 0;
            }

            const discordButton = new ButtonBuilder()
                .setCustomId(`ticket_create_${button.ticketType}`)
                .setLabel(button.label)
                .setStyle(convertStyleToDiscord(button.style));

            if (button.emoji) {
                discordButton.setEmoji(button.emoji);
            }

            currentRow.addComponents(discordButton);
            buttonCount++;
        }

        if (buttonCount > 0) {
            rows.push(currentRow);
        }

        await message.edit({ embeds: [embed], components: rows });
        
        // Save to database
        await config.save();

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed(
                '✅ Panel Saved & Published!',
                `Your panel has been updated and published to ${channel}.\n\n` +
                `**Panel ID:** \`${panel.panelId}\`\n` +
                `**Title:** ${panel.title}\n` +
                `**Buttons:** ${panel.buttons.length}`
            )]
        });
    } catch (error) {
        console.error('Error in handleSaveAndPublish:', error);
        await interaction.editReply({
            embeds: [Utils.createErrorEmbed('Error', 'Failed to save and publish panel changes.')]
        });
    }
}

async function handleEditButtonLabel(interaction, config, panelId, buttonIndex) {
    try {
        const panel = config.panels.find(p => p.panelId === panelId);
        if (!panel || !panel.buttons[buttonIndex]) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Button Not Found', 'The button could not be found.')],
                ephemeral: true
            });
        }

        const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId(`edit_button_label_${panelId}_${buttonIndex}`)
            .setTitle('Edit Button Label');

        const labelInput = new TextInputBuilder()
            .setCustomId('button_label')
            .setLabel('Button Label')
            .setStyle(TextInputStyle.Short)
            .setValue(panel.buttons[buttonIndex].label)
            .setMaxLength(80)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(labelInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    } catch (error) {
        console.error('Error in handleEditButtonLabel:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to show button label edit modal.')],
                ephemeral: true
            });
        }
    }
}

async function handleEditButtonStyle(interaction, config, panelId, buttonIndex) {
    try {
        const panel = config.panels.find(p => p.panelId === panelId);
        if (!panel || !panel.buttons[buttonIndex]) {
            return interaction.editReply({
                embeds: [Utils.createErrorEmbed('Button Not Found', 'The button could not be found.')]
            });
        }

        const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setTitle('🎨 Select Button Style')
            .setDescription(`Choose the style for button: **${panel.buttons[buttonIndex].label}**`)
            .setColor(parseInt(panel.color.replace('#', ''), 16) || 0x5865F2)
            .addFields([
                { name: 'Current Style', value: getButtonStyleName(panel.buttons[buttonIndex].style), inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`button_style_select_${panelId}_${buttonIndex}`)
            .setPlaceholder('Choose a button style...')
            .addOptions([
                {
                    label: 'Primary (Blue)',
                    description: 'Blue button style - most prominent',
                    value: '1',
                    default: panel.buttons[buttonIndex].style === 'Primary' || panel.buttons[buttonIndex].style === 1
                },
                {
                    label: 'Secondary (Gray)',
                    description: 'Gray button style - neutral appearance',
                    value: '2',
                    default: panel.buttons[buttonIndex].style === 'Secondary' || panel.buttons[buttonIndex].style === 2
                },
                {
                    label: 'Success (Green)',
                    description: 'Green button style - positive action',
                    value: '3',
                    default: panel.buttons[buttonIndex].style === 'Success' || panel.buttons[buttonIndex].style === 3
                },
                {
                    label: 'Danger (Red)',
                    description: 'Red button style - caution/important',
                    value: '4',
                    default: panel.buttons[buttonIndex].style === 'Danger' || panel.buttons[buttonIndex].style === 4
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.editReply({
            embeds: [embed],
            components: [row]
        });
    } catch (error) {
        console.error('Error in handleEditButtonStyle:', error);
        await interaction.editReply({
            embeds: [Utils.createErrorEmbed('Error', 'Failed to show button style selector.')]
        });
    }
}

async function handleEditButtonEmoji(interaction, config, panelId, buttonIndex) {
    try {
        const panel = config.panels.find(p => p.panelId === panelId);
        if (!panel || !panel.buttons[buttonIndex]) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Button Not Found', 'The button could not be found.')],
                ephemeral: true
            });
        }

        const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId(`edit_button_emoji_${panelId}_${buttonIndex}`)
            .setTitle('Edit Button Emoji');

        const emojiInput = new TextInputBuilder()
            .setCustomId('button_emoji')
            .setLabel('Button Emoji')
            .setStyle(TextInputStyle.Short)
            .setValue(panel.buttons[buttonIndex].emoji || '')
            .setPlaceholder('🎫 or leave empty for no emoji')
            .setMaxLength(10)
            .setRequired(false);

        const row = new ActionRowBuilder().addComponents(emojiInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    } catch (error) {
        console.error('Error in handleEditButtonEmoji:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to show button emoji edit modal.')],
                ephemeral: true
            });
        }
    }
}

async function handleEditButtonType(interaction, config, panelId, buttonIndex) {
    try {
        const panel = config.panels.find(p => p.panelId === panelId);
        if (!panel || !panel.buttons[buttonIndex]) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Button Not Found', 'The button could not be found.')],
                ephemeral: true
            });
        }

        const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId(`edit_button_type_${panelId}_${buttonIndex}`)
            .setTitle('Edit Ticket Type');

        const typeInput = new TextInputBuilder()
            .setCustomId('ticket_type')
            .setLabel('Ticket Type')
            .setStyle(TextInputStyle.Short)
            .setValue(panel.buttons[buttonIndex].ticketType)
            .setPlaceholder('general, support, bug, etc.')
            .setMaxLength(50)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(typeInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    } catch (error) {
        console.error('Error in handleEditButtonType:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to show ticket type edit modal.')],
                ephemeral: true
            });
        }
    }
}

async function handleRemoveButton(interaction, config, panelId, buttonIndex) {
    try {
        const panel = config.panels.find(p => p.panelId === panelId);
        if (!panel || !panel.buttons[buttonIndex]) {
            return interaction.editReply({
                embeds: [Utils.createErrorEmbed('Button Not Found', 'The button could not be found.')]
            });
        }

        const buttonToRemove = panel.buttons[buttonIndex];
        
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setTitle('🗑️ Confirm Button Removal')
            .setDescription(`Are you sure you want to remove this button?\n\n**Button:** ${buttonToRemove.label}\n**Type:** ${buttonToRemove.ticketType}\n\n⚠️ **This action cannot be undone!**`)
            .setColor(0xED4245);

        const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_remove_button_${panelId}_${buttonIndex}`)
                    .setLabel('Yes, Remove Button')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🗑️'),
                new ButtonBuilder()
                    .setCustomId(`panel_manage_buttons_${panelId}`)
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('❌')
            );

        await interaction.editReply({
            embeds: [embed],
            components: [confirmRow]
        });
    } catch (error) {
        console.error('Error in handleRemoveButton:', error);
        await interaction.editReply({
            embeds: [Utils.createErrorEmbed('Error', 'Failed to show button removal confirmation.')]
        });
    }
}

async function handleConfirmRemoveButton(interaction, config, panelId, buttonIndex, client) {
    try {
        const panel = config.panels.find(p => p.panelId === panelId);
        if (!panel || !panel.buttons[buttonIndex]) {
            return interaction.editReply({
                embeds: [Utils.createErrorEmbed('Button Not Found', 'The button could not be found.')]
            });
        }

        const removedButton = panel.buttons[buttonIndex];
        
        // Remove the button from the array
        panel.buttons.splice(buttonIndex, 1);
        
        // Save the configuration
        await config.save();

        // Update the actual panel message
        try {
            const channel = interaction.guild.channels.cache.get(panel.channelId);
            if (channel) {
                const message = await channel.messages.fetch(panel.messageId).catch(() => null);
                if (message) {
                    // Create the panel embed
                    const embed = Utils.createEmbed({
                        title: panel.title,
                        description: panel.description,
                        color: parseInt(panel.color.replace('#', ''), 16) || 0x5865F2,
                        footer: { text: `Panel ID: ${panel.panelId}` }
                    });

                    // Create button components using TicketManager
                    const ticketManager = client.ticketManager;
                    const components = ticketManager ? ticketManager.createButtonRows(panel.buttons) : [];
                    
                    await message.edit({ embeds: [embed], components });
                }
            }
        } catch (error) {
            console.error('Error updating panel message:', error);
        }

        // Show success message and return to button management interface
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setTitle('🔘 Manage Panel Buttons')
            .setDescription(`Managing buttons for panel: **${panel.title}**\n\nCurrent buttons: ${panel.buttons.length}\n\n✅ Button "**${removedButton.label}**" has been successfully removed.`)
            .setColor(parseInt(panel.color.replace('#', ''), 16) || 0x5865F2);

        if (panel.buttons.length > 0) {
            embed.addFields(
                panel.buttons.map((btn, index) => ({
                    name: `Button ${index + 1}: ${btn.label}`,
                    value: `Style: ${getButtonStyleName(btn.style)}${btn.emoji ? ` | Emoji: ${btn.emoji}` : ''}\nType: ${btn.ticketType}`,
                    inline: true
                }))
            );

            // Add a select menu to choose which button to edit
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`panel_select_button_${panelId}`)
                .setPlaceholder('Select a button to edit...')
                .addOptions(
                    panel.buttons.map((btn, index) => ({
                        label: `${btn.label} (${btn.ticketType})`,
                        description: `Edit button ${index + 1}`,
                        value: `${index}`,
                        emoji: btn.emoji || '🎫'
                    }))
                );

            const selectRow = new ActionRowBuilder().addComponents(selectMenu);

            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`panel_add_button_${panelId}`)
                        .setLabel('Add Button')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('➕')
                );

            const backRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`panel_customizer_back_${panelId}`)
                        .setLabel('Back to Panel Editor')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⬅️')
                );

            await interaction.editReply({
                embeds: [embed],
                components: [selectRow, actionRow, backRow]
            });
        } else {
            // No buttons left
            embed.setDescription(`Managing buttons for panel: **${panel.title}**\n\nThis panel has no buttons. Add a button to get started.`);
            
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`panel_add_button_${panelId}`)
                        .setLabel('Add Button')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('➕')
                );

            const backRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`panel_customizer_back_${panelId}`)
                        .setLabel('Back to Panel Editor')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⬅️')
                );

            await interaction.editReply({
                embeds: [embed],
                components: [actionRow, backRow]
            });
        }

    } catch (error) {
        console.error('Error in handleConfirmRemoveButton:', error);
        await interaction.editReply({
            embeds: [Utils.createErrorEmbed('Error', 'Failed to remove the button.')]
        });
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