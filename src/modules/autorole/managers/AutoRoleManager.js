const Utils = require('./utils');

class AutoRoleManager {
    constructor(client) {
        this.client = client;
        this.logger = client.logger;
        this.pendingRoles = new Map(); // Store pending role assignments with delays
    }

    /**
     * Handle member join for autorole
     * @param {GuildMember} member - The member who joined
     */
    async handleMemberJoin(member) {
        try {
            // Skip if member is a bot and botBypass is enabled
            const guildData = await Utils.getGuildData(member.guild.id);
            if (!guildData || !guildData.autoRole.enabled) {
                return;
            }

            // Skip bots if botBypass is enabled
            if (member.user.bot && guildData.autoRole.botBypass) {
                return;
            }

            // Skip if verification is required and member is not verified
            if (guildData.autoRole.requireVerification && member.pending) {
                return;
            }

            // Get the role
            const role = member.guild.roles.cache.get(guildData.autoRole.roleId);
            if (!role) {
                this.logger.warn(`AutoRole: Role ${guildData.autoRole.roleId} not found in guild ${member.guild.name} (${member.guild.id})`);
                return;
            }

            // Check if bot has permission to manage this role
            if (!member.guild.members.me.permissions.has('ManageRoles') || role.position >= member.guild.members.me.roles.highest.position) {
                this.logger.warn(`AutoRole: Insufficient permissions to assign role ${role.name} in guild ${member.guild.name}`);
                return;
            }

            // Check if member already has the role
            if (member.roles.cache.has(role.id)) {
                return;
            }

            // Apply role with delay if specified
            if (guildData.autoRole.delay > 0) {
                this.scheduleRoleAssignment(member, role, guildData.autoRole.delay);
            } else {
                await this.assignRole(member, role);
            }

        } catch (error) {
            this.logger.error(`AutoRole error for ${member.user.tag} in ${member.guild.name}:`, error);
        }
    }

    /**
     * Handle member update (for verification changes)
     * @param {GuildMember} oldMember - The member before update
     * @param {GuildMember} newMember - The member after update
     */
    async handleMemberUpdate(oldMember, newMember) {
        try {
            // Check if member verification status changed
            if (oldMember.pending && !newMember.pending) {
                const guildData = await Utils.getGuildData(newMember.guild.id);
                if (guildData && guildData.autoRole.enabled && guildData.autoRole.requireVerification) {
                    // Member is now verified, apply autorole
                    await this.handleMemberJoin(newMember);
                }
            }
        } catch (error) {
            this.logger.error(`AutoRole member update error for ${newMember.user.tag}:`, error);
        }
    }

    /**
     * Schedule role assignment with delay
     * @param {GuildMember} member - The member to assign role to
     * @param {Role} role - The role to assign
     * @param {number} delay - Delay in seconds
     */
    scheduleRoleAssignment(member, role, delay) {
        const key = `${member.guild.id}-${member.id}`;
        
        // Clear existing timeout if any
        if (this.pendingRoles.has(key)) {
            clearTimeout(this.pendingRoles.get(key));
        }

        // Schedule new assignment
        const timeout = setTimeout(async () => {
            try {
                // Check if member is still in guild
                const currentMember = member.guild.members.cache.get(member.id);
                if (currentMember && !currentMember.roles.cache.has(role.id)) {
                    await this.assignRole(currentMember, role);
                }
            } catch (error) {
                this.logger.error(`AutoRole delayed assignment error for ${member.user.tag}:`, error);
            } finally {
                this.pendingRoles.delete(key);
            }
        }, delay * 1000);

        this.pendingRoles.set(key, timeout);
    }

    /**
     * Assign role to member
     * @param {GuildMember} member - The member to assign role to
     * @param {Role} role - The role to assign
     */
    async assignRole(member, role) {
        try {
            await member.roles.add(role, 'AutoRole system');
            this.logger.info(`AutoRole: Assigned role "${role.name}" to ${member.user.tag} in ${member.guild.name}`);
        } catch (error) {
            this.logger.error(`AutoRole: Failed to assign role "${role.name}" to ${member.user.tag}:`, error);
        }
    }

    /**
     * Cancel pending role assignment
     * @param {string} guildId - Guild ID
     * @param {string} memberId - Member ID
     */
    cancelPendingAssignment(guildId, memberId) {
        const key = `${guildId}-${memberId}`;
        if (this.pendingRoles.has(key)) {
            clearTimeout(this.pendingRoles.get(key));
            this.pendingRoles.delete(key);
        }
    }

    /**
     * Test autorole configuration
     * @param {Guild} guild - The guild to test
     * @param {User} testUser - Optional test user (for testing purposes)
     * @returns {Object} Test result
     */
    async testConfiguration(guild, testUser = null) {
        try {
            const guildData = await Utils.getGuildData(guild.id);
            const result = {
                enabled: false,
                roleExists: false,
                botPermissions: false,
                rolePosition: false,
                issues: []
            };

            if (!guildData || !guildData.autoRole.enabled) {
                result.issues.push('AutoRole is not enabled');
                return result;
            }

            result.enabled = true;

            // Check if role exists
            const role = guild.roles.cache.get(guildData.autoRole.roleId);
            if (!role) {
                result.issues.push(`Role with ID ${guildData.autoRole.roleId} not found`);
                return result;
            }

            result.roleExists = true;

            // Check bot permissions
            if (!guild.members.me.permissions.has('ManageRoles')) {
                result.issues.push('Bot lacks "Manage Roles" permission');
                return result;
            }

            result.botPermissions = true;

            // Check role hierarchy
            if (role.position >= guild.members.me.roles.highest.position) {
                result.issues.push(`Role "${role.name}" is higher than bot's highest role`);
                return result;
            }

            result.rolePosition = true;

            return result;

        } catch (error) {
            return {
                enabled: false,
                roleExists: false,
                botPermissions: false,
                rolePosition: false,
                issues: [`Test failed: ${error.message}`]
            };
        }
    }

    /**
     * Get autorole statistics for a guild
     * @param {string} guildId - Guild ID
     * @returns {Object} Statistics
     */
    getStatistics(guildId) {
        const pendingCount = Array.from(this.pendingRoles.keys())
            .filter(key => key.startsWith(`${guildId}-`)).length;

        return {
            pendingAssignments: pendingCount
        };
    }
}

module.exports = AutoRoleManager;
