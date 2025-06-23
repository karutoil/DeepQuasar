const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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
        const source = interaction.options.getString('source') || interaction.guildData?.musicSettings?.searchEngine || 'youtube';
        const playNext = interaction.options.getBoolean('next') || false;
        const shuffle = interaction.options.getBoolean('shuffle') || false;

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
        const player = client.musicPlayerManager.createPlayer({
            guildId: interaction.guild.id,
            voiceChannelId: voiceChannel.id,
            textChannelId: interaction.channel.id,
            autoPlay: true
        });

        // Connect to voice channel
        if (!player.connected) {
            try {
                await player.connect();
                // Wait a moment for the connection to be established
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription('❌ Failed to connect to voice channel!')
                    ]
                });
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

        switch (searchResult.loadType) {
            case 'playlist':
                isPlaylist = true;
                tracksToAdd = searchResult.tracks;
                if (shuffle) tracksToAdd = shuffleArray([...tracksToAdd]);

                // Check queue limits
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
                const maxSize = interaction.guildData?.premium ? 
                    client.config.bot.premiumMaxQueueSize : 
                    client.config.bot.maxQueueSize;

                if (player.queue.size >= maxSize) {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('#ff0000')
                            .setDescription(`❌ Queue is full! Maximum ${maxSize} tracks allowed.`)
                        ]
                    });
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
            const Utils = require('../../utils/utils');
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
            embed = await createClassicPlayEmbed({
                searchResult,
                addedTracks: tracksToAdd,
                isPlaylist,
                player,
                interaction,
                playNext,
                shuffle
            });
        }

        // Start playback if not already playing
        if (!player.playing && !player.paused && player.queue.size > 0) {
            await player.play();
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
            const searchResult = await client.musicPlayerManager.search({
                query: focusedValue,
                source: 'youtube',
                requester: interaction.user.id
            });

            const choices = searchResult.tracks.slice(0, 25).map(track => ({
                name: `${track.title} - ${track.author}`.slice(0, 100),
                value: track.url || track.uri || track.identifier || track.title || 'unknown'
            })).filter(choice => choice.value && choice.value !== 'unknown');

            await interaction.respond(choices);
        } catch (error) {
            client.logger.error('Autocomplete error:', error);
            await interaction.respond([]);
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
