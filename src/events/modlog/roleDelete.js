const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.GuildRoleDelete,
    async execute(role) {
        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            role.guild, 
            AuditLogEvent.RoleDelete,
            role
        );

        const embed = {
            title: 'Role Deleted',
            description: `Role **${role.name}** was deleted`,
            fields: [
                {
                    name: '🎭 Role',
                    value: `${role.name} (${role.id})`,
                    inline: true
                },
                {
                    name: '🎨 Color',
                    value: role.hexColor,
                    inline: true
                },
                {
                    name: '🆔 Role ID',
                    value: role.id,
                    inline: true
                },
                {
                    name: '📍 Position',
                    value: role.position.toString(),
                    inline: true
                },
                {
                    name: '📌 Hoisted',
                    value: role.hoist ? 'Yes' : 'No',
                    inline: true
                },
                {
                    name: '💬 Mentionable',
                    value: role.mentionable ? 'Yes' : 'No',
                    inline: true
                },
                {
                    name: '📅 Created',
                    value: `<t:${Math.floor(role.createdTimestamp / 1000)}:F>`,
                    inline: true
                }
            ]
        };

        // Add permissions info
        const permissions = role.permissions.toArray();
        if (permissions.length > 0) {
            embed.fields.push({
                name: '🔐 Permissions',
                value: ModLogManager.truncateText(ModLogManager.formatPermissions(permissions), 1024),
                inline: false
            });
        }

        if (auditLogEntry?.reason) {
            embed.fields.push({
                name: '📝 Reason',
                value: auditLogEntry.reason,
                inline: true
            });
        }

        await ModLogManager.logEvent(role.guild, 'roleDelete', embed, auditLogEntry?.executor);
    }
};
