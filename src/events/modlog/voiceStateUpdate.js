const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        // Handle temp VC system first
        const client = oldState.client || newState.client;
        if (client.tempVCManager) {
            try {
                await client.tempVCManager.handleVoiceStateUpdate(oldState, newState);
            } catch (error) {
                client.logger?.error('Error in temp VC voice state handler:', error);
            }
        }

        // Continue with modlog handling
        const member = newState.member || oldState.member;
        if (!member || member.user.bot) return;

        let action = '';
        let description = '';
        let fields = [
            {
                name: '👤 User',
                value: ModLogManager.formatUser(member.user),
                inline: true
            },
            {
                name: '🆔 User ID',
                value: member.user.id,
                inline: true
            }
        ];
        let auditLogEntry = null;

        // User joined a voice channel
        if (!oldState.channel && newState.channel) {
            action = 'Joined Voice Channel';
            description = `${member.user.tag} joined ${newState.channel.name}`;
            fields.push({
                name: '📞 Channel',
                value: `${newState.channel.name} (${newState.channel.id})`,
                inline: true
            });
        }
        // User left a voice channel
        else if (oldState.channel && !newState.channel) {
            action = 'Left Voice Channel';
            description = `${member.user.tag} left ${oldState.channel.name}`;
            fields.push({
                name: '📞 Channel',
                value: `${oldState.channel.name} (${oldState.channel.id})`,
                inline: true
            });
        }
        // User moved between voice channels
        else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            action = 'Moved Voice Channels';
            description = `${member.user.tag} moved from ${oldState.channel.name} to ${newState.channel.name}`;
            fields.push(
                {
                    name: '📞 From',
                    value: `${oldState.channel.name} (${oldState.channel.id})`,
                    inline: true
                },
                {
                    name: '📞 To',
                    value: `${newState.channel.name} (${newState.channel.id})`,
                    inline: true
                }
            );
            // Fetch audit log for member move
            auditLogEntry = await ModLogManager.getAuditLogEntry(
                member.guild,
                AuditLogEvent.MemberMove,
                member.user
            );
        }
        // User's voice state changed (mute, deafen, etc.)
        else if (oldState.channel && newState.channel) {
            const changes = [];
            
            if (oldState.mute !== newState.mute) {
                changes.push(`**Muted:** ${oldState.mute ? 'Yes' : 'No'} → ${newState.mute ? 'Yes' : 'No'}`);
            }
            if (oldState.deaf !== newState.deaf) {
                changes.push(`**Deafened:** ${oldState.deaf ? 'Yes' : 'No'} → ${newState.deaf ? 'Yes' : 'No'}`);
            }
            if (oldState.selfMute !== newState.selfMute) {
                changes.push(`**Self Muted:** ${oldState.selfMute ? 'Yes' : 'No'} → ${newState.selfMute ? 'Yes' : 'No'}`);
            }
            if (oldState.selfDeaf !== newState.selfDeaf) {
                changes.push(`**Self Deafened:** ${oldState.selfDeaf ? 'Yes' : 'No'} → ${newState.selfDeaf ? 'Yes' : 'No'}`);
            }
            if (oldState.streaming !== newState.streaming) {
                changes.push(`**Streaming:** ${oldState.streaming ? 'Yes' : 'No'} → ${newState.streaming ? 'Yes' : 'No'}`);
            }
            if (oldState.selfVideo !== newState.selfVideo) {
                changes.push(`**Camera:** ${oldState.selfVideo ? 'On' : 'Off'} → ${newState.selfVideo ? 'On' : 'Off'}`);
            }

            if (changes.length === 0) return; // No relevant changes

            action = 'Voice State Changed';
            description = `${member.user.tag}'s voice state changed in ${newState.channel.name}`;
            fields.push(
                {
                    name: '📞 Channel',
                    value: `${newState.channel.name} (${newState.channel.id})`,
                    inline: true
                },
                {
                    name: '🔄 Changes',
                    value: changes.join('\n'),
                    inline: false
                }
            );
            // Fetch audit log for member update (mute/deafen)
            auditLogEntry = await ModLogManager.getAuditLogEntry(
                member.guild,
                AuditLogEvent.MemberUpdate,
                member.user
            );
        } else {
            return; // No relevant changes
        }

        const embed = {
            title: action,
            description,
            fields,
            thumbnail: member.user.displayAvatarURL({ dynamic: true })
        };

        if (auditLogEntry?.reason) {
            embed.fields.push({
                name: '📝 Reason',
                value: auditLogEntry.reason,
                inline: true
            });
        }

        await ModLogManager.logEvent(member.guild, 'voiceStateUpdate', embed, auditLogEntry?.executor);
    }
};
