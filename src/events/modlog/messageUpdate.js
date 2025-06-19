const { Events } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        // Skip bot messages, DMs, and partial messages
        if (!newMessage.guild || newMessage.author.bot || !oldMessage.content || !newMessage.content) return;

        // Skip if content didn't actually change
        if (oldMessage.content === newMessage.content) return;

        const embed = {
            title: 'Message Edited',
            fields: [
                {
                    name: '👤 Author',
                    value: ModLogManager.formatUser(newMessage.author),
                    inline: true
                },
                {
                    name: '📋 Channel',
                    value: newMessage.channel.toString(),
                    inline: true
                },
                {
                    name: '🔗 Jump to Message',
                    value: `[Click here](${newMessage.url})`,
                    inline: true
                },
                {
                    name: '📝 Before',
                    value: ModLogManager.truncateText(oldMessage.content, 1024),
                    inline: false
                },
                {
                    name: '📝 After',
                    value: ModLogManager.truncateText(newMessage.content, 1024),
                    inline: false
                },
                {
                    name: '🆔 Message ID',
                    value: newMessage.id,
                    inline: true
                }
            ],
            thumbnail: newMessage.author.displayAvatarURL({ dynamic: true })
        };

        await ModLogManager.logEvent(newMessage.guild, 'messageUpdate', embed);
    }
};
