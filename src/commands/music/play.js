const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song or playlist')
        .addStringOption(option =>
            option
                .setName('query')
                .setDescription('Song name, URL, or search query')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option
                .setName('source')
                .setDescription('Music source to search from')
                .setRequired(false)
                .addChoices(
                    { name: 'YouTube', value: 'youtube' },
                    { name: 'SoundCloud', value: 'soundcloud' },
                    { name: 'Spotify', value: 'spotify' }
                )
        )
        .addBooleanOption(option =>
            option
                .setName('next')
                .setDescription('Add to the front of the queue')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('shuffle')
                .setDescription('Shuffle the playlist if adding multiple songs')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const source = interaction.options.getString('source') || interaction.guildData.musicSettings.searchEngine;
        const playNext = interaction.options.getBoolean('next') || false;
        const shuffle = interaction.options.getBoolean('shuffle') || false;

        // Handle Spotify URLs - convert them to search queries
        let processedQuery = query;
        let processedSource = source;
        
        if (query.includes('open.spotify.com')) {
            // Check if it's a Spotify track or playlist
            const spotifyTrackMatch = query.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
            const spotifyPlaylistMatch = query.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
            const spotifyAlbumMatch = query.match(/open\.spotify\.com\/album\/([a-zA-Z0-9]+)/);
            
            if (spotifyTrackMatch || spotifyPlaylistMatch || spotifyAlbumMatch) {
                // Use Spotify source to resolve the track/playlist/album
                processedQuery = query; // Keep the Spotify URL for resolution
                processedSource = 'spotify'; // Force Spotify source for resolution
                
                let typeText = 'track';
                if (spotifyPlaylistMatch) typeText = 'playlist';
                else if (spotifyAlbumMatch) typeText = 'album';
                
                interaction.followUp({ 
                    content: `🎵 Converting Spotify ${typeText} to playable source...`, 
                    ephemeral: true 
                });
            } else {
                // Invalid Spotify URL
                const embed = Utils.createErrorEmbed(
                    'Invalid Spotify URL',
                    'The Spotify URL format is not supported. Please try copying the URL again.'
                );
                return interaction.editReply({ embeds: [embed] });
            }
        } else if (query.includes('youtube.com') && query.includes('list=')) {
            // This is a YouTube playlist URL
            interaction.followUp({ 
                content: '📋 Loading YouTube playlist...', 
                ephemeral: true 
            });
        }

        // Voice channel checks
        const voiceCheck = Utils.checkVoiceChannel(interaction.member);
        if (!voiceCheck.inVoice) {
            const embed = Utils.createErrorEmbed('Not in Voice Channel', voiceCheck.reason);
            return interaction.editReply({ embeds: [embed] });
        }

        const botVoiceCheck = Utils.checkBotVoicePermissions(voiceCheck.channel);
        if (!botVoiceCheck.canJoin) {
            const embed = Utils.createErrorEmbed('Cannot Join Voice Channel', botVoiceCheck.reason);
            return interaction.editReply({ embeds: [embed] });
        }

        // Get or create player
        let player = client.musicPlayer.getPlayer(interaction.guildId);
        
        if (!player) {
            player = await client.musicPlayer.create(
                interaction.guildId,
                voiceCheck.channel.id,
                interaction.channelId
            );
            
            if (!player) {
                const embed = Utils.createErrorEmbed(
                    'Connection Failed',
                    'Failed to connect to the voice channel. Please try again.'
                );
                return interaction.editReply({ embeds: [embed] });
            }
        } else {
            // Check if user is in the same voice channel as the bot
            if (player.voiceChannelId !== voiceCheck.channel.id) {
                const embed = Utils.createErrorEmbed(
                    'Different Voice Channel', 
                    'You need to be in the same voice channel as the bot to add songs.'
                );
                return interaction.editReply({ embeds: [embed] });
            }
        }

        try {
            // Search for the track(s)
            const result = await player.search(processedQuery, processedSource);
            
            client.logger.debug('Play command search result:', {
                loadType: result?.loadType,
                trackCount: result?.tracks?.length || 0,
                isPlaylist: result?.loadType === 'playlist',
                playlistName: result?.playlistInfo?.name || 'N/A',
                originalQuery: query
            });

            if (!result || !result.tracks.length) {
                let errorMessage = `No tracks found for: **${query}**\n\nTry:\n• Different search terms\n• Checking the URL\n• Using a different source`;
                
                // Special message for Spotify URLs
                if (query.includes('open.spotify.com')) {
                    errorMessage = `Could not resolve Spotify URL: **${query}**\n\nTry:\n• Copying the Spotify URL again\n• Searching by song name and artist instead\n• Checking if the content is available in your region`;
                }
                
                // Special message for YouTube playlists
                if (query.includes('youtube.com') && query.includes('list=')) {
                    errorMessage = `Could not load YouTube playlist: **${query}**\n\nTry:\n• Checking if the playlist is public\n• Using a different playlist URL\n• Playing individual tracks from the playlist`;
                }
                
                const embed = Utils.createErrorEmbed('No Results Found', errorMessage);
                return interaction.editReply({ embeds: [embed] });
            }

            // Handle different result types
            let addedTracks = [];
            let isPlaylist = false;

            if (result.loadType === 'playlist') {
                isPlaylist = true;
                const maxTracks = interaction.guildData.isPremium() ? 
                    interaction.guildData.musicSettings.maxPlaylistSize : 
                    Math.min(result.tracks.length, 50);

                // Add requester information to tracks
                addedTracks = result.tracks.slice(0, maxTracks).map(track => ({
                    ...track,
                    requester: interaction.user
                }));
                
                if (shuffle) {
                    addedTracks = addedTracks.sort(() => Math.random() - 0.5);
                }
            } else {
                addedTracks = [{
                    ...result.tracks[0],
                    requester: interaction.user
                }];
            }

            // Check queue size limits
            const currentQueueSize = player.size;
            const maxQueueSize = interaction.guildData.isPremium() ? 
                interaction.guildData.musicSettings.maxQueueSize : 
                Math.min(interaction.guildData.musicSettings.maxQueueSize, 100);

            if (currentQueueSize + addedTracks.length > maxQueueSize) {
                const embed = Utils.createErrorEmbed(
                    'Queue Full',
                    `Queue is full! Maximum size: ${maxQueueSize}\nCurrent size: ${currentQueueSize}\n\n${interaction.guildData.isPremium() ? '' : 'Upgrade to premium for larger queues!'}`
                );
                return interaction.editReply({ embeds: [embed] });
            }

            // Add tracks to queue
            if (playNext && addedTracks.length === 1) {
                player.addTrack(addedTracks[0], 0);
            } else {
                for (const track of addedTracks) {
                    player.addTrack(track);
                }
            }

            // Start playing if not already playing
            if (!player.isPlaying && !player.current) {
                await player.play();
            }

            // Update user statistics
            if (interaction.userData) {
                const firstTrack = result.tracks[0];
                interaction.userData.addToHistory({
                    title: firstTrack.info.title,
                    artist: firstTrack.info.author,
                    uri: firstTrack.info.uri, // This will be the playable URI (YouTube, etc.)
                    source: firstTrack.info.sourceName || processedSource, // Use the actual source of the resolved track
                    duration: firstTrack.info.length
                }, {
                    id: interaction.guildId,
                    name: interaction.guild.name
                });
                await interaction.userData.save();
            }

            // Create response embed
            const embed = await createPlayEmbed(result, addedTracks, isPlaylist, player, interaction);
            const components = createPlayComponents(player);

            await interaction.editReply({ embeds: [embed], components });

            // Log the action
            client.logger.music('play', {
                guildId: interaction.guildId,
                userId: interaction.user.id,
                query: query, // Use original query for logging
                source: processedSource,
                tracksAdded: addedTracks.length,
                isPlaylist
            });

        } catch (error) {
            client.logger.error('Error in play command:', error);
            
            const embed = Utils.createErrorEmbed(
                'Playback Error',
                'An error occurred while trying to play the requested track. Please try again.'
            );
            
            return interaction.editReply({ embeds: [embed] });
        }
    },

    async autocomplete(interaction, client) {
        const focusedValue = interaction.options.getFocused();
        
        if (!focusedValue || focusedValue.length < 2) {
            return interaction.respond([]);
        }

        // Set a timeout for autocomplete to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Autocomplete timeout')), 2000); // 2 second timeout
        });

        try {
            // Check if interaction is still valid and not responded to
            if (interaction.responded || interaction.deferred) {
                return;
            }

            // Race between autocomplete logic and timeout
            await Promise.race([
                this.performAutocomplete(interaction, client, focusedValue),
                timeoutPromise
            ]);

        } catch (error) {
            client.logger.error('Error in play autocomplete:', error);
            // Only try to respond with empty array if interaction is still valid
            try {
                if (!interaction.responded && !interaction.deferred) {
                    await interaction.respond([]);
                }
            } catch (respondError) {
                // Ignore errors when trying to respond - likely interaction expired
                client.logger.debug('Could not respond to autocomplete (interaction expired):', respondError.message);
            }
        }
    },

    async performAutocomplete(interaction, client, focusedValue) {
        // Get user's search history for autocomplete
        const userData = await Utils.getUserData(interaction.user.id);
        const choices = [];

        if (userData && userData.history.tracks.length > 0) {
            // Create a Set to track unique songs (by title + artist combination)
            const seenTracks = new Set();
            const uniqueTracks = [];

            // Filter and deduplicate tracks from history
            for (const track of userData.history.tracks) {
                const trackKey = `${track.title.toLowerCase()}-${track.artist.toLowerCase()}`;
                
                // Check if this track matches the search and hasn't been seen before
                if (!seenTracks.has(trackKey) && 
                    (track.title.toLowerCase().includes(focusedValue.toLowerCase()) ||
                     track.artist.toLowerCase().includes(focusedValue.toLowerCase()))) {
                    
                    seenTracks.add(trackKey);
                    
                    // For Spotify URIs, use the title and artist instead of the URI
                    let trackValue = track.uri;
                    if (track.uri && track.uri.includes('open.spotify.com')) {
                        trackValue = `${track.title} ${track.artist}`;
                    }
                    
                    uniqueTracks.push({
                        name: `🕒 ${track.title} - ${track.artist}`.substring(0, 100),
                        value: trackValue || `${track.title} ${track.artist}`,
                        // Add timestamp for sorting (most recent first)
                        timestamp: track.playedAt || 0
                    });
                    
                    // Limit to 15 unique tracks from history
                    if (uniqueTracks.length >= 15) break;
                }
            }

            // Sort by most recent first and take the top results
            const recentTracks = uniqueTracks
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 10)
                .map(({ name, value }) => ({ name, value }));

            choices.push(...recentTracks);
        }

        // If not enough results from history, add some popular suggestions
        if (choices.length < 8) {
            const popularSuggestions = [
                'Lofi Hip Hop Radio',
                'Chill Music Playlist',
                'Top 40 Pop Hits',
                'Gaming Music Mix',
                'Study Music Playlist',
                'Rock Classics',
                'Electronic Dance Music',
                'Indie Pop Mix',
                'Relaxing Piano Music',
                'Workout Music Mix'
            ].filter(suggestion => 
                suggestion.toLowerCase().includes(focusedValue.toLowerCase())
            ).slice(0, 8 - choices.length) // Only add what we need to reach 8 total
            .map(suggestion => ({
                name: `🎵 ${suggestion}`,
                value: suggestion
            }));

            choices.push(...popularSuggestions);
        }

        // Double-check interaction is still valid before responding
        if (!interaction.responded && !interaction.deferred) {
            await interaction.respond(choices.slice(0, 25));
        }
    }
};

async function createPlayEmbed(result, addedTracks, isPlaylist, player, interaction) {
    const track = result.tracks[0];
    const embed = new EmbedBuilder()
        .setColor(interaction.client.config.colors.music)
        .setTimestamp();

    if (isPlaylist) {
        embed
            .setTitle('📜 Playlist Added to Queue')
            .setDescription(`**${result.playlistInfo?.name || 'Unknown Playlist'}**\n\n${Utils.truncate(track.info.title, 50)} - ${Utils.truncate(track.info.author, 30)}`)
            .addFields(
                { name: '📊 Tracks Added', value: addedTracks.length.toString(), inline: true },
                { name: '⏱️ Total Duration', value: Utils.formatDuration(addedTracks.reduce((acc, t) => acc + (t.info.length || 0), 0)), inline: true },
                { name: '🎵 Queue Position', value: `${player.size - addedTracks.length + 1}-${player.size}`, inline: true }
            );
    } else {
        embed
            .setTitle('🎵 Added to Queue')
            .setDescription(`**${track.info.title}**\n${track.info.author}`)
            .addFields(
                { name: '⏱️ Duration', value: Utils.formatDuration(track.info.length || 0), inline: true },
                { name: '🎵 Queue Position', value: player.size.toString(), inline: true },
                { name: '🔊 Volume', value: `${player.volume}%`, inline: true }
            );
    }

    // Use thumbnail from track info if available
    if (track.info.artworkUrl) {
        embed.setThumbnail(track.info.artworkUrl);
    }

    embed.setFooter({
        text: `Requested by ${interaction.user.username} • ${Utils.getSourceEmoji(track.info.sourceName)} ${Utils.capitalize(track.info.sourceName)}`,
        iconURL: interaction.user.displayAvatarURL()
    });

    // Add now playing info if this is the first track
    if (player.size === 1 && !player.isPlaying) {
        embed.addFields({
            name: '▶️ Now Playing',
            value: 'This track will start playing now!',
            inline: false
        });
    }

    return embed;
}

function createPlayComponents(player) {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('play_pause')
                .setEmoji(player.isPlaying ? '⏸️' : '▶️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('skip')
                .setEmoji('⏭️')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('stop')
                .setEmoji('⏹️')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('shuffle')
                .setEmoji('🔀')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('loop')
                .setEmoji(player.loop === 'none' ? '➡️' : player.loop === 'track' ? '🔂' : '🔁')
                .setStyle(ButtonStyle.Secondary)
        );

    return [row];
}
