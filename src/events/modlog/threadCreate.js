const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.ThreadCreate,
    async execute(thread) {
        if (!thread.guild) return;

        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            thread.guild, 
            AuditLogEvent.ThreadCreate,
            thread
        );

        const threadTypes = {
            11: 'Public Thread',
            12: 'Private Thread', 
            10: 'Announcement Thread'
        };

        const embed = {
            title: 'Thread Created',
            description: `${threadTypes[thread.type] || 'Thread'} was created`,
            fields: [
                {
                    name: '🧵 Thread',
                    value: ModLogManager.formatChannel(thread),
                    inline: true
                },
                {
                    name: '📂 Type',
                    value: threadTypes[thread.type] || 'Unknown',
                    inline: true
                },
                {
                    name: '🆔 Thread ID',
                    value: thread.id,
                    inline: true
                },
                {
                    name: '📋 Parent Channel',
                    value: thread.parent ? ModLogManager.formatChannel(thread.parent) : 'Unknown',
                    inline: true
                },
                {
                    name: '👤 Owner',
                    value: thread.ownerId ? `<@${thread.ownerId}>` : 'Unknown',
                    inline: true
                },
                {
                    name: '🔒 Archived',
                    value: thread.archived ? 'Yes' : 'No',
                    inline: true
                }
            ]
        };

        if (thread.rateLimitPerUser > 0) {
            embed.fields.push({
                name: '⏱️ Slowmode',
                value: ModLogManager.formatDuration(thread.rateLimitPerUser),
                inline: true
            });
        }

        if (auditLogEntry?.reason) {
            embed.fields.push({
                name: '📝 Reason',
                value: auditLogEntry.reason,
                inline: true
            });
        }

        await ModLogManager.logEvent(thread.guild, 'threadCreate', embed, auditLogEntry?.executor);
    }
};
