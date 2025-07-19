/**
 * Temporary Voice Channels Routes
 */

const express = require('express');
const router = express.Router();
const { verifyToken, validateGuildAccess, requireAdmin, rateLimit } = require('../middleware/auth');
const TempVCInstance = require('../../../schemas/TempVCInstance');
const TempVCUserSettings = require('../../../schemas/TempVCUserSettings');

// Apply authentication and rate limiting to all routes
router.use(verifyToken);
router.use(rateLimit(60000, 50)); // 50 requests per minute

/**
 * GET /api/tempvc/:guildId/instances
 * Get all active temporary voice channels
 */
router.get('/:guildId/instances', validateGuildAccess, requireAdmin, async (req, res) => {
    try {
        const instances = await TempVCInstance.find({ guildId: req.guild.id });
        
        // Add live member count from Discord
        const enrichedInstances = instances.map(instance => {
            const channel = req.guild.channels.cache.get(instance.channelId);
            return {
                ...instance.toObject(),
                memberCount: channel ? channel.members.size : 0,
                exists: !!channel
            };
        });
        
        res.json({
            success: true,
            instances: enrichedInstances
        });
        
    } catch (error) {
        req.client.logger.error('TempVC instances fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch TempVC instances'
        });
    }
});

/**
 * GET /api/tempvc/:guildId/settings/:userId
 * Get user's TempVC settings
 */
router.get('/:guildId/settings/:userId', validateGuildAccess, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Users can only view their own settings unless admin
        if (userId !== req.auth.userId && !req.member.permissions.has('Administrator')) {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'Can only access your own settings'
            });
        }
        
        const settings = await TempVCUserSettings.findOne({
            guildId: req.guild.id,
            userId: userId
        });
        
        res.json({
            success: true,
            settings: settings?.defaultSettings || {}
        });
        
    } catch (error) {
        req.client.logger.error('TempVC settings fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch TempVC settings'
        });
    }
});

/**
 * PUT /api/tempvc/:guildId/settings/:userId
 * Update user's TempVC settings
 */
router.put('/:guildId/settings/:userId', validateGuildAccess, async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;
        
        // Users can only update their own settings unless admin
        if (userId !== req.auth.userId && !req.member.permissions.has('Administrator')) {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'Can only update your own settings'
            });
        }
        
        let settings = await TempVCUserSettings.findOne({
            guildId: req.guild.id,
            userId: userId
        });
        
        if (!settings) {
            settings = new TempVCUserSettings({
                guildId: req.guild.id,
                userId: userId,
                defaultSettings: {}
            });
        }
        
        // Update allowed fields
        const allowedFields = ['channelName', 'userLimit', 'bitrate', 'isPrivate', 'allowedUsers', 'blockedUsers'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                settings.defaultSettings[field] = updates[field];
            }
        });
        
        await settings.save();
        
        res.json({
            success: true,
            message: 'TempVC settings updated',
            settings: settings.defaultSettings
        });
        
    } catch (error) {
        req.client.logger.error('TempVC settings update error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update TempVC settings'
        });
    }
});

/**
 * DELETE /api/tempvc/:guildId/instances/:channelId
 * Delete a temporary voice channel (admin only)
 */
router.delete('/:guildId/instances/:channelId', validateGuildAccess, requireAdmin, async (req, res) => {
    try {
        const { channelId } = req.params;
        
        const instance = await TempVCInstance.findOne({
            guildId: req.guild.id,
            channelId: channelId
        });
        
        if (!instance) {
            return res.status(404).json({
                error: 'Instance Not Found',
                message: 'TempVC instance does not exist'
            });
        }
        
        // Delete the Discord channel
        const channel = req.guild.channels.cache.get(channelId);
        if (channel) {
            await channel.delete('Deleted via dashboard');
        }
        
        // Remove from database
        await TempVCInstance.deleteOne({ _id: instance._id });
        
        res.json({
            success: true,
            message: 'TempVC instance deleted successfully'
        });
        
    } catch (error) {
        req.client.logger.error('TempVC delete error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete TempVC instance'
        });
    }
});

module.exports = router;