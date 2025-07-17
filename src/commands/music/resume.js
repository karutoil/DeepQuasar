const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume playback if paused'),

    async execute(interaction, client) {
        const player = client.musicPlayerManager.getPlayer(interaction.guild.id);
        
        if (!player) {
            return interaction.reply({
                embeds: [client.musicPlayerManager.createBeautifulEmbed({
                    title: 'Error',
                    description: '❌ There is nothing playing in this server!',
                    color: '#ED4245'
                })],
                ephemeral: true
            });
        }

        // Check if user is in the same voice channel
        if (!client.musicPlayerManager.isInSameVoiceChannel(interaction.member, player)) {
            return interaction.reply({
                embeds: [client.musicPlayerManager.createBeautifulEmbed({
                    title: 'Error',
                    description: '❌ You need to be in the same voice channel as the bot to use this command!',
                    color: '#ED4245'
                })],
                ephemeral: true
            });
        }

        // Check if player is paused
        if (!player.paused) {
            return interaction.reply({
                embeds: [client.musicPlayerManager.createBeautifulEmbed({
                    title: 'Error',
                    description: '❌ The player is not paused!',
                    color: '#ED4245'
                })],
                ephemeral: true
            });
        }

        // Resume the player
        await player.setPaused(false);

        return interaction.reply({
            embeds: [client.musicPlayerManager.createBeautifulEmbed({
                title: 'Resumed',
                description: '▶️ Resumed playback.',
                color: '#43b581'
            })]
        });
    }
};
