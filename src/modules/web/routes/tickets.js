/**
 * Ticket System Routes
 */

const express = require('express');
const router = express.Router();
const { verifyToken, validateGuildAccess, requireModerator, rateLimit } = require('../middleware/auth');
const Ticket = require('../../../schemas/Ticket');
const TicketConfig = require('../../../schemas/TicketConfig');

// Apply authentication and rate limiting to all routes
router.use(verifyToken);
router.use(rateLimit(60000, 50)); // 50 requests per minute

/**
 * GET /api/tickets/:guildId
 * Get all tickets for a guild
 */
router.get('/:guildId', validateGuildAccess, requireModerator, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const status = req.query.status; // open, closed, all
        
        const query = { guildId: req.guild.id };
        if (status && status !== 'all') {
            query.status = status;
        }
        
        const total = await Ticket.countDocuments(query);
        const tickets = await Ticket.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);
        
        res.json({
            success: true,
            tickets,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        req.client.logger.error('Tickets fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch tickets'
        });
    }
});

/**
 * GET /api/tickets/:guildId/config
 * Get ticket system configuration
 */
router.get('/:guildId/config', validateGuildAccess, requireModerator, async (req, res) => {
    try {
        const config = await TicketConfig.findOne({ guildId: req.guild.id });
        
        res.json({
            success: true,
            config: config || {
                enabled: false,
                categoryId: null,
                supportRoles: [],
                maxTicketsPerUser: 1,
                autoClose: false,
                autoCloseTime: 24
            }
        });
        
    } catch (error) {
        req.client.logger.error('Ticket config fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch ticket configuration'
        });
    }
});

/**
 * PUT /api/tickets/:guildId/config
 * Update ticket system configuration
 */
router.put('/:guildId/config', validateGuildAccess, requireModerator, async (req, res) => {
    try {
        const updates = req.body;
        
        let config = await TicketConfig.findOne({ guildId: req.guild.id });
        if (!config) {
            config = new TicketConfig({ guildId: req.guild.id });
        }
        
        // Update allowed fields
        const allowedFields = ['enabled', 'categoryId', 'supportRoles', 'maxTicketsPerUser', 'autoClose', 'autoCloseTime'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                config[field] = updates[field];
            }
        });
        
        await config.save();
        
        res.json({
            success: true,
            message: 'Ticket configuration updated',
            config
        });
        
    } catch (error) {
        req.client.logger.error('Ticket config update error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update ticket configuration'
        });
    }
});

/**
 * POST /api/tickets/:guildId/:ticketId/close
 * Close a ticket
 */
router.post('/:guildId/:ticketId/close', validateGuildAccess, requireModerator, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { reason } = req.body;
        
        const ticket = await Ticket.findOne({
            _id: ticketId,
            guildId: req.guild.id
        });
        
        if (!ticket) {
            return res.status(404).json({
                error: 'Ticket Not Found',
                message: 'Ticket does not exist'
            });
        }
        
        if (ticket.status === 'closed') {
            return res.status(400).json({
                error: 'Already Closed',
                message: 'Ticket is already closed'
            });
        }
        
        ticket.status = 'closed';
        ticket.closedBy = req.member.id;
        ticket.closedAt = new Date();
        ticket.closeReason = reason || 'No reason provided';
        
        await ticket.save();
        
        res.json({
            success: true,
            message: 'Ticket closed successfully',
            ticket
        });
        
    } catch (error) {
        req.client.logger.error('Close ticket error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to close ticket'
        });
    }
});

module.exports = router;