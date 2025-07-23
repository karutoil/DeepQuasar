/**
 * LFG (Looking for Group) Routes
 */

const express = require('express');
const router = express.Router();
const { verifyToken, validateGuildAccess, requireModerator, rateLimit } = require('../middleware/auth');
const LFGPost = require('../../../schemas/LFGPost');
const LFGSettings = require('../../../schemas/LFGSettings');

// Apply authentication and rate limiting to all routes
router.use(verifyToken);
router.use(rateLimit(60000, 50)); // 50 requests per minute

/**
 * GET /api/lfg/:guildId/posts
 * Get LFG posts
 */
router.get('/:guildId/posts', validateGuildAccess, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const game = req.query.game;
        const status = req.query.status || 'active'; // active, filled, expired
        
        const query = { guildId: req.guild.id };
        if (game) query.game = new RegExp(game, 'i');
        if (status !== 'all') query.status = status;
        
        const total = await LFGPost.countDocuments(query);
        const posts = await LFGPost.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);
        
        res.json({
            success: true,
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        req.client.logger.error('LFG posts fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch LFG posts'
        });
    }
});

/**
 * GET /api/lfg/:guildId/settings
 * Get LFG settings
 */
router.get('/:guildId/settings', validateGuildAccess, requireModerator, async (req, res) => {
    try {
        const settings = await LFGSettings.findOne({ guildId: req.guild.id });
        
        res.json({
            success: true,
            settings: settings || {
                enabled: false,
                channelId: null,
                autoDeleteAfter: 24,
                allowedGames: [],
                maxPostsPerUser: 3
            }
        });
        
    } catch (error) {
        req.client.logger.error('LFG settings fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch LFG settings'
        });
    }
});

/**
 * PUT /api/lfg/:guildId/settings
 * Update LFG settings
 */
router.put('/:guildId/settings', validateGuildAccess, requireModerator, async (req, res) => {
    try {
        const updates = req.body;
        
        let settings = await LFGSettings.findOne({ guildId: req.guild.id });
        if (!settings) {
            settings = new LFGSettings({ guildId: req.guild.id });
        }
        
        // Update allowed fields
        const allowedFields = ['enabled', 'channelId', 'autoDeleteAfter', 'allowedGames', 'maxPostsPerUser'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                settings[field] = updates[field];
            }
        });
        
        await settings.save();
        
        res.json({
            success: true,
            message: 'LFG settings updated',
            settings
        });
        
    } catch (error) {
        req.client.logger.error('LFG settings update error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update LFG settings'
        });
    }
});

/**
 * DELETE /api/lfg/:guildId/posts/:postId
 * Delete an LFG post
 */
router.delete('/:guildId/posts/:postId', validateGuildAccess, async (req, res) => {
    try {
        const { postId } = req.params;
        
        const post = await LFGPost.findOne({
            _id: postId,
            guildId: req.guild.id
        });
        
        if (!post) {
            return res.status(404).json({
                error: 'Post Not Found',
                message: 'LFG post does not exist'
            });
        }
        
        // Users can delete their own posts, moderators can delete any
        if (post.authorId !== req.auth.userId && !req.member.permissions.has('ModerateMembers')) {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'Can only delete your own posts'
            });
        }
        
        await LFGPost.deleteOne({ _id: postId });
        
        res.json({
            success: true,
            message: 'LFG post deleted successfully'
        });
        
    } catch (error) {
        req.client.logger.error('Delete LFG post error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete LFG post'
        });
    }
});

module.exports = router;