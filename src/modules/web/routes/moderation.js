/**
 * Moderation Module Routes
 */

const express = require('express');
const router = express.Router();
const { verifyToken, validateGuildAccess, requireModerator, rateLimit } = require('../middleware/auth');
const ModLog = require('../../../schemas/ModLog');
const UserNotes = require('../../../schemas/UserNotes');
const PunishmentLog = require('../../../schemas/PunishmentLog');

// Apply authentication and rate limiting to all routes
router.use(verifyToken);
router.use(rateLimit(60000, 30)); // 30 requests per minute

/**
 * GET /api/moderation/:guildId/logs
 * Get moderation logs with pagination
 */
router.get('/:guildId/logs', validateGuildAccess, requireModerator, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const type = req.query.type; // Optional filter by action type
        const userId = req.query.userId; // Optional filter by user
        
        const query = { guildId: req.guild.id };
        if (type) query.action = type;
        if (userId) query.userId = userId;
        
        const total = await ModLog.countDocuments(query);
        const logs = await ModLog.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('userId', 'username discriminator avatar')
            .populate('moderatorId', 'username discriminator avatar');
        
        res.json({
            success: true,
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
        
    } catch (error) {
        req.client.logger.error('Moderation logs fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch moderation logs'
        });
    }
});

/**
 * POST /api/moderation/:guildId/kick
 * Kick a member from the guild
 */
router.post('/:guildId/kick', validateGuildAccess, requireModerator, async (req, res) => {
    try {
        const { userId, reason } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'User ID is required'
            });
        }
        
        const member = req.guild.members.cache.get(userId);
        if (!member) {
            return res.status(404).json({
                error: 'Member Not Found',
                message: 'User is not a member of this guild'
            });
        }
        
        // Check permissions
        if (!member.kickable) {
            return res.status(403).json({
                error: 'Insufficient Permissions',
                message: 'Cannot kick this member due to role hierarchy'
            });
        }
        
        if (member.permissions.has('Administrator')) {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'Cannot kick administrators'
            });
        }
        
        // Perform kick
        await member.kick(reason || 'No reason provided');
        
        // Log the action
        await ModLog.create({
            guildId: req.guild.id,
            userId: userId,
            moderatorId: req.member.id,
            action: 'KICK',
            reason: reason || 'No reason provided'
        });
        
        res.json({
            success: true,
            message: `Successfully kicked ${member.user.username}`,
            action: {
                type: 'kick',
                target: {
                    id: member.user.id,
                    username: member.user.username,
                    discriminator: member.user.discriminator
                },
                moderator: {
                    id: req.member.id,
                    username: req.member.user.username
                },
                reason: reason || 'No reason provided'
            }
        });
        
    } catch (error) {
        req.client.logger.error('Kick member error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to kick member'
        });
    }
});

/**
 * POST /api/moderation/:guildId/ban
 * Ban a user from the guild
 */
router.post('/:guildId/ban', validateGuildAccess, requireModerator, async (req, res) => {
    try {
        const { userId, reason, deleteMessageDays = 0 } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'User ID is required'
            });
        }
        
        // Check if user is already banned
        const existingBan = await req.guild.bans.fetch(userId).catch(() => null);
        if (existingBan) {
            return res.status(400).json({
                error: 'Already Banned',
                message: 'User is already banned from this guild'
            });
        }
        
        const member = req.guild.members.cache.get(userId);
        
        // If member exists, check permissions
        if (member) {
            if (!member.bannable) {
                return res.status(403).json({
                    error: 'Insufficient Permissions',
                    message: 'Cannot ban this member due to role hierarchy'
                });
            }
            
            if (member.permissions.has('Administrator')) {
                return res.status(403).json({
                    error: 'Access Denied',
                    message: 'Cannot ban administrators'
                });
            }
        }
        
        // Perform ban
        await req.guild.members.ban(userId, {
            reason: reason || 'No reason provided',
            deleteMessageDays: Math.min(deleteMessageDays, 7)
        });
        
        // Log the action
        await ModLog.create({
            guildId: req.guild.id,
            userId: userId,
            moderatorId: req.member.id,
            action: 'BAN',
            reason: reason || 'No reason provided'
        });
        
        const targetUser = member ? member.user : await req.client.users.fetch(userId).catch(() => null);
        
        res.json({
            success: true,
            message: `Successfully banned ${targetUser?.username || 'user'}`,
            action: {
                type: 'ban',
                target: {
                    id: userId,
                    username: targetUser?.username || 'Unknown',
                    discriminator: targetUser?.discriminator || '0000'
                },
                moderator: {
                    id: req.member.id,
                    username: req.member.user.username
                },
                reason: reason || 'No reason provided'
            }
        });
        
    } catch (error) {
        req.client.logger.error('Ban user error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to ban user'
        });
    }
});

/**
 * DELETE /api/moderation/:guildId/ban/:userId
 * Unban a user from the guild
 */
router.delete('/:guildId/ban/:userId', validateGuildAccess, requireModerator, async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        
        // Check if user is banned
        const ban = await req.guild.bans.fetch(userId).catch(() => null);
        if (!ban) {
            return res.status(404).json({
                error: 'Not Banned',
                message: 'User is not banned from this guild'
            });
        }
        
        // Perform unban
        await req.guild.members.unban(userId, reason || 'No reason provided');
        
        // Log the action
        await ModLog.create({
            guildId: req.guild.id,
            userId: userId,
            moderatorId: req.member.id,
            action: 'UNBAN',
            reason: reason || 'No reason provided'
        });
        
        res.json({
            success: true,
            message: `Successfully unbanned ${ban.user.username}`,
            action: {
                type: 'unban',
                target: {
                    id: ban.user.id,
                    username: ban.user.username,
                    discriminator: ban.user.discriminator
                },
                moderator: {
                    id: req.member.id,
                    username: req.member.user.username
                },
                reason: reason || 'No reason provided'
            }
        });
        
    } catch (error) {
        req.client.logger.error('Unban user error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to unban user'
        });
    }
});

/**
 * POST /api/moderation/:guildId/timeout
 * Timeout a member
 */
router.post('/:guildId/timeout', validateGuildAccess, requireModerator, async (req, res) => {
    try {
        const { userId, duration, reason } = req.body;
        
        if (!userId || !duration) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'User ID and duration are required'
            });
        }
        
        const member = req.guild.members.cache.get(userId);
        if (!member) {
            return res.status(404).json({
                error: 'Member Not Found',
                message: 'User is not a member of this guild'
            });
        }
        
        // Check permissions
        if (!member.moderatable) {
            return res.status(403).json({
                error: 'Insufficient Permissions',
                message: 'Cannot timeout this member due to role hierarchy'
            });
        }
        
        if (member.permissions.has('Administrator')) {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'Cannot timeout administrators'
            });
        }
        
        // Validate duration (max 28 days)
        const maxDuration = 28 * 24 * 60 * 60 * 1000; // 28 days in milliseconds
        const timeoutDuration = Math.min(parseInt(duration), maxDuration);
        
        // Perform timeout
        await member.timeout(timeoutDuration, reason || 'No reason provided');
        
        // Log the action
        await ModLog.create({
            guildId: req.guild.id,
            userId: userId,
            moderatorId: req.member.id,
            action: 'TIMEOUT',
            reason: reason || 'No reason provided',
            duration: timeoutDuration
        });
        
        res.json({
            success: true,
            message: `Successfully timed out ${member.user.username} for ${Math.floor(timeoutDuration / (60 * 1000))} minutes`,
            action: {
                type: 'timeout',
                target: {
                    id: member.user.id,
                    username: member.user.username,
                    discriminator: member.user.discriminator
                },
                moderator: {
                    id: req.member.id,
                    username: req.member.user.username
                },
                reason: reason || 'No reason provided',
                duration: timeoutDuration
            }
        });
        
    } catch (error) {
        req.client.logger.error('Timeout member error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to timeout member'
        });
    }
});

/**
 * GET /api/moderation/:guildId/user/:userId/notes
 * Get user notes
 */
router.get('/:guildId/user/:userId/notes', validateGuildAccess, requireModerator, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userNotes = await UserNotes.findOne({
            guildId: req.guild.id,
            userId: userId
        });
        
        res.json({
            success: true,
            notes: userNotes?.notes || []
        });
        
    } catch (error) {
        req.client.logger.error('User notes fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch user notes'
        });
    }
});

/**
 * POST /api/moderation/:guildId/user/:userId/notes
 * Add a note to a user
 */
router.post('/:guildId/user/:userId/notes', validateGuildAccess, requireModerator, async (req, res) => {
    try {
        const { userId } = req.params;
        const { note } = req.body;
        
        if (!note || note.trim().length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Note content is required'
            });
        }
        
        const newNote = {
            id: Date.now().toString(),
            moderatorId: req.member.id,
            moderatorTag: req.member.user.tag,
            note: note.trim(),
            createdAt: new Date()
        };
        
        let userNotes = await UserNotes.findOne({
            guildId: req.guild.id,
            userId: userId
        });
        
        if (!userNotes) {
            userNotes = new UserNotes({
                guildId: req.guild.id,
                userId: userId,
                notes: [newNote]
            });
        } else {
            userNotes.notes.push(newNote);
        }
        
        await userNotes.save();
        
        res.json({
            success: true,
            message: 'Note added successfully',
            note: newNote
        });
        
    } catch (error) {
        req.client.logger.error('Add user note error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to add user note'
        });
    }
});

module.exports = router;