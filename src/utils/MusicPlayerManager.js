const { EmbedBuilder } = require('discord.js');
const Utils = require('./utils');
const Guild = require('../schemas/Guild');

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
     * Create or get an existing player for a guild
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

        // Create new player (use manager.players.create)
        if (Object.keys(this.client.manager.players).length >= this.client.config.maxPlayers) {
            throw new Error('Maximum number of players reached.');
        }
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
     * Search for tracks using Moonlink
     * @param {Object} options - Search options
     * @param {string} options.query - Search query
     * @param {string} options.source - Search source (youtube, soundcloud, etc.)
     * @param {string} options.requester - Requester user ID
     * @returns {Object} Search results
     */
    async search(options) {
        const { query, source = 'youtube', requester } = options;
        // Use .cache for Moonlink.js v4
        if (!this.client.manager.nodes.cache || this.client.manager.nodes.cache.size === 0) {
            this.client.logger.error('No Lavalink nodes are available for searching.');
            return {
                loadType: 'error',
                error: 'No Lavalink nodes are available. Please try again later.',
                tracks: []
            };
        }
        // Check if at least one node is connected
        const hasConnectedNode = Array.from(this.client.manager.nodes.cache.values()).some(node => node.connected);
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
            }
        }
        try {
            const result = await this.client.manager.search({
                query: searchQuery,  // Add prefix for Spotify/SoundCloud search terms
                source: source,  // Specify source separately
                requester
            });

            return result;
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
        const embed = new EmbedBuilder()
            .setTitle('🎵 Now Playing')
            .setDescription(`**[${track.title}](${track.uri})**`)
            .setColor('#00ff00')
            .addFields(
                { name: '⏱️ Duration', value: this.formatDuration(track.duration), inline: true },
                { name: '👤 Requested by', value: `<@${track.requester}>`, inline: true },
                { name: '🔊 Volume', value: `${player.volume}%`, inline: true }
            );

        if (track.thumbnail) {
            embed.setThumbnail(track.thumbnail);
        }

        if (player.queue.size > 0) {
            embed.addFields({
                name: '📋 Queue',
                value: `${player.queue.size} track(s) in queue`,
                inline: true
            });
        }

        return embed;
    }

    /**
     * Create a queue embed
     * @param {Object} player - Player object
     * @param {number} page - Page number (default: 1)
     * @returns {EmbedBuilder} Discord embed
     */
    createQueueEmbed(player, page = 1) {
        const embed = new EmbedBuilder()
            .setTitle('📋 Music Queue')
            .setColor('#0099ff');

        // Current track
        if (player.current) {
            embed.setDescription(`**Now Playing:**\n[${player.current.title}](${player.current.uri}) | \`${this.formatDuration(player.current.duration)}\``);
        }

        // Queue tracks
        if (player.queue.size > 0) {
            const tracksPerPage = 10;
            const startIndex = (page - 1) * tracksPerPage;
            const endIndex = startIndex + tracksPerPage;
            const queueTracks = player.queue.tracks.slice(startIndex, endIndex);

            const trackList = queueTracks.map((track, index) => {
                const position = startIndex + index + 1;
                return `${position}. [${track.title}](${track.uri}) | \`${this.formatDuration(track.duration)}\``;
            }).join('\n');

            embed.addFields({
                name: `Up Next (${player.queue.size} total):`,
                value: trackList || 'No tracks in queue'
            });

            // Add pagination info if needed
            const totalPages = Math.ceil(player.queue.size / tracksPerPage);
            if (totalPages > 1) {
                embed.setFooter({ text: `Page ${page}/${totalPages}` });
            }
        } else {
            embed.addFields({
                name: 'Up Next:',
                value: 'No tracks in queue'
            });
        }

        return embed;
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
