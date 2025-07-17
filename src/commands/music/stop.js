const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop playback and clear the queue'),

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

        // Stop playback and clear queue
        await client.musicPlayerManager.destroyPlayer(interaction.guild.id);

        return interaction.reply({
            embeds: [client.musicPlayerManager.createBeautifulEmbed({
                title: 'Stopped',
                description: '⏹️ Stopped playback and cleared the queue.',
                color: '#43b581'
            })]
        });
    }
};
