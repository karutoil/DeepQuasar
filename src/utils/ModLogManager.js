const { EmbedBuilder, AuditLogEvent, PermissionsBitField } = require('discord.js');
const ModLog = require('../schemas/ModLog');
const Utils = require('./utils');

class ModLogManager {
    static colors = {
        // Member Events
        memberJoin: 0x57F287,      // Green
        memberLeave: 0xED4245,     // Red
        memberUpdate: 0x5DADE2,    // Blue
        memberBan: 0x992D22,       // Dark Red
        memberUnban: 0x57F287,     // Green
        memberKick: 0xE67E22,      // Orange
        memberTimeout: 0xE67E22,   // Orange
        
        // User Events
        userUpdate: 0x5DADE2,      // Blue
        presenceUpdate: 0x95A5A6,  // Gray
        
        // Message Events
        messageDelete: 0xED4245,   // Red
        messageUpdate: 0xFEE75C,   // Yellow
        messageBulkDelete: 0x992D22, // Dark Red
        messageReactionAdd: 0x57F287, // Green
        messageReactionRemove: 0xED4245, // Red
        
        // Channel Events
        channelCreate: 0x57F287,   // Green
        channelDelete: 0xED4245,   // Red
        channelUpdate: 0x5DADE2,   // Blue
        channelPinsUpdate: 0x5DADE2, // Blue
        
        // Role Events
        roleCreate: 0x57F287,      // Green
        roleDelete: 0xED4245,      // Red
        roleUpdate: 0x5DADE2,      // Blue
        
        // Guild Events
        guildUpdate: 0x5DADE2,     // Blue
        emojiCreate: 0x57F287,     // Green
        emojiDelete: 0xED4245,     // Red
        emojiUpdate: 0x5DADE2,     // Blue
        stickerCreate: 0x57F287,   // Green
        stickerDelete: 0xED4245,   // Red
        stickerUpdate: 0x5DADE2,   // Blue
        
        // Voice Events
        voiceStateUpdate: 0x9B59B6, // Purple
        
        // Invite Events
        inviteCreate: 0x57F287,    // Green
        inviteDelete: 0xED4245,    // Red
        
        // Thread Events
        threadCreate: 0x57F287,    // Green
        threadDelete: 0xED4245,    // Red
        threadUpdate: 0x5DADE2,    // Blue
        threadMemberUpdate: 0x95A5A6, // Gray
        
        // Integration Events
        integrationCreate: 0x57F287, // Green
        integrationDelete: 0xED4245, // Red
        integrationUpdate: 0x5DADE2, // Blue
        
        // Webhook Events
        webhookUpdate: 0x5DADE2,   // Blue
        
        // Stage Events
        stageInstanceCreate: 0x57F287, // Green
        stageInstanceDelete: 0xED4245, // Red
        stageInstanceUpdate: 0x5DADE2, // Blue
        
        // Scheduled Event Events
        guildScheduledEventCreate: 0x57F287, // Green
        guildScheduledEventDelete: 0xED4245, // Red
        guildScheduledEventUpdate: 0x5DADE2, // Blue
        guildScheduledEventUserAdd: 0x57F287, // Green
        guildScheduledEventUserRemove: 0xED4245 // Red
    };

    static emojis = {
        // Member Events
        memberJoin: '📥',
        memberLeave: '📤',
        memberUpdate: '✏️',
        memberBan: '🔨',
        memberUnban: '🔓',
        memberKick: '👢',
        memberTimeout: '⏰',
        
        // User Events
        userUpdate: '👤',
        presenceUpdate: '🟢',
        
        // Message Events
        messageDelete: '🗑️',
        messageUpdate: '📝',
        messageBulkDelete: '🗂️',
        messageReactionAdd: '➕',
        messageReactionRemove: '➖',
        
        // Channel Events
        channelCreate: '📋',
        channelDelete: '🗑️',
        channelUpdate: '✏️',
        channelPinsUpdate: '📌',
        
        // Role Events
        roleCreate: '🆕',
        roleDelete: '🗑️',
        roleUpdate: '✏️',
        
        // Guild Events
        guildUpdate: '🏠',
        emojiCreate: '😊',
        emojiDelete: '🗑️',
        emojiUpdate: '✏️',
        stickerCreate: '🎨',
        stickerDelete: '🗑️',
        stickerUpdate: '✏️',
        
        // Voice Events
        voiceStateUpdate: '🔊',
        
        // Invite Events
        inviteCreate: '🔗',
        inviteDelete: '🗑️',
        
        // Thread Events
        threadCreate: '🧵',
        threadDelete: '🗑️',
        threadUpdate: '✏️',
        threadMemberUpdate: '👥',
        
        // Integration Events
        integrationCreate: '🔗',
        integrationDelete: '🗑️',
        integrationUpdate: '✏️',
        
        // Webhook Events
        webhookUpdate: '🪝',
        
        // Stage Events
        stageInstanceCreate: '🎤',
        stageInstanceDelete: '🗑️',
        stageInstanceUpdate: '✏️',
        
        // Scheduled Event Events
        guildScheduledEventCreate: '📅',
        guildScheduledEventDelete: '🗑️',
        guildScheduledEventUpdate: '✏️',
        guildScheduledEventUserAdd: '➕',
        guildScheduledEventUserRemove: '➖'
    };

    /**
     * Log an event to the appropriate channel(s) or webhook(s)
     * Includes rate limiting, filtering, template support, and audit log integration.
     */
    static _rateLimitMap = new Map();

    static async logEvent(guild, eventType, embedOptions, executor, userId = null, roleIds = []) {
        try {
            const modLog = await ModLog.getOrCreate(guild.id);
            if (!modLog || !modLog.isEventEnabled(eventType)) {
                return;
            }

            // Event filtering by user/role
            if (userId && modLog.isExcluded(eventType, userId, roleIds)) {
                return;
            }

            // Rate limiting (per event per guild)
            const key = `${guild.id}:${eventType}`;
            const now = Date.now();
            const last = this._rateLimitMap.get(key) || 0;
            if (now - last < 1000) { // 1 event/sec per type per guild
                return;
            }
            this._rateLimitMap.set(key, now);

            // Get all targets (channels/webhooks)
            const targets = modLog.getEventTargets(eventType);
            if (!targets.length) return;

            // Build embed with template support
            let embed;
            const template = modLog.getTemplate(eventType);
            if (template) {
                // Simple template replacement
                let desc = template;
                if (embedOptions.description) desc = desc.replace('{description}', embedOptions.description);
                embed = new EmbedBuilder()
                    .setColor(this.colors[eventType] || 0x5865F2)
                    .setDescription(desc)
                    .setTimestamp()
                    .setFooter({ text: `Event: ${eventType}` });
            } else {
                embed = new EmbedBuilder()
                    .setColor(this.colors[eventType] || 0x5865F2)
                    .setTimestamp()
                    .setFooter({ text: `Event: ${eventType}` });
                if (embedOptions.title) {
                    const emoji = this.emojis[eventType] || '📋';
                    embed.setTitle(`${emoji} ${embedOptions.title}`);
                }
                if (embedOptions.description) embed.setDescription(embedOptions.description);
            }
            if (embedOptions.fields) embed.addFields(embedOptions.fields);
            if (embedOptions.thumbnail) embed.setThumbnail(embedOptions.thumbnail);
            if (embedOptions.image) embed.setImage(embedOptions.image);
            if (embedOptions.author) embed.setAuthor(embedOptions.author);

            if (executor) {
                embed.addFields({ name: 'Responsible User', value: this.formatUser(executor), inline: true });
            }

            // Send to all channels/webhooks
            for (const target of targets) {
                const channel = guild.channels.cache.get(target);
                if (channel && channel.isTextBased()) {
                    // Check bot permissions
                    const botMember = guild.members.me;
                    if (!botMember) continue;
                    const permissions = channel.permissionsFor(botMember);
                    if (!permissions.has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])) {
                        continue;
                    }
                    await channel.send({ embeds: [embed] });
                } else if (/^https?:\/\//.test(target)) {
                    // Webhook support
                    await Utils.sendWebhook(target, { embeds: [embed] });
                }
            }
        } catch (error) {
            console.error(`Error logging ${eventType} event:`, error);
        }
    }

    /**
     * Get audit log entry for an event
     */
    static async getAuditLogEntry(guild, type, target, maxAge = 10000) {
        try {
            if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
                return null;
            }

            const auditLogs = await guild.fetchAuditLogs({
                type,
                limit: 10
            });

            return auditLogs.entries.find(entry => {
                const timeDiff = Date.now() - entry.createdTimestamp;
                return timeDiff < maxAge && (!target || entry.target?.id === target?.id);
            });
        } catch (error) {
            console.error('Error fetching audit log:', error);
            return null;
        }
    }

    /**
     * Format user for display
     */
    static formatUser(user) {
        return `${user.tag} (${user.id})`;
    }

    /**
     * Format channel for display
     */
    static formatChannel(channel) {
        return `${channel.name} (${channel.id})`;
    }

    /**
     * Format role for display
     */
    static formatRole(role) {
        return `${role.name} (${role.id})`;
    }

    /**
     * Format permissions for display
     */
    static formatPermissions(permissions) {
        if (!permissions || permissions.length === 0) return 'None';
        
        return permissions.map(perm => {
            return perm.replace(/([A-Z])/g, ' $1').trim();
        }).join(', ');
    }

    /**
     * Get differences between two objects
     */
    static getObjectDifferences(oldObj, newObj, fields = []) {
        const differences = [];
        
        for (const field of fields) {
            const oldValue = oldObj[field];
            const newValue = newObj[field];
            
            if (oldValue !== newValue) {
                differences.push({
                    name: field.charAt(0).toUpperCase() + field.slice(1),
                    value: `**Before:** ${oldValue || 'None'}\n**After:** ${newValue || 'None'}`,
                    inline: true
                });
            }
        }
        
        return differences;
    }

    /**
     * Truncate text to fit Discord limits
     */
    static truncateText(text, maxLength = 1024) {
        if (!text) return 'None';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * Format duration from seconds
     */
    static formatDuration(seconds) {
        if (!seconds || seconds === 0) return 'Permanent';
        
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0) parts.push(`${secs}s`);

        return parts.join(' ') || '0s';
    }

    /**
     * Get all available event types
     */
    static getEventTypes() {
        return Object.keys(this.colors);
    }

    /**
     * Get event type display name
     */
    static getEventDisplayName(eventType) {
        return eventType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
}

module.exports = ModLogManager;
