/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { generateToken, verifyToken, validateGuildAccess } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Authenticate user with Discord OAuth2 or generate token for existing user
 */
router.post('/login', async (req, res) => {
    try {
        const { userId, guildId } = req.body;
        
        if (!userId || !guildId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'userId and guildId are required'
            });
        }
        
        // Validate that the guild exists and bot is in it
        const guild = req.client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({
                error: 'Guild Not Found',
                message: 'Bot is not a member of the specified guild'
            });
        }
        
        // Validate that user is a member of the guild
        const member = guild.members.cache.get(userId);
        if (!member) {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'User is not a member of the specified guild'
            });
        }
        
        // Generate JWT token
        const token = generateToken(userId, guildId);
        
        res.json({
            success: true,
            token,
            user: {
                id: member.user.id,
                username: member.user.username,
                displayName: member.displayName,
                avatar: member.user.displayAvatarURL(),
                permissions: {
                    administrator: member.permissions.has('Administrator'),
                    manageGuild: member.permissions.has('ManageGuild'),
                    moderateMembers: member.permissions.has('ModerateMembers'),
                    manageMessages: member.permissions.has('ManageMessages')
                }
            },
            guild: {
                id: guild.id,
                name: guild.name,
                icon: guild.iconURL(),
                memberCount: guild.memberCount
            }
        });
        
    } catch (error) {
        req.client.logger.error('Authentication error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authentication failed'
        });
    }
});

/**
 * POST /api/auth/verify
 * Verify if current token is valid
 */
router.post('/verify', verifyToken, validateGuildAccess, (req, res) => {
    res.json({
        success: true,
        valid: true,
        user: {
            id: req.member.user.id,
            username: req.member.user.username,
            displayName: req.member.displayName,
            avatar: req.member.user.displayAvatarURL(),
            permissions: {
                administrator: req.member.permissions.has('Administrator'),
                manageGuild: req.member.permissions.has('ManageGuild'),
                moderateMembers: req.member.permissions.has('ModerateMembers'),
                manageMessages: req.member.permissions.has('ManageMessages')
            }
        },
        guild: {
            id: req.guild.id,
            name: req.guild.name,
            icon: req.guild.iconURL(),
            memberCount: req.guild.memberCount
        }
    });
});

/**
 * GET /api/auth/guilds/:userId
 * Get list of guilds where user has admin permissions and bot is present
 */
router.get('/guilds/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'User ID is required'
            });
        }
        
        const userGuilds = [];
        
        for (const [guildId, guild] of req.client.guilds.cache) {
            const member = guild.members.cache.get(userId);
            
            if (member && (member.permissions.has('Administrator') || member.permissions.has('ManageGuild'))) {
                userGuilds.push({
                    id: guild.id,
                    name: guild.name,
                    icon: guild.iconURL(),
                    memberCount: guild.memberCount,
                    permissions: {
                        administrator: member.permissions.has('Administrator'),
                        manageGuild: member.permissions.has('ManageGuild')
                    }
                });
            }
        }
        
        res.json({
            success: true,
            guilds: userGuilds
        });
        
    } catch (error) {
        req.client.logger.error('Guild list error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch user guilds'
        });
    }
});

/**
 * POST /api/auth/refresh
 * Refresh an existing token
 */
router.post('/refresh', verifyToken, (req, res) => {
    try {
        // Generate new token with same user/guild
        const newToken = generateToken(req.auth.userId, req.auth.guildId);
        
        res.json({
            success: true,
            token: newToken
        });
        
    } catch (error) {
        req.client.logger.error('Token refresh error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to refresh token'
        });
    }
});

module.exports = router;