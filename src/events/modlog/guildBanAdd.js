const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.GuildBanAdd,
    async execute(ban) {
        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            ban.guild, 
            AuditLogEvent.MemberBanAdd, 
            ban.user
        );

        const embed = {
            title: 'Member Banned',
            description: `${ban.user.tag} was banned from the server`,
            fields: [
                {
                    name: '👤 User',
                    value: ModLogManager.formatUser(ban.user),
                    inline: true
                },
                {
                    name: '📝 Ban Reason',
                    value: ban.reason || 'No reason provided',
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
            if (auditLogEntry?.reason && auditLogEntry.reason !== ban.reason) {
                embed.fields.push({
                    name: '📝 Audit Log Reason',
                    value: auditLogEntry.reason,
                    inline: true
                });
            }
        }

        await ModLogManager.logEvent(ban.guild, 'memberBan', embed, auditLogEntry?.executor);
    }
};
