/**
 * Guild Management Routes
 */

const express = require('express');
const router = express.Router();
const { verifyToken, validateGuildAccess, requireAdmin, rateLimit } = require('../middleware/auth');
const Guild = require('../../../schemas/Guild');

// Apply authentication and rate limiting to all routes
router.use(verifyToken);
router.use(rateLimit(60000, 50)); // 50 requests per minute

/**
 * GET /api/guild/:guildId
 * Get guild information and bot settings
 */
router.get('/:guildId', validateGuildAccess, async (req, res) => {
    try {
        const guildSettings = await Guild.findByGuildId(req.guild.id) || 
                             await Guild.createDefault(req.guild.id, req.guild.name);
        
        res.json({
            success: true,
            guild: {
                id: req.guild.id,
                name: req.guild.name,
                icon: req.guild.iconURL(),
                memberCount: req.guild.memberCount,
                botJoinedAt: req.guild.joinedAt,
                features: req.guild.features,
                settings: guildSettings
            }
        });
        
    } catch (error) {
        req.client.logger.error('Guild fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch guild information'
        });
    }
});

/**
 * PUT /api/guild/:guildId/settings
 * Update guild settings (admin only)
 */
router.put('/:guildId/settings', validateGuildAccess, requireAdmin, async (req, res) => {
    try {
        const updates = req.body;
        
        // Find or create guild settings
        let guildSettings = await Guild.findByGuildId(req.guild.id);
        if (!guildSettings) {
            guildSettings = await Guild.createDefault(req.guild.id, req.guild.name);
        }
        
        // Update allowed fields
        const allowedFields = [
            'musicSettings',
            'commandSettings', 
            'queueSettings',
            'logging',
            'chatbot',
            'messageLinkEmbed',
            'welcomeSystem',
            'autoRole',
            'permissions'
        ];
        
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                guildSettings[field] = { ...guildSettings[field], ...updates[field] };
            }
        }
        
        await guildSettings.save();
        
        res.json({
            success: true,
            message: 'Guild settings updated successfully',
            settings: guildSettings
        });
        
    } catch (error) {
        req.client.logger.error('Guild settings update error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update guild settings'
        });
    }
});

/**
 * GET /api/guild/:guildId/channels
 * Get list of channels in the guild
 */
router.get('/:guildId/channels', validateGuildAccess, (req, res) => {
    try {
        const channels = req.guild.channels.cache
            .filter(channel => channel.type !== 4) // Exclude category channels
            .map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type,
                position: channel.position,
                parentId: channel.parentId,
                permission: {
                    viewChannel: channel.permissionsFor(req.member)?.has('ViewChannel') || false,
                    sendMessages: channel.permissionsFor(req.member)?.has('SendMessages') || false,
                    manageChannel: channel.permissionsFor(req.member)?.has('ManageChannels') || false
                }
            }))
            .sort((a, b) => a.position - b.position);
        
        res.json({
            success: true,
            channels
        });
        
    } catch (error) {
        req.client.logger.error('Channels fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch guild channels'
        });
    }
});

/**
 * GET /api/guild/:guildId/roles
 * Get list of roles in the guild
 */
router.get('/:guildId/roles', validateGuildAccess, (req, res) => {
    try {
        const roles = req.guild.roles.cache
            .filter(role => role.id !== req.guild.id) // Exclude @everyone role
            .map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor,
                position: role.position,
                permissions: role.permissions.toArray(),
                managed: role.managed,
                mentionable: role.mentionable,
                memberCount: role.members.size
            }))
            .sort((a, b) => b.position - a.position);
        
        res.json({
            success: true,
            roles
        });
        
    } catch (error) {
        req.client.logger.error('Roles fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch guild roles'
        });
    }
});

/**
 * GET /api/guild/:guildId/members
 * Get list of members in the guild (with pagination)
 */
router.get('/:guildId/members', validateGuildAccess, (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const search = req.query.search?.toLowerCase();
        
        let members = Array.from(req.guild.members.cache.values());
        
        // Apply search filter
        if (search) {
            members = members.filter(member => 
                member.user.username.toLowerCase().includes(search) ||
                member.displayName.toLowerCase().includes(search) ||
                member.user.id.includes(search)
            );
        }
        
        // Sort by join date (newest first)
        members.sort((a, b) => b.joinedTimestamp - a.joinedTimestamp);
        
        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedMembers = members.slice(startIndex, endIndex);
        
        const memberData = paginatedMembers.map(member => ({
            id: member.user.id,
            username: member.user.username,
            displayName: member.displayName,
            avatar: member.user.displayAvatarURL(),
            joinedAt: member.joinedAt,
            roles: member.roles.cache
                .filter(role => role.id !== req.guild.id)
                .map(role => ({
                    id: role.id,
                    name: role.name,
                    color: role.hexColor
                })),
            permissions: {
                administrator: member.permissions.has('Administrator'),
                manageGuild: member.permissions.has('ManageGuild'),
                moderateMembers: member.permissions.has('ModerateMembers')
            }
        }));
        
        res.json({
            success: true,
            members: memberData,
            pagination: {
                page,
                limit,
                total: members.length,
                totalPages: Math.ceil(members.length / limit),
                hasNext: endIndex < members.length,
                hasPrev: page > 1
            }
        });
        
    } catch (error) {
        req.client.logger.error('Members fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch guild members'
        });
    }
});

/**
 * GET /api/guild/:guildId/stats
 * Get guild statistics
 */
router.get('/:guildId/stats', validateGuildAccess, async (req, res) => {
    try {
        const guildSettings = await Guild.findByGuildId(req.guild.id);
        
        // Calculate basic stats
        const stats = {
            members: {
                total: req.guild.memberCount,
                online: req.guild.members.cache.filter(m => m.presence?.status === 'online').size,
                bots: req.guild.members.cache.filter(m => m.user.bot).size
            },
            channels: {
                total: req.guild.channels.cache.size,
                text: req.guild.channels.cache.filter(c => c.type === 0).size,
                voice: req.guild.channels.cache.filter(c => c.type === 2).size,
                categories: req.guild.channels.cache.filter(c => c.type === 4).size
            },
            roles: req.guild.roles.cache.size - 1, // Exclude @everyone
            bot: {
                joinedAt: req.guild.joinedAt,
                commandsUsed: guildSettings?.stats?.commandsUsed || 0,
                songsPlayed: guildSettings?.stats?.songsPlayed || 0,
                totalPlaytime: guildSettings?.stats?.totalPlaytime || 0,
                lastActivity: guildSettings?.stats?.lastActivity
            }
        };
        
        res.json({
            success: true,
            stats
        });
        
    } catch (error) {
        req.client.logger.error('Stats fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch guild statistics'
        });
    }
});

module.exports = router;