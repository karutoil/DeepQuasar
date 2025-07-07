const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.GuildEmojiDelete,
    async execute(emoji) {
        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            emoji.guild, 
            AuditLogEvent.EmojiDelete,
            emoji
        );

        const embed = {
            title: 'Emoji Deleted',
            description: `Emoji **${emoji.name}** was deleted`,
            fields: [
                {
                    name: '😀 Emoji',
                    value: `${emoji.name} (${emoji.id})`,
                    inline: true
                },
                {
                    name: '🆔 Emoji ID',
                    value: emoji.id,
                    inline: true
                },
                {
                    name: '🔗 Animated',
                    value: emoji.animated ? 'Yes' : 'No',
                    inline: true
                },
                {
                    name: '📅 Created',
                    value: `<t:${Math.floor(emoji.createdTimestamp / 1000)}:F>`,
                    inline: true
                }
            ],
            thumbnail: emoji.url
        };

        if (auditLogEntry?.reason) {
            embed.fields.push({
                name: '📝 Reason',
                value: auditLogEntry.reason,
                inline: true
            });
        }

        await ModLogManager.logEvent(emoji.guild, 'emojiDelete', embed, auditLogEntry?.executor);
    }
};
