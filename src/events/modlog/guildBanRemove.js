const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.GuildBanRemove,
    async execute(ban) {
        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            ban.guild, 
            AuditLogEvent.MemberBanRemove, 
            ban.user
        );

        const embed = {
            title: 'Member Unbanned',
            description: `${ban.user.tag} was unbanned from the server`,
            fields: [
                {
                    name: '👤 User',
                    value: ModLogManager.formatUser(ban.user),
                    inline: true
                },
                {
                    name: '🆔 User ID',
                    value: ban.user.id,
                    inline: true
                }
            ],
            thumbnail: ban.user.displayAvatarURL({ dynamic: true })
        };

        if (auditLogEntry) {
            embed.fields.push(
                {
                    name: '👮 Unbanned By',
                    value: ModLogManager.formatUser(auditLogEntry.executor),
                    inline: true
                }
            );

            if (auditLogEntry.reason) {
                embed.fields.push({
                    name: '📝 Reason',
                    value: auditLogEntry.reason,
                    inline: true
                });
            }
        }

        await ModLogManager.logEvent(ban.guild, 'memberUnban', embed);
    }
};
