/**
 * Music Module Routes
 */

const express = require('express');
const router = express.Router();
const { verifyToken, validateGuildAccess, requireDJ, rateLimit } = require('../middleware/auth');

// Apply authentication and rate limiting to all routes
router.use(verifyToken);
router.use(rateLimit(60000, 30)); // 30 requests per minute

/**
 * GET /api/music/:guildId/player
 * Get current player status and queue
 */
router.get('/:guildId/player', validateGuildAccess, (req, res) => {
    try {
        const player = req.client.manager?.players.cache.get(req.guild.id);
        
        if (!player) {
            return res.json({
                success: true,
                player: null,
                queue: [],
                status: 'not_playing'
            });
        }
        
        const currentTrack = player.current;
        const queue = player.queue.map(track => ({
            title: track.title,
            author: track.author,
            duration: track.duration,
            uri: track.uri,
            requester: track.requester?.id || null,
            thumbnail: track.thumbnail
        }));
        
        res.json({
            success: true,
            player: {
                guildId: player.guildId,
                voiceChannelId: player.voiceChannelId,
                textChannelId: player.textChannelId,
                connected: player.connected,
                playing: player.playing,
                paused: player.paused,
                volume: player.volume,
                position: player.position,
                repeatMode: player.repeatMode,
                shuffled: player.shuffled
            },
            currentTrack: currentTrack ? {
                title: currentTrack.title,
                author: currentTrack.author,
                duration: currentTrack.duration,
                uri: currentTrack.uri,
                requester: currentTrack.requester?.id || null,
                thumbnail: currentTrack.thumbnail,
                position: player.position
            } : null,
            queue,
            status: player.playing ? 'playing' : player.paused ? 'paused' : 'stopped'
        });
        
    } catch (error) {
        req.client.logger.error('Music player fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch player status'
        });
    }
});

/**
 * POST /api/music/:guildId/play
 * Add a track to queue or start playing
 */
router.post('/:guildId/play', validateGuildAccess, requireDJ, async (req, res) => {
    try {
        const { query, voiceChannelId } = req.body;
        
        if (!query) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Search query is required'
            });
        }
        
        if (!voiceChannelId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Voice channel ID is required'
            });
        }
        
        // Validate voice channel
        const voiceChannel = req.guild.channels.cache.get(voiceChannelId);
        if (!voiceChannel || voiceChannel.type !== 2) {
            return res.status(400).json({
                error: 'Invalid Channel',
                message: 'Specified voice channel not found'
            });
        }
        
        // Check if manager exists
        if (!req.client.manager) {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'Music service is not available'
            });
        }
        
        // Get or create player
        let player = req.client.manager.players.cache.get(req.guild.id);
        if (!player) {
            player = req.client.manager.createPlayer({
                guildId: req.guild.id,
                voiceChannelId: voiceChannelId,
                textChannelId: req.body.textChannelId || null
            });
        }
        
        // Search for tracks
        const searchResult = await req.client.manager.search(query, req.member.user);
        
        if (!searchResult || !searchResult.tracks.length) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'No tracks found for the search query'
            });
        }
        
        // Add track(s) to queue
        const tracksAdded = searchResult.loadType === 'PLAYLIST_LOADED' 
            ? searchResult.tracks 
            : [searchResult.tracks[0]];
        
        for (const track of tracksAdded) {
            track.requester = req.member.user;
            player.queue.add(track);
        }
        
        // Connect and play if not already playing
        if (!player.connected) {
            await player.connect();
        }
        
        if (!player.playing && !player.paused) {
            await player.play();
        }
        
        res.json({
            success: true,
            message: tracksAdded.length === 1 
                ? `Added **${tracksAdded[0].title}** to queue`
                : `Added **${tracksAdded.length}** tracks to queue`,
            tracksAdded: tracksAdded.map(track => ({
                title: track.title,
                author: track.author,
                duration: track.duration,
                uri: track.uri,
                thumbnail: track.thumbnail
            })),
            queueLength: player.queue.size
        });
        
    } catch (error) {
        req.client.logger.error('Music play error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to play music'
        });
    }
});

/**
 * POST /api/music/:guildId/pause
 * Pause/resume playback
 */
router.post('/:guildId/pause', validateGuildAccess, requireDJ, (req, res) => {
    try {
        const player = req.client.manager?.players.cache.get(req.guild.id);
        
        if (!player || !player.current) {
            return res.status(400).json({
                error: 'No Active Player',
                message: 'No music is currently playing'
            });
        }
        
        if (player.paused) {
            player.resume();
            res.json({
                success: true,
                message: 'Music resumed',
                status: 'playing'
            });
        } else {
            player.pause();
            res.json({
                success: true,
                message: 'Music paused',
                status: 'paused'
            });
        }
        
    } catch (error) {
        req.client.logger.error('Music pause error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to pause/resume music'
        });
    }
});

/**
 * POST /api/music/:guildId/skip
 * Skip current track
 */
router.post('/:guildId/skip', validateGuildAccess, requireDJ, (req, res) => {
    try {
        const player = req.client.manager?.players.cache.get(req.guild.id);
        
        if (!player || !player.current) {
            return res.status(400).json({
                error: 'No Active Player',
                message: 'No music is currently playing'
            });
        }
        
        const skippedTrack = player.current.title;
        player.skip();
        
        res.json({
            success: true,
            message: `Skipped **${skippedTrack}**`,
            queueLength: player.queue.size
        });
        
    } catch (error) {
        req.client.logger.error('Music skip error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to skip track'
        });
    }
});

/**
 * POST /api/music/:guildId/stop
 * Stop playback and clear queue
 */
router.post('/:guildId/stop', validateGuildAccess, requireDJ, (req, res) => {
    try {
        const player = req.client.manager?.players.cache.get(req.guild.id);
        
        if (!player) {
            return res.status(400).json({
                error: 'No Active Player',
                message: 'No music player is active'
            });
        }
        
        player.destroy();
        
        res.json({
            success: true,
            message: 'Music stopped and queue cleared'
        });
        
    } catch (error) {
        req.client.logger.error('Music stop error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to stop music'
        });
    }
});

/**
 * POST /api/music/:guildId/volume
 * Set playback volume
 */
router.post('/:guildId/volume', validateGuildAccess, requireDJ, (req, res) => {
    try {
        const { volume } = req.body;
        
        if (volume === undefined || volume < 0 || volume > 150) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Volume must be between 0 and 150'
            });
        }
        
        const player = req.client.manager?.players.cache.get(req.guild.id);
        
        if (!player) {
            return res.status(400).json({
                error: 'No Active Player',
                message: 'No music player is active'
            });
        }
        
        player.setVolume(volume);
        
        res.json({
            success: true,
            message: `Volume set to ${volume}%`,
            volume
        });
        
    } catch (error) {
        req.client.logger.error('Music volume error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to set volume'
        });
    }
});

/**
 * POST /api/music/:guildId/seek
 * Seek to position in current track
 */
router.post('/:guildId/seek', validateGuildAccess, requireDJ, (req, res) => {
    try {
        const { position } = req.body;
        
        if (position === undefined || position < 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Position must be a positive number in milliseconds'
            });
        }
        
        const player = req.client.manager?.players.cache.get(req.guild.id);
        
        if (!player || !player.current) {
            return res.status(400).json({
                error: 'No Active Player',
                message: 'No music is currently playing'
            });
        }
        
        if (position > player.current.duration) {
            return res.status(400).json({
                error: 'Invalid Position',
                message: 'Position exceeds track duration'
            });
        }
        
        player.seek(position);
        
        res.json({
            success: true,
            message: `Seeked to ${Math.floor(position / 1000)}s`,
            position
        });
        
    } catch (error) {
        req.client.logger.error('Music seek error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to seek in track'
        });
    }
});

/**
 * DELETE /api/music/:guildId/queue/:index
 * Remove track from queue
 */
router.delete('/:guildId/queue/:index', validateGuildAccess, requireDJ, (req, res) => {
    try {
        const index = parseInt(req.params.index);
        
        if (isNaN(index) || index < 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid queue index'
            });
        }
        
        const player = req.client.manager?.players.cache.get(req.guild.id);
        
        if (!player) {
            return res.status(400).json({
                error: 'No Active Player',
                message: 'No music player is active'
            });
        }
        
        if (index >= player.queue.size) {
            return res.status(400).json({
                error: 'Invalid Index',
                message: 'Queue index out of range'
            });
        }
        
        const removedTrack = player.queue[index];
        player.queue.splice(index, 1);
        
        res.json({
            success: true,
            message: `Removed **${removedTrack.title}** from queue`,
            queueLength: player.queue.size
        });
        
    } catch (error) {
        req.client.logger.error('Queue remove error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to remove track from queue'
        });
    }
});

module.exports = router;