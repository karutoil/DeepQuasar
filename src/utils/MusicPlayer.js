const { EmbedBuilder } = require('discord.js');
const Utils = require('./utils');

class MusicPlayer {
    constructor(client, guildId, voiceChannelId, textChannelId) {
        this.client = client;
        this.guildId = guildId;
        this.voiceChannelId = voiceChannelId;
        this.textChannelId = textChannelId;
        this.queue = [];
        this.current = null;
        this.volume = 50;
        this.loop = 'none'; // none, track, queue
        this.playing = false;
        this.paused = false;
        this.position = 0;
        this.player = null;
        this.connection = null;
        this.lastActivity = Date.now();
    }

    async connect() {
        try {
            // Use Shoukaku v4 API - joinVoiceChannel is called on the Shoukaku instance
            this.player = await this.client.shoukaku.joinVoiceChannel({
                guildId: this.guildId,
                channelId: this.voiceChannelId,
                shardId: 0
            });

            this.setupPlayerEvents();
            this.client.players.set(this.guildId, this);
            return true;
        } catch (error) {
            this.client.logger.error('Failed to connect to voice channel:', error);
            return false;
        }
    }

    setupPlayerEvents() {
        this.player.on('start', (track) => {
            try {
                this.playing = true;
                this.paused = false;
                // Don't overwrite this.current here since we set it in play() method
                this.lastActivity = Date.now();
                this.client.logger.music('track_start', {
                    guildId: this.guildId,
                    trackTitle: this.current?.info?.title || this.current?.title || 'Unknown Track'
                });
            } catch (error) {
                this.client.logger.error('Error in start event handler:', error);
            }
        });

        this.player.on('end', (track) => {
            this.playing = false;
            this.lastActivity = Date.now();
            
            try {
                if (this.loop === 'track' && this.current) {
                    // Repeat current track - make a deep copy to avoid reference issues
                    const trackToRepeat = { ...this.current };
                    // Ensure the track has the required encoded field
                    if (!trackToRepeat.encoded) {
                        this.client.logger.error('Current track missing encoded data for loop:', {
                            guildId: this.guildId,
                            trackTitle: trackToRepeat.info?.title || trackToRepeat.title || 'Unknown',
                            hasInfo: !!trackToRepeat.info,
                            trackKeys: Object.keys(trackToRepeat)
                        });
                        // Fallback to normal playNext if track is corrupted
                        this.playNext().catch(e => this.client.logger.error('Error in fallback playNext:', e));
                        return;
                    }
                    
                    this.client.logger.debug('Repeating track:', {
                        guildId: this.guildId,
                        trackTitle: trackToRepeat.info?.title || trackToRepeat.title || 'Unknown',
                        hasEncoded: !!trackToRepeat.encoded
                    });
                    
                    this.play(trackToRepeat).catch(error => {
                        this.client.logger.error('Error repeating track:', error);
                        this.playNext().catch(e => this.client.logger.error('Error in fallback playNext:', e));
                    });
                } else if (this.loop === 'queue' && this.current) {
                    // Add current track to end of queue - make a copy to avoid reference issues
                    const trackToQueue = { ...this.current };
                    if (trackToQueue.encoded) {
                        this.queue.push(trackToQueue);
                    } else {
                        this.client.logger.warn('Current track missing encoded data for queue loop, skipping add to queue');
                    }
                    this.playNext().catch(error => {
                        this.client.logger.error('Error in queue loop playNext:', error);
                    });
                } else {
                    this.playNext().catch(error => {
                        this.client.logger.error('Error in normal playNext:', error);
                    });
                }
            } catch (error) {
                this.client.logger.error('Error in end event handler:', error);
            }
        });

        this.player.on('exception', (exception) => {
            // Check if this is a network-related exception (very common with YouTube)
            const exceptionStr = String(exception);
            const fullExceptionStr = JSON.stringify(exception);
            
            const isNetworkError = exceptionStr.includes('SocketTimeoutException') || 
                                 exceptionStr.includes('Read timed out') ||
                                 exceptionStr.includes('Connection reset') ||
                                 exceptionStr.includes('UnknownHostException') ||
                                 fullExceptionStr.includes('SocketTimeoutException') ||
                                 fullExceptionStr.includes('Read timed out') ||
                                 fullExceptionStr.includes('Connection reset') ||
                                 fullExceptionStr.includes('UnknownHostException');
            
            if (isNetworkError) {
                // Log network errors at warn level instead of error (they're common)
                this.client.logger.warn('Network timeout while loading track', {
                    guildId: this.guildId,
                    currentTrack: this.current?.info?.title || this.current?.title || 'Unknown',
                    reason: 'Network connectivity issue with audio source',
                    loopMode: this.loop
                });
                
                // Don't send error message for network timeouts as track usually plays fine
                // this.sendMessage('🌐 Network timeout loading track. Skipping...');
            } else {
                // Log other exceptions at error level with more detail
                this.client.logger.error('Player exception (non-network):', {
                    guildId: this.guildId,
                    exception: exceptionStr,
                    rawException: exception,
                    exceptionType: typeof exception,
                    currentTrack: this.current?.info?.title || this.current?.title || 'Unknown',
                    queueSize: this.queue.length,
                    loopMode: this.loop,
                    currentTrackStructure: this.current ? Object.keys(this.current) : null
                });
                
                // Send error message for non-network issues
                this.sendMessage('⚠️ Track failed to play. Skipping...');
            }
            
            // For network errors, don't interrupt playback - the track usually continues playing
            if (isNetworkError) {
                this.client.logger.debug('Ignoring network timeout exception - track should continue playing');
                return;
            }
            
            // Store current track for potential loop before clearing it
            const failedTrack = this.current;
            
            // Clean up current track state
            this.playing = false;
            this.current = null;
            
            // Try to play next track after a brief delay to avoid race conditions
            setTimeout(() => {
                // Check if we should retry the failed track due to loop mode
                if (this.loop === 'track' && failedTrack && failedTrack.encoded) {
                    this.client.logger.debug('Retrying failed track due to loop mode:', {
                        guildId: this.guildId,
                        trackTitle: failedTrack.info?.title || failedTrack.title || 'Unknown'
                    });
                    
                    // Create a copy of the track to retry
                    const trackToRetry = { ...failedTrack };
                    this.play(trackToRetry).catch(error => {
                        this.client.logger.error('Error retrying looped track after exception:', error);
                        // If retry fails, try normal queue progression
                        this.handlePostExceptionPlayback();
                    });
                } else if (this.loop === 'queue' && failedTrack && failedTrack.encoded) {
                    // Add failed track back to queue for queue loop
                    this.queue.push({ ...failedTrack });
                    this.handlePostExceptionPlayback();
                } else {
                    this.handlePostExceptionPlayback();
                }
            }, 500);
        });
        
        // Helper method for handling playback after exceptions
        this.handlePostExceptionPlayback = () => {
            if (this.queue.length > 0) {
                this.playNext().catch(error => {
                    this.client.logger.error('Error in playNext after exception:', error);
                });
            } else {
                this.sendMessage('Queue is empty. Add more music with `/play`!');
            }
        };

        this.player.on('stuck', (data) => {
            this.client.logger.warn('Player stuck, skipping track:', {
                guildId: this.guildId,
                data: data,
                currentTrack: this.current?.info?.title || this.current?.title || 'Unknown'
            });
            
            this.playing = false;
            setTimeout(() => {
                this.playNext().catch(error => {
                    this.client.logger.error('Error in playNext after stuck:', error);
                });
            }, 500);
        });

        this.player.on('update', (data) => {
            this.position = data.state.position || 0;
        });
    }

    async search(query, source = 'youtube') {
        try {
            const searchQuery = this.formatSearchQuery(query, source);
            // Use Shoukaku v4 node resolver
            const node = this.client.shoukaku.options.nodeResolver(this.client.shoukaku.nodes);
            
            this.client.logger.debug('Searching with query:', {
                original: query,
                formatted: searchQuery,
                isUrl: query.startsWith('http'),
                source: source
            });
            
            const result = await node.rest.resolve(searchQuery);
            
            this.client.logger.debug('Search result:', {
                loadType: result?.loadType,
                hasData: !!result?.data,
                dataKeys: result?.data ? Object.keys(result.data) : [],
                hasTrack: !!result?.data?.track,
                hasTracks: !!result?.data?.tracks || !!result?.tracks,
                tracksLength: result?.data?.tracks?.length || result?.tracks?.length || 0,
                playlistName: result?.data?.info?.name || 'N/A'
            });
            
            if (!result) {
                return null;
            }

            // Handle different response structures for Shoukaku v4
            let tracks = null;
            let playlistInfo = {};
            
            switch (result.loadType) {
                case 'track':
                    // Single track result (usually from direct URLs)
                    // In Shoukaku v4, track data is directly in result.data
                    if (result.data && result.data.encoded) {
                        tracks = [result.data];
                    }
                    break;
                    
                case 'playlist':
                    // Playlist result
                    if (result.data?.tracks && Array.isArray(result.data.tracks)) {
                        tracks = result.data.tracks;
                        playlistInfo = result.data.info || {};
                    }
                    break;
                    
                case 'search':
                    // Search results - data is an array of tracks
                    if (result.data && Array.isArray(result.data)) {
                        tracks = result.data;
                    }
                    break;
                    
                default:
                    // Fallback for unknown formats
                    if (result.data && Array.isArray(result.data)) {
                        tracks = result.data;
                    } else if (result.data && result.data.tracks && Array.isArray(result.data.tracks)) {
                        tracks = result.data.tracks;
                        playlistInfo = result.data.info || {};
                    } else if (result.data && result.data.encoded) {
                        // Single track fallback
                        tracks = [result.data];
                    }
                    break;
            }

            if (!tracks || tracks.length === 0) {
                this.client.logger.debug('No tracks found in result');
                return null;
            }

            // Return in expected format
            return {
                loadType: result.loadType,
                tracks: tracks,
                playlistInfo: playlistInfo
            };
        } catch (error) {
            this.client.logger.error('Search error:', error);
            return null;
        }
    }

    formatSearchQuery(query, source) {
        // Check if it's already a URL
        if (query.startsWith('http://') || query.startsWith('https://')) {
            return query;
        }

        // Format search query based on source
        const sourceMapping = {
            youtube: 'ytsearch',
            soundcloud: 'scsearch',
            spotify: 'spsearch'
        };

        const searchPrefix = sourceMapping[source] || 'ytsearch';
        return `${searchPrefix}:${query}`;
    }

    async play(track = null) {
        if (!this.player) {
            this.client.logger.error('Cannot play: Player not connected');
            return false;
        }

        try {
            if (track) {
                // Play specific track - use Shoukaku v4 format
                if (!track.encoded) {
                    this.client.logger.error('Track missing encoded data:', {
                        guildId: this.guildId,
                        trackTitle: track.info?.title || track.title || 'Unknown',
                        hasInfo: !!track.info,
                        trackKeys: Object.keys(track)
                    });
                    return false;
                }
                
                this.client.logger.debug('Playing specific track:', {
                    guildId: this.guildId,
                    title: track.info?.title || track.title || 'Unknown',
                    hasEncoded: !!track.encoded
                });
                
                try {
                    // Validate track structure before sending to Shoukaku
                    const playPayload = { track: { encoded: track.encoded } };
                    await this.player.playTrack(playPayload);
                    
                    // Only set current track and playing state after successful playback start
                    this.current = track;
                    this.playing = true;
                    
                } catch (playError) {
                    this.client.logger.error('Error calling playTrack for specific track:', {
                        error: playError.message,
                        guildId: this.guildId,
                        track: track.info?.title || track.title || 'Unknown',
                        hasPlayer: !!this.player,
                        playerConnected: this.player?.track !== undefined
                    });
                    throw playError;
                }
                
                return true;
            }

            if (this.queue.length === 0) {
                // No tracks in queue
                this.sendMessage('Queue is empty. Add some music with `/play`!');
                return false;
            }

            // Play next track from queue - use Shoukaku v4 format
            const nextTrack = this.queue.shift();
            if (!nextTrack || !nextTrack.encoded) {
                this.client.logger.error('Invalid track data in queue:', {
                    hasTrack: !!nextTrack,
                    hasEncoded: !!nextTrack?.encoded,
                    trackData: nextTrack
                });
                // Try the next track if this one is invalid
                if (this.queue.length > 0) {
                    return await this.playNext();
                }
                return false;
            }

            this.client.logger.debug('Playing next track from queue:', {
                title: nextTrack.info?.title || nextTrack.title || 'Unknown',
                queueRemaining: this.queue.length
            });

            try {
                // Validate track structure before sending to Shoukaku
                const playPayload = { track: { encoded: nextTrack.encoded } };
                await this.player.playTrack(playPayload);
                
                // Only set current track after successful playback start
                this.current = nextTrack;
                this.playing = true;
                
            } catch (playError) {
                this.client.logger.error('Error calling playTrack:', {
                    error: playError.message,
                    track: nextTrack.info?.title || nextTrack.title || 'Unknown',
                    hasPlayer: !!this.player,
                    playerConnected: this.player?.track !== undefined
                });
                
                // Don't set current track if play failed
                // Try next track if available
                if (this.queue.length > 0) {
                    return await this.playNext();
                }
                
                throw playError;
            }
            
            return true;
        } catch (error) {
            this.client.logger.error('Error in play method:', {
                error: error,
                guildId: this.guildId,
                trackTitle: track?.info?.title || track?.title || 'Unknown'
            });
            
            // If this was a queue track, try the next one
            if (!track && this.queue.length > 0) {
                return await this.playNext();
            }
            
            return false;
        }
    }

    async playNext() {
        try {
            if (this.queue.length === 0) {
                this.current = null;
                this.playing = false;
                
                // Auto-leave after 5 minutes of inactivity
                setTimeout(() => {
                    if (!this.playing && this.queue.length === 0) {
                        this.destroy();
                    }
                }, 5 * 60 * 1000);
                
                return false;
            }

            return await this.play();
        } catch (error) {
            this.client.logger.error('Error in playNext:', {
                error: error,
                guildId: this.guildId,
                queueSize: this.queue.length
            });
            
            // Clear current state
            this.current = null;
            this.playing = false;
            
            // The problematic track was already removed by play() method
            // Just try the next track if available
            if (this.queue.length > 0) {
                this.client.logger.warn('Trying next track after playNext error, remaining tracks:', this.queue.length);
                
                // Add a small delay to prevent rapid recursion
                await new Promise(resolve => setTimeout(resolve, 100));
                return await this.playNext();
            }
            
            return false;
        }
    }

    skip() {
        if (this.player && this.current) {
            this.player.stopTrack();
            return true;
        }
        return false;
    }

    pause(state = true) {
        if (this.player) {
            this.player.setPaused(state);
            this.paused = state;
            return true;
        }
        return false;
    }

    setVolume(volume) {
        if (this.player && volume >= 0 && volume <= 200) {
            // Use Shoukaku v4 setGlobalVolume (0-1000 range)
            const shoukakuVolume = Math.floor((volume / 100) * 100); // Convert 0-200 to 0-200
            this.player.setGlobalVolume(shoukakuVolume);
            this.volume = volume;
            return true;
        }
        return false;
    }

    async setLoop(mode) {
        const validModes = ['none', 'track', 'queue'];
        if (validModes.includes(mode)) {
            this.loop = mode;
            this.client.logger.music('loop_changed', {
                guildId: this.guildId,
                mode
            });
        }
    }

    addTrack(track, position = -1) {
        if (position === -1 || position >= this.queue.length) {
            this.queue.push(track);
        } else {
            this.queue.splice(position, 0, track);
        }
    }

    async removeTrack(index) {
        if (index >= 0 && index < this.queue.length) {
            const removedTrack = this.queue.splice(index, 1)[0];
            this.client.logger.music('track_removed', {
                guildId: this.guildId,
                trackTitle: removedTrack.info.title,
                position: index + 1
            });
            return removedTrack;
        }
        return null;
    }

    async moveTrack(fromIndex, toIndex) {
        if (fromIndex >= 0 && fromIndex < this.queue.length && 
            toIndex >= 0 && toIndex < this.queue.length) {
            const track = this.queue.splice(fromIndex, 1)[0];
            this.queue.splice(toIndex, 0, track);
            this.client.logger.music('track_moved', {
                guildId: this.guildId,
                trackTitle: track.info.title,
                from: fromIndex + 1,
                to: toIndex + 1
            });
            return track;
        }
        return null;
    }

    async clearQueue() {
        this.queue = [];
        this.client.logger.music('queue_cleared', {
            guildId: this.guildId
        });
    }

    async shuffleQueue() {
        if (this.queue.length < 2) return;
        
        // Fisher-Yates shuffle algorithm
        for (let i = this.queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
        }
        
        this.client.logger.music('queue_shuffled', {
            guildId: this.guildId,
            queueSize: this.queue.length
        });
    }

    getQueue(page = 0, limit = 10) {
        const start = page * limit;
        const end = start + limit;
        return {
            tracks: this.queue.slice(start, end),
            total: this.queue.length,
            page,
            totalPages: Math.ceil(this.queue.length / limit)
        };
    }

    getPosition() {
        return this.player ? this.player.position : 0;
    }

    async seek(position) {
        if (this.player && this.current) {
            await this.player.seekTo(position);
            return true;
        }
        return false;
    }

    // Filter methods for Shoukaku v4
    async setFilters(filters) {
        if (this.player) {
            await this.player.setFilters(filters);
            return true;
        }
        return false;
    }

    async setEqualizer(bands) {
        if (this.player) {
            await this.player.setEqualizer(bands);
            return true;
        }
        return false;
    }

    async setTimescale(settings) {
        if (this.player) {
            await this.player.setTimescale(settings);
            return true;
        }
        return false;
    }

    async clearFilters() {
        if (this.player) {
            await this.player.clearFilters();
            return true;
        }
        return false;
    }

    async sendMessage(content, embed = null) {
        try {
            const channel = this.client.channels.cache.get(this.textChannelId);
            if (channel) {
                if (embed) {
                    await channel.send({ content, embeds: [embed] });
                } else {
                    await channel.send(content);
                }
            }
        } catch (error) {
            this.client.logger.error('Failed to send message:', error);
        }
    }

    async destroy() {
        try {
            if (this.player) {
                // Use Shoukaku v4 API - leaveVoiceChannel is called on the Shoukaku instance
                await this.client.shoukaku.leaveVoiceChannel(this.guildId);
            }
            
            this.client.players.delete(this.guildId);
            
            this.client.logger.info(`Player destroyed for guild ${this.guildId}`);
        } catch (error) {
            this.client.logger.error('Error destroying player:', error);
        }
    }

    // Utility methods
    get size() {
        return this.queue.length;
    }

    get isConnected() {
        return this.player && this.player.track !== null;
    }

    get isPaused() {
        return this.paused;
    }

    get isPlaying() {
        return this.playing && !this.paused;
    }
}

class MusicPlayerManager {
    constructor(client) {
        this.client = client;
        this.players = new Map();
    }

    async create(guildId, voiceChannelId, textChannelId) {
        if (this.players.has(guildId)) {
            return this.players.get(guildId);
        }

        const player = new MusicPlayer(this.client, guildId, voiceChannelId, textChannelId);
        const connected = await player.connect();
        
        if (connected) {
            this.players.set(guildId, player);
            return player;
        }
        
        return null;
    }

    getPlayer(guildId) {
        return this.players.get(guildId) || null;
    }

    async destroy(guildId) {
        const player = this.players.get(guildId);
        if (player) {
            await player.destroy();
            this.players.delete(guildId);
            return true;
        }
        return false;
    }

    async play(guildId, track) {
        const player = this.players.get(guildId);
        if (player) {
            return await player.play(track);
        }
        return false;
    }

    async pause(guildId, state = true) {
        const player = this.players.get(guildId);
        if (player) {
            return player.pause(state);
        }
        return false;
    }

    async skip(guildId) {
        const player = this.players.get(guildId);
        if (player) {
            return player.skip();
        }
        return false;
    }

    async setVolume(guildId, volume) {
        const player = this.players.get(guildId);
        if (player) {
            return player.setVolume(volume);
        }
        return false;
    }

    async setLoop(guildId, mode) {
        const player = this.players.get(guildId);
        if (player) {
            await player.setLoop(mode);
            return true;
        }
        return false;
    }

    async clearQueue(guildId) {
        const player = this.players.get(guildId);
        if (player) {
            await player.clearQueue();
            return true;
        }
        return false;
    }

    async shuffleQueue(guildId) {
        const player = this.players.get(guildId);
        if (player) {
            await player.shuffleQueue();
            return true;
        }
        return false;
    }

    async removeTrack(guildId, index) {
        const player = this.players.get(guildId);
        if (player) {
            return await player.removeTrack(index);
        }
        return null;
    }

    async moveTrack(guildId, fromIndex, toIndex) {
        const player = this.players.get(guildId);
        if (player) {
            return await player.moveTrack(fromIndex, toIndex);
        }
        return null;
    }

    async setFilters(guildId, filters) {
        const player = this.players.get(guildId);
        if (player) {
            return await player.setFilters(filters);
        }
        return false;
    }

    async clearFilters(guildId) {
        const player = this.players.get(guildId);
        if (player) {
            return await player.clearFilters();
        }
        return false;
    }

    async search(query, source = 'youtube') {
        try {
            // Format the search query based on source
            const searchQuery = this.formatSearchQuery(query, source);
            
            // Use Shoukaku v4 node resolver
            const node = this.client.shoukaku.options.nodeResolver(this.client.shoukaku.nodes);
            
            this.client.logger.debug('MusicPlayerManager searching with query:', {
                original: query,
                formatted: searchQuery,
                isUrl: query.startsWith('http'),
                source: source
            });
            
            const result = await node.rest.resolve(searchQuery);
            
            this.client.logger.debug('MusicPlayerManager search result:', {
                loadType: result?.loadType,
                hasData: !!result?.data,
                dataKeys: result?.data ? Object.keys(result.data) : [],
                hasTrack: !!result?.data?.track,
                hasTracks: !!result?.data?.tracks || !!result?.tracks,
            });

            if (!result || !result.data) {
                this.client.logger.debug('No data in search result');
                return null;
            }

            let tracks = [];
            let playlistInfo = {};

            // Handle different result types
            switch (result.loadType) {
                case 'track':
                    // Single track result
                    if (result.data.encoded) {
                        tracks = [result.data];
                    }
                    break;
                    
                case 'playlist':
                    // Playlist result
                    if (result.data?.tracks && Array.isArray(result.data.tracks)) {
                        tracks = result.data.tracks;
                        playlistInfo = result.data.info || {};
                    }
                    break;
                    
                case 'search':
                    // Search results - data is an array of tracks
                    if (result.data && Array.isArray(result.data)) {
                        tracks = result.data;
                    }
                    break;
                    
                default:
                    // Fallback for unknown formats
                    if (result.data && Array.isArray(result.data)) {
                        tracks = result.data;
                    } else if (result.data && result.data.tracks && Array.isArray(result.data.tracks)) {
                        tracks = result.data.tracks;
                        playlistInfo = result.data.info || {};
                    } else if (result.data && result.data.encoded) {
                        // Single track fallback
                        tracks = [result.data];
                    }
                    break;
            }

            if (!tracks || tracks.length === 0) {
                this.client.logger.debug('No tracks found in result');
                return null;
            }

            // Return in expected format
            return {
                loadType: result.loadType,
                tracks: tracks,
                playlistInfo: playlistInfo
            };
        } catch (error) {
            this.client.logger.error('MusicPlayerManager search error:', error);
            return null;
        }
    }

    formatSearchQuery(query, source) {
        // Check if it's already a URL
        if (query.startsWith('http://') || query.startsWith('https://')) {
            return query;
        }
        
        // Format search query based on source
        const sourceMapping = {
            youtube: 'ytsearch',
            soundcloud: 'scsearch',
            spotify: 'spsearch'
        };
        
        const searchPrefix = sourceMapping[source] || 'ytsearch';
        return `${searchPrefix}:${query}`;
    }

    getAllPlayers() {
        return this.players; // Return the Map directly
    }

    getAllPlayersArray() {
        return Array.from(this.players.values());
    }

    getPlayerCount() {
        return this.players.size;
    }
}

module.exports = MusicPlayerManager;
