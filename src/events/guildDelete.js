const { ActivityType } = require('discord.js');
const Guild = require('../schemas/Guild');

module.exports = {
    name: 'guildDelete',
    async execute(guild, client) {
        client.logger.info(`➖ Left guild: ${guild.name} (${guild.id}) - ${guild.memberCount || 0} members`);

        try {
            // Destroy any active music player (robust to missing references)
            let destroyed = false;
            if (client.musicPlayer && typeof client.musicPlayer.getPlayer === 'function') {
                const player = client.musicPlayer.getPlayer(guild.id);
                if (player && typeof client.musicPlayer.destroy === 'function') {
                    await client.musicPlayer.destroy(guild.id);
                    client.logger.info(`Destroyed music player for guild: ${guild.name}`);
                    destroyed = true;
                }
            } else if (client.musicPlayerManager && typeof client.musicPlayerManager.getPlayer === 'function') {
                const player = client.musicPlayerManager.getPlayer(guild.id);
                if (player && typeof client.musicPlayerManager.destroy === 'function') {
                    await client.musicPlayerManager.destroy(guild.id);
                    client.logger.info(`Destroyed music player for guild: ${guild.name}`);
                    destroyed = true;
                }
            } else if (client.manager && client.manager.players && typeof client.manager.players.get === 'function') {
                const player = client.manager.players.get(guild.id);
                if (player && typeof player.destroy === 'function') {
                    await player.destroy();
                    client.logger.info(`Destroyed music player for guild: ${guild.name}`);
                    destroyed = true;
                }
            }

            // Optional: Remove guild data from database
            // You might want to keep it for when the bot rejoins
            const guildData = await Guild.findByGuildId(guild.id);
            if (guildData) {
                // Mark as inactive instead of deleting
                guildData.stats.lastActivity = new Date();
                await guildData.save();
                
                client.logger.info(`Updated last activity for guild: ${guild.name}`);
            }

            // Update bot activity
            if (client.user && client.guilds && client.guilds.cache) {
                client.user.setActivity(`${client.guilds.cache.size} servers`, { type: ActivityType.Watching });
            }

        } catch (error) {
            client.logger.error(`Error handling guildDelete for ${guild.name}:`, error);
        }
    }
};
