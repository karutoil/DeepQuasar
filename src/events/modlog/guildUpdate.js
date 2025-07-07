const { Events, AuditLogEvent } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.GuildUpdate,
    async execute(oldGuild, newGuild) {
        const changes = [];

        // Check name changes
        if (oldGuild.name !== newGuild.name) {
            changes.push({
                name: '📝 Server Name',
                value: `**Before:** ${oldGuild.name}\n**After:** ${newGuild.name}`,
                inline: true
            });
        }

        // Check description changes
        if (oldGuild.description !== newGuild.description) {
            changes.push({
                name: '📄 Description',
                value: `**Before:** ${ModLogManager.truncateText(oldGuild.description || 'None', 512)}\n**After:** ${ModLogManager.truncateText(newGuild.description || 'None', 512)}`,
                inline: false
            });
        }

        // Check icon changes
        if (oldGuild.icon !== newGuild.icon) {
            changes.push({
                name: '🖼️ Server Icon',
                value: 'Server icon was changed',
                inline: true
            });
        }

        // Check banner changes
        if (oldGuild.banner !== newGuild.banner) {
            changes.push({
                name: '🎨 Server Banner',
                value: 'Server banner was changed',
                inline: true
            });
        }

        // Check splash changes
        if (oldGuild.splash !== newGuild.splash) {
            changes.push({
                name: '💦 Invite Splash',
                value: 'Invite splash was changed',
                inline: true
            });
        }

        // Check discovery splash changes
        if (oldGuild.discoverySplash !== newGuild.discoverySplash) {
            changes.push({
                name: '🔍 Discovery Splash',
                value: 'Discovery splash was changed',
                inline: true
            });
        }

        // Check owner changes
        if (oldGuild.ownerId !== newGuild.ownerId) {
            const oldOwner = oldGuild.members.cache.get(oldGuild.ownerId);
            const newOwner = newGuild.members.cache.get(newGuild.ownerId);
            
            changes.push({
                name: '👑 Server Owner',
                value: `**Before:** ${oldOwner ? ModLogManager.formatUser(oldOwner.user) : 'Unknown'}\n**After:** ${newOwner ? ModLogManager.formatUser(newOwner.user) : 'Unknown'}`,
                inline: true
            });
        }

        // Check verification level changes
        if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
            const levels = ['None', 'Low', 'Medium', 'High', 'Very High'];
            changes.push({
                name: '🔒 Verification Level',
                value: `**Before:** ${levels[oldGuild.verificationLevel]}\n**After:** ${levels[newGuild.verificationLevel]}`,
                inline: true
            });
        }

        // Check explicit content filter changes
        if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter) {
            const filters = ['Disabled', 'Members without roles', 'All members'];
            changes.push({
                name: '🔞 Content Filter',
                value: `**Before:** ${filters[oldGuild.explicitContentFilter]}\n**After:** ${filters[newGuild.explicitContentFilter]}`,
                inline: true
            });
        }

        // Check default message notifications changes
        if (oldGuild.defaultMessageNotifications !== newGuild.defaultMessageNotifications) {
            const notifications = ['All messages', 'Only mentions'];
            changes.push({
                name: '🔔 Default Notifications',
                value: `**Before:** ${notifications[oldGuild.defaultMessageNotifications]}\n**After:** ${notifications[newGuild.defaultMessageNotifications]}`,
                inline: true
            });
        }

        // Check AFK channel changes
        if (oldGuild.afkChannelId !== newGuild.afkChannelId) {
            const oldChannel = oldGuild.afkChannelId ? oldGuild.channels.cache.get(oldGuild.afkChannelId)?.name : 'None';
            const newChannel = newGuild.afkChannelId ? newGuild.channels.cache.get(newGuild.afkChannelId)?.name : 'None';
            
            changes.push({
                name: '💤 AFK Channel',
                value: `**Before:** ${oldChannel}\n**After:** ${newChannel}`,
                inline: true
            });
        }

        // Check AFK timeout changes
        if (oldGuild.afkTimeout !== newGuild.afkTimeout) {
            changes.push({
                name: '⏰ AFK Timeout',
                value: `**Before:** ${ModLogManager.formatDuration(oldGuild.afkTimeout)}\n**After:** ${ModLogManager.formatDuration(newGuild.afkTimeout)}`,
                inline: true
            });
        }

        // Check system channel changes
        if (oldGuild.systemChannelId !== newGuild.systemChannelId) {
            const oldChannel = oldGuild.systemChannelId ? oldGuild.channels.cache.get(oldGuild.systemChannelId)?.name : 'None';
            const newChannel = newGuild.systemChannelId ? newGuild.channels.cache.get(newGuild.systemChannelId)?.name : 'None';
            
            changes.push({
                name: '📢 System Channel',
                value: `**Before:** ${oldChannel}\n**After:** ${newChannel}`,
                inline: true
            });
        }

        // Check rules channel changes
        if (oldGuild.rulesChannelId !== newGuild.rulesChannelId) {
            const oldChannel = oldGuild.rulesChannelId ? oldGuild.channels.cache.get(oldGuild.rulesChannelId)?.name : 'None';
            const newChannel = newGuild.rulesChannelId ? newGuild.channels.cache.get(newGuild.rulesChannelId)?.name : 'None';
            
            changes.push({
                name: '📜 Rules Channel',
                value: `**Before:** ${oldChannel}\n**After:** ${newChannel}`,
                inline: true
            });
        }

        // Only log if there are changes
        if (changes.length === 0) return;

        const auditLogEntry = await ModLogManager.getAuditLogEntry(
            newGuild, 
            AuditLogEvent.GuildUpdate
        );

        const embed = {
            title: 'Server Updated',
            description: `Server settings were updated`,
            fields: [
                {
                    name: '🏠 Server',
                    value: `${newGuild.name} (${newGuild.id})`,
                    inline: true
                },
                ...changes
            ]
        };

        // Add server icon as thumbnail if available
        if (newGuild.iconURL()) {
            embed.thumbnail = newGuild.iconURL({ dynamic: true });
        }

        if (auditLogEntry?.reason) {
            embed.fields.push({
                name: '📝 Reason',
                value: auditLogEntry.reason,
                inline: true
            });
        }

        await ModLogManager.logEvent(newGuild, 'guildUpdate', embed, auditLogEntry?.executor);
    }
};
