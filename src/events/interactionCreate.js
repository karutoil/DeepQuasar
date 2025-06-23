const Utils = require('../utils/utils');
const EmbedBuilderHandler = require('../utils/EmbedBuilderHandler');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            await handleSlashCommand(interaction, client);
        }
        
        // Handle autocomplete
        else if (interaction.isAutocomplete()) {
            await handleAutocomplete(interaction, client);
        }
        
        // Handle button interactions
        else if (interaction.isButton()) {
            await handleButtonInteraction(interaction, client);
        }
        
        // Handle select menu interactions
        else if (interaction.isAnySelectMenu()) {
            await handleSelectMenuInteraction(interaction, client);
        }
        
        // Handle modal submissions
        else if (interaction.isModalSubmit()) {
            await handleModalSubmit(interaction, client);
        }
    }
};

async function handleSlashCommand(interaction, client) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
        const embed = Utils.createErrorEmbed(
            'Command Not Found',
            'This command is not available or has been disabled.'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
        // Check if command is in a guild
        if (!interaction.inGuild()) {
            const embed = Utils.createErrorEmbed(
                'Server Only',
                'This command can only be used in a server.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Get guild and user data
        const guildData = await Utils.getGuildData(interaction.guildId, interaction.guild.name);
        const userData = await Utils.getUserData(
            interaction.user.id, 
            interaction.user.username, 
            interaction.user.discriminator
        );

        // Check permissions
        const permissionCheck = await Utils.checkPermissions(interaction, command.permissions || []);
        if (!permissionCheck.hasPermission) {
            const embed = Utils.createErrorEmbed(
                'Insufficient Permissions',
                permissionCheck.reason
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check cooldown
        const cooldownTime = guildData.isPremium() ? 
            client.config.bot.premiumCommandCooldown : 
            client.config.bot.commandCooldown;
            
        const cooldownCheck = Utils.checkCooldown(
            client, 
            interaction.user.id, 
            interaction.commandName, 
            cooldownTime
        );
        
        if (cooldownCheck.onCooldown) {
            const embed = Utils.createWarningEmbed(
                'Command Cooldown',
                `Please wait ${cooldownCheck.timeLeft} seconds before using this command again.`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if command is disabled in this guild
        if (guildData.commandSettings.disabledCommands.includes(interaction.commandName)) {
            const embed = Utils.createErrorEmbed(
                'Command Disabled',
                'This command has been disabled in this server.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if command is restricted to specific channels
        if (guildData.commandSettings.commandChannels.length > 0) {
            if (!guildData.commandSettings.commandChannels.includes(interaction.channelId)) {
                const channels = guildData.commandSettings.commandChannels
                    .map(id => `<#${id}>`)
                    .join(', ');
                    
                const embed = Utils.createWarningEmbed(
                    'Wrong Channel',
                    `This command can only be used in: ${channels}`
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        // Attach data to interaction for command use
        interaction.guildData = guildData;
        interaction.userData = userData;

        // Execute the command
        await command.execute(interaction, client);

        // Log command usage
        client.logger.command(
            interaction.user,
            interaction.guild,
            interaction.commandName,
            interaction.options.data
        );

        // Update statistics
        guildData.incrementStats('commands');
        userData.stats.commandsUsed += 1;
        userData.stats.lastActive = new Date();

        // Save updated data
        await Promise.all([
            guildData.save(),
            userData.save()
        ]);

    } catch (error) {
        client.logger.error(`Error executing command ${interaction.commandName}:`, error);

        const errorEmbed = Utils.createErrorEmbed(
            'Command Error',
            'An error occurred while executing this command. The developers have been notified.'
        );

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

async function handleAutocomplete(interaction, client) {
    const command = client.commands.get(interaction.commandName);

    if (!command || !command.autocomplete) {
        return;
    }

    try {
        // Check if interaction is still valid
        if (interaction.responded || interaction.deferred) {
            return;
        }

        await command.autocomplete(interaction, client);
    } catch (error) {
        // Suppress 'Unknown interaction' errors (DiscordAPIError[10062])
        if (error?.code === 10062 || (error?.message && error.message.includes('Unknown interaction'))) {
            client.logger.debug(`Suppressed Unknown interaction error in autocomplete for ${interaction.commandName}`);
            return;
        }
        client.logger.error(`Error in autocomplete for ${interaction.commandName}:`, error);
        // Try to respond with empty array if interaction is still valid
        try {
            if (!interaction.responded && !interaction.deferred) {
                await interaction.respond([]);
            }
        } catch (respondError) {
            // Ignore errors - interaction likely expired
            client.logger.debug(`Could not respond to autocomplete for ${interaction.commandName}: ${respondError.message}`);
        }
    }
}

async function handleButtonInteraction(interaction, client) {
    const customId = interaction.customId;

    try {
        // Handle embed builder buttons
        if (customId.startsWith('embed_')) {
            // This is handled in the embed builder command itself
            return;
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

        // Handle ticket confirmation buttons
        if (customId.startsWith('confirm_delete_')) {
            await handleTicketDeleteConfirmation(interaction, client);
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

    } catch (error) {
        client.logger.error(`Error handling button interaction ${customId}:`, error);
        
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

async function handleSelectMenuInteraction(interaction, client) {
    const customId = interaction.customId;

    try {
        // Handle embed builder select menus
        if (customId.startsWith('embed_select_')) {
            const handled = await EmbedBuilderHandler.handleSelectMenu(interaction);
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

// Helper function for progress bar
function createProgressBar(current, total, length = 20) {
    if (!total || total === 0) return '▬'.repeat(length);
    
    const progress = Math.round((current / total) * length);
    const progressBar = '▬'.repeat(Math.max(0, progress - 1)) + '🔘' + '▬'.repeat(Math.max(0, length - progress));
    
    return progressBar;
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
    const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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

async function handleModalSubmit(interaction, client) {
    try {
        const customId = interaction.customId;
        
        // Handle embed builder modals
        if (customId.startsWith('embed_modal_')) {
            const handled = await EmbedBuilderHandler.handleModalSubmit(interaction);
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
