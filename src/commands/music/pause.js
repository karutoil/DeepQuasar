const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current song'),

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

        // Check if player is already paused
        if (player.paused) {
            return interaction.reply({
                embeds: [client.musicPlayerManager.createBeautifulEmbed({
                    title: 'Error',
                    description: '❌ The player is already paused!',
                    color: '#ED4245'
                })],
                ephemeral: true
            });
        }

        // Pause the player
        await player.setPaused(true);

        return interaction.reply({
            embeds: [client.musicPlayerManager.createBeautifulEmbed({
                title: 'Paused',
                description: '⏸️ Paused the player.',
                color: '#43b581'
            })]
        });
    }
};
