const { EmbedBuilder } = require('discord.js');
const Utils = require('./utils');
const Guild = require('../schemas/Guild');

/**
 * Music Player Manager for Shoukaku
 * This class provides utility methods for managing music players
 * and handles common music operations
 */
class MusicPlayerManager {
    constructor(client) {
        this.client = client;
        // Create a Map to track queues since Shoukaku doesn't have built-in queue management
        this.queues = new Map();
    }

    /**
     * Helper to create a beautiful embed
     * @param {Object} options - Embed options
     * @returns {EmbedBuilder}
     */
    createBeautifulEmbed(options = {}) {
        const { title, description, color = '#8e44ad', thumbnail, author, footer, fields = [], image } = options;
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title ? `🌈 ${title}` : undefined)
            .setDescription(description ? `\n━━━━━━━━━━━━━━━━━━\n${description}\n━━━━━━━━━━━━━━━━━━` : undefined)
            .setTimestamp();

        if (author) embed.setAuthor(author);
        if (footer) embed.setFooter(footer);
        if (thumbnail) embed.setThumbnail(thumbnail);
        if (image) embed.setImage(image);
        if (fields.length > 0) embed.addFields(fields);

        return embed;
    }

    /**
     * Create or get an existing player for a guild
     * @param {Object} options - Player options
     * @param {string} options.guildId - Guild ID
     * @param {string} options.voiceChannelId - Voice channel ID
     * @param {string} options.textChannelId - Text channel ID
     * @param {boolean} options.autoPlay - Auto play next song
     * @returns {Object} Shoukaku player instance
     */
    async createPlayer(options) {
        const { guildId, voiceChannelId, textChannelId, autoPlay = true } = options;
        
        // Check if player already exists
        let player = this.client.players.get(guildId);

        if (player) {
            // Update voice channel if different
            if (player.voiceId !== voiceChannelId) {
                try {
                    await player.move(voiceChannelId);
                } catch (error) {
                    this.client.logger.error('Error updating voice channel:', error);
                }
            }
            // Update text channel if different
            if (player.textChannelId !== textChannelId) {
                player.textChannelId = textChannelId;
            }
            return player;
        }

        // Create new player using Shoukaku
        try {
            player = await this.client.shoukaku.joinVoiceChannel({
                guildId,
                channelId: voiceChannelId,
                shardId: 0
            });

            // Add custom properties to match moonlink API
            player.guildId = guildId;
            player.voiceChannelId = voiceChannelId;
            player.textChannelId = textChannelId;
            player.autoPlay = autoPlay;

            // Initialize queue for this guild
            this.queues.set(guildId, {
                tracks: [],
                current: null,
                loop: false,
                size: 0
            });

            // Create queue object similar to moonlink
            player.queue = {
                tracks: this.queues.get(guildId).tracks,
                get size() { return this.tracks.length; },
                add: (track, position) => {
                    const queue = this.tracks;
                    if (typeof position === 'number') {
                        queue.splice(position, 0, ...(Array.isArray(track) ? track : [track]));
                    } else {
                        queue.push(...(Array.isArray(track) ? track : [track]));
                    }
                    return this;
                }
            };

            // Set up player event handlers
            this.setupPlayerEvents(player);

            // Set volume from DB
            try {
                const guildData = await Guild.findByGuildId(guildId);
                if (guildData && guildData.musicSettings && typeof guildData.musicSettings.defaultVolume === 'number') {
                    await player.setVolume(guildData.musicSettings.defaultVolume);
                }
            } catch (err) {
                this.client.logger?.warn?.(`Failed to load default volume for guild ${guildId}:`, err);
            }

            // Store player
            this.client.players.set(guildId, player);

            return player;
        } catch (error) {
            this.client.logger.error('Error creating player:', error);
            throw error;
        }
    }

    /**
     * Set up event handlers for a player
     * @param {Object} player - Shoukaku player
     */
    setupPlayerEvents(player) {
        player.on('start', () => {
            this.client.logger.debug(`Track started in guild ${player.guildId}`);
        });

        player.on('end', (data) => {
            this.client.logger.debug(`Track ended in guild ${player.guildId}`);
            this.handleTrackEnd(player, data);
        });

        player.on('closed', () => {
            this.client.logger.info(`Player closed in guild ${player.guildId}`);
            this.cleanupPlayer(player.guildId);
        });

        player.on('exception', (error) => {
            this.client.logger.error(`Player exception in guild ${player.guildId}:`, error);
            this.handleTrackEnd(player, { reason: 'LOAD_FAILED' });
        });
    }

    /**
     * Handle track end and auto-play next track
     * @param {Object} player - Shoukaku player
     * @param {Object} data - End data
     */
    async handleTrackEnd(player, data) {
        const queue = this.queues.get(player.guildId);
        if (!queue) return;

        const { reason } = data;

        // If track finished normally and autoPlay is enabled, play next track
        if (reason === 'FINISHED' || reason === 'LOAD_FAILED') {
            if (queue.tracks.length > 0) {
                const nextTrack = queue.tracks.shift();
                queue.current = nextTrack;
                try {
                    await player.playTrack(nextTrack);
                } catch (error) {
                    this.client.logger.error('Error playing next track:', error);
                    this.handleTrackEnd(player, { reason: 'LOAD_FAILED' });
                }
            } else {
                // Queue ended
                queue.current = null;
                const channel = this.client.channels.cache.get(player.textChannelId);
                if (channel) {
                    channel.send('Queue ended. Disconnecting in 30 seconds if no new tracks are added.');
                }
                
                // Disconnect after a delay if no new tracks are added
                setTimeout(() => {
                    const currentQueue = this.queues.get(player.guildId);
                    if (!currentQueue || (currentQueue.tracks.length === 0 && !currentQueue.current)) {
                        this.destroyPlayer(player.guildId);
                        if (channel) {
                            channel.send('Disconnected due to inactivity.');
                        }
                    }
                }, 30000);
            }
        }
    }

    /**
     * Get an existing player for a guild
     * @param {string} guildId - Guild ID
     * @returns {Object|null} Shoukaku player instance or null
     */
    getPlayer(guildId) {
        return this.client.players.get(guildId) || null;
    }

    /**
     * Search for tracks using Shoukaku
     * @param {Object} options - Search options
     * @param {string} options.query - Search query
     * @param {string} options.source - Search source (youtube, soundcloud, etc.)
     * @param {string} options.requester - Requester user ID
     * @returns {Object} Search results
     */
    async search(options) {
        const { query, source = 'youtube', requester } = options;
        
        // Check if any nodes are available
        if (!this.client.shoukaku.nodes || this.client.shoukaku.nodes.size === 0) {
            this.client.logger.error('No Lavalink nodes are available for searching.');
            return {
                loadType: 'error',
                error: 'No Lavalink nodes are available. Please try again later.',
                tracks: []
            };
        }

        // Check if at least one node is connected
        const hasConnectedNode = Array.from(this.client.shoukaku.nodes.values()).some(node => node.state === 2); // 2 = CONNECTED
        if (!hasConnectedNode) {
            this.client.logger.error('No connected Lavalink nodes for searching.');
            return {
                loadType: 'error',
                error: 'No connected Lavalink nodes. Please try again later.',
                tracks: []
            };
        }

        let searchQuery = query;
        // Only add prefix for search terms, not URLs
        if (!this.isURL(query)) {
            if (source === 'spotify') {
                searchQuery = `spsearch:${query}`;
            } else if (source === 'soundcloud') {
                searchQuery = `scsearch:${query}`;
            } else {
                searchQuery = `ytsearch:${query}`;
            }
        }

        try {
            const node = this.client.shoukaku.getIdealNode();
            const result = await node.rest.resolve(searchQuery);

            // Transform Shoukaku result to match moonlink format
            const transformedResult = {
                loadType: result.loadType.toLowerCase(),
                tracks: result.data?.tracks?.map(track => ({
                    title: track.info.title,
                    author: track.info.author,
                    uri: track.info.uri,
                    identifier: track.info.identifier,
                    duration: track.info.length,
                    thumbnail: track.info.artworkUrl,
                    sourceName: track.info.sourceName,
                    requester: requester,
                    track: track.encoded // Store encoded track for playback
                })) || [],
                playlistInfo: result.data?.info ? {
                    name: result.data.info.name,
                    selectedTrack: result.data.info.selectedTrack
                } : null
            };

            return transformedResult;
        } catch (error) {
            this.client.logger.error('Error searching for tracks:', error);
            return {
                loadType: 'error',
                error: error.message,
                tracks: []
            };
        }
    }

    /**
     * Check if a string is a URL
     * @param {string} string - String to check
     * @returns {boolean} True if URL, false otherwise
     */
    isURL(string) {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Format duration from milliseconds to readable format
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted duration (HH:MM:SS or MM:SS)
     */
    formatDuration(ms) {
        if (!ms || ms === 0) return '00:00';
        
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Create a now playing embed
     * @param {Object} track - Track object
     * @param {Object} player - Player object
     * @returns {EmbedBuilder} Discord embed
     */
    createNowPlayingEmbed(track, player) {
        return this.createBeautifulEmbed({
            title: 'Now Playing',
            description: `**[${track.title}](${track.uri})**\n\n🎤 **Artist:** ${track.author || 'Unknown'}\n👤 **Requested by:** <@${track.requester}>`,
            color: '#43b581',
            thumbnail: track.thumbnail,
            fields: [
                { name: '⏱️ Duration', value: this.formatDuration(track.duration), inline: true },
                { name: '🔊 Volume', value: `${Math.round(player.volume * 100)}%`, inline: true },
                { name: '📋 Queue', value: `${player.queue.size} track(s) in queue`, inline: true }
            ],
            footer: { text: 'Enjoy your music! 🎶', iconURL: this.client.user.displayAvatarURL() }
        });
    }

    /**
     * Create a queue embed
     * @param {Object} player - Player object
     * @param {number} page - Page number (default: 1)
     * @returns {EmbedBuilder} Discord embed
     */
    createQueueEmbed(player, page = 1) {
        const tracksPerPage = 10;
        const startIndex = (page - 1) * tracksPerPage;
        const endIndex = startIndex + tracksPerPage;
        const queueTracks = player.queue.tracks.slice(startIndex, endIndex);

        const trackList = queueTracks.map((track, index) => {
            const position = startIndex + index + 1;
            return `**${position}.** [${track.title}](${track.uri}) • ⏱️ ${this.formatDuration(track.duration)} • 👤 ${track.author || 'Unknown'}`;
        }).join('\n');

        const totalPages = Math.ceil(player.queue.size / tracksPerPage);
        const queue = this.queues.get(player.guildId);

        return this.createBeautifulEmbed({
            title: 'Music Queue',
            description: queue?.current
                ? `**Now Playing:**\n[${queue.current.title}](${queue.current.uri}) | \`${this.formatDuration(queue.current.duration)}\`\n\n${trackList || '_No tracks in queue._'}`
                : trackList || '_No tracks in queue._',
            color: '#0099ff',
            fields: [
                { name: 'Up Next', value: trackList || 'No tracks in queue' }
            ],
            footer: totalPages > 1 ? { text: `Page ${page}/${totalPages}` } : { text: 'Queue' }
        });
    }

    /**
     * Get all active players
     * @returns {Map} Map of guild IDs to player objects
     */
    getAllPlayers() {
        return this.client.players || new Map();
    }

    /**
     * Get the count of active players
     * @returns {number} Number of active players
     */
    getPlayerCount() {
        return this.getAllPlayers().size;
    }

    /**
     * Destroy all players
     */
    async destroyAllPlayers() {
        const players = this.getAllPlayers();
        const promises = [];

        for (const [guildId, player] of players) {
            promises.push(this.destroyPlayer(guildId).catch(error => 
                this.client.logger.error(`Error destroying player for guild ${guildId}:`, error)
            ));
        }

        await Promise.all(promises);
    }

    /**
     * Destroy a specific player
     * @param {string} guildId - Guild ID
     */
    async destroyPlayer(guildId) {
        const player = this.client.players.get(guildId);
        if (player) {
            try {
                await player.destroy();
            } catch (error) {
                this.client.logger.error(`Error destroying player for guild ${guildId}:`, error);
            }
        }
        this.cleanupPlayer(guildId);
    }

    /**
     * Clean up player data
     * @param {string} guildId - Guild ID
     */
    cleanupPlayer(guildId) {
        this.client.players.delete(guildId);
        this.queues.delete(guildId);
    }

    /**
     * Check if user is in the same voice channel as the bot
     * @param {Object} member - Discord guild member
     * @param {Object} player - Shoukaku player
     * @returns {boolean} True if in same channel, false otherwise
     */
    isInSameVoiceChannel(member, player) {
        return member.voice.channel?.id === (player.voiceId || player.voiceChannelId);
    }

    /**
     * Check if user is in a voice channel
     * @param {Object} member - Discord guild member
     * @returns {boolean} True if in voice channel, false otherwise
     */
    isInVoiceChannel(member) {
        return !!member.voice.channel;
    }

    /**
     * Get voice channel permissions for the bot
     * @param {Object} voiceChannel - Discord voice channel
     * @param {Object} botMember - Bot's guild member object
     * @returns {Object} Permissions object
     */
    getVoicePermissions(voiceChannel, botMember) {
        const permissions = voiceChannel.permissionsFor(botMember);
        
        return {
            connect: permissions.has('Connect'),
            speak: permissions.has('Speak'),
            viewChannel: permissions.has('ViewChannel')
        };
    }

    /**
     * Convert Spotify URL to search query
     * @param {string} url - Spotify URL
     * @returns {string} Search query
     */
    convertSpotifyUrl(url) {
        // This is a basic implementation
        // You might want to use a Spotify API to get actual track details
        const regex = /spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/;
        const match = url.match(regex);
        
        if (match) {
            // For now, just return the original URL
            // In a full implementation, you'd fetch the Spotify metadata
            return url;
        }
        
        return url;
    }

    /**
     * Search and play or queue tracks, connecting if needed
     * @param {Object} options - Options for playback
     * @param {string} options.guildId - Guild ID
     * @param {string} options.voiceChannelId - Voice channel ID
     * @param {string} options.textChannelId - Text channel ID
     * @param {string} options.query - Search query
     * @param {string} options.source - Search source (youtube, spotify, soundcloud, etc.)
     * @param {string} options.requester - Requester user ID
     * @returns {Object} Result with player and search result
     */
    async playOrQueue(options) {
        const { guildId, voiceChannelId, textChannelId, query, source = 'youtube', requester } = options;
        
        // Search for tracks
        const searchResult = await this.search({ query, source, requester });

        if (searchResult.loadType === 'error' || !searchResult.tracks?.length) {
            return { error: searchResult.error || 'No tracks found', searchResult };
        }

        // Get or create player
        const player = await this.createPlayer({ guildId, voiceChannelId, textChannelId });

        // Add tracks to queue
        if (searchResult.loadType === 'playlist') {
            for (const track of searchResult.tracks) {
                player.queue.add(track);
            }
        } else {
            player.queue.add(searchResult.tracks[0]);
        }

        // Start playing if not already
        const queue = this.queues.get(guildId);
        if (!queue.current && player.queue.size > 0) {
            const nextTrack = player.queue.tracks.shift();
            queue.current = nextTrack;
            try {
                await player.playTrack({ track: nextTrack.track });
            } catch (error) {
                this.client.logger.error('Error starting playback:', error);
                return { error: 'Failed to start playback', searchResult };
            }
        }

        return { player, searchResult };
    }
}

module.exports = MusicPlayerManager;
