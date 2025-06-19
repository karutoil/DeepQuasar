const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.GuildRoleUpdate,
    async execute(oldRole, newRole) {
        const changes = [];

        // Check name changes
        if (oldRole.name !== newRole.name) {
            changes.push({
                name: '📝 Name',
                value: `**Before:** ${oldRole.name}\n**After:** ${newRole.name}`,
                inline: true
            });
        }

        // Check color changes
        if (oldRole.color !== newRole.color) {
            changes.push({
                name: '🎨 Color',
                value: `**Before:** ${oldRole.hexColor}\n**After:** ${newRole.hexColor}`,
                inline: true
            });
        }

        // Check position changes
        if (oldRole.position !== newRole.position) {
            changes.push({
                name: '📍 Position',
                value: `**Before:** ${oldRole.position}\n**After:** ${newRole.position}`,
                inline: true
            });
        }

        // Check hoist changes
        if (oldRole.hoist !== newRole.hoist) {
            changes.push({
                name: '📌 Hoisted',
                value: `**Before:** ${oldRole.hoist ? 'Yes' : 'No'}\n**After:** ${newRole.hoist ? 'Yes' : 'No'}`,
                inline: true
            });
        }

        // Check mentionable changes
        if (oldRole.mentionable !== newRole.mentionable) {
            changes.push({
                name: '💬 Mentionable',
                value: `**Before:** ${oldRole.mentionable ? 'Yes' : 'No'}\n**After:** ${newRole.mentionable ? 'Yes' : 'No'}`,
                inline: true
            });
        }

        // Check permission changes
        const oldPermissions = oldRole.permissions.toArray();
        const newPermissions = newRole.permissions.toArray();
        
        const addedPermissions = newPermissions.filter(perm => !oldPermissions.includes(perm));
        const removedPermissions = oldPermissions.filter(perm => !newPermissions.includes(perm));

        if (addedPermissions.length > 0) {
            changes.push({
                name: '➕ Permissions Added',
                value: ModLogManager.truncateText(ModLogManager.formatPermissions(addedPermissions), 1024),
                inline: false
            });
        }

        if (removedPermissions.length > 0) {
            changes.push({
                name: '➖ Permissions Removed',
                value: ModLogManager.truncateText(ModLogManager.formatPermissions(removedPermissions), 1024),
                inline: false
            });
        }

        // Only log if there are changes
        if (changes.length === 0) return;

        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            newRole.guild, 
            AuditLogEvent.RoleUpdate,
            newRole
        );

        const embed = {
            title: 'Role Updated',
            description: `Role ${newRole.toString()} was updated`,
            fields: [
                {
                    name: '🎭 Role',
                    value: ModLogManager.formatRole(newRole),
                    inline: true
                },
                {
                    name: '🆔 Role ID',
                    value: newRole.id,
                    inline: true
                },
                ...changes
            ]
        };

        if (auditLogEntry) {
            embed.fields.push({
                name: '👮 Updated By',
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

        await ModLogManager.logEvent(newRole.guild, 'roleUpdate', embed);
    }
};
