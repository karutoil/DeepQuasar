const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.ChannelUpdate,
    async execute(oldChannel, newChannel) {
        if (!newChannel.guild) return;

        const changes = [];

        // Check name changes
        if (oldChannel.name !== newChannel.name) {
            changes.push({
                name: '📝 Name',
                value: `**Before:** ${oldChannel.name}\n**After:** ${newChannel.name}`,
                inline: true
            });
        }

        // Check topic changes (for text channels)
        if (oldChannel.topic !== newChannel.topic) {
            changes.push({
                name: '📄 Topic',
                value: `**Before:** ${ModLogManager.truncateText(oldChannel.topic || 'None', 512)}\n**After:** ${ModLogManager.truncateText(newChannel.topic || 'None', 512)}`,
                inline: false
            });
        }

        // Check position changes
        if (oldChannel.position !== newChannel.position) {
            changes.push({
                name: '📍 Position',
                value: `**Before:** ${oldChannel.position}\n**After:** ${newChannel.position}`,
                inline: true
            });
        }

        // Check category changes
        if (oldChannel.parentId !== newChannel.parentId) {
            const oldParent = oldChannel.parentId ? oldChannel.guild.channels.cache.get(oldChannel.parentId)?.name : 'None';
            const newParent = newChannel.parentId ? newChannel.guild.channels.cache.get(newChannel.parentId)?.name : 'None';
            
            changes.push({
                name: '📁 Category',
                value: `**Before:** ${oldParent}\n**After:** ${newParent}`,
                inline: true
            });
        }

        // Check NSFW changes (for text channels)
        if (oldChannel.nsfw !== undefined && oldChannel.nsfw !== newChannel.nsfw) {
            changes.push({
                name: '🔞 NSFW',
                value: `**Before:** ${oldChannel.nsfw ? 'Yes' : 'No'}\n**After:** ${newChannel.nsfw ? 'Yes' : 'No'}`,
                inline: true
            });
        }

        // Check rate limit changes (for text channels)
        if (oldChannel.rateLimitPerUser !== undefined && oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
            changes.push({
                name: '⏱️ Slowmode',
                value: `**Before:** ${ModLogManager.formatDuration(oldChannel.rateLimitPerUser)}\n**After:** ${ModLogManager.formatDuration(newChannel.rateLimitPerUser)}`,
                inline: true
            });
        }

        // Check bitrate changes (for voice channels)
        if (oldChannel.bitrate !== undefined && oldChannel.bitrate !== newChannel.bitrate) {
            changes.push({
                name: '🎵 Bitrate',
                value: `**Before:** ${oldChannel.bitrate / 1000}kbps\n**After:** ${newChannel.bitrate / 1000}kbps`,
                inline: true
            });
        }

        // Check user limit changes (for voice channels)
        if (oldChannel.userLimit !== undefined && oldChannel.userLimit !== newChannel.userLimit) {
            changes.push({
                name: '👥 User Limit',
                value: `**Before:** ${oldChannel.userLimit || 'Unlimited'}\n**After:** ${newChannel.userLimit || 'Unlimited'}`,
                inline: true
            });
        }

        // Only log if there are changes
        if (changes.length === 0) return;

        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            newChannel.guild, 
            AuditLogEvent.ChannelUpdate,
            newChannel
        );

        const embed = {
            title: 'Channel Updated',
            description: `${newChannel.toString()} was updated`,
            fields: [
                {
                    name: '📋 Channel',
                    value: ModLogManager.formatChannel(newChannel),
                    inline: true
                },
                {
                    name: '🆔 Channel ID',
                    value: newChannel.id,
                    inline: true
                },
                ...changes
            ]
        };

        if (auditLogEntry?.reason) {
            embed.fields.push({
                name: '📝 Reason',
                value: auditLogEntry.reason,
                inline: true
            });
        }

        await ModLogManager.logEvent(newChannel.guild, 'channelUpdate', embed, auditLogEntry?.executor);
    }
};
