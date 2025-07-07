const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        // Handle modlog for member join
        const embed = {
            title: 'Member Joined',
            description: `${member.user.tag} joined the server`,
            fields: [
                {
                    name: '👤 User',
                    value: ModLogManager.formatUser(member.user),
                    inline: true
                },
                {
                    name: '📅 Account Created',
                    value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
                    inline: true
                },
                {
                    name: '🆔 User ID',
                    value: member.user.id,
                    inline: true
                }
            ],
            thumbnail: member.user.displayAvatarURL({ dynamic: true })
        };

        await ModLogManager.logEvent(member.guild, 'memberJoin', embed);
    }
};
