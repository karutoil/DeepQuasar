const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.ThreadDelete,
    async execute(thread) {
        if (!thread.guild) return;

        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            thread.guild, 
            AuditLogEvent.ThreadDelete,
            thread
        );

        const threadTypes = {
            11: 'Public Thread',
            12: 'Private Thread', 
            10: 'Announcement Thread'
        };

        const embed = {
            title: 'Thread Deleted',
            description: `${threadTypes[thread.type] || 'Thread'} was deleted`,
            fields: [
                {
                    name: '🧵 Thread',
                    value: `${thread.name} (${thread.id})`,
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
                    name: '📅 Created',
                    value: `<t:${Math.floor(thread.createdTimestamp / 1000)}:F>`,
                    inline: true
                }
            ]
        };

        if (thread.messageCount) {
            embed.fields.push({
                name: '💬 Messages',
                value: thread.messageCount.toString(),
                inline: true
            });
        }

        if (thread.memberCount) {
            embed.fields.push({
                name: '👥 Members',
                value: thread.memberCount.toString(),
                inline: true
            });
        }

        if (auditLogEntry) {
            embed.fields.push({
                name: '👮 Deleted By',
                value: ModLogManager.formatUser(auditLogEntry.executor),
                inline: true
            });

            if (auditLogEntry.reason) {
                embed.fields.push({
                    name: '📝 Reason',
                    value: auditLogEntry.reason,
                    inline: true
                });
            }
        }

        await ModLogManager.logEvent(thread.guild, 'threadDelete', embed);
    }
};
