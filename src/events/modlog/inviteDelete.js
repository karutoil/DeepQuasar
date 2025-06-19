const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.InviteDelete,
    async execute(invite) {
        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            invite.guild, 
            AuditLogEvent.InviteDelete,
            null
        );

        const embed = {
            title: 'Invite Deleted',
            description: `Invite was deleted: ~~${invite.url}~~`,
            fields: [
                {
                    name: '🔗 Invite Code',
                    value: invite.code,
                    inline: true
                },
                {
                    name: '📋 Channel',
                    value: invite.channel ? ModLogManager.formatChannel(invite.channel) : 'Unknown',
                    inline: true
                },
                {
                    name: '👤 Original Inviter',
                    value: invite.inviter ? ModLogManager.formatUser(invite.inviter) : 'Unknown',
                    inline: true
                },
                {
                    name: '📊 Uses',
                    value: `${invite.uses || 0}/${invite.maxUses || 'Unlimited'}`,
                    inline: true
                },
                {
                    name: '📅 Created',
                    value: invite.createdAt ? `<t:${Math.floor(invite.createdTimestamp / 1000)}:F>` : 'Unknown',
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

        await ModLogManager.logEvent(invite.guild, 'inviteDelete', embed);
    }
};
