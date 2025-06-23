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

        const mode = interaction.options.getString('mode');

        if (!mode) {
            // Show current loop mode
            let currentMode = 'Off';
            let emoji = '⏹️';
            
            if (player.loop === 'track') {
                currentMode = 'Track';
                emoji = '🔂';
            } else if (player.loop === 'queue') {
                currentMode = 'Queue';
                emoji = '🔁';
            }

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#0099ff')
                    .setDescription(`${emoji} Current loop mode: **${currentMode}**`)
                ]
            });
        }

        // Set new loop mode
        await player.setLoop(mode);

        let modeText = 'Off';
        let emoji = '⏹️';
        
        if (mode === 'track') {
            modeText = 'Track';
            emoji = '🔂';
        } else if (mode === 'queue') {
            modeText = 'Queue';
            emoji = '🔁';
        }

        return interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('#00ff00')
                .setDescription(`${emoji} Loop mode set to: **${modeText}**`)
            ]
        });
    }
};
