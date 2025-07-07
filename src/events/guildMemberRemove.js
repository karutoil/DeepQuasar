const { AuditLogEvent } = require('discord.js');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        client.logger.info(`👋 Member left: ${member.user.tag} (${member.id}) from guild: ${member.guild.name} (${member.guild.id})`);

        try {
            // Cancel any pending autorole assignments
            if (client.autoRoleManager) {
                client.autoRoleManager.cancelPendingAssignment(member.guild.id, member.id);
            }

            // Handle leave system
            const WelcomeSystem = require('../utils/WelcomeSystem');
            await WelcomeSystem.handleMemberLeave(member, client);

            // Handle modlog
            // const ModLogManager = require('../utils/ModLogManager');
            
            // // Check if it was a kick or leave
            // const auditLogEntry = await ModLogManager.getAuditLogEntry(
            //     member.guild, 
            //     AuditLogEvent.MemberKick, 
            //     member.user
            // );

            // const isKick = auditLogEntry !== null;
            // const eventType = isKick ? 'memberKick' : 'memberLeave';
            
            // const embed = {
            //     title: isKick ? 'Member Kicked' : 'Member Left',
            //     description: `${member.user.tag} ${isKick ? 'was kicked from' : 'left'} the server`,
            //     fields: [
            //         {
            //             name: '👤 User',
            //             value: ModLogManager.formatUser(member.user),
            //             inline: true
            //         },
            //         {
            //             name: '📅 Joined Server',
            //             value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Unknown',
            //             inline: true
            //         },
            //         {
            //             name: '🆔 User ID',
            //             value: member.user.id,
            //             inline: true
            //         }
            //     ],
            //     thumbnail: member.user.displayAvatarURL({ dynamic: true })
            // };

            // if (isKick && auditLogEntry) {
            //     embed.fields.push(
            //         {
            //             name: '👮 Kicked By',
            //             value: ModLogManager.formatUser(auditLogEntry.executor),
            //             inline: true
            //         },
            //         {
            //             name: '📝 Reason',
            //             value: auditLogEntry.reason || 'No reason provided',
            //             inline: true
            //         }
            //     );
            // }

            // // Calculate time in server
            // if (member.joinedAt) {
            //     const timeInServer = Date.now() - member.joinedTimestamp;
            //     const days = Math.floor(timeInServer / (1000 * 60 * 60 * 24));
            //     embed.fields.push({
            //         name: '⏱️ Time in Server',
            //         value: `${days} days`,
            //         inline: true
            //     });
            // }

            // await ModLogManager.logEvent(member.guild, eventType, embed);

        } catch (error) {
            client.logger.error(`Error handling guildMemberRemove for ${member.user.tag}:`, error);
        }
    }
};
