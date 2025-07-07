const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        const changes = [];
        let auditLogEntry = null;
        let eventType = 'memberUpdate'; // Default event type

        // Check nickname changes
        if (oldMember.nickname !== newMember.nickname) {
            changes.push({
                name: '📝 Nickname',
                value: `**Before:** ${oldMember.nickname || 'None'}\n**After:** ${newMember.nickname || 'None'} `,
                inline: true
            });
            // Fetch audit log for nickname change
            auditLogEntry = await ModLogManager.getAuditLogEntry(
                newMember.guild,
                AuditLogEvent.MemberUpdate, // Type for nickname change
                newMember.user
            );
        }

        // Check role changes
        const oldRoles = oldMember.roles.cache.filter(role => role.id !== newMember.guild.id);
        const newRoles = newMember.roles.cache.filter(role => role.id !== newMember.guild.id);

        const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
        const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

        if (addedRoles.size > 0) {
            changes.push({
                name: '➕ Roles Added',
                value: addedRoles.map(role => role.toString()).join(', '),
                inline: true
            });
            // Fetch audit log for role change
            // Prioritize role update audit log if roles changed
            auditLogEntry = await ModLogManager.getAuditLogEntry(
                newMember.guild,
                AuditLogEvent.MemberRoleUpdate, // Type for role changes
                newMember.user
            );
        }

        if (removedRoles.size > 0) {
            changes.push({
                name: '➖ Roles Removed',
                value: removedRoles.map(role => role.toString()).join(', '),
                inline: true
            });
            // Fetch audit log for role change
            // Prioritize role update audit log if roles changed
            auditLogEntry = await ModLogManager.getAuditLogEntry(
                newMember.guild,
                AuditLogEvent.MemberRoleUpdate, // Type for role changes
                newMember.user
            );
        }

        // Check timeout changes
        if (oldMember.communicationDisabledUntil !== newMember.communicationDisabledUntil) {
            if (newMember.communicationDisabledUntil) {
                // Member was timed out
                eventType = 'memberTimeout'; // Specific event type for timeout
                auditLogEntry = await ModLogManager.getAuditLogEntry(
                    newMember.guild,
                    AuditLogEvent.MemberUpdate, // Type for timeout
                    newMember.user
                );

                const embed = {
                    title: 'Member Timed Out',
                    description: `${newMember.user.tag} was timed out`,
                    fields: [
                        {
                            name: '👤 User',
                            value: ModLogManager.formatUser(newMember.user),
                            inline: true
                        },
                        {
                            name: '⏰ Until',
                            value: `<t:${Math.floor(newMember.communicationDisabledUntil.getTime() / 1000)}:F>`,
                            inline: true
                        },
                        {
                            name: '🆔 User ID',
                            value: newMember.user.id,
                            inline: true
                        }
                    ],
                    thumbnail: newMember.user.displayAvatarURL({ dynamic: true })
                };

                if (auditLogEntry?.reason) {
                    embed.fields.push(
                        {
                            name: '📝 Reason',
                            value: auditLogEntry.reason || 'No reason provided',
                            inline: true
                        }
                    );
                }

                await ModLogManager.logEvent(newMember.guild, eventType, embed, auditLogEntry?.executor);
                return; // Return early as timeout is a distinct event
            } else if (oldMember.communicationDisabledUntil) {
                // Timeout was removed
                changes.push({
                    name: '⏰ Timeout',
                    value: '**Before:** Timed out\n**After:** Timeout removed',
                    inline: true
                });
                // For timeout removal, we still look for MemberUpdate audit log
                auditLogEntry = await ModLogManager.getAuditLogEntry(
                    newMember.guild,
                    AuditLogEvent.MemberUpdate,
                    newMember.user
                );
            }
        }

        // Only log if there are changes to log
        if (changes.length === 0) return;

        const embed = {
            title: 'Member Updated',
            description: `${newMember.user.tag} was updated`,
            fields: [
                {
                    name: '👤 User',
                    value: ModLogManager.formatUser(newMember.user),
                    inline: true
                },
                {
                    name: '🆔 User ID',
                    value: newMember.user.id,
                    inline: true
                },
                ...changes
            ],
            thumbnail: newMember.user.displayAvatarURL({ dynamic: true })
        };

        if (auditLogEntry?.reason) {
            embed.fields.push({
                name: '📝 Reason',
                value: auditLogEntry.reason,
                inline: true
            });
        }

        await ModLogManager.logEvent(newMember.guild, eventType, embed, auditLogEntry?.executor);
    }
};