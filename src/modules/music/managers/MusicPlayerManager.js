const { EmbedBuilder } = require('discord.js');
const Utils = require('../../../utils/utils');
const Guild = require('../../../schemas/Guild');

/**
 * Music Player Manager for Moonlink.js
 * This class provides utility methods for managing music players
 * and handles common music operations
 */
class MusicPlayerManager {
    constructor(client) {
        this.client = client;
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
     * Create or get an existing player for a guild with connection retry
     * @param {Object} options - Player options
     * @param {string} options.guildId - Guild ID
     * @param {string} options.voiceChannelId - Voice channel ID
     * @param {string} options.textChannelId - Text channel ID
     * @param {boolean} options.autoPlay - Auto play next song
     * @returns {Object} Moonlink player instance
     */
    async createPlayer(options) {
        const { guildId, voiceChannelId, textChannelId, autoPlay = true } = options;
        
        // Check if player already exists - Moonlink.js V4.44+ PlayerManager
        let player;
        try {
            player = this.client.manager.players.get(guildId);
        } catch (error) {
            player = null;
        }

        if (player) {
            // Update voice channel if different
            if (player.voiceChannelId !== voiceChannelId) {
                try {
                    player.setVoiceChannel(voiceChannelId);
                } catch (error) {
                    this.client.logger.error('Error updating voice channel:', error);
                }
            }
            // Update text channel if different
            if (player.textChannelId !== textChannelId) {
                try {
                    player.setTextChannel(textChannelId);
                } catch (error) {
                    this.client.logger.error('Error updating text channel:', error);
                }
            }
            return player;
        }

        // Ensure we have a connected node before creating a player
        await this.ensureNodeConnection();

        // Create new player (use manager.players.create)
        if (Object.keys(this.client.manager.players).length >= this.client.config.maxPlayers) {
            throw new Error('Maximum number of players reached.');
        }
        
        try {
            player = this.client.manager.players.create({
                guildId,
                voiceChannelId,
                textChannelId,
                autoPlay
            });

            // Set volume from DB
            try {
                const guildData = await Guild.findByGuildId(guildId);
                if (guildData && guildData.musicSettings && typeof guildData.musicSettings.defaultVolume === 'number') {
                    player.setVolume(guildData.musicSettings.defaultVolume);
                }
            } catch (err) {
                this.client.logger?.warn?.(`Failed to load default volume for guild ${guildId}:`, err);
            }

            return player;
        } catch (error) {
            this.client.logger.error('Error creating player:', error);
            throw new Error('Failed to create music player. Please try again.');
        }
    }

    /**
     * Ensure at least one node is connected, with retry logic
     * @returns {Promise<void>}
     */
    async ensureNodeConnection() {
        const connectedNodes = Array.from(this.client.manager.nodes.cache.values()).filter(node => node.connected);
        
        if (connectedNodes.length > 0) {
            return; // We have at least one connected node
        }
        
        this.client.logger.warn('No connected nodes available, attempting to reconnect...');
        
        // Try to trigger reconnection on all disconnected nodes
        const disconnectedNodes = Array.from(this.client.manager.nodes.cache.values()).filter(node => !node.connected && !node.destroyed);
        
        for (const node of disconnectedNodes) {
            if (node.reconnectAttempts < node.retryAmount) {
                try {
                    node.connect();
                } catch (error) {
                    this.client.logger.error(`Failed to trigger reconnection for node ${node.identifier}:`, error);
                }
            }
        }
        
        // Wait for at least one node to connect (up to 15 seconds)
        const connectionPromise = new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                const currentConnectedNodes = Array.from(this.client.manager.nodes.cache.values()).filter(node => node.connected);
                if (currentConnectedNodes.length > 0) {
                    clearInterval(checkInterval);
                    resolve();
                } else if (Date.now() - startTime > 15000) { // 15 seconds timeout
                    clearInterval(checkInterval);
                    reject(new Error('Failed to establish connection to music server'));
                }
            }, 1000); // Check every second
        });
        
        await connectionPromise;
    }

    /**
     * Get an existing player for a guild
     * @param {string} guildId - Guild ID
     * @returns {Object|null} Moonlink player instance or null
     */
    getPlayer(guildId) {
        try {
            const player = this.client.manager.players.get(guildId);
            if (!player) {
                throw new Error(`Player not found for guild ID: ${guildId}`);
            }
            return player;
        } catch (error) {
            return null;
        }
    }

    /**
     * Search for tracks using Moonlink with automatic retry on disconnection
     * @param {Object} options - Search options
     * @param {string} options.query - Search query
     * @param {string} options.source - Search source (youtube, soundcloud, etc.)
     * @param {string} options.requester - Requester user ID
     * @returns {Object} Search results
     */
    async search(options) {
        const { query, source = 'youtube', requester } = options;
        
        // First, check if any nodes are available
        if (!this.client.manager.nodes.cache || this.client.manager.nodes.cache.size === 0) {
            this.client.logger.error('No Lavalink nodes are available for searching.');
            return {
                loadType: 'error',
                error: 'No Lavalink nodes are available. Please try again later.',
                tracks: []
            };
        }
        
        // Check if at least one node is connected
        const connectedNodes = Array.from(this.client.manager.nodes.cache.values()).filter(node => node.connected);
        if (connectedNodes.length === 0) {
            this.client.logger.warn('No connected Lavalink nodes for searching. Waiting for reconnection...');
            
            // Try to wait for a node to reconnect (up to 10 seconds)
            const waitForConnection = new Promise((resolve, reject) => {
                const startTime = Date.now();
                const checkInterval = setInterval(() => {
                    const currentConnectedNodes = Array.from(this.client.manager.nodes.cache.values()).filter(node => node.connected);
                    if (currentConnectedNodes.length > 0) {
                        clearInterval(checkInterval);
                        resolve(true);
                    } else if (Date.now() - startTime > 10000) { // 10 seconds timeout
                        clearInterval(checkInterval);
                        reject(new Error('Connection timeout'));
                    }
                }, 500); // Check every 500ms
            });
            
            try {
                await waitForConnection;
                this.client.logger.info('Node reconnected, retrying search...');
            } catch (error) {
                return {
                    loadType: 'error',
                    error: 'Music server is temporarily unavailable. Please try again in a moment.',
                    tracks: []
                };
            }
        }
        
        let searchQuery = query;
        // Only add prefix for search terms, not URLs
        if (!this.isURL(query)) {
            if (source === 'spotify') {
                searchQuery = `spsearch:${query}`;
            } else if (source === 'soundcloud') {
                searchQuery = `scsearch:${query}`;
            }
        }
        
        // Implement retry logic for search operations
        const maxRetries = 3;
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.client.manager.search({
                    query: searchQuery,
                    source: source,
                    requester
                });
                
                return result;
            } catch (error) {
                lastError = error;
                this.client.logger.warn(`Search attempt ${attempt} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    // Wait before retrying (exponential backoff)
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    
                    // Check if nodes are still connected before retrying
                    const currentConnectedNodes = Array.from(this.client.manager.nodes.cache.values()).filter(node => node.connected);
                    if (currentConnectedNodes.length === 0) {
                        this.client.logger.warn('No connected nodes available for retry, aborting search');
                        break;
                    }
                }
            }
        }
        
        this.client.logger.error('All search attempts failed:', lastError);
        return {
            loadType: 'error',
            error: lastError?.message || 'Search failed after multiple attempts. Please try again.',
            tracks: []
        };
    }

    /**
     * Search for playlists using LavaSearch plugin (for queries, not URLs)
     * @param {Object} options - Search options
     * @param {string} options.query - Search query
     * @param {string} options.source - Search source (youtube, soundcloud, etc.)
     * @param {string} options.requester - Requester user ID
     * @param {string} [options.types] - Comma-separated result types (default: 'playlist')
     * @returns {Object} LavaSearch results (may include playlists, tracks, etc)
     */
    async lavaSearch(options) {
        const { query, source = 'youtube', requester, types = 'playlist' } = options;
        if (!this.client.manager.lavaSearch) {
            throw new Error('LavaSearch is not available on this node.');
        }
        return await this.client.manager.lavaSearch({
            query,
            source,
            requester,
            types
        });
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
                { name: '🔊 Volume', value: `${player.volume}%`, inline: true },
                { name: '📋 Queue', value: `${player.queue.size} track(s) in queue`, inline: true }
            ],
            footer: { text: 'Enjoy your music! 🎶', iconURL: player.client.user.displayAvatarURL() }
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

        return this.createBeautifulEmbed({
            title: 'Music Queue',
            description: player.current
                ? `**Now Playing:**\n[${player.current.title}](${player.current.uri}) | \`${this.formatDuration(player.current.duration)}\`\n\n${trackList || '_No tracks in queue._'}`
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
        return this.client.manager.players.all || new Map();
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
            promises.push(player.destroy().catch(error => 
                this.client.logger.error(`Error destroying player for guild ${guildId}:`, error)
            ));
        }

        await Promise.all(promises);
    }

    /**
     * Check if user is in the same voice channel as the bot
     * @param {Object} member - Discord guild member
     * @param {Object} player - Moonlink player
     * @returns {boolean} True if in same channel, false otherwise
     */
    isInSameVoiceChannel(member, player) {
        return member.voice.channel?.id === player.voiceChannelId;
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
     * Check connection health of all nodes
     * @returns {Object} Connection status information
     */
    getConnectionHealth() {
        const nodes = Array.from(this.client.manager.nodes.cache.values());
        const connected = nodes.filter(node => node.connected);
        const connecting = nodes.filter(node => node.state === 'CONNECTING');
        const disconnected = nodes.filter(node => !node.connected && !node.destroyed);
        const destroyed = nodes.filter(node => node.destroyed);
        
        return {
            total: nodes.length,
            connected: connected.length,
            connecting: connecting.length,
            disconnected: disconnected.length,
            destroyed: destroyed.length,
            healthy: connected.length > 0,
            nodes: {
                connected: connected.map(node => ({ identifier: node.identifier, address: node.address })),
                disconnected: disconnected.map(node => ({ identifier: node.identifier, address: node.address, attempts: node.reconnectAttempts }))
            }
        };
    }

    /**
     * Check if the music system is operational
     * @returns {boolean} True if at least one node is connected
     */
    isOperational() {
        const health = this.getConnectionHealth();
        return health.healthy;
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
        // Normalize loadType for Moonlink.js v4.44.4
        let loadType = searchResult.loadType;
        if (loadType === 'PLAYLIST_LOADED') loadType = 'playlist';
        if (loadType === 'TRACK_LOADED') loadType = 'track';
        if (loadType === 'SEARCH_RESULT') loadType = 'search';
        if (loadType === 'NO_MATCHES') loadType = 'empty';

        if (loadType === 'error' || !searchResult.tracks?.length) {
            return { error: searchResult.error || 'No tracks found', searchResult };
        }
        // Get or create player
        const player = await this.createPlayer({ guildId, voiceChannelId, textChannelId });
        // If player is not in a voice channel, set it (connect)
        if (!player.voiceChannelId || player.voiceChannelId !== voiceChannelId) {
            player.setVoiceChannel(voiceChannelId);
        }
        // Add tracks to queue
        if (loadType === 'playlist') {
            for (const track of searchResult.tracks) {
                player.queue.add(track);
            }
        } else {
            player.queue.add(searchResult.tracks[0]);
        }
        // Start playing if not already
        if ((!player.playing && !player.paused) || (!player.current && player.queue.size > 0)) {
            player.play();
        }
        return { player, searchResult };
    }
}

module.exports = MusicPlayerManager;
