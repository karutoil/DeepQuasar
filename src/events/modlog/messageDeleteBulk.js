const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.MessageBulkDelete,
    async execute(messages) {
        const channel = messages.first()?.channel;
        if (!channel?.guild) return;

        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            channel.guild, 
            AuditLogEvent.MessageBulkDelete,
            null,
            10000
        );

        // Filter out bot messages and get some sample messages
        const userMessages = messages.filter(msg => msg.author && !msg.author.bot);
        const sampleMessages = Array.from(userMessages.values()).slice(0, 5);

        const embed = {
            title: 'Bulk Message Delete',
            description: `${messages.size} messages were deleted in ${channel.toString()}`,
            fields: [
                {
                    name: '📊 Statistics',
                    value: [
                        `**Total Messages:** ${messages.size}`,
                        `**User Messages:** ${userMessages.size}`,
                        `**Bot Messages:** ${messages.size - userMessages.size}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📋 Channel',
                    value: ModLogManager.formatChannel(channel),
                    inline: true
                }
            ]
        };

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

        // Add sample messages if available
        if (sampleMessages.length > 0) {
            const sampleText = sampleMessages
                .map(msg => `**${msg.author.tag}:** ${ModLogManager.truncateText(msg.content || '*No content*', 100)}`)
                .join('\n');
            
            embed.fields.push({
                name: '📄 Sample Messages',
                value: ModLogManager.truncateText(sampleText, 1024),
                inline: false
            });
        }

        await ModLogManager.logEvent(channel.guild, 'messageBulkDelete', embed);
    }
};
