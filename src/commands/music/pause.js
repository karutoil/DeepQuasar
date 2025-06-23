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
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ There is nothing playing in this server!')
                ],
                ephemeral: true
            });
        }

        // Check if user is in the same voice channel
        if (!client.musicPlayerManager.isInSameVoiceChannel(interaction.member, player)) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ You need to be in the same voice channel as the bot to use this command!')
                ],
                ephemeral: true
            });
        }

        // Check if player is already paused
        if (player.paused) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ The player is already paused!')
                ],
                ephemeral: true
            });
        }

        // Pause the player
        player.pause();

        return interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('#00ff00')
                .setDescription('⏸️ Paused the player.')
            ]
        });
    }
};
