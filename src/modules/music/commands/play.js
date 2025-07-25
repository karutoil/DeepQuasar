const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../../schemas/User');

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

        // Music module toggle check
        if (interaction.guildData && interaction.guildData.musicEnabled === false) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#ED4245')
                    .setTitle('❌ Music Disabled')
                    .setDescription('The music module is currently disabled on this server. An admin can enable it with `/settings music-toggle state:on`.')],
                ephemeral: true
            });
        }

        const query = interaction.options.getString('query');
        const source = interaction.options.getString('source') || interaction.guildData?.musicSettings?.searchEngine || 'youtube';
        const playNext = interaction.options.getBoolean('next') || false;
        const shuffle = interaction.options.getBoolean('shuffle') || false;

        // Check if music system is operational
        if (!client.musicPlayerManager.isOperational()) {
            const health = client.musicPlayerManager.getConnectionHealth();
            let description = '❌ Music system is temporarily unavailable.';
            
            if (health.connecting > 0) {
                description = '🔄 Music system is reconnecting. Please wait a moment and try again.';
            } else if (health.disconnected > 0) {
                description = '⚠️ Music server is disconnected. Attempting to reconnect...';
            }
            
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Connection Issue')
                    .setDescription(description)
                ]
            });
        }

        // Check if user is in a voice channel
        if (!interaction.member.voice.channel) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ You need to join a voice channel first!')
                ]
            });
        }

        const voiceChannel = interaction.member.voice.channel;

        // Check bot permissions
        const permissions = client.musicPlayerManager.getVoicePermissions(voiceChannel, interaction.guild.members.me);
        if (!permissions.connect || !permissions.speak) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ I need `Connect` and `Speak` permissions in that voice channel!')
                ]
            });
        }

        // Create or get player
        const player = await client.musicPlayerManager.createPlayer({
            guildId: interaction.guild.id,
            voiceChannelId: voiceChannel.id,
            textChannelId: interaction.channel.id,
            autoPlay: true
        });

        // Connect to voice channel with retry logic
        if (!player.connected) {
            try {
                await player.connect();
                // Wait a moment for the connection to be established
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                client.logger.warn('First connection attempt failed, retrying...', error);
                
                // Retry connection once more
                try {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                    await player.connect();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (retryError) {
                    client.logger.error('Connection retry failed:', retryError);
                    return interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('#ff0000')
                            .setDescription('❌ Unable to connect to the voice channel. The music server may be temporarily unavailable. Please try again in a moment.')
                        ]
                    });
                }
            }
        }

        // Search for tracks
        const searchResult = await client.musicPlayerManager.search({
            query: query,
            source: source,
            requester: interaction.user.id
        });

        // Handle search results
        if (!searchResult.tracks.length) {
            // Check if this was due to connection issues
            if (searchResult.loadType === 'error' && searchResult.error?.includes('server') || searchResult.error?.includes('connection')) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#ff9500')
                        .setTitle('⚠️ Connection Issue')
                        .setDescription('❌ Unable to search due to music server connectivity issues. Please try again in a moment.')
                    ]
                });
            }
            
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ No results found!')
                ]
            });
        }

        let addedTracks = 0;
        let embed;
        let isPlaylist = false;
        let tracksToAdd = [];

        // Normalize loadType for Moonlink.js v4.44.4
        let loadType = searchResult.loadType;
        if (loadType === 'PLAYLIST_LOADED') loadType = 'playlist';
        if (loadType === 'TRACK_LOADED') loadType = 'track';
        if (loadType === 'SEARCH_RESULT') loadType = 'search';
        if (loadType === 'NO_MATCHES') loadType = 'empty';

        switch (loadType) {
            case 'playlist':
                isPlaylist = true;
                tracksToAdd = searchResult.tracks;
                if (shuffle) tracksToAdd = shuffleArray([...tracksToAdd]);

                // Check queue limits
                {
                    const maxQueueSize = interaction.guildData?.premium ? 
                        client.config.bot.premiumMaxQueueSize : 
                        client.config.bot.maxQueueSize;

                    if (player.queue.size + tracksToAdd.length > maxQueueSize) {
                        const allowedTracks = maxQueueSize - player.queue.size;
                        if (allowedTracks <= 0) {
                            return interaction.editReply({
                                embeds: [new EmbedBuilder()
                                    .setColor('#ff0000')
                                    .setDescription(`❌ Queue is full! Maximum ${maxQueueSize} tracks allowed.`)
                                ]
                            });
                        }
                        tracksToAdd = tracksToAdd.slice(0, allowedTracks);
                    }
                }

                // Add tracks to queue
                if (playNext) {
                    // Add to front of queue (reverse order so first track is at front)
                    for (let i = tracksToAdd.length - 1; i >= 0; i--) {
                        player.queue.add(tracksToAdd[i], 0);
                    }
                } else {
                    player.queue.add(tracksToAdd);
                }

                addedTracks = tracksToAdd.length;
                break;

            case 'search':
            case 'track':
                tracksToAdd = [searchResult.tracks[0]];

                // Check queue limit
                {
                    const queueLimit = client.config.queueLimit || 100; // Centralized queue limit
                    if (player.queue.size >= queueLimit) {
                        return interaction.editReply({
                            embeds: [new EmbedBuilder()
                                .setColor('#ff0000')
                                .setDescription(`❌ Queue limit of ${queueLimit} reached. Please remove some tracks.`)
                            ]
                        });
                    }
                }

                // Add track to queue
                if (playNext) {
                    player.queue.add(tracksToAdd[0], 0);
                } else {
                    player.queue.add(tracksToAdd[0]);
                }

                addedTracks = 1;
                break;

            case 'empty':
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription('❌ No matches found for your query!')
                    ]
                });

            case 'error':
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription(`❌ Error loading track: ${searchResult.error || 'Unknown error'}`)
                    ]
                });
        }

        // Helper to create a classic-style play embed
        async function createClassicPlayEmbed({ searchResult, addedTracks, isPlaylist, player, interaction, playNext, shuffle }) {
            const Utils = require('../../../utils/utils');
            const user = interaction.user;
            const track = addedTracks[0] || searchResult.tracks[0];
            const playlistInfo = searchResult.playlistInfo || {};
            const source = (track.sourceName || track.source || track.origin || 'unknown').toLowerCase();
            const sourceEmoji = Utils.getSourceEmoji(source);
            const volume = player.volume || 100;
            const queuePos = playNext ? 1 : player.queue.size;
            const artwork = track.thumbnail || track.artworkUrl || null;
            const isPremium = interaction.guildData?.premium || false;

            const embed = new EmbedBuilder()
                .setColor('#9B00FF')
                .setTimestamp();

            if (isPlaylist) {
                // Playlist embed
                const totalDuration = addedTracks.reduce((acc, t) => acc + (t.duration || t.info?.length || 0), 0);
                embed
                    .setTitle('📜 Playlist Added to Queue')
                    .setDescription(`**${playlistInfo.name || 'Unknown Playlist'}**\n\n${Utils.truncate(track.title || track.info?.title, 50)} - ${Utils.truncate(track.author || track.info?.author, 30)}`)
                    .addFields(
                        { name: '📊 Tracks Added', value: addedTracks.length.toString(), inline: true },
                        { name: '⏱️ Total Duration', value: Utils.formatDuration(totalDuration), inline: true },
                        { name: '🎵 Queue Position', value: `${player.queue.size - addedTracks.length + 1}-${player.queue.size}`, inline: true }
                    );
                if (shuffle) {
                    embed.addFields({ name: '🔀 Shuffled', value: 'Playlist order was shuffled', inline: true });
                }
            } else {
                // Single track embed
                embed
                    .setTitle('🎵 Added to Queue')
                    .setDescription(`**[${track.title || track.info?.title || 'Unknown Title'}](${track.uri || track.url || track.info?.uri || '#'})**\n${track.author || track.info?.author || 'Unknown Artist'}`)
                    .addFields(
                        { name: '⏱️ Duration', value: Utils.formatDuration(track.duration || track.info?.length), inline: true },
                        { name: '🎵 Queue Position', value: queuePos.toString(), inline: true },
                        { name: '🔊 Volume', value: `${volume}%`, inline: true }
                    );
                // Fix: If no valid URL, show plain text instead of a broken link
                if (!track.uri && !track.url && !track.info?.uri) {
                    embed.setDescription(`**${track.title || track.info?.title || 'Unknown Title'}**\n${track.author || track.info?.author || 'Unknown Artist'}`);
                }
            }

            if (artwork) {
                embed.setThumbnail(artwork);
            }

            embed.setFooter({
                text: `Requested by ${user.username} • ${sourceEmoji} ${Utils.capitalize(source)}`,
                iconURL: user.displayAvatarURL()
            });

            // If this is the first track and not playing, add now playing info
            if (player.queue.size === 1 && !player.playing && !player.current) {
                embed.addFields({
                    name: '▶️ Now Playing',
                    value: 'This track will start playing now!',
                    inline: false
                });
            }

            return embed;
        }

        // Only build embed if tracks were added
        if (addedTracks > 0) {
            // Use beautiful embed for play confirmation
            if (isPlaylist) {
                embed = client.musicPlayerManager.createBeautifulEmbed({
                    title: 'Playlist Added to Queue',
                    description: `**${searchResult.playlistInfo?.name || 'Unknown Playlist'}**\n\n${tracksToAdd[0]?.title || 'Unknown'} - ${tracksToAdd[0]?.author || 'Unknown'}`,
                    color: '#9B00FF',
                    fields: [
                        { name: '📊 Tracks Added', value: tracksToAdd.length.toString(), inline: true },
                        { name: '⏱️ Total Duration', value: client.musicPlayerManager.formatDuration(tracksToAdd.reduce((acc, t) => acc + (t.duration || 0), 0)), inline: true },
                        { name: '🎵 Queue Position', value: `${player.queue.size - tracksToAdd.length + 1}-${player.queue.size}`, inline: true },
                        ...(shuffle ? [{ name: '🔀 Shuffled', value: 'Playlist order was shuffled', inline: true }] : [])
                    ],
                    thumbnail: tracksToAdd[0]?.thumbnail,
                    footer: { text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() }
                });
            } else {
                const track = tracksToAdd[0];
                embed = client.musicPlayerManager.createBeautifulEmbed({
                    title: 'Added to Queue',
                    description: `**[${track.title || 'Unknown Title'}](${track.uri || '#'})**\n${track.author || 'Unknown Artist'}`,
                    color: '#9B00FF',
                    fields: [
                        { name: '⏱️ Duration', value: client.musicPlayerManager.formatDuration(track.duration), inline: true },
                        { name: '🎵 Queue Position', value: playNext ? '1' : player.queue.size.toString(), inline: true },
                        { name: '🔊 Volume', value: `${player.volume || 100}%`, inline: true }
                    ],
                    thumbnail: track.thumbnail,
                    footer: { text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() }
                });
            }
        }

        // Start playback if not already playing
        if ((!player.playing && !player.paused && player.queue.size > 0) || (!player.current && player.queue.size > 0)) {
            await player.play();
        }

        // After adding tracks to queue, save to user history
        try {
            let userData = await User.findOne({ userId: interaction.user.id });
            if (!userData) {
                userData = await User.create({
                    userId: interaction.user.id,
                    username: interaction.user.username,
                    discriminator: interaction.user.discriminator
                });
            }
            // Save each track (for playlist, save all; for single, save one)
            const tracksToSave = Array.isArray(tracksToAdd) ? tracksToAdd : [tracksToAdd];
            for (const track of tracksToSave) {
                userData.addToHistory({
                    title: track.title,
                    artist: track.author || track.artist || track.uploader || 'Unknown',
                    uri: track.uri || track.url,
                    source: track.sourceName || track.source || track.origin || 'unknown',
                    duration: track.duration || track.info?.length || 0
                }, {
                    id: interaction.guild.id,
                    name: interaction.guild.name
                });
            }
            await userData.save();
        } catch (err) {
            client.logger?.warn?.(`Failed to save play history for user ${interaction.user.id}:`, err);
        }

        if (embed) {
            return interaction.editReply({ embeds: [embed] });
        }
    },

    async autocomplete(interaction, client) {
        const focusedValue = interaction.options.getFocused();
        if (focusedValue.length < 2) {
            return interaction.respond([]);
        }

        try {
            let choices = [];

            // Get history choices
            const UserModel = require('../../../schemas/User');
            const userData = await UserModel.findOne({ userId: interaction.user.id });
            if (userData && userData.history && userData.history.tracks.length > 0) {
                const seen = new Set();
                const historyChoices = userData.history.tracks
                    .filter(track => track.title && track.title.toLowerCase().includes(focusedValue.toLowerCase()))
                    .filter(track => {
                        const key = `${track.title}|${track.artist}|${track.uri}`;
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    })
                    .slice(0, 5)
                    .map(track => ({
                        name: `🕘 [History] ${track.title} - ${track.artist}`.slice(0, 100),
                        value: track.uri || track.title
                    }));
                choices.push(...historyChoices);
            }

            // Get live search suggestions
            if (client.musicPlayerManager.isOperational()) {
                const searchResult = await client.musicPlayerManager.search({
                    query: focusedValue,
                    source: 'youtube',
                    requester: interaction.user.id
                });
                const searchChoices = searchResult.tracks.slice(0, 10).map(track => ({
                    name: `🔎 [Suggest] ${track.title} - ${track.author}`.slice(0, 100),
                    value: track.url || track.uri || track.identifier || track.title || 'unknown'
                })).filter(choice => choice.value && choice.value !== 'unknown');
                choices.push(...searchChoices);
            }

            // Respond with combined choices
            await interaction.respond(choices.slice(0, 25));
        } catch (error) {
            // Suppress 'Unknown interaction' errors (DiscordAPIError[10062]) as they're normal
            if (error?.code !== 10062 && !error?.message?.includes('Unknown interaction')) {
                client.logger.error('Autocomplete error:', error);
            }
            // If an error occurs, respond with an empty array to prevent the interaction from failing.
            if (!interaction.responded) {
                try {
                    await interaction.respond([]);
                } catch (respondError) {
                    // Ignore response errors - interaction likely expired
                }
            }
        }
    }
};

// Helper function to shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
