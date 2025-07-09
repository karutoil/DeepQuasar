const { PermissionFlagsBits } = require('discord.js');
const ModerationSettings = require('../schemas/ModerationSettings');
const PunishmentLog = require('../schemas/PunishmentLog');
const UserNotes = require('../schemas/UserNotes');
const Appeals = require('../schemas/Appeals');
const Utils = require('./utils');

class ModerationUtils {
    /**
     * Check if a user has permission to use a moderation command based on Discord permissions
     */
    static checkDiscordPermissions(interaction, requiredPermission) {
        try {
            const member = interaction.member;
            
            // Bot owner always has permission
            if (Utils.isBotOwner(interaction)) {
                return { hasPermission: true };
            }
            
            // Server owner always has permission
            if (Utils.isServerOwner(interaction)) {
                return { hasPermission: true };
            }
            
            // Check if user has the required Discord permission
            if (member.permissions.has(requiredPermission)) {
                return { hasPermission: true };
            }
            
            return { 
                hasPermission: false, 
                reason: `You need the ${this.getPermissionName(requiredPermission)} permission to use this command.` 
            };
            
        } catch (error) {
            console.error('Error checking Discord permissions:', error);
            return { 
                hasPermission: false, 
                reason: 'Error checking permissions. Please try again.' 
            };
        }
    }

    /**
     * Get human-readable permission name
     */
    static getPermissionName(permission) {
        const permissionNames = {
            [PermissionFlagsBits.KickMembers]: 'Kick Members',
            [PermissionFlagsBits.BanMembers]: 'Ban Members',
            [PermissionFlagsBits.ManageMessages]: 'Manage Messages',
            [PermissionFlagsBits.ManageRoles]: 'Manage Roles',
            [PermissionFlagsBits.ManageChannels]: 'Manage Channels',
            [PermissionFlagsBits.ModerateMembers]: 'Moderate Members',
            [PermissionFlagsBits.Administrator]: 'Administrator'
        };
        return permissionNames[permission] || 'Unknown Permission';
    }
    
    /**
     * Get or create moderation settings for a guild
     */
    static async getModerationSettings(guildId) {
        let settings = await ModerationSettings.findOne({ guildId });
        
        if (!settings) {
            settings = new ModerationSettings({
                guildId,
                modLogChannel: null,
                muteRoleId: null,
                autoModEnabled: false,
                warnLimitBeforeBan: 5,
                defaultModRoles: [],
                commandPermissions: {}
            });
            await settings.save();
        }
        
        return settings;
    }
    
    /**
     * Log a moderation action
     */
    static async logAction(actionData) {
        try {
            const caseId = PunishmentLog.generateCaseId(actionData.guildId);
            
            const logEntry = new PunishmentLog({
                ...actionData,
                caseId,
                status: 'active'
            });
            
            await logEntry.save();
            return logEntry;
        } catch (error) {
            console.error('Error logging moderation action:', error);
            throw error;
        }
    }
    
    /**
     * Send moderation log to configured channel
     */
    static async sendModLog(interaction, logEntry, additionalFields = []) {
        try {
            const settings = await this.getModerationSettings(interaction.guild.id);
            
            if (!settings.modLogChannel) {
                return; // No log channel configured
            }
            
            const logChannel = interaction.guild.channels.cache.get(settings.modLogChannel);
            if (!logChannel) {
                return; // Channel doesn't exist
            }
            
            const user = await interaction.client.users.fetch(logEntry.userId);
            const moderator = await interaction.client.users.fetch(logEntry.moderatorId);
            
            const embed = Utils.createEmbed({
                title: `${this.getActionEmoji(logEntry.action)} ${this.capitalizeAction(logEntry.action)}`,
                color: this.getActionColor(logEntry.action),
                fields: [
                    {
                        name: 'User',
                        value: `${user.tag} (${user.id})`,
                        inline: true
                    },
                    {
                        name: 'Moderator',
                        value: `${moderator.tag} (${moderator.id})`,
                        inline: true
                    },
                    {
                        name: 'Case ID',
                        value: logEntry.caseId,
                        inline: true
                    },
                    {
                        name: 'Reason',
                        value: logEntry.reason || 'No reason provided',
                        inline: false
                    },
                    ...additionalFields
                ],
                footer: {
                    text: `User ID: ${user.id}`,
                    iconURL: user.displayAvatarURL()
                }
            });
            
            if (logEntry.duration) {
                embed.addFields({
                    name: 'Duration',
                    value: Utils.formatDuration(logEntry.duration),
                    inline: true
                });
            }
            
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending mod log:', error);
        }
    }
    
    /**
     * Try to DM user about moderation action
     */
    static async dmUser(client, userId, action, reason, guildName, duration = null) {
        try {
            const user = await client.users.fetch(userId);
            
            const embed = Utils.createWarningEmbed(
                `You have been ${action} in ${guildName}`,
                `**Reason:** ${reason || 'No reason provided'}`
            );
            
            if (duration) {
                embed.addFields({
                    name: 'Duration',
                    value: Utils.formatDuration(duration),
                    inline: false
                });
            }
            
            embed.addFields({
                name: 'Appeals',
                value: 'You can appeal this action using the `/appeal` command in the server.',
                inline: false
            });
            
            try {
                await user.send({ embeds: [embed] });
                return true;
            } catch (error) {
                if (error.code === 50007) {
                    // Do not log this error
                    return false;
                }
                console.error('Failed to DM user:', error);
                return false;
            }
        } catch (error) {
            console.error('Failed to DM user:', error);
            return false;
        }
    }
    
    /**
     * Check if user should receive auto-action based on warnings
     */
    static async checkAutoActions(guildId, userId) {
        try {
            const settings = await this.getModerationSettings(guildId);
            
            if (!settings.autoActions.enabled) {
                return null;
            }
            
            const warnings = await PunishmentLog.getActiveWarnings(guildId, userId);
            const warnCount = warnings.length;
            
            if (warnCount >= settings.autoActions.banOnWarns) {
                return { action: 'ban', count: warnCount };
            } else if (warnCount >= settings.autoActions.kickOnWarns) {
                return { action: 'kick', count: warnCount };
            } else if (warnCount >= settings.autoActions.muteOnWarns) {
                return { action: 'mute', count: warnCount };
            }
            
            return null;
        } catch (error) {
            console.error('Error checking auto actions:', error);
            return null;
        }
    }
    
    /**
     * Get or create mute role
     */
    static async getMuteRole(guild, settings) {
        let muteRole;
        
        if (settings.muteRoleId) {
            muteRole = guild.roles.cache.get(settings.muteRoleId);
        }
        
        if (!muteRole) {
            // Create mute role
            muteRole = await guild.roles.create({
                name: 'Muted',
                color: '#818386',
                permissions: [],
                reason: 'Mute role for moderation'
            });
            
            // Update settings
            settings.muteRoleId = muteRole.id;
            await settings.save();
            
            // Setup channel permissions
            await this.setupMuteRolePermissions(guild, muteRole);
        }
        
        return muteRole;
    }
    
    /**
     * Setup mute role permissions in all channels
     */
    static async setupMuteRolePermissions(guild, muteRole) {
        try {
            const channels = guild.channels.cache.filter(c => c.type === 0 || c.type === 2); // Text and Voice
            
            for (const [, channel] of channels) {
                try {
                    await channel.permissionOverwrites.edit(muteRole, {
                        SendMessages: false,
                        Speak: false,
                        SendMessagesInThreads: false,
                        CreatePublicThreads: false,
                        CreatePrivateThreads: false,
                        AddReactions: false
                    });
                } catch (error) {
                    console.error(`Failed to set mute permissions in ${channel.name}:`, error);
                }
            }
        } catch (error) {
            console.error('Error setting up mute role permissions:', error);
        }
    }
    
    /**
     * Parse duration string (e.g., "1h", "30m", "2d")
     */
    static parseDuration(durationStr) {
        if (!durationStr) return null;
        
        const match = durationStr.match(/^(\d+)([smhd])$/i);
        if (!match) return null;
        
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        const multipliers = {
            s: 1000,           // seconds
            m: 60 * 1000,      // minutes
            h: 60 * 60 * 1000, // hours
            d: 24 * 60 * 60 * 1000 // days
        };
        
        return value * multipliers[unit];
    }
    
    /**
     * Get action emoji
     */
    static getActionEmoji(action) {
        const emojis = {
            warn: '⚠️',
            kick: '👢',
            ban: '🔨',
            unban: '🔓',
            mute: '🔇',
            unmute: '🔊',
            lock: '🔒',
            unlock: '🔓',
            slowmode: '🐌',
            strike: '⚡',
            softban: '🧹',
            note: '📝',
            pardon: '✅'
        };
        return emojis[action] || '⚖️';
    }
    
    /**
     * Get action color
     */
    static getActionColor(action) {
        const colors = {
            warn: 0xFFD700,    // Gold
            kick: 0xFF8C00,    // Dark Orange
            ban: 0xFF0000,     // Red
            unban: 0x00FF00,   // Green
            mute: 0x808080,    // Gray
            unmute: 0x00FF00,  // Green
            lock: 0xFF4500,    // Red Orange
            unlock: 0x00FF00,  // Green
            slowmode: 0xFFD700, // Gold
            strike: 0xFF1493,  // Deep Pink
            softban: 0xFF6347, // Tomato
            note: 0x87CEEB,    // Sky Blue
            pardon: 0x32CD32   // Lime Green
        };
        return colors[action] || 0x5865F2;
    }
    
    /**
     * Capitalize action name
     */
    static capitalizeAction(action) {
        return action.charAt(0).toUpperCase() + action.slice(1);
    }
    
    /**
     * Validate target user for moderation action
     */
    static validateTarget(interaction, target) {
        const member = interaction.member;
        const targetMember = interaction.guild.members.cache.get(target.id);
        
        // Can't moderate yourself
        if (target.id === interaction.user.id) {
            return { valid: false, reason: 'You cannot moderate yourself.' };
        }
        
        // Can't moderate the bot
        if (target.id === interaction.client.user.id) {
            return { valid: false, reason: 'You cannot moderate the bot.' };
        }
        
        // Check if target is in guild
        if (!targetMember) {
            return { valid: false, reason: 'User is not in this server.' };
        }
        
        // Can't moderate server owner
        if (target.id === interaction.guild.ownerId) {
            return { valid: false, reason: 'You cannot moderate the server owner.' };
        }
        
        // Check role hierarchy
        if (member.roles.highest.position <= targetMember.roles.highest.position) {
            return { valid: false, reason: 'You cannot moderate someone with equal or higher roles.' };
        }
        
        // Check if bot can moderate target
        const botMember = interaction.guild.members.me;
        if (botMember.roles.highest.position <= targetMember.roles.highest.position) {
            return { valid: false, reason: 'I cannot moderate someone with equal or higher roles than me.' };
        }
        
        return { valid: true };
    }
}

module.exports = ModerationUtils;
