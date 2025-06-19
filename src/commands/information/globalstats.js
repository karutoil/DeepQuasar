const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../schemas/User');

module.exports = {
    category: 'Information',
    data: new SlashCommandBuilder()
        .setName('globalstats')
        .setDescription('Show all-time global stats: played songs, AI conversations, total users, premium users'),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            // Total users
            const totalUsers = await User.countDocuments();

            // Total premium users
            const premiumUsers = await User.countDocuments({ 'premium.enabled': true });

            // Total played songs (all time)
            const songStats = await User.aggregate([
                { $group: { _id: null, total: { $sum: '$stats.songsPlayed' } } }
            ]);
            const totalPlayedSongs = songStats[0]?.total || 0;

            // Total AI conversations (all time)
            const aiStats = await User.aggregate([
                { $group: { _id: null, total: { $sum: '$stats.aiConversations' } } }
            ]);
            const totalAIConversations = aiStats[0]?.total || 0;

            const embed = new EmbedBuilder()
                .setTitle('🌐 Global Bot Statistics')
                .setColor(0x5865F2)
                .addFields(
                    { name: 'Total Played Songs', value: totalPlayedSongs.toLocaleString(), inline: true },
                    { name: 'AI Conversations', value: totalAIConversations.toLocaleString(), inline: true },
                    { name: 'Total Users', value: totalUsers.toLocaleString(), inline: true },
                    { name: 'Premium Users', value: premiumUsers.toLocaleString(), inline: true },
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply('❌ Failed to fetch global statistics.');
        }
    }
};
