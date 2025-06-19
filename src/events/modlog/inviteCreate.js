const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.InviteCreate,
    async execute(invite) {
        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            invite.guild, 
            AuditLogEvent.InviteCreate,
            null
        );

        const embed = {
            title: 'Invite Created',
            description: `New invite created: ${invite.url}`,
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
                    name: '👤 Inviter',
                    value: invite.inviter ? ModLogManager.formatUser(invite.inviter) : 'Unknown',
                    inline: true
                },
                {
                    name: '📊 Max Uses',
                    value: invite.maxUses || 'Unlimited',
                    inline: true
                },
                {
                    name: '⏰ Max Age',
                    value: invite.maxAge ? ModLogManager.formatDuration(invite.maxAge) : 'Never',
                    inline: true
                },
                {
                    name: '👥 Temporary',
                    value: invite.temporary ? 'Yes' : 'No',
                    inline: true
                }
            ]
        };

        if (invite.expiresAt) {
            embed.fields.push({
                name: '📅 Expires',
                value: `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:F>`,
                inline: true
            });
        }

        if (auditLogEntry && auditLogEntry.executor.id !== invite.inviter?.id) {
            embed.fields.push({
                name: '👮 Created By (Audit)',
                value: ModLogManager.formatUser(auditLogEntry.executor),
                inline: true
            });
        }

        await ModLogManager.logEvent(invite.guild, 'inviteCreate', embed);
    }
};
