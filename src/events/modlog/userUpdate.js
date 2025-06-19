const { Events } = require('discord.js');
const ModLogManager = require('../../utils/ModLogManager');

module.exports = {
    name: Events.UserUpdate,
    async execute(oldUser, newUser) {
        const changes = [];

        // Check username changes
        if (oldUser.username !== newUser.username) {
            changes.push({
                name: '👤 Username',
                value: `**Before:** ${oldUser.username}\n**After:** ${newUser.username}`,
                inline: true
            });
        }

        // Check discriminator changes (for legacy usernames)
        if (oldUser.discriminator !== newUser.discriminator) {
            changes.push({
                name: '🏷️ Discriminator',
                value: `**Before:** #${oldUser.discriminator}\n**After:** #${newUser.discriminator}`,
                inline: true
            });
        }

        // Check avatar changes
        if (oldUser.avatar !== newUser.avatar) {
            changes.push({
                name: '🖼️ Avatar',
                value: 'Avatar was changed',
                inline: true
            });
        }

        // Check global name changes (display name)
        if (oldUser.globalName !== newUser.globalName) {
            changes.push({
                name: '📛 Display Name',
                value: `**Before:** ${oldUser.globalName || 'None'}\n**After:** ${newUser.globalName || 'None'}`,
                inline: true
            });
        }

        // Only log if there are changes
        if (changes.length === 0) return;

        // Get all mutual guilds to log to each one
        const mutualGuilds = newUser.client.guilds.cache.filter(guild => guild.members.cache.has(newUser.id));

        for (const guild of mutualGuilds.values()) {
            const embed = {
                title: 'User Updated',
                description: `${newUser.tag} updated their profile`,
                fields: [
                    {
                        name: '👤 User',
                        value: ModLogManager.formatUser(newUser),
                        inline: true
                    },
                    {
                        name: '🆔 User ID',
                        value: newUser.id,
                        inline: true
                    },
                    ...changes
                ],
                thumbnail: newUser.displayAvatarURL({ dynamic: true })
            };

            await ModLogManager.logEvent(guild, 'userUpdate', embed);
        }
    }
};
