const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        // Skip bot messages and DMs
        if (!message.guild || message.author?.bot) return;

        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            message.guild, 
            AuditLogEvent.MessageDelete,
            null,
            5000 // Shorter time window for message deletions
        );

        const embed = {
            title: 'Message Deleted',
            description: message.content ? ModLogManager.truncateText(message.content, 2000) : '*No text content*',
            fields: [
                {
                    name: '👤 Author',
                    value: message.author ? ModLogManager.formatUser(message.author) : 'Unknown User',
                    inline: true
                },
                {
                    name: '📋 Channel',
                    value: message.channel.toString(),
                    inline: true
                },
                {
                    name: '🆔 Message ID',
                    value: message.id,
                    inline: true
                }
            ]
        };

        if (message.author) {
            embed.thumbnail = message.author.displayAvatarURL({ dynamic: true });
        }

        // Add attachment info if present
        if (message.attachments.size > 0) {
            const attachmentList = message.attachments.map(att => `[${att.name}](${att.url})`).join('\n');
            embed.fields.push({
                name: '📎 Attachments',
                value: ModLogManager.truncateText(attachmentList, 1024),
                inline: false
            });
        }

        // Add embed info if present
        if (message.embeds.length > 0) {
            embed.fields.push({
                name: '📄 Embeds',
                value: `${message.embeds.length} embed(s)`,
                inline: true
            });
        }

        if (auditLogEntry?.executor.id !== message.author?.id && auditLogEntry?.reason) {
            embed.fields.push({
                name: '📝 Reason',
                value: auditLogEntry.reason,
                inline: true
            });
        }

        await ModLogManager.logEvent(
            message.guild,
            'messageDelete',
            embed,
            auditLogEntry?.executor,
            message.author?.id,
            message.member?.roles.cache.map(r => r.id) || []
        );
    }
};
