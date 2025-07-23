const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for music and select tracks to play')
        .addStringOption(option =>
            option
                .setName('query')
                .setDescription('What to search for (song name, artist, etc.)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('source')
                .setDescription('Source to search from')
                .setRequired(false)
                .addChoices(
                    { name: 'YouTube', value: 'youtube' },
                    { name: 'SoundCloud', value: 'soundcloud' },
                    { name: 'Spotify', value: 'spotify' }
                )
        )
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Type of content to search for')
                .setRequired(false)
                .addChoices(
                    { name: 'Track', value: 'track' },
                    { name: 'Playlist', value: 'playlist' }
                )
        ),

    async execute(interaction, client) {
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const source = interaction.options.getString('source') || 'youtube';
        const type = interaction.options.getString('type') || 'track';

        // Search for tracks or playlists
        const searchResult = await client.musicPlayerManager.search({
            query: query,
            source: source,
            requester: interaction.user.id,
            type: type
        });

        if (!searchResult.tracks.length) {
            // Check if this was due to connection issues
            if (searchResult.loadType === 'error' && (searchResult.error?.includes('server') || searchResult.error?.includes('connection'))) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#ff9500')
                        .setTitle('⚠️ Connection Issue')
                        .setDescription('❌ Unable to search due to music server connectivity issues. Please try again in a moment.')
                    ]
                });
            }
            
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ No results found!')
                ]
            });
        }

        if (searchResult.loadType === 'playlist') {
            const playlist = searchResult.tracks;
            const embed = client.musicPlayerManager.createBeautifulEmbed({
                title: `Playlist Found`,
                description: `**${searchResult.playlistInfo.name}**\n${playlist.length} tracks`,
                color: '#5865F2',
                footer: { text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() }
            });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`add_playlist_${interaction.user.id}`)
                        .setLabel('Add to Queue')
                        .setStyle(ButtonStyle.Success)
                );

            const reply = await interaction.editReply({ embeds: [embed], components: [row] });

            const collector = reply.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id && i.customId === `add_playlist_${interaction.user.id}`,
                time: 180000, // 3 minutes
                max: 1
            });

            collector.on('collect', async i => {
                const player = await client.musicPlayerManager.createPlayer({
                    guildId: interaction.guild.id,
                    voiceChannelId: interaction.member.voice.channel.id,
                    textChannelId: interaction.channel.id,
                    autoPlay: true
                });

                if (!player.connected) {
                    await player.connect();
                }

                player.queue.add(playlist);

                if (!player.playing && !player.paused) {
                    await player.play();
                }

                await i.update({ content: `Added playlist **${searchResult.playlistInfo.name}** to the queue.`, embeds: [], components: [] });
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.deleteReply().catch(() => {});
                }
            });

        } else {
    }
    }
};
