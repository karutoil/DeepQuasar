const Utils = require('../utils/utils');
const EmbedBuilderHandler = require('../utils/EmbedBuilderHandler');
const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function handlePanelCustomizeSelection(interaction, client) {
    try {
        const panelId = interaction.values[0];
        const TicketConfig = require('../schemas/TicketConfig');
        
        const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
        if (!config) {
            return interaction.update({
                embeds: [Utils.createErrorEmbed('Error', 'Ticket configuration not found.')],
                components: []
            });
        }

        const panel = config.panels.find(p => p.panelId === panelId);
        if (!panel) {
            return interaction.update({
                embeds: [Utils.createErrorEmbed('Error', 'Panel not found.')],
                components: []
            });
        }

        // Create live preview of the panel
        const previewEmbed = Utils.createEmbed({
            title: panel.title,
            description: panel.description,
            color: parseInt(panel.color.replace('#', ''), 16) || 0x5865F2,
            footer: { text: `Panel ID: ${panel.panelId} • LIVE PREVIEW` }
        });

        // Create preview buttons (disabled for preview)
        const previewRows = [];
        for (let i = 0; i < panel.buttons.length; i += 5) {
            const row = new ActionRowBuilder();
            const rowButtons = panel.buttons.slice(i, i + 5);
            
            rowButtons.forEach(btn => {
                const button = new ButtonBuilder()
                    .setCustomId(`preview_${btn.customId}`)
                    .setLabel(btn.label)
                    .setStyle(convertStyleToDiscord(btn.style))
                    .setDisabled(true);
                
                if (btn.emoji) {
                    button.setEmoji(btn.emoji);
                }
                
                row.addComponents(button);
            });
            
            previewRows.push(row);
        }

        // Create control panel
        const controlEmbed = Utils.createEmbed({
            title: '🎛️ Panel Customizer',
            description: `**Editing:** ${panel.title}\n**Panel ID:** \`${panel.panelId}\`\n\n` +
                        'Use the buttons below to modify your panel. Changes will be reflected in the preview above.',
            color: 0x9B59B6,
            fields: [
                {
                    name: '📝 Current Settings',
                    value: `**Title:** ${panel.title}\n**Description:** ${panel.description}\n**Color:** ${panel.color}\n**Buttons:** ${panel.buttons.length}`,
                    inline: false
                }
            ]
        });

        const controlRow1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`panel_edit_title_${panel.panelId}`)
                    .setLabel('Edit Title')
                    .setEmoji('📝')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`panel_edit_description_${panel.panelId}`)
                    .setLabel('Edit Description')
                    .setEmoji('📄')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`panel_edit_color_${panel.panelId}`)
                    .setLabel('Change Color')
                    .setEmoji('🎨')
                    .setStyle(ButtonStyle.Primary)
            );

        const controlRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`panel_manage_buttons_${panel.panelId}`)
                    .setLabel('Manage Buttons')
                    .setEmoji('🔘')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`panel_preview_${panel.panelId}`)
                    .setLabel('Refresh Preview')
                    .setEmoji('🔄')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`panel_save_changes_${panel.panelId}`)
                    .setLabel('Save & Publish')
                    .setEmoji('✅')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.update({
            content: '### 📺 **LIVE PREVIEW**',
            embeds: [previewEmbed, controlEmbed],
            components: [...previewRows, controlRow1, controlRow2]
        });

    } catch (error) {
        console.error('Error handling panel customize selection:', error);
        await interaction.update({
            embeds: [Utils.createErrorEmbed('Error', 'Failed to load panel customizer.')],
            components: []
        });
    }
}

// Duplicated from buttonInteractionHandler.js to avoid circular dependency
async function handleModLogEventToggle(interaction, client) {
    const ModLog = require('../schemas/ModLog');
    const ModLogManager = require('../utils/ModLogManager');

    // NOTE: The original interactionCreate.js had a potential bug here for select menus
    // where customId.startsWith('modlog_events_') was used to call this function,
    // but the function expects customId.replace('modlog_toggle_', '').
    // Assuming the intent is to toggle an event based on the customId.
    // This implementation assumes the customId will be in the format 'modlog_toggle_EVENTTYPE'
    // or 'modlog_events_EVENTTYPE' and extracts EVENTTYPE.
    const eventType = interaction.customId.replace(/modlog_(toggle|events)_/, '');
    const modLog = await ModLog.getOrCreate(interaction.guild.id);

    if (!modLog.enabled) {
        const embed = Utils.createErrorEmbed(
            'Modlog Not Enabled', 
            'Please use `/modlog setup` first to enable moderation logging.'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const currentState = modLog.events[eventType]?.enabled; // Use optional chaining for safety
    modLog.events[eventType] = modLog.events[eventType] || {}; // Ensure event object exists
    modLog.events[eventType].enabled = !currentState;
    await modLog.save();

    const displayName = ModLogManager.getEventDisplayName(eventType);
    const newState = !currentState ? 'enabled' : 'disabled';

    const embed = Utils.createSuccessEmbed(
        'Event Toggled',
        `**${displayName}** has been **${newState}**`
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleSearchSelection(interaction, client) {
    const selectedValues = interaction.values; // Array of selected indices as strings
    const userId = interaction.user.id;
    
    // Check if we have search results for this user
    if (!client.searchResults || !client.searchResults.has(userId)) {
        return interaction.reply({ 
            content: '❌ Search results have expired. Please search again.', 
            ephemeral: true 
        });
    }
    
    const searchData = client.searchResults.get(userId);
    // Validate all selected indices
    const validIndices = selectedValues
        .map(v => parseInt(v))
        .filter(idx => idx >= 0 && idx < searchData.tracks.length);
    if (validIndices.length === 0) {
        return interaction.reply({ 
            content: '❌ Invalid track selection.', 
            ephemeral: true 
        });
    }
    
    await interaction.deferReply({ ephemeral: true });
    
    try {
        // Check if user is still in the same voice channel
        if (!interaction.member.voice.channel || 
            interaction.member.voice.channel.id !== searchData.voiceChannelId) {
            return interaction.editReply({ 
                content: '❌ You need to be in the same voice channel where you started the search.' 
            });
        }
        
        // Create or get player
        const player = client.musicPlayerManager.createPlayer({
            guildId: searchData.guildId,
            voiceChannelId: searchData.voiceChannelId,
            textChannelId: searchData.textChannelId,
            autoPlay: true
        });
        
        // Connect to voice channel if not connected
        if (!player.connected) {
            await player.connect();
        }
        
        // Add all selected tracks to queue
        const addedTitles = [];
        for (const idx of validIndices) {
            const track = searchData.tracks[idx];
            player.queue.add(track);
            addedTitles.push(track.title);
        }
        
        // Start playback if not already playing
        if (!player.playing && !player.paused && player.queue.size > 0) {
            await player.play();
        }
        
        // Send confirmation
        await interaction.editReply({ 
            content: `✅ Added to queue: ${addedTitles.map(t => `**${t}**`).join(', ')}` 
        });
        
        // Clean up search results
        client.searchResults.delete(userId);
        
    } catch (error) {
        client.logger.error('Error handling search selection:', error);
        await interaction.editReply({ 
            content: '❌ Failed to add track(s) to queue. Please try again.' 
        });
    }
}

async function handleSettingsSelection(interaction, client) {
    // Settings selection logic
    await interaction.deferUpdate();
}

async function handleModLogCategorySelection(interaction, client) {
    const ModLog = require('../schemas/ModLog');
    const ModLogManager = require('../utils/ModLogManager');

    const category = interaction.values[0];
    const modLog = await ModLog.getOrCreate(interaction.guild.id);

    const eventCategories = {
        member: {
            name: 'Member Events',
            events: ['memberJoin', 'memberLeave', 'memberUpdate', 'memberBan', 'memberUnban', 'memberKick', 'memberTimeout']
        },
        message: {
            name: 'Message Events',
            events: ['messageDelete', 'messageUpdate', 'messageBulkDelete', 'messageReactionAdd', 'messageReactionRemove']
        },
        channel: {
            name: 'Channel Events',
            events: ['channelCreate', 'channelDelete', 'channelUpdate', 'channelPinsUpdate']
        },
        role: {
            name: 'Role Events',
            events: ['roleCreate', 'roleDelete', 'roleUpdate']
        },
        guild: {
            name: 'Guild Events',
            events: ['guildUpdate', 'emojiCreate', 'emojiDelete', 'emojiUpdate', 'stickerCreate', 'stickerDelete', 'stickerUpdate']
        },
        voice: {
            name: 'Voice Events',
            events: ['voiceStateUpdate']
        },
        other: {
            name: 'Other Events',
            events: ['userUpdate', 'presenceUpdate', 'inviteCreate', 'inviteDelete', 'threadCreate', 'threadDelete', 'threadUpdate']
        }
    };

    const categoryData = eventCategories[category];
    if (!categoryData) return;

    const embed = Utils.createInfoEmbed(
        `Configure ${categoryData.name}`,
        'Toggle events on/off for this category:'
    );

    const eventButtons = [];
    const events = categoryData.events;

    for (let i = 0; i < events.length; i += 5) {
        const row = new ActionRowBuilder();
        const chunk = events.slice(i, i + 5);
        
        for (const eventType of chunk) {
            const isEnabled = modLog.events[eventType]?.enabled;
            const displayName = ModLogManager.getEventDisplayName(eventType);
            
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`modlog_toggle_${eventType}`)
                    .setLabel(displayName)
                    .setStyle(isEnabled ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setEmoji(isEnabled ? '✅' : '❌')
            );
        }
        
        eventButtons.push(row);
    }

    // Add back button
    const backRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('modlog_back')
                .setLabel('Back to Categories')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔙')
        );

    eventButtons.push(backRow);

    await interaction.update({ embeds: [embed], components: eventButtons });
}

async function handleTempVCSelectMenu(interaction, client) {
    if (!client.tempVCManager) {
        return interaction.reply({
            content: '❌ Temp VC system is not available.',
            ephemeral: true
        });
    }

    try {
        const customId = interaction.customId;
        
        // Handle menu selection
        if (customId.includes('menu_')) {
            await client.tempVCManager.handleControlPanelInteraction(interaction);
            return;
        }
        
        // Handle other select menus
        await client.tempVCManager.controlHandlers.handleSelectMenuInteraction(interaction);
        
    } catch (error) {
        client.logger.error('Error handling temp VC select menu:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ An error occurred while processing your selection.',
                ephemeral: true
            });
        }
    }
}

async function handleSelectMenuInteraction(interaction, client) {
    const customId = interaction.customId;

    try {
        // Handle reminder select menu
        if (customId === 'reminder_select') {
            const Reminder = require('../schemas/Reminder');
            const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const reminderId = interaction.values[0];
            const reminder = await Reminder.findOne({ reminder_id: reminderId });
            if (!reminder) {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Reminder not found.',
                        components: [],
                        embeds: [],
                        ephemeral: true
                    });
                } else {
                    await interaction.editReply({
                        content: '❌ Reminder not found.',
                        components: [],
                        embeds: []
                    });
                }
                return;
            }
            const embed = new EmbedBuilder()
                .setTitle('⏰ Reminder Preview')
                .setDescription(reminder.task_description)
                .addFields(
                    { name: 'Time', value: `<t:${Math.floor(reminder.trigger_timestamp/1000)}:F>`, inline: true },
                    { name: 'Target', value: reminder.target_type === 'self' ? 'You (DM)' : reminder.target_type === 'user' ? `<@${reminder.target_id}>` : `<#${reminder.target_id}>`, inline: true }
                )
                .setFooter({ text: `ID: ${reminder.reminder_id}` })
                .setColor(0x5865F2);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`reminder_edit_${reminder.reminder_id}`)
                        .setLabel('Edit')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`reminder_delete_${reminder.reminder_id}`)
                        .setLabel('Delete')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.update({
                content: '',
                embeds: [embed],
                components: [row]
            });
            return;
        }

        // Handle embed builder select menus
        if (customId.startsWith('embed_select_')) {
            const handled = await EmbedBuilderHandler.handleSelectMenu(interaction);
            if (handled) return;
        }

        // Handle welcome embed builder select menus
        if (customId.startsWith('welcome_select_')) {
            const WelcomeEmbedHandler = require('../utils/WelcomeEmbedHandler');
            const handled = await WelcomeEmbedHandler.handleWelcomeSelectMenu(interaction);
            if (handled) return;
        }

        // Handle search result selection
        if (customId === 'search_select' || customId.startsWith('search_select_')) {
            await handleSearchSelection(interaction, client);
            return;
        }

        // Handle playlist search result selection
        if (customId === 'playlist_select') {
            const userId = interaction.user.id;
            if (!client.searchResults || !client.searchResults.has(userId)) {
                return interaction.reply({
                    content: '❌ Playlist search results have expired. Please search again.',
                    ephemeral: true
                });
            }
            const searchData = client.searchResults.get(userId);
            const selectedValue = interaction.values[0];
            const playlist = (searchData.playlists || []).find(pl => (pl.info?.url === selectedValue || pl.info?.identifier === selectedValue || String(searchData.playlists.indexOf(pl)) === selectedValue));
            if (!playlist) {
                return interaction.reply({
                    content: '❌ Could not find the selected playlist.',
                    ephemeral: true
                });
            }
            // Check voice channel
            if (!interaction.member.voice.channel || interaction.member.voice.channel.id !== searchData.voiceChannelId) {
                return interaction.reply({
                    content: '❌ You need to be in the same voice channel where you started the search.',
                    ephemeral: true
                });
            }
            await interaction.deferReply({ ephemeral: true });
            try {
                const player = await client.musicPlayerManager.createPlayer({
                    guildId: searchData.guildId,
                    voiceChannelId: searchData.voiceChannelId,
                    textChannelId: searchData.textChannelId,
                    autoPlay: true
                });
                if (!player.connected) {
                    await player.connect();
                }
                player.queue.add(playlist.tracks);
                if (!player.playing && !player.paused) {
                    await player.play();
                }
                await interaction.editReply({
                    content: `✅ Added playlist **${playlist.info?.name || 'Unknown'}** (${playlist.tracks?.length || 0} tracks) to the queue.`
                });
                client.searchResults.delete(userId);
            } catch (error) {
                client.logger.error('Error handling playlist selection:', error);
                await interaction.editReply({
                    content: '❌ Failed to add playlist to queue. Please try again.'
                });
            }
            return;
        }

        // Handle settings selection
        if (customId.startsWith('settings_')) {
            await handleSettingsSelection(interaction, client);
            return;
        }

        // Handle modlog configuration
        if (customId === 'modlog_category_select') {
            await handleModLogCategorySelection(interaction, client);
            return;
        }

        // Handle panel customizer selection
        if (customId === 'panel_customize_select') {
            await handlePanelCustomizeSelection(interaction, client);
            return;
        }

        // Handle panel button style selection
        if (customId === 'panel_button_style_select') {
            await handleButtonStyleSelection(interaction, client);
            return;
        }

        // Handle panel button selection for editing
        if (customId.startsWith('panel_select_button_')) {
            await handlePanelButtonSelection(interaction, client);
            return;
        }

        // Handle button style selection for individual buttons
        if (customId.startsWith('button_style_select_')) {
            await handleIndividualButtonStyleSelection(interaction, client);
            return;
        }

        if (customId.startsWith('modlog_events_')) {
            await handleModLogEventToggle(interaction, client);
            return;
        }

        // Handle temp VC select menus
        if (customId.startsWith('tempvc_')) {
            await handleTempVCSelectMenu(interaction, client);
            return;
        }

        // Handle LFG select menus
        if (customId.startsWith('lfg_')) {
            const LFGInteractionHandler = require('../modules/lfg/handlers/LFGInteractionHandler');
            const handled = await LFGInteractionHandler.handleSelectMenuInteraction(interaction);
            if (handled) return;
        }

    } catch (error) {
        client.logger.error(`Error handling select menu interaction ${customId}:`, error);

        // Try to provide a more user-friendly message for Discord API errors
        let userMessage = 'An error occurred while processing this selection.';
        if (error && error.name === 'HTTPError' && error.message && error.message.includes('Service Unavailable')) {
            userMessage = '❌ Discord is currently experiencing issues (Service Unavailable). Please try again in a moment.';
        }

        const errorEmbed = Utils.createErrorEmbed(
            'Selection Error',
            userMessage
        );

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        } catch (err2) {
            client.logger.error('Error sending error message to user:', err2);
        }
    }
}

// Helper function to convert numeric Discord.js style to schema string
function convertStyleToSchema(discordStyle) {
    const conversion = {
        1: 'Primary',
        2: 'Secondary',
        3: 'Success',
        4: 'Danger'
    };
    return conversion[discordStyle] || 'Primary';
}

// Helper function to convert schema string to Discord.js style
function convertStyleToDiscord(schemaStyle) {
    const conversion = {
        'Primary': ButtonStyle.Primary,
        'Secondary': ButtonStyle.Secondary,
        'Success': ButtonStyle.Success,
        'Danger': ButtonStyle.Danger
    };
    return conversion[schemaStyle] || ButtonStyle.Primary;
}

async function handleButtonStyleSelection(interaction, client) {
    const TicketConfig = require('../schemas/TicketConfig');
    
    try {
        await interaction.deferUpdate();
        
        const config = await TicketConfig.findOne({ guildId: interaction.guildId });
        if (!config) {
            return interaction.editReply({
                embeds: [Utils.createErrorEmbed('Configuration Error', 'Ticket system is not configured for this server.')],
                components: []
            });
        }

        const selectedStyle = parseInt(interaction.values[0]);
        config.buttonStyle = selectedStyle;
        await config.save();

        const styleNames = {
            1: 'Primary (Blue)',
            2: 'Secondary (Gray)',  
            3: 'Success (Green)',
            4: 'Danger (Red)'
        };

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed(
                '✅ Button Style Updated',
                `Button style has been updated to: **${styleNames[selectedStyle]}**`
            )],
            components: []
        });
        
    } catch (error) {
        client.logger.error('Error in button style selection handler:', error);
        await interaction.editReply({
            embeds: [Utils.createErrorEmbed(
                'Selection Error',
                'An error occurred while updating the button style.'
            )],
            components: []
        });
    }
}

async function handlePanelButtonSelection(interaction, client) {
    try {
        const customId = interaction.customId;
        const selectedButtonIndex = parseInt(interaction.values[0]);
        
        // Extract panel ID from customId (panel_select_button_panelId)
        const panelId = customId.replace('panel_select_button_', '');
        
        const TicketConfig = require('../schemas/TicketConfig');
        const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
        
        if (!config) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Configuration Error', 'Ticket system is not configured for this server.')],
                ephemeral: true
            });
        }

        const panel = config.panels.find(p => p.panelId === panelId);
        if (!panel) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Panel Not Found', 'The panel could not be found.')],
                ephemeral: true
            });
        }

        const selectedButton = panel.buttons[selectedButtonIndex];
        if (!selectedButton) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Button Not Found', 'The selected button could not be found.')],
                ephemeral: true
            });
        }

        // Show button edit interface for the selected button
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setTitle(`✏️ Edit Button: ${selectedButton.label}`)
            .setDescription(`Editing button for panel: **${panel.title}**`)
            .setColor(parseInt(panel.color.replace('#', ''), 16) || 0x5865F2)
            .addFields([
                {
                    name: '🏷️ Current Label',
                    value: `\`${selectedButton.label}\``,
                    inline: true
                },
                {
                    name: '🎨 Current Style',
                    value: getButtonStyleName(selectedButton.style),
                    inline: true
                },
                {
                    name: '❓ Current Emoji',
                    value: selectedButton.emoji || 'None',
                    inline: true
                },
                {
                    name: '🎫 Ticket Type',
                    value: selectedButton.ticketType,
                    inline: true
                },
                {
                    name: '📋 Button Index',
                    value: `${selectedButtonIndex + 1} of ${panel.buttons.length}`,
                    inline: true
                }
            ]);

        const editRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`panel_edit_button_label_${panelId}_${selectedButtonIndex}`)
                    .setLabel('Edit Label')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏷️'),
                new ButtonBuilder()
                    .setCustomId(`panel_edit_button_style_${panelId}_${selectedButtonIndex}`)
                    .setLabel('Edit Style')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎨'),
                new ButtonBuilder()
                    .setCustomId(`panel_edit_button_emoji_${panelId}_${selectedButtonIndex}`)
                    .setLabel('Edit Emoji')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('❓')
            );

        const typeRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`panel_edit_button_type_${panelId}_${selectedButtonIndex}`)
                    .setLabel('Edit Ticket Type')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎫'),
                new ButtonBuilder()
                    .setCustomId(`panel_remove_button_${panelId}_${selectedButtonIndex}`)
                    .setLabel('Remove Button')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🗑️')
            );

        const backRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`panel_manage_buttons_${panelId}`)
                    .setLabel('Back to Button Management')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⬅️')
            );

        await interaction.update({
            embeds: [embed],
            components: [editRow, typeRow, backRow]
        });

    } catch (error) {
        client.logger.error('Error in panel button selection handler:', error);
        const errorEmbed = Utils.createErrorEmbed(
            'Selection Error',
            'An error occurred while processing the button selection.'
        );
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

function getButtonStyleName(style) {
    const styles = {
        1: 'Primary (Blue)',
        2: 'Secondary (Gray)',  
        3: 'Success (Green)',
        4: 'Danger (Red)'
    };
    return styles[style] || 'Primary (Blue)';
}

async function handleIndividualButtonStyleSelection(interaction, client) {
    try {
        const customId = interaction.customId;
        const selectedStyle = parseInt(interaction.values[0]);
        
        // Extract panel ID and button index from customId (button_style_select_panelId_buttonIndex)
        const parts = customId.split('_');
        if (parts.length < 5) {
            throw new Error('Invalid customId format');
        }
        
        const panelId = parts[3];
        const buttonIndex = parseInt(parts[4]);
        
        const TicketConfig = require('../schemas/TicketConfig');
        const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
        
        if (!config) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Configuration Error', 'Ticket system is not configured for this server.')],
                ephemeral: true
            });
        }

        const panel = config.panels.find(p => p.panelId === panelId);
        if (!panel || !panel.buttons[buttonIndex]) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Button Not Found', 'The button could not be found.')],
                ephemeral: true
            });
        }

        // Update the button style with schema-compatible string
        const selectedStyleValue = parseInt(interaction.values[0]);
        panel.buttons[buttonIndex].style = convertStyleToSchema(selectedStyleValue);
        await config.save();

        const styleNames = {
            1: 'Primary (Blue)',
            2: 'Secondary (Gray)',
            3: 'Success (Green)',
            4: 'Danger (Red)'
        };

        await interaction.update({
            embeds: [Utils.createSuccessEmbed(
                '✅ Button Style Updated',
                `Button "**${panel.buttons[buttonIndex].label}**" style has been updated to: **${styleNames[selectedStyleValue]}**`
            )],
            components: []
        });

        // After a short delay, return to button edit interface
        setTimeout(async () => {
            try {
                // Go back to individual button edit interface
                const buttonInteractionHandler = require('./buttonInteractionHandler');
                // Simulate returning to the button edit interface by calling the select handler again
                const mockSelectInteraction = {
                    customId: `panel_select_button_${panelId}`,
                    values: [buttonIndex.toString()],
                    update: interaction.editReply.bind(interaction),
                    guild: interaction.guild
                };
                await handlePanelButtonSelection(mockSelectInteraction, client);
            } catch (error) {
                console.error('Error returning to button edit interface:', error);
            }
        }, 2000);
        
    } catch (error) {
        client.logger.error('Error in individual button style selection handler:', error);
        const errorEmbed = Utils.createErrorEmbed(
            'Selection Error',
            'An error occurred while updating the button style.'
        );
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

module.exports = { handleSelectMenuInteraction };
