const { Events, AuditLogEvent, ChannelType } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.ChannelCreate,
    async execute(channel) {
        if (!channel.guild) return;

        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            channel.guild, 
            AuditLogEvent.ChannelCreate,
            channel
        );

        const channelTypes = {
            [ChannelType.GuildText]: 'Text Channel',
            [ChannelType.GuildVoice]: 'Voice Channel',
            [ChannelType.GuildCategory]: 'Category',
            [ChannelType.GuildAnnouncement]: 'Announcement Channel',
            [ChannelType.AnnouncementThread]: 'Announcement Thread',
            [ChannelType.PublicThread]: 'Public Thread',
            [ChannelType.PrivateThread]: 'Private Thread',
            [ChannelType.GuildStageVoice]: 'Stage Channel',
            [ChannelType.GuildForum]: 'Forum Channel',
            [ChannelType.GuildMedia]: 'Media Channel'
        };

        const embed = {
            title: 'Channel Created',
            description: `${channelTypes[channel.type] || 'Unknown'} was created`,
            fields: [
                {
                    name: '📋 Channel',
                    value: ModLogManager.formatChannel(channel),
                    inline: true
                },
                {
                    name: '📂 Type',
                    value: channelTypes[channel.type] || 'Unknown',
                    inline: true
                },
                {
                    name: '🆔 Channel ID',
                    value: channel.id,
                    inline: true
                }
            ]
        };

        // Add category info for non-category channels
        if (channel.parent && channel.type !== ChannelType.GuildCategory) {
            embed.fields.push({
                name: '📁 Category',
                value: channel.parent.name,
                inline: true
            });
        }

        // Add position info
        if (channel.position !== undefined) {
            embed.fields.push({
                name: '📍 Position',
                value: channel.position.toString(),
                inline: true
            });
        }

        if (auditLogEntry) {
            embed.fields.push({
                name: '👮 Created By',
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

        await ModLogManager.logEvent(channel.guild, 'channelCreate', embed);
    }
};
