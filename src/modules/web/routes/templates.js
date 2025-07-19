/**
 * Template Management Routes
 */

const express = require('express');
const router = express.Router();
const { verifyToken, validateGuildAccess, requireAdmin, rateLimit } = require('../middleware/auth');
const EmbedTemplate = require('../../../schemas/EmbedTemplate');

// Apply authentication and rate limiting to all routes
router.use(verifyToken);
router.use(rateLimit(60000, 50)); // 50 requests per minute

/**
 * GET /api/templates/:guildId
 * Get all embed templates for the guild
 */
router.get('/:guildId', validateGuildAccess, async (req, res) => {
    try {
        const templates = await EmbedTemplate.find({ guildId: req.guild.id })
            .sort({ name: 1 });
        
        res.json({
            success: true,
            templates
        });
        
    } catch (error) {
        req.client.logger.error('Templates fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch templates'
        });
    }
});

/**
 * GET /api/templates/:guildId/:templateId
 * Get a specific template
 */
router.get('/:guildId/:templateId', validateGuildAccess, async (req, res) => {
    try {
        const { templateId } = req.params;
        
        const template = await EmbedTemplate.findOne({
            _id: templateId,
            guildId: req.guild.id
        });
        
        if (!template) {
            return res.status(404).json({
                error: 'Template Not Found',
                message: 'Template does not exist'
            });
        }
        
        res.json({
            success: true,
            template
        });
        
    } catch (error) {
        req.client.logger.error('Template fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch template'
        });
    }
});

/**
 * POST /api/templates/:guildId
 * Create a new embed template
 */
router.post('/:guildId', validateGuildAccess, requireAdmin, async (req, res) => {
    try {
        const { name, description, embedData } = req.body;
        
        if (!name || !embedData) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Name and embed data are required'
            });
        }
        
        // Check if template name already exists
        const existing = await EmbedTemplate.findOne({
            guildId: req.guild.id,
            name: name.trim()
        });
        
        if (existing) {
            return res.status(400).json({
                error: 'Already Exists',
                message: 'Template with this name already exists'
            });
        }
        
        const template = new EmbedTemplate({
            guildId: req.guild.id,
            name: name.trim(),
            description: description?.trim() || null,
            embedData,
            authorId: req.auth.userId,
            createdAt: new Date()
        });
        
        await template.save();
        
        res.json({
            success: true,
            message: 'Template created successfully',
            template
        });
        
    } catch (error) {
        req.client.logger.error('Create template error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create template'
        });
    }
});

/**
 * PUT /api/templates/:guildId/:templateId
 * Update an embed template
 */
router.put('/:guildId/:templateId', validateGuildAccess, requireAdmin, async (req, res) => {
    try {
        const { templateId } = req.params;
        const { name, description, embedData } = req.body;
        
        const template = await EmbedTemplate.findOne({
            _id: templateId,
            guildId: req.guild.id
        });
        
        if (!template) {
            return res.status(404).json({
                error: 'Template Not Found',
                message: 'Template does not exist'
            });
        }
        
        // Check if new name conflicts with existing template
        if (name && name.trim() !== template.name) {
            const existing = await EmbedTemplate.findOne({
                guildId: req.guild.id,
                name: name.trim(),
                _id: { $ne: templateId }
            });
            
            if (existing) {
                return res.status(400).json({
                    error: 'Already Exists',
                    message: 'Template with this name already exists'
                });
            }
        }
        
        // Update fields
        if (name) template.name = name.trim();
        if (description !== undefined) template.description = description?.trim() || null;
        if (embedData) template.embedData = embedData;
        template.updatedAt = new Date();
        
        await template.save();
        
        res.json({
            success: true,
            message: 'Template updated successfully',
            template
        });
        
    } catch (error) {
        req.client.logger.error('Update template error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update template'
        });
    }
});

/**
 * DELETE /api/templates/:guildId/:templateId
 * Delete an embed template
 */
router.delete('/:guildId/:templateId', validateGuildAccess, requireAdmin, async (req, res) => {
    try {
        const { templateId } = req.params;
        
        const template = await EmbedTemplate.findOneAndDelete({
            _id: templateId,
            guildId: req.guild.id
        });
        
        if (!template) {
            return res.status(404).json({
                error: 'Template Not Found',
                message: 'Template does not exist'
            });
        }
        
        res.json({
            success: true,
            message: 'Template deleted successfully'
        });
        
    } catch (error) {
        req.client.logger.error('Delete template error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete template'
        });
    }
});

/**
 * POST /api/templates/:guildId/:templateId/send
 * Send a template to a specific channel
 */
router.post('/:guildId/:templateId/send', validateGuildAccess, requireAdmin, async (req, res) => {
    try {
        const { templateId } = req.params;
        const { channelId } = req.body;
        
        if (!channelId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Channel ID is required'
            });
        }
        
        const template = await EmbedTemplate.findOne({
            _id: templateId,
            guildId: req.guild.id
        });
        
        if (!template) {
            return res.status(404).json({
                error: 'Template Not Found',
                message: 'Template does not exist'
            });
        }
        
        const channel = req.guild.channels.cache.get(channelId);
        if (!channel) {
            return res.status(404).json({
                error: 'Channel Not Found',
                message: 'Specified channel does not exist'
            });
        }
        
        if (!channel.isTextBased()) {
            return res.status(400).json({
                error: 'Invalid Channel',
                message: 'Channel must be a text channel'
            });
        }
        
        // Send the embed
        const message = await channel.send({ embeds: [template.embedData] });
        
        res.json({
            success: true,
            message: 'Template sent successfully',
            messageId: message.id,
            channelId: channel.id
        });
        
    } catch (error) {
        req.client.logger.error('Send template error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to send template'
        });
    }
});

module.exports = router;