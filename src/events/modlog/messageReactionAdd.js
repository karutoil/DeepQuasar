const { Events } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        // Skip bot reactions and DMs
        if (user.bot || !reaction.message.guild) return;

        // Handle partial reactions
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return;
            }
        }

        const embed = {
            title: 'Reaction Added',
            description: `${user.tag} reacted to a message`,
            fields: [
                {
                    name: '👤 User',
                    value: ModLogManager.formatUser(user),
                    inline: true
                },
                {
                    name: '📋 Channel',
                    value: reaction.message.channel.toString(),
                    inline: true
                },
                {
                    name: '🔗 Message',
                    value: `[Jump to Message](${reaction.message.url})`,
                    inline: true
                },
                {
                    name: '😀 Reaction',
                    value: reaction.emoji.toString(),
                    inline: true
                },
                {
                    name: '📝 Message Content',
                    value: ModLogManager.truncateText(reaction.message.content || '*No text content*', 1024),
                    inline: false
                },
                {
                    name: '🆔 Message ID',
                    value: reaction.message.id,
                    inline: true
                }
            ],
            thumbnail: user.displayAvatarURL({ dynamic: true })
        };

        if (reaction.message.attachments.size > 0) {
            embed.fields.push({
                name: '📎 Attachments',
                value: `${reaction.message.attachments.size} attachment(s)`,
                inline: true
            });
        }

        await ModLogManager.logEvent(reaction.message.guild, 'messageReactionAdd', embed);
    }
};
