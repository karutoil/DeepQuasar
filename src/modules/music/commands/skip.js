const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current track')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Number of tracks to skip (default: 1)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)
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

        // Check if there is a current track
        if (!player.current) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ There is nothing playing right now!')
                ],
                ephemeral: true
            });
        }

        const amount = interaction.options.getInteger('amount') || 1;
        const currentTrack = player.current;
        const artist = currentTrack.author || currentTrack.artist || currentTrack.uploader || 'Unknown';

        if (amount === 1) {
            // Skip single track
            player.skip();
            
            return interaction.reply({
                embeds: [client.musicPlayerManager.createBeautifulEmbed({
                    title: 'Skipped',
                    description: `⏭️ Skipped: **${currentTrack.title}** by **${artist}**`,
                    color: '#43b581'
                })]
            });
        } else {
            // Skip multiple tracks
            let skippedTracks = 1; // Current track
            const skippedList = [currentTrack.title];

            // Skip additional tracks from the queue
            for (let i = 1; i < amount && player.queue.size > 0; i++) {
                const nextTrack = player.queue.tracks[0];
                if (nextTrack) {
                    player.queue.remove(0);
                    skippedList.push(nextTrack.title);
                    skippedTracks++;
                }
            }

            // Skip the current track
            player.skip();

            const embed = client.musicPlayerManager.createBeautifulEmbed({
                title: `Skipped ${skippedTracks} Track${skippedTracks > 1 ? 's' : ''}`,
                description: skippedList.map((title, index) => 
                    `${index + 1}. ${title}`
                ).join('\n'),
                color: '#43b581'
            });

            return interaction.reply({ embeds: [embed] });
        }
    }
};
