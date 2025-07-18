const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Guild = require('../../schemas/Guild');
const User = require('../../schemas/User');

module.exports = {
    category: 'Information',
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Show global bot statistics: played songs, AI conversations, servers, users, supporters'),

    async execute(interaction, client) {
        await interaction.deferReply();
        try {
            // Total servers
            const totalServers = client.guilds.cache.size;

            // Total users (unique)
            let totalUsers = 0;
            client.guilds.cache.forEach(guild => {
                totalUsers += guild.memberCount || 0;
            });

            // Total supporters (premium users)
            const premiumCount = await User.countDocuments({ 'premium.enabled': true });

            // Total played songs (all time)
            const userSongStats = await User.aggregate([
                { $group: { _id: null, total: { $sum: '$stats.songsPlayed' } } }
            ]);
            const totalPlayedSongs = userSongStats[0]?.total || 0;

            // Total AI conversations (all time)
            const userAIStats = await User.aggregate([
                { $group: { _id: null, total: { $sum: '$stats.aiConversations' } } }
            ]);
            const totalAIConversations = userAIStats[0]?.total || 0;

            const embed = new EmbedBuilder()
                .setTitle('Bot Statistics')
                .setColor(0x00AE86)
                .addFields(
                    { name: 'Total Played Songs', value: totalPlayedSongs.toLocaleString(), inline: true },
                    { name: 'AI Conversations', value: totalAIConversations.toLocaleString(), inline: true },
                    { name: 'Servers', value: totalServers.toLocaleString(), inline: true },
                    { name: 'Users', value: totalUsers.toLocaleString(), inline: true },
                    { name: 'Supporters', value: premiumCount.toLocaleString(), inline: true },
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply('❌ Failed to fetch statistics.');
            if (client.logger) client.logger.error('Error in /stats command:', error);
        }
    }
};
