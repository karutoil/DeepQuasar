const Guild = require('../schemas/Guild');

module.exports = {
    name: 'guildDelete',
    async execute(guild, client) {
        client.logger.info(`➖ Left guild: ${guild.name} (${guild.id}) - ${guild.memberCount || 0} members`);

        try {
            // Destroy any active music player
            const player = client.musicPlayer.getPlayer(guild.id);
            if (player) {
                await client.musicPlayer.destroy(guild.id);
                client.logger.info(`Destroyed music player for guild: ${guild.name}`);
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
            client.user.setActivity(`${client.guilds.cache.size} servers`, { type: 'WATCHING' });

        } catch (error) {
            client.logger.error(`Error handling guildDelete for ${guild.name}:`, error);
        }
    }
};
