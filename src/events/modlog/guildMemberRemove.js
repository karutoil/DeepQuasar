const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        // Check if it was a kick or leave
        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            member.guild, 
            AuditLogEvent.MemberKick, 
            member.user
        );

        const isKick = auditLogEntry !== null;
        const eventType = isKick ? 'memberKick' : 'memberLeave';
        
        const embed = {
            title: isKick ? 'Member Kicked' : 'Member Left',
            description: `${member.user.tag} ${isKick ? 'was kicked from' : 'left'} the server`,
            fields: [
                {
                    name: '👤 User',
                    value: ModLogManager.formatUser(member.user),
                    inline: true
                },
                {
                    name: '📅 Joined Server',
                    value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Unknown',
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

        if (isKick && auditLogEntry?.reason) {
            embed.fields.push({
                name: '📝 Reason',
                value: auditLogEntry.reason || 'No reason provided',
                inline: true
            });
        }

        // Calculate time in server
        if (member.joinedAt) {
            const timeInServer = Date.now() - member.joinedTimestamp;
            const days = Math.floor(timeInServer / (1000 * 60 * 60 * 24));
            embed.fields.push({
                name: '⏱️ Time in Server',
                value: `${days} days`,
                inline: true
            });
        }

        await ModLogManager.logEvent(member.guild, eventType, embed, auditLogEntry?.executor);
    }
};
