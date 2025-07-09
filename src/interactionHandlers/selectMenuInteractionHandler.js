const Utils = require('../utils/utils');
const EmbedBuilderHandler = require('../utils/EmbedBuilderHandler');
const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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

        if (customId.startsWith('modlog_events_')) {
            await handleModLogEventToggle(interaction, client);
            return;
        }

        // Handle temp VC select menus
        if (customId.startsWith('tempvc_')) {
            await handleTempVCSelectMenu(interaction, client);
            return;
        }

    } catch (error) {
        client.logger.error(`Error handling select menu interaction ${customId}:`, error);
        
        const errorEmbed = Utils.createErrorEmbed(
            'Selection Error',
            'An error occurred while processing this selection.'
        );

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

module.exports = { handleSelectMenuInteraction };