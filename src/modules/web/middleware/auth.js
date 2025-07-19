/**
 * Authentication and Authorization Middleware
 */

const jwt = require('jsonwebtoken');
const axios = require('axios');
const Guild = require('../../../schemas/Guild');

/**
 * Verify Discord access token with Discord API
 */
async function verifyDiscordToken(accessToken) {
    try {
        const response = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'DeepQuasar Dashboard (https://github.com/karutoil/DeepQuasar, 1.0.0)'
            },
            timeout: 10000
        });
        
        return {
            success: true,
            user: response.data
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.status === 401 ? 'Invalid token' : 'Discord API error'
        };
    }
}

/**
 * Get user's guilds from Discord API
 */
async function getUserGuilds(accessToken) {
    try {
        const response = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'DeepQuasar Dashboard (https://github.com/karutoil/DeepQuasar, 1.0.0)'
            },
            timeout: 10000
        });
        
        return {
            success: true,
            guilds: response.data
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.status === 401 ? 'Invalid token' : 'Discord API error'
        };
    }
}

/**
 * Generate JWT token for authenticated user
 */
function generateToken(userId, guildId) {
    const payload = {
        userId,
        guildId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };
    
    const secret = process.env.WEB_SECRET || 'your_web_dashboard_secret_here';
    return jwt.sign(payload, secret);
}

/**
 * Verify JWT token middleware
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Authentication Required',
            message: 'No valid authorization header provided'
        });
    }
    
    const token = authHeader.substring(7);
    const secret = process.env.WEB_SECRET || 'your_web_dashboard_secret_here';
    
    try {
        const decoded = jwt.verify(token, secret);
        req.auth = {
            userId: decoded.userId,
            guildId: decoded.guildId
        };
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication Error',
                message: 'Token has expired'
            });
        }
        
        return res.status(401).json({
            error: 'Authentication Error',
            message: 'Invalid token'
        });
    }
}

/**
 * Validate guild access middleware
 */
async function validateGuildAccess(req, res, next) {
    try {
        const guildId = req.params.guildId || req.auth.guildId;
        
        if (!guildId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Guild ID is required'
            });
        }
        
        // Check if bot is in the guild
        const guild = req.client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({
                error: 'Guild Not Found',
                message: 'Bot is not a member of this guild'
            });
        }
        
        // Check if user is a member of the guild
        const member = guild.members.cache.get(req.auth.userId);
        if (!member) {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'You are not a member of this guild'
            });
        }
        
        // Add guild and member to request
        req.guild = guild;
        req.member = member;
        
        next();
    } catch (error) {
        req.client.logger.error('Guild validation error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to validate guild access'
        });
    }
}

/**
 * Check if user has admin permissions in the guild
 */
function requireAdmin(req, res, next) {
    if (!req.member) {
        return res.status(403).json({
            error: 'Access Denied',
            message: 'Guild membership required'
        });
    }
    
    const hasAdminPerms = req.member.permissions.has('Administrator') ||
                         req.member.permissions.has('ManageGuild');
    
    if (!hasAdminPerms) {
        return res.status(403).json({
            error: 'Access Denied',
            message: 'Administrator permissions required'
        });
    }
    
    next();
}

/**
 * Check if user has moderator permissions in the guild
 */
function requireModerator(req, res, next) {
    if (!req.member) {
        return res.status(403).json({
            error: 'Access Denied',
            message: 'Guild membership required'
        });
    }
    
    const hasModPerms = req.member.permissions.has('Administrator') ||
                       req.member.permissions.has('ManageGuild') ||
                       req.member.permissions.has('ModerateMembers') ||
                       req.member.permissions.has('ManageMessages');
    
    if (!hasModPerms) {
        return res.status(403).json({
            error: 'Access Denied',
            message: 'Moderator permissions required'
        });
    }
    
    next();
}

/**
 * Check if user has DJ permissions (for music commands)
 */
async function requireDJ(req, res, next) {
    try {
        if (!req.member) {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'Guild membership required'
            });
        }
        
        // Admins always have DJ permissions
        const hasAdminPerms = req.member.permissions.has('Administrator') ||
                             req.member.permissions.has('ManageGuild');
        
        if (hasAdminPerms) {
            return next();
        }
        
        // Check for DJ role from guild settings
        const guildSettings = await Guild.findByGuildId(req.guild.id);
        if (guildSettings && guildSettings.permissions.djRole) {
            const hasDJRole = req.member.roles.cache.has(guildSettings.permissions.djRole);
            if (!hasDJRole) {
                return res.status(403).json({
                    error: 'Access Denied',
                    message: 'DJ role required'
                });
            }
        }
        
        next();
    } catch (error) {
        req.client.logger.error('DJ permission check error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to validate DJ permissions'
        });
    }
}

/**
 * Rate limiting middleware (simple in-memory implementation)
 */
const rateLimitStore = new Map();

function rateLimit(windowMs = 60000, maxRequests = 100) {
    return (req, res, next) => {
        const identifier = req.auth ? req.auth.userId : req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Clean up old entries
        const userRequests = rateLimitStore.get(identifier) || [];
        const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
        
        if (validRequests.length >= maxRequests) {
            return res.status(429).json({
                error: 'Rate Limit Exceeded',
                message: 'Too many requests, please try again later'
            });
        }
        
        validRequests.push(now);
        rateLimitStore.set(identifier, validRequests);
        
        next();
    };
}

module.exports = {
    verifyDiscordToken,
    getUserGuilds,
    generateToken,
    verifyToken,
    validateGuildAccess,
    requireAdmin,
    requireModerator,
    requireDJ,
    rateLimit
};