/**
 * Role Management Routes (SelfRole & AutoRole)
 */

const express = require('express');
const router = express.Router();
const { verifyToken, validateGuildAccess, requireAdmin, rateLimit } = require('../middleware/auth');
const SelfRole = require('../../../schemas/SelfRole');

// Apply authentication and rate limiting to all routes
router.use(verifyToken);
router.use(rateLimit(60000, 50)); // 50 requests per minute

/**
 * GET /api/roles/:guildId/selfroles
 * Get all self-assignable roles
 */
router.get('/:guildId/selfroles', validateGuildAccess, async (req, res) => {
    try {
        const selfRoles = await SelfRole.find({ guildId: req.guild.id });
        
        // Enrich with Discord role data
        const enrichedRoles = selfRoles.map(selfRole => {
            const role = req.guild.roles.cache.get(selfRole.roleId);
            return {
                ...selfRole.toObject(),
                exists: !!role,
                role: role ? {
                    name: role.name,
                    color: role.hexColor,
                    position: role.position,
                    memberCount: role.members.size
                } : null
            };
        });
        
        res.json({
            success: true,
            selfRoles: enrichedRoles
        });
        
    } catch (error) {
        req.client.logger.error('Self roles fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch self roles'
        });
    }
});

/**
 * POST /api/roles/:guildId/selfroles
 * Add a new self-assignable role
 */
router.post('/:guildId/selfroles', validateGuildAccess, requireAdmin, async (req, res) => {
    try {
        const { roleId, emoji, description } = req.body;
        
        if (!roleId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Role ID is required'
            });
        }
        
        // Validate role exists
        const role = req.guild.roles.cache.get(roleId);
        if (!role) {
            return res.status(404).json({
                error: 'Role Not Found',
                message: 'Specified role does not exist'
            });
        }
        
        // Check if role is already a self role
        const existing = await SelfRole.findOne({ guildId: req.guild.id, roleId });
        if (existing) {
            return res.status(400).json({
                error: 'Already Exists',
                message: 'Role is already a self-assignable role'
            });
        }
        
        const selfRole = new SelfRole({
            guildId: req.guild.id,
            roleId,
            emoji: emoji || null,
            description: description || null
        });
        
        await selfRole.save();
        
        res.json({
            success: true,
            message: 'Self role added successfully',
            selfRole: {
                ...selfRole.toObject(),
                role: {
                    name: role.name,
                    color: role.hexColor,
                    position: role.position,
                    memberCount: role.members.size
                }
            }
        });
        
    } catch (error) {
        req.client.logger.error('Add self role error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to add self role'
        });
    }
});

/**
 * DELETE /api/roles/:guildId/selfroles/:roleId
 * Remove a self-assignable role
 */
router.delete('/:guildId/selfroles/:roleId', validateGuildAccess, requireAdmin, async (req, res) => {
    try {
        const { roleId } = req.params;
        
        const selfRole = await SelfRole.findOneAndDelete({
            guildId: req.guild.id,
            roleId
        });
        
        if (!selfRole) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Self role does not exist'
            });
        }
        
        res.json({
            success: true,
            message: 'Self role removed successfully'
        });
        
    } catch (error) {
        req.client.logger.error('Remove self role error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to remove self role'
        });
    }
});

/**
 * POST /api/roles/:guildId/assign/:userId/:roleId
 * Assign a role to a user (admin only)
 */
router.post('/:guildId/assign/:userId/:roleId', validateGuildAccess, requireAdmin, async (req, res) => {
    try {
        const { userId, roleId } = req.params;
        
        const member = req.guild.members.cache.get(userId);
        if (!member) {
            return res.status(404).json({
                error: 'Member Not Found',
                message: 'User is not a member of this guild'
            });
        }
        
        const role = req.guild.roles.cache.get(roleId);
        if (!role) {
            return res.status(404).json({
                error: 'Role Not Found',
                message: 'Specified role does not exist'
            });
        }
        
        if (member.roles.cache.has(roleId)) {
            return res.status(400).json({
                error: 'Already Has Role',
                message: 'User already has this role'
            });
        }
        
        await member.roles.add(role);
        
        res.json({
            success: true,
            message: `Successfully assigned ${role.name} to ${member.displayName}`
        });
        
    } catch (error) {
        req.client.logger.error('Assign role error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to assign role'
        });
    }
});

/**
 * DELETE /api/roles/:guildId/assign/:userId/:roleId
 * Remove a role from a user (admin only)
 */
router.delete('/:guildId/assign/:userId/:roleId', validateGuildAccess, requireAdmin, async (req, res) => {
    try {
        const { userId, roleId } = req.params;
        
        const member = req.guild.members.cache.get(userId);
        if (!member) {
            return res.status(404).json({
                error: 'Member Not Found',
                message: 'User is not a member of this guild'
            });
        }
        
        const role = req.guild.roles.cache.get(roleId);
        if (!role) {
            return res.status(404).json({
                error: 'Role Not Found',
                message: 'Specified role does not exist'
            });
        }
        
        if (!member.roles.cache.has(roleId)) {
            return res.status(400).json({
                error: 'Does Not Have Role',
                message: 'User does not have this role'
            });
        }
        
        await member.roles.remove(role);
        
        res.json({
            success: true,
            message: `Successfully removed ${role.name} from ${member.displayName}`
        });
        
    } catch (error) {
        req.client.logger.error('Remove role error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to remove role'
        });
    }
});

module.exports = router;