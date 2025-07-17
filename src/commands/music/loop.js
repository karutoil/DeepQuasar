const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Set loop mode for the player')
        .addStringOption(option =>
            option
                .setName('mode')
                .setDescription('Loop mode')
                .setRequired(false)
                .addChoices(
                    { name: 'Off', value: 'none' },
                    { name: 'Track', value: 'track' },
                    { name: 'Queue', value: 'queue' }
                )
        ),

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

        const mode = interaction.options.getString('mode');
        const queue = client.musicPlayerManager.queues.get(interaction.guild.id);

        if (!mode) {
            // Show current loop mode
            let currentMode = 'Off';
            let emoji = '⏹️';
            
            if (queue && queue.loop) {
                currentMode = 'Queue';
                emoji = '🔁';
            }

            return interaction.reply({
                embeds: [client.musicPlayerManager.createBeautifulEmbed({
                    title: 'Loop Mode',
                    description: `${emoji} Current loop mode: **${currentMode}**`,
                    color: '#0099ff'
                })]
            });
        }

        // Set new loop mode
        if (queue) {
            queue.loop = (mode === 'queue');
        }

        let modeText = 'Off';
        let emoji = '⏹️';
        
        if (mode === 'queue') {
            modeText = 'Queue';
            emoji = '🔁';
        }

        return interaction.reply({
            embeds: [client.musicPlayerManager.createBeautifulEmbed({
                title: 'Loop Mode',
                description: `${emoji} Loop mode set to: **${modeText}**`,
                color: '#43b581'
            })]
        });
    }
};
