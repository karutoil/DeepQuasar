const Utils = require('../../../utils/utils');

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
    const queueCommand = require('../commands/queue');
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
            const queueCommand = require('../commands/queue');
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
        const searchCommand = require('../commands/search');
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

class MusicInteractionHandler {
    static async handleButtonInteraction(interaction, client) {
        const customId = interaction.customId;
        
        try {
            // Handle queue pagination buttons (queue_prev_X, queue_next_X)
            if (customId.startsWith('queue_prev_') || customId.startsWith('queue_next_')) {
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
                    return true;
                }
            }

            // Handle pagination buttons (legacy: page_prev, page_next, etc.)
            if (customId.startsWith('page_')) {
                await handlePaginationButton(interaction, client);
                return true;
            }

            // Handle music control buttons
            if (['play_pause', 'skip', 'stop', 'shuffle', 'loop'].includes(customId)) {
                await handleMusicControlButton(interaction, client);
                return true;
            }

            // Handle queue management buttons
            if (customId.startsWith('queue_')) {
                await handleQueueButton(interaction, client);
                return true;
            }

            // Handle search buttons
            if (customId.startsWith('search_')) {
                await handleSearchButton(interaction, client);
                return true;
            }

            return false;
        } catch (error) {
            client.logger.error(`Error handling music button interaction ${customId}:`, error);
            const embed = Utils.createErrorEmbed(
                'Music Button Error',
                'An error occurred while processing this music button interaction.'
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

module.exports = MusicInteractionHandler;