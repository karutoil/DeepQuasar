/**
 * Reminders Routes
 */

const express = require('express');
const router = express.Router();
const { verifyToken, validateGuildAccess, rateLimit } = require('../middleware/auth');
const Reminder = require('../../../schemas/Reminder');

// Apply authentication and rate limiting to all routes
router.use(verifyToken);
router.use(rateLimit(60000, 50)); // 50 requests per minute

/**
 * GET /api/reminders/:guildId
 * Get reminders for the guild
 */
router.get('/:guildId', validateGuildAccess, async (req, res) => {
    try {
        const userId = req.query.userId; // Optional filter by user
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        
        const query = { guildId: req.guild.id };
        
        // Users can only see their own reminders unless they're moderators
        if (userId) {
            if (userId !== req.auth.userId && !req.member.permissions.has('ModerateMembers')) {
                return res.status(403).json({
                    error: 'Access Denied',
                    message: 'Can only view your own reminders'
                });
            }
            query.userId = userId;
        } else if (!req.member.permissions.has('ModerateMembers')) {
            // Regular users can only see their own reminders
            query.userId = req.auth.userId;
        }
        
        const total = await Reminder.countDocuments(query);
        const reminders = await Reminder.find(query)
            .sort({ reminderTime: 1 })
            .limit(limit)
            .skip((page - 1) * limit);
        
        res.json({
            success: true,
            reminders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        req.client.logger.error('Reminders fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch reminders'
        });
    }
});

/**
 * POST /api/reminders/:guildId
 * Create a new reminder
 */
router.post('/:guildId', validateGuildAccess, async (req, res) => {
    try {
        const { message, reminderTime, channelId } = req.body;
        
        if (!message || !reminderTime) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Message and reminder time are required'
            });
        }
        
        const reminderDate = new Date(reminderTime);
        if (isNaN(reminderDate.getTime()) || reminderDate <= new Date()) {
            return res.status(400).json({
                error: 'Invalid Time',
                message: 'Reminder time must be a valid future date'
            });
        }
        
        // Validate channel if provided
        if (channelId) {
            const channel = req.guild.channels.cache.get(channelId);
            if (!channel) {
                return res.status(404).json({
                    error: 'Channel Not Found',
                    message: 'Specified channel does not exist'
                });
            }
        }
        
        const reminder = new Reminder({
            guildId: req.guild.id,
            userId: req.auth.userId,
            channelId: channelId || null,
            message: message.trim(),
            reminderTime: reminderDate,
            createdAt: new Date()
        });
        
        await reminder.save();
        
        res.json({
            success: true,
            message: 'Reminder created successfully',
            reminder
        });
        
    } catch (error) {
        req.client.logger.error('Create reminder error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create reminder'
        });
    }
});

/**
 * DELETE /api/reminders/:guildId/:reminderId
 * Delete a reminder
 */
router.delete('/:guildId/:reminderId', validateGuildAccess, async (req, res) => {
    try {
        const { reminderId } = req.params;
        
        const reminder = await Reminder.findOne({
            _id: reminderId,
            guildId: req.guild.id
        });
        
        if (!reminder) {
            return res.status(404).json({
                error: 'Reminder Not Found',
                message: 'Reminder does not exist'
            });
        }
        
        // Users can only delete their own reminders unless they're moderators
        if (reminder.userId !== req.auth.userId && !req.member.permissions.has('ModerateMembers')) {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'Can only delete your own reminders'
            });
        }
        
        await Reminder.deleteOne({ _id: reminderId });
        
        res.json({
            success: true,
            message: 'Reminder deleted successfully'
        });
        
    } catch (error) {
        req.client.logger.error('Delete reminder error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete reminder'
        });
    }
});

module.exports = router;