/**
 * User Management Routes
 */

const express = require('express');
const router = express.Router();
const { verifyToken, validateGuildAccess, requireModerator, rateLimit } = require('../middleware/auth');
const User = require('../../../schemas/User');

// Apply authentication and rate limiting to all routes
router.use(verifyToken);
router.use(rateLimit(60000, 50)); // 50 requests per minute

/**
 * GET /api/user/:guildId/:userId
 * Get user information
 */
router.get('/:guildId/:userId', validateGuildAccess, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Users can view their own info, moderators can view anyone's
        if (userId !== req.auth.userId && !req.member.permissions.has('ModerateMembers')) {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'Insufficient permissions to view user information'
            });
        }
        
        const member = req.guild.members.cache.get(userId);
        if (!member) {
            return res.status(404).json({
                error: 'User Not Found',
                message: 'User is not a member of this guild'
            });
        }
        
        const userDoc = await User.findOne({ userId: userId });
        
        res.json({
            success: true,
            user: {
                id: member.user.id,
                username: member.user.username,
                discriminator: member.user.discriminator,
                avatar: member.user.displayAvatarURL(),
                displayName: member.displayName,
                joinedAt: member.joinedAt,
                premiumSince: member.premiumSince,
                roles: member.roles.cache
                    .filter(role => role.id !== req.guild.id)
                    .map(role => ({
                        id: role.id,
                        name: role.name,
                        color: role.hexColor,
                        position: role.position
                    }))
                    .sort((a, b) => b.position - a.position),
                permissions: {
                    administrator: member.permissions.has('Administrator'),
                    manageGuild: member.permissions.has('ManageGuild'),
                    moderateMembers: member.permissions.has('ModerateMembers'),
                    manageMessages: member.permissions.has('ManageMessages')
                },
                database: userDoc || null
            }
        });
        
    } catch (error) {
        req.client.logger.error('User info fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch user information'
        });
    }
});

/**
 * GET /api/user/:guildId/search
 * Search for users in the guild
 */
router.get('/:guildId/search', validateGuildAccess, requireModerator, (req, res) => {
    try {
        const query = req.query.q?.toLowerCase();
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        
        if (!query || query.length < 2) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Search query must be at least 2 characters'
            });
        }
        
        const members = Array.from(req.guild.members.cache.values())
            .filter(member => 
                member.user.username.toLowerCase().includes(query) ||
                member.displayName.toLowerCase().includes(query) ||
                member.user.id.includes(query)
            )
            .slice(0, limit)
            .map(member => ({
                id: member.user.id,
                username: member.user.username,
                discriminator: member.user.discriminator,
                displayName: member.displayName,
                avatar: member.user.displayAvatarURL(),
                joinedAt: member.joinedAt
            }));
        
        res.json({
            success: true,
            users: members,
            query,
            count: members.length
        });
        
    } catch (error) {
        req.client.logger.error('User search error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to search users'
        });
    }
});

module.exports = router;