const Utils = require('../utils/utils');
const { ButtonStyle, ButtonBuilder } = require('discord.js');
const LFGInteractionHandler = require('./lfg/LFGInteractionHandler');

// Helper function for progress bar (not used in original interactionCreate.js, but kept for completeness if it was intended)
function createProgressBar(current, total, length = 20) {
    if (!total || total === 0) return '▬'.repeat(length);
    
    const progress = Math.round((current / total) * length);
    const progressBar = '▬'.repeat(Math.max(0, progress - 1)) + '🔘' + '▬'.repeat(Math.max(0, length - progress));
    
    return progressBar;
}

async function handlePaginationButton(interaction, client) {
    await interaction.deferUpdate();
    
    const customId = interaction.customId;
    const originalMessage = interaction.message;
    
    // Extract current page from the embed footer if it exists
    let currentPage = 0;
    let totalPages = 1;
    
    if (originalMessage.embeds[0]?.footer?.text) {
        const footerText = originalMessage.embeds[0].footer.text;
        const pageMatch = footerText.match(/Page (\d+) of (\d+)/);
        if (pageMatch) {
            currentPage = parseInt(pageMatch[1]) - 1; // Convert to 0-based
            totalPages = parseInt(pageMatch[2]);
        }
    }
    
    // Calculate new page based on button pressed
    let newPage = currentPage;
    switch (customId) {
        case 'page_first':
            newPage = 0;
            break;
        case 'page_prev':
            newPage = Math.max(0, currentPage - 1);
            break;
        case 'page_next':
            newPage = Math.min(totalPages - 1, currentPage + 1);
            break;
        case 'page_last':
            newPage = totalPages - 1;
            break;
    }
    
    // If the page hasn't changed, don't do anything
    if (newPage === currentPage) {
        return;
    }
    
    // For queue pagination, we need to re-run the queue show command with the new page
    if (originalMessage.embeds[0]?.title?.includes('Music Queue')) {
        await handleQueuePagination(interaction, client, newPage);
    }
}

async function handleQueuePagination(interaction, client, page) {
    const player = client.musicPlayerManager.getPlayer(interaction.guildId);
    
    // Moonlink.js V4: player.queue is an object, use .tracks or .toArray()
    const queueArray = player && player.queue && typeof player.queue.toArray === 'function'
        ? player.queue.toArray()
        : (player && Array.isArray(player.queue) ? player.queue : []);
    const hasQueue = queueArray && queueArray.length > 0;
    const hasCurrent = !!player?.current;

    if (!player || (!hasQueue && !hasCurrent)) {
        const embed = Utils.createInfoEmbed(
            'Empty Queue',
            'The queue is currently empty. Use `/play` to add some music!'
        );
        return interaction.update({ embeds: [embed], components: [] });
    }

    // Import the queue command to use the createQueueDisplay function
    const queueCommand = require('../commands/music/queue');
    // Pass the correct queue array to the display function if needed
    const { embed, components } = queueCommand.createQueueDisplay(client, player, page, queueArray);
    
    await interaction.update({ embeds: [embed], components });
}

async function handleMusicControlButton(interaction, client) {
    const player = client.musicPlayerManager.getPlayer(interaction.guildId);
    
    if (!player) {
        const embed = Utils.createErrorEmbed(
            'No Player',
            'There is no music player active in this server.'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if user is in the same voice channel
    const voiceCheck = Utils.checkVoiceChannel(interaction.member);
    if (!voiceCheck.inVoice || voiceCheck.channel.id !== player.voiceChannelId) {
        const embed = Utils.createErrorEmbed(
            'Wrong Voice Channel',
            'You need to be in the same voice channel as the bot to control music.'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const customId = interaction.customId;

    switch (customId) {
        case 'play_pause':
            if (player.playing) {
                await player.pause();
                await interaction.reply({ content: '⏸️ Paused the music.', ephemeral: true });
            } else {
                await player.resume();
                await interaction.reply({ content: '▶️ Resumed the music.', ephemeral: true });
            }
            break;

        case 'skip':
            await player.skip();
            await interaction.reply({ content: '⏭️ Skipped the current track.', ephemeral: true });
            break;

        case 'stop':
            await player.destroy();
            await interaction.reply({ content: '⏹️ Stopped the music and cleared the queue.', ephemeral: true });
            break;

        case 'shuffle':
            player.queue.shuffle();
            await interaction.reply({ content: '🔀 Shuffled the queue.', ephemeral: true });
            break;

        case 'loop':
            const currentLoop = player.loop;
            const nextLoop = currentLoop === 'none' ? 'track' : 
                           currentLoop === 'track' ? 'queue' : 'none';
            player.setLoop(nextLoop);
            
            const loopEmojis = { none: '➡️', track: '🔂', queue: '🔁' };
            await interaction.reply({ 
                content: `${loopEmojis[nextLoop]} Loop mode: ${nextLoop}`, 
                ephemeral: true 
            });
            break;
    }
}

async function handleQueueButton(interaction, client) {
    const player = client.musicPlayerManager.getPlayer(interaction.guildId);
    
    if (!player) {
        const embed = Utils.createErrorEmbed(
            'No Player',
            'There is no music player active in this server.'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if user is in the same voice channel
    const voiceCheck = Utils.checkVoiceChannel(interaction.member);
    if (!voiceCheck.inVoice || voiceCheck.channel.id !== player.voiceChannelId) {
        const embed = Utils.createErrorEmbed(
            'Wrong Voice Channel',
            'You need to be in the same voice channel as the bot to control music.'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const customId = interaction.customId;
    let actionMessage = '';

    switch (customId) {
        case 'queue_shuffle':
            player.queue.shuffle();
            actionMessage = '🔀 Shuffled the queue.';
            break;

        case 'queue_clear':
            player.queue.clear();
            actionMessage = '🗑️ Cleared the queue.';
            break;

        case 'queue_loop':
            const currentLoop = player.loop;
            const nextLoop = currentLoop === 'none' ? 'track' : 
                           currentLoop === 'track' ? 'queue' : 'none';
            player.setLoop(nextLoop);
            
            const loopEmojis = { none: '➡️', track: '🔂', queue: '🔁' };
            actionMessage = `${loopEmojis[nextLoop]} Loop mode: ${nextLoop}`;
            break;

        default:
            await interaction.deferUpdate();
            return;
    }

    // Update the original message with the new queue state
    try {
        // Get the updated player
        const updatedPlayer = client.musicPlayerManager.getPlayer(interaction.guildId);
        
        if (!updatedPlayer || ((!updatedPlayer.queue || !updatedPlayer.queue.length) && !updatedPlayer.current)) {
            // Queue is empty after clearing
            const embed = Utils.createInfoEmbed(
                'Empty Queue',
                'The queue is currently empty. Use `/play` to add some music!'
            );
            await interaction.update({ embeds: [embed], components: [] });
        } else {
            // Import the queue command to use the createQueueDisplay function
            const queueCommand = require('../commands/music/queue');
            const { embed, components } = queueCommand.createQueueDisplay(client, updatedPlayer, 0);
            
            await interaction.update({ embeds: [embed], components });
        }

        // Send ephemeral confirmation message
        await interaction.followUp({ content: actionMessage, ephemeral: true });
        
    } catch (error) {
        client.logger.error('Error updating queue display:', error);
        // Fallback to simple response if update fails
        await interaction.reply({ content: actionMessage, ephemeral: true });
    }
}

async function handleSettingsButton(interaction, client) {
    // Settings button logic
    await interaction.deferUpdate();
}

async function handleSearchButton(interaction, client) {
    const customId = interaction.customId;
    
    // Check if user is in voice channel
    const voiceCheck = Utils.checkVoiceChannel(interaction.member);
    if (!voiceCheck.inVoice) {
        const embed = Utils.createErrorEmbed(
            'Not in Voice Channel',
            'You need to be in a voice channel to use music commands.'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
        switch (customId) {
            case 'search_play_all':
                await handleSearchPlayAll(interaction, client);
                break;
            case 'search_queue_all':
                await handleSearchQueueAll(interaction, client);
                break;
            case 'search_refresh':
                await handleSearchRefresh(interaction, client);
                break;
            default:
                await interaction.deferUpdate();
                break;
        }
    } catch (error) {
        client.logger.error('Error handling search button:', error);
        const embed = Utils.createErrorEmbed(
            'Search Error',
            'An error occurred while processing your request.'
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

async function handleSearchPlayAll(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    
    // Check if user is in voice channel
    const voiceCheck = Utils.checkVoiceChannel(interaction.member);
    if (!voiceCheck.inVoice) {
        return interaction.editReply({ content: 'You need to be in a voice channel to play music.' });
    }
    
    // Extract search results from the original message
    const embed = interaction.message.embeds[0];
    if (!embed || !embed.description) {
        return interaction.editReply({ content: 'Could not find search results to play.' });
    }

    // Get the original search query from the embed
    const descriptionLines = embed.description.split('\n');
    const queryLine = descriptionLines.find(line => line.startsWith('Search for:'));
    const sourceLine = descriptionLines.find(line => line.startsWith('Source:'));
    
    if (!queryLine) {
        return interaction.editReply({ content: 'Could not determine what to search for.' });
    }

    const query = queryLine.replace('Search for: **', '').replace('**', '');
    const source = sourceLine ? sourceLine.replace('Source: **', '').replace('**', '').toLowerCase() : 'youtube';
    
    try {
        // Get or create player using Moonlink.js V4
        let player = client.musicPlayerManager.getPlayer(interaction.guildId);
        
        if (!player) {
            player = client.musicPlayerManager.createPlayer({
                guildId: interaction.guildId,
                voiceChannelId: voiceCheck.channel.id,
                textChannelId: interaction.channelId,
                autoPlay: true
            });
            await player.connect();
        } else {
            // Check if user is in the same voice channel as the bot
            if (player.voiceChannelId !== voiceCheck.channel.id) {
                return interaction.editReply({ content: 'You need to be in the same voice channel as the bot to add songs.' });
            }
        }

        // Search for tracks using Moonlink.js V4
        const result = await client.musicPlayerManager.search(query, { source });
        if (!result || !result.tracks || result.tracks.length === 0) {
            return interaction.editReply({ content: 'No tracks found for the search query.' });
        }

        // Add requester info to all tracks
        const requester = {
            id: interaction.user.id,
            username: interaction.user.username,
            discriminator: interaction.user.discriminator
        };
        const tracksToAdd = result.tracks.map(track => ({
            ...track,
            requester
        }));

        // Add tracks to queue
        player.queue.add(tracksToAdd);

        // Start playing if not already playing
        if (!player.playing && !player.paused && player.queue.size > 0) {
            await player.play();
        }
        
        await interaction.editReply({ 
            content: `🎵 Added ${tracksToAdd.length} track${tracksToAdd.length !== 1 ? 's' : ''} to the queue and started playing!` 
        });
        
    } catch (error) {
        client.logger.error('Error in handleSearchPlayAll:', error);
        await interaction.editReply({ content: 'Failed to play the search results.' });
    }
}

async function handleSearchQueueAll(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    
    // Check if user is in voice channel
    const voiceCheck = Utils.checkVoiceChannel(interaction.member);
    if (!voiceCheck.inVoice) {
        return interaction.editReply({ content: 'You need to be in a voice channel to queue music.' });
    }
    
    // Extract search results from the original message
    const embed = interaction.message.embeds[0];
    if (!embed || !embed.description) {
        return interaction.editReply({ content: 'Could not find search results to queue.' });
    }

    // Get the original search query from the embed
    const descriptionLines = embed.description.split('\n');
    const queryLine = descriptionLines.find(line => line.startsWith('Search for:'));
    const sourceLine = descriptionLines.find(line => line.startsWith('Source:'));
    
    if (!queryLine) {
        return interaction.editReply({ content: 'Could not determine what to search for.' });
    }

    const query = queryLine.replace('Search for: **', '').replace('**', '');
    const source = sourceLine ? sourceLine.replace('Source: **', '').replace('**', '').toLowerCase() : 'youtube';
    
    try {
        // Get or create player using Moonlink.js V4
        let player = client.musicPlayerManager.getPlayer(interaction.guildId);
        
        if (!player) {
            player = client.musicPlayerManager.createPlayer({
                guildId: interaction.guildId,
                voiceChannelId: voiceCheck.channel.id,
                textChannelId: interaction.channelId,
                autoPlay: false
            });
            await player.connect();
        } else {
            // Check if user is in the same voice channel as the bot
            if (player.voiceChannelId !== voiceCheck.channel.id) {
                return interaction.editReply({ content: 'You need to be in the same voice channel as the bot to add songs.' });
            }
        }

        // Search for tracks using Moonlink.js V4
        const result = await client.musicPlayerManager.search(query, { source });
        if (!result || !result.tracks || result.tracks.length === 0) {
            return interaction.editReply({ content: 'No tracks found for the search query.' });
        }

        // Add requester info to all tracks
        const requester = {
            id: interaction.user.id,
            username: interaction.user.username,
            discriminator: interaction.user.discriminator
        };
        const tracksToAdd = result.tracks.map(track => ({
            ...track,
            requester
        }));

        // Add tracks to queue (but don't start playing if nothing is currently playing)
        player.queue.add(tracksToAdd);
        
        await interaction.editReply({ 
            content: `➕ Added ${tracksToAdd.length} track${tracksToAdd.length !== 1 ? 's' : ''} to the queue!` 
        });
        
    } catch (error) {
        client.logger.error('Error in handleSearchQueueAll:', error);
        await interaction.editReply({ content: 'Failed to queue the search results.' });
    }
}

async function handleSearchRefresh(interaction, client) {
    await interaction.deferUpdate();
    
    // Re-run the search with the same parameters
    const embed = interaction.message.embeds[0];
    if (!embed || !embed.description) {
        return;
    }

    const descriptionLines = embed.description.split('\n');
    const queryLine = descriptionLines.find(line => line.startsWith('Search for:'));
    const sourceLine = descriptionLines.find(line => line.startsWith('Source:'));
    const typeLine = descriptionLines.find(line => line.startsWith('Type:'));
    
    if (!queryLine) return;

    const query = queryLine.replace('Search for: **', '').replace('**', '');
    const source = sourceLine ? sourceLine.replace('Source: **', '').replace('**', '').toLowerCase() : 'youtube';
    const type = typeLine ? typeLine.replace('Type: **', '').replace('**', '').toLowerCase() : 'track';

    try {
        const searchCommand = require('../commands/music/search');
        const searchResults = await searchCommand.performSearch(client, query, source, type, 10);
        
        if (!searchResults || searchResults.length === 0) {
            const newEmbed = Utils.createInfoEmbed(
                'No Results Found',
                `No ${type === 'all' ? 'content' : type + 's'} found for "${query}" on ${source === 'all' ? 'any source' : source}.`
            );
            return interaction.editReply({ embeds: [newEmbed], components: [] });
        }

        const voiceCheck = Utils.checkVoiceChannel(interaction.member);
        const newEmbed = searchCommand.createSearchEmbed(query, source, type, searchResults, voiceCheck.inVoice);
        const newComponents = searchCommand.createSearchComponents(searchResults, voiceCheck.inVoice);

        await interaction.editReply({ embeds: [newEmbed], components: newComponents });
    } catch (error) {
        client.logger.error('Error refreshing search:', error);
    }
}

async function handleModLogEventToggle(interaction, client) {
    const ModLog = require('../schemas/ModLog');
    const ModLogManager = require('../utils/ModLogManager');

    const eventType = interaction.customId.replace('modlog_toggle_', '');
    const modLog = await ModLog.getOrCreate(interaction.guild.id);

    if (!modLog.enabled) {
        const embed = Utils.createErrorEmbed(
            'Modlog Not Enabled', 
            'Please use `/modlog setup` first to enable moderation logging.'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const currentState = modLog.events[eventType].enabled;
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

async function handleModLogButton(interaction, client) {
    const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
    
    if (interaction.customId === 'modlog_back') {
        // Return to category selection
        const embed = Utils.createInfoEmbed(
            'Modlog Configuration',
            'Select a category to configure event settings:'
        );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('modlog_category_select')
            .setPlaceholder('Choose a category to configure')
            .addOptions([
                {
                    label: 'Member Events',
                    description: 'Join, leave, ban, kick, timeout, etc.',
                    value: 'member',
                    emoji: '👥'
                },
                {
                    label: 'Message Events',
                    description: 'Delete, edit, bulk delete, reactions',
                    value: 'message',
                    emoji: '💬'
                },
                {
                    label: 'Channel Events',
                    description: 'Create, delete, update channels',
                    value: 'channel',
                    emoji: '📋'
                },
                {
                    label: 'Role Events',
                    description: 'Create, delete, update roles',
                    value: 'role',
                    emoji: '🎭'
                },
                {
                    label: 'Guild Events',
                    description: 'Server updates, emojis, stickers',
                    value: 'guild',
                    emoji: '🏠'
                },
                {
                    label: 'Voice Events',
                    description: 'Voice channel join/leave/move',
                    value: 'voice',
                    emoji: '🔊'
                },
                {
                    label: 'Other Events',
                    description: 'Invites, threads, integrations, etc.',
                    value: 'other',
                    emoji: '⚙️'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }
    
    if (interaction.customId.startsWith('modlog_toggle_')) {
        await handleModLogEventToggle(interaction, client);
    }
}

// Ticket interaction handlers
async function handleTicketButton(interaction, client) {
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
}

async function handleTicketDeleteConfirmation(interaction, client) {
    try {
        const ticketId = interaction.customId.replace('confirm_delete_', '');
        const Ticket = require('../schemas/Ticket');
        const TicketConfig = require('../schemas/TicketConfig');
        
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

// Temp VC interaction handlers
async function handleTempVCButton(interaction, client) {
    if (!client.tempVCManager) {
        return interaction.reply({
            content: '❌ Temp VC system is not available.',
            ephemeral: true
        });
    }

    try {
        const customId = interaction.customId;
        
        // Handle delete confirmation
        if (customId.includes('delete_confirm')) {
            await client.tempVCManager.controlHandlers.handleDeleteConfirmation(interaction);
            return;
        }
        
        // Handle delete cancellation
        if (customId.includes('delete_cancel')) {
            await client.tempVCManager.controlHandlers.handleDeleteCancellation(interaction);
            return;
        }
        
        // Handle reset confirmation
        if (customId.includes('reset_confirm')) {
            await client.tempVCManager.controlHandlers.handleResetConfirmation(interaction);
            return;
        }
        
        // Handle reset cancellation
        if (customId.includes('reset_cancel')) {
            await client.tempVCManager.controlHandlers.handleResetCancellation(interaction);
            return;
        }
        
        // Handle unban confirmation
        if (customId.includes('unban_confirm')) {
            await client.tempVCManager.controlHandlers.handleUnbanConfirmation(interaction);
            return;
        }
        
        // Handle unban cancellation
        if (customId.includes('unban_cancel')) {
            await client.tempVCManager.controlHandlers.handleUnbanCancellation(interaction);
            return;
        }
        
        // Handle other control panel actions
        await client.tempVCManager.handleControlPanelInteraction(interaction);
        
    } catch (error) {
        client.logger.error('Error handling temp VC button:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ An error occurred while processing your request.',
                ephemeral: true
            });
        }
    }
}

async function handleButtonInteraction(interaction, client) {
    // Always define customId at the top for use in all branches and in catch
    const customId = interaction.customId;
    try {
        // Handle LFG button interactions first
        const lfgHandled = await LFGInteractionHandler.handleButtonInteraction(interaction);
        if (lfgHandled) return;

        // Remove reminder select menu handler from here.
        // It should be handled in the selectMenuHandler file.

        // Reminder Edit Handler
        if (customId.startsWith('reminder_edit_')) {
            const reminderId = customId.replace('reminder_edit_', '');
            const Reminder = require('../schemas/Reminder');
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
            const reminder = await Reminder.findOne({ reminder_id: reminderId });
            if (!reminder) {
                await interaction.reply({
                    content: '❌ Reminder not found.',
                    ephemeral: true
                });
                return;
            }
            // Show modal to edit the reminder task description
            const modal = new ModalBuilder()
                .setCustomId(`reminder_edit_modal_${reminderId}`)
                .setTitle('Edit Reminder');

            const taskInput = new TextInputBuilder()
                .setCustomId('reminder_task_description')
                .setLabel('Task Description')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(reminder.task_description)
                .setMaxLength(200)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(taskInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
            return;
        }

        // Reminder Delete Handler
        if (customId.startsWith('reminder_delete_')) {
            const reminderId = customId.replace('reminder_delete_', '');
            const Reminder = require('../schemas/Reminder');
            const reminder = await Reminder.findOne({ reminder_id: reminderId });
            if (!reminder) {
                await interaction.reply({
                    content: '❌ Reminder not found.',
                    ephemeral: true
                });
                return;
            }
            await Reminder.deleteOne({ reminder_id: reminderId });
            // Cancel scheduled timer if any
            if (client.reminderManager) {
                client.reminderManager.cancelReminder(reminderId);
            }
            await interaction.update({
                content: '🗑️ Reminder deleted.',
                embeds: [],
                components: []
            });
            return;
        }
        // Handle embed builder buttons
        if (customId.startsWith('embed_')) {
            const embedCommand = client.commands.get('embed');
            if (embedCommand && typeof embedCommand.handleBuilderInteraction === 'function') {
                await embedCommand.handleBuilderInteraction(interaction);
                return;
            } else {
                const errorEmbed = Utils.createErrorEmbed(
                    'Handler Error',
                    'Embed builder handler is not available.'
                );
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
        }

        // Handle embed builder buttons
        if (customId.startsWith('embed_')) {
            const embedCommand = client.commands.get('embed');
            if (embedCommand && typeof embedCommand.handleBuilderInteraction === 'function') {
                await embedCommand.handleBuilderInteraction(interaction);
                return;
            } else {
                const errorEmbed = Utils.createErrorEmbed(
                    'Handler Error',
                    'Embed builder handler is not available.'
                );
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }
        }

        // Handle welcome embed builder buttons
        if (customId.startsWith('welcome_embed_')) {
            const WelcomeEmbedHandler = require('../utils/WelcomeEmbedHandler');
            const handled = await WelcomeEmbedHandler.handleWelcomeEmbedInteraction(interaction);
            if (handled) return;
        }

        // Handle queue pagination buttons (queue_prev_X, queue_next_X)
        if (customId.startsWith('queue_prev_') || customId.startsWith('queue_next_')) {
            // Extract the page number from the customId
            const match = customId.match(/queue_(prev|next)_(\d+)/);
            if (match) {
                let page = parseInt(match[2], 10);
                page = match[1] === 'prev' ? Math.max(1, page - 1) : page + 1;
                // Call the /queue command's execute function for button navigation
                const queueCommand = client.commands.get('queue');
                if (queueCommand && typeof queueCommand.execute === 'function') {
                    // Patch interaction.options to simulate a slash command option
                    interaction.options = {
                        getInteger: (name) => name === 'page' ? page : null
                    };
                    // Mark as button interaction
                    interaction.isButton = () => true;
                    await queueCommand.execute(interaction, client);
                }
                return;
            }
        }

        // Handle pagination buttons (legacy: page_prev, page_next, etc.)
        if (customId.startsWith('page_')) {
            await handlePaginationButton(interaction, client);
            return;
        }

        // Handle music control buttons
        if (['play_pause', 'skip', 'stop', 'shuffle', 'loop'].includes(customId)) {
            await handleMusicControlButton(interaction, client);
            return;
        }

        // Handle queue management buttons
        if (customId.startsWith('queue_')) {
            await handleQueueButton(interaction, client);
            return;
        }

        // Handle search buttons
        if (customId.startsWith('search_')) {
            await handleSearchButton(interaction, client);
            return;
        }

        // Handle settings buttons
        if (customId.startsWith('settings_')) {
            await handleSettingsButton(interaction, client);
            return;
        }

        // Handle modlog buttons
        if (customId.startsWith('modlog_')) {
            await handleModLogButton(interaction, client);
            return;
        }

        // Handle ticket buttons
        if (customId.startsWith('ticket_')) {
            await handleTicketButton(interaction, client);
            return;
        }

        // Handle dashboard buttons
        if (
            customId === 'dashboard_panels' ||
            customId === 'dashboard_staff' ||
            customId === 'dashboard_settings' ||
            customId === 'dashboard_logs' ||
            customId === 'dashboard_analytics' ||
            customId === 'dashboard_refresh'
        ) {
            await interaction.deferUpdate();
            // Feature: Show a modal or embed for each dashboard button
            if (customId === 'dashboard_panels') {
                // Show panel list and quick links
                const panelCommand = client.commands.get('panel');
                if (panelCommand && typeof panelCommand.listPanels === 'function') {
                    await panelCommand.listPanels(interaction);
                } else {
                    await interaction.followUp({
                        embeds: [Utils.createErrorEmbed('Handler Error', 'Panel command handler not found.')],
                        ephemeral: true
                    });
                }
                return;
            }
            if (customId === 'dashboard_staff') {
                // Show staff roles and quick management info
                const configCommand = client.commands.get('tickets');
                if (configCommand && typeof configCommand.manageStaff === 'function') {
                    // Simulate 'list' action for staff roles
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
                return;
            }
            if (customId === 'dashboard_settings') {
                // Show current ticket system settings
                const configCommand = client.commands.get('tickets');
                if (configCommand && typeof configCommand.showConfig === 'function') {
                    await configCommand.showConfig(interaction);
                } else {
                    await interaction.followUp({
                        embeds: [Utils.createErrorEmbed('Handler Error', 'Settings handler not found.')],
                        ephemeral: true
                    });
                }
                return;
            }
            if (customId === 'dashboard_logs') {
                // Show a simple embed for logs (feature stub)
                await interaction.followUp({
                    embeds: [Utils.createInfoEmbed(
                        'Ticket Logs',
                        'Log viewing is not yet implemented. Check your configured log channel for ticket events.'
                    )],
                    ephemeral: true
                });
                return;
            }
            if (customId === 'dashboard_analytics') {
                // Show the analytics embed from the dashboard command
                const dashboardCommand = client.commands.get('dashboard');
                if (dashboardCommand && typeof dashboardCommand.getTicketAnalytics === 'function') {
                    const analytics = await dashboardCommand.getTicketAnalytics(interaction.guild.id);

                    // Fetch member display names for top agents
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
                                    `📁 **Archived:** ${analytics.statusCounts.archived}`,
                                inline: false
                            },
                            {
                                name: 'Top Agents (Assigned Tickets)',
                                value: topAgentsText,
                                inline: false
                            },
                            {
                                name: 'Ticket Types',
                                value: analytics.types.length > 0
                                    ? analytics.types.map(t => `• **${t._id || 'Unknown'}**: ${t.count}`).join('\n')
                                    : 'No data',
                                inline: true
                            },
                            {
                                name: 'Priorities',
                                value: analytics.priorities.length > 0
                                    ? analytics.priorities.map(p => `• **${p._id || 'Unknown'}**: ${p.count}`).join('\n')
                                    : 'No data',
                                inline: true
                            },
                            {
                                name: 'Average Close Time',
                                value: analytics.avgCloseTime
                                    ? `${analytics.avgCloseTime} hours`
                                    : 'N/A',
                                inline: true
                            },
                            {
                                name: 'Tag Usage',
                                value: analytics.tags.length > 0
                                    ? analytics.tags.map(tag => `• **${tag._id || 'Unknown'}**: ${tag.count}`).join('\n')
                                    : 'No tags used',
                                inline: true
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
                return;
            }
            if (customId === 'dashboard_refresh') {
                // Refresh the dashboard view
                const dashboardCommand = client.commands.get('dashboard');
                if (dashboardCommand) {
                    await dashboardCommand.execute(interaction);
                }
                return;
            }
        }

        // Handle ticket confirmation buttons
        if (customId.startsWith('confirm_delete_')) {
            await handleTicketDeleteConfirmation(interaction, client);
            return;
        }

        // Handle temp VC buttons
        if (customId.startsWith('tempvc_')) {
            await handleTempVCButton(interaction, client);
            return;
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
            return;
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
            customId === 'panel_button_edit_back'
        ) {
            await handlePanelCustomizerButton(interaction, client);
            return;
        }

    } catch (error) {
        // customId is always defined at the top, but fallback just in case
        const safeCustomId = typeof customId !== 'undefined' ? customId : '[unknown]';
        client.logger.error(`Error handling button interaction ${safeCustomId}:`, error);
        
        const errorEmbed = Utils.createErrorEmbed(
            'Button Error',
            'An error occurred while processing this button interaction.'
        );

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

async function handlePanelCustomizerButton(interaction, client) {
    const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
    const TicketConfig = require('../schemas/TicketConfig');
    
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
                // Handle different formats:
                // panel_manage_buttons_panelId
                // panel_preview_panelId 
                // panel_save_changes_panelId
                // panel_edit_action_panelId
                // panel_edit_button_action_panelId_buttonIndex
                // panel_remove_button_panelId_buttonIndex
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
                    // Format: panel_edit_button_action_panelId_buttonIndex
                    action = `edit_button_${parts[3]}`;
                    panelId = parts[4];
                    buttonIndex = parseInt(parts[5]);
                } else if (parts[1] === 'remove' && parts[2] === 'button' && parts.length >= 5) {
                    // Format: panel_remove_button_panelId_buttonIndex
                    action = 'remove_button';
                    panelId = parts[3];
                    buttonIndex = parseInt(parts[4]);
                } else if (parts[0] === 'confirm' && parts[1] === 'remove' && parts[2] === 'button' && parts.length >= 5) {
                    // Format: confirm_remove_button_panelId_buttonIndex
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
                    // Format: panel_edit_action (global)
                    action = parts[2];
                }
            }
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
                    const panelCommand = require('../commands/tickets/panel');
                    // Use interaction.update to update the message, not deferReply/editReply
                    await panelCommand.showPanelCustomizer(interaction, panel, config);
                    return;
                }
            }
            
            // Fallback: show available panels or error
            if (config.panels && config.panels.length > 0) {
                await interaction.update({
                    embeds: [Utils.createEmbed({
                        title: '🎛️ Select a Panel to Customize',
                        description: `Available panels:\n\n${config.panels.map(p => `• **${p.title}** (ID: \`${p.panelId}\`)`).join('\n')}\n\nUse \`/panel customize <panel_id>\` to customize a specific panel.`,
                        color: 0x5865F2
                    })],
                    components: []
                });
            } else {
                await interaction.update({
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
            case 'edit_button_label':
                await handleEditButtonLabel(interaction, config, panelId, buttonIndex);
                break;
            case 'edit_button_style':
                await handleEditButtonStyle(interaction, config, panelId, buttonIndex);
                break;
            case 'edit_button_emoji':
                await handleEditButtonEmoji(interaction, config, panelId, buttonIndex);
                break;
            case 'edit_button_type':
                await handleEditButtonType(interaction, config, panelId, buttonIndex);
                break;
            case 'remove_button':
                await handleRemoveButton(interaction, config, panelId, buttonIndex);
                break;
            case 'confirm_remove_button':
                await handleConfirmRemoveButton(interaction, config, panelId, buttonIndex);
                break;
            case 'add_button':
            case 'edit_buttons':
                await interaction.editReply({
                    embeds: [Utils.createEmbed({
                        title: '🚧 Feature Coming Soon',
                        description: `The "${action.replace('_', ' ')}" feature is currently under development.\n\nFor now, you can manually edit panel buttons using the panel configuration files.`,
                        color: 0xFFB84D
                    })]
                });
                break;
            default:
                await interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Unknown Action', 'The requested customization action is not supported.')]
                });
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
        const panelCommand = require('../commands/tickets/panel');
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

        // Update the actual panel message in Discord
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

        // Create the updated panel embed and buttons
        const embed = Utils.createEmbed({
            title: panel.title,
            description: panel.description,
            color: parseInt(panel.color.replace('#', ''), 16),
            footer: { text: `Panel ID: ${panel.panelId}` }
        });

        const panelCommand = require('../commands/tickets/panel');
        const rows = panelCommand.createButtonRows(panel.buttons);
        
        // Update the message
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

async function handleConfirmRemoveButton(interaction, config, panelId, buttonIndex) {
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

module.exports = { handleButtonInteraction, handleModLogEventToggle };
