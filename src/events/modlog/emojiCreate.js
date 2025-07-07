const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.GuildEmojiCreate,
    async execute(emoji) {
        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            emoji.guild, 
            AuditLogEvent.EmojiCreate,
            emoji
        );

        const embed = {
            title: 'Emoji Created',
            description: `Emoji ${emoji.toString()} was created`,
            fields: [
                {
                    name: '😀 Emoji',
                    value: `${emoji.name} (${emoji.toString()})`,
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
                    name: '🖼️ Image URL',
                    value: `[Click here](${emoji.url})`,
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

        await ModLogManager.logEvent(emoji.guild, 'emojiCreate', embed, auditLogEntry?.executor);
    }
};
