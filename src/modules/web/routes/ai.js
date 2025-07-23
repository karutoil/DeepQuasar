/**
 * AI/Chatbot Configuration Routes
 */

const express = require('express');
const router = express.Router();
const { verifyToken, validateGuildAccess, requireAdmin, rateLimit } = require('../middleware/auth');
const Guild = require('../../../schemas/Guild');

// Apply authentication and rate limiting to all routes
router.use(verifyToken);
router.use(rateLimit(60000, 30)); // 30 requests per minute

/**
 * GET /api/ai/:guildId/config
 * Get AI/chatbot configuration
 */
router.get('/:guildId/config', validateGuildAccess, requireAdmin, async (req, res) => {
    try {
        const guildSettings = await Guild.findByGuildId(req.guild.id);
        
        if (!guildSettings) {
            return res.json({
                success: true,
                config: {
                    enabled: false,
                    model: 'gpt-3.5-turbo',
                    maxTokens: 500,
                    temperature: 0.7,
                    systemPrompt: 'You are a helpful Discord bot assistant. Be friendly, concise, and helpful.',
                    responseChance: 10,
                    channelMode: 'all',
                    whitelistedChannels: [],
                    blacklistedChannels: [],
                    ignoreBots: true,
                    requireMention: false,
                    cooldown: 5000,
                    maxMessageLength: 2000,
                    conversationEnabled: true
                }
            });
        }
        
        res.json({
            success: true,
            config: guildSettings.chatbot
        });
        
    } catch (error) {
        req.client.logger.error('AI config fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch AI configuration'
        });
    }
});

/**
 * PUT /api/ai/:guildId/config
 * Update AI/chatbot configuration
 */
router.put('/:guildId/config', validateGuildAccess, requireAdmin, async (req, res) => {
    try {
        const updates = req.body;
        
        let guildSettings = await Guild.findByGuildId(req.guild.id);
        if (!guildSettings) {
            guildSettings = await Guild.createDefault(req.guild.id, req.guild.name);
        }
        
        // Update chatbot settings
        const allowedFields = [
            'enabled', 'model', 'maxTokens', 'temperature', 'systemPrompt',
            'responseChance', 'channelMode', 'whitelistedChannels', 'blacklistedChannels',
            'ignoreBots', 'requireMention', 'cooldown', 'maxMessageLength', 'conversationEnabled'
        ];
        
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                guildSettings.chatbot[field] = updates[field];
            }
        });
        
        // Validate numeric fields
        if (guildSettings.chatbot.maxTokens < 50) guildSettings.chatbot.maxTokens = 50;
        if (guildSettings.chatbot.maxTokens > 4000) guildSettings.chatbot.maxTokens = 4000;
        if (guildSettings.chatbot.temperature < 0) guildSettings.chatbot.temperature = 0;
        if (guildSettings.chatbot.temperature > 2) guildSettings.chatbot.temperature = 2;
        if (guildSettings.chatbot.responseChance < 0) guildSettings.chatbot.responseChance = 0;
        if (guildSettings.chatbot.responseChance > 100) guildSettings.chatbot.responseChance = 100;
        if (guildSettings.chatbot.cooldown < 1000) guildSettings.chatbot.cooldown = 1000;
        if (guildSettings.chatbot.cooldown > 60000) guildSettings.chatbot.cooldown = 60000;
        if (guildSettings.chatbot.maxMessageLength < 100) guildSettings.chatbot.maxMessageLength = 100;
        if (guildSettings.chatbot.maxMessageLength > 4000) guildSettings.chatbot.maxMessageLength = 4000;
        
        await guildSettings.save();
        
        res.json({
            success: true,
            message: 'AI configuration updated successfully',
            config: guildSettings.chatbot
        });
        
    } catch (error) {
        req.client.logger.error('AI config update error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update AI configuration'
        });
    }
});

/**
 * POST /api/ai/:guildId/test
 * Test AI response (admin only)
 */
router.post('/:guildId/test', validateGuildAccess, requireAdmin, async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Test message is required'
            });
        }
        
        // Check if chatbot is available
        if (!req.client.chatBot) {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'AI chatbot service is not available'
            });
        }
        
        const guildSettings = await Guild.findByGuildId(req.guild.id);
        if (!guildSettings || !guildSettings.chatbot.enabled) {
            return res.status(400).json({
                error: 'AI Disabled',
                message: 'AI chatbot is not enabled for this guild'
            });
        }
        
        // Create a mock message object for testing
        const mockMessage = {
            content: message.trim(),
            author: req.member.user,
            guild: req.guild,
            channel: { id: 'test-channel' }
        };
        
        // Test the AI response
        const response = await req.client.chatBot.generateResponse(mockMessage, guildSettings.chatbot);
        
        res.json({
            success: true,
            input: message.trim(),
            response: response || 'No response generated',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        req.client.logger.error('AI test error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to test AI response'
        });
    }
});

/**
 * GET /api/ai/:guildId/stats
 * Get AI usage statistics
 */
router.get('/:guildId/stats', validateGuildAccess, requireAdmin, async (req, res) => {
    try {
        // This would require implementing usage tracking in the chatbot
        // For now, return basic information
        const guildSettings = await Guild.findByGuildId(req.guild.id);
        
        res.json({
            success: true,
            stats: {
                enabled: guildSettings?.chatbot?.enabled || false,
                model: guildSettings?.chatbot?.model || 'gpt-3.5-turbo',
                totalChannels: req.guild.channels.cache.filter(c => c.isTextBased()).size,
                whitelistedChannels: guildSettings?.chatbot?.whitelistedChannels?.length || 0,
                blacklistedChannels: guildSettings?.chatbot?.blacklistedChannels?.length || 0,
                responseChance: guildSettings?.chatbot?.responseChance || 10,
                // These would need to be tracked in the database
                messagesProcessed: 0,
                responsesGenerated: 0,
                averageResponseTime: 0
            }
        });
        
    } catch (error) {
        req.client.logger.error('AI stats fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch AI statistics'
        });
    }
});

module.exports = router;