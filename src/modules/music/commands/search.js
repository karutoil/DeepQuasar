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

    async execute(interaction, client) {
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const source = interaction.options.getString('source') || 'youtube';

        // Only search for tracks (playlist search removed)



        // Search for tracks or playlists (legacy)
        const searchResult = await client.musicPlayerManager.search({
            query: query,
            source: source,
            requester: interaction.user.id
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

        // Handle track search results only
        const tracks = searchResult.tracks.slice(0, 10); // Show top 10 results
        const embed = client.musicPlayerManager.createBeautifulEmbed({
            title: 'Search Results',
            description: tracks.map((track, i) => `**${i + 1}.** [${track.title}](${track.uri}) • ${client.musicPlayerManager.formatDuration(track.duration)} • ${track.author || 'Unknown'}`).join('\n'),
            color: '#5865F2',
            footer: { text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() }
        });

        // Build select menu
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('search_select')
            .setPlaceholder('Select a track to add to queue')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(tracks.map((track, i) => ({
                label: track.title.length > 97 ? track.title.slice(0, 97) + '...' : track.title,
                value: i.toString(),
                description: track.author ? `by ${track.author}` : undefined
            })));
        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Store search results for this user for later selection
        if (!client.searchResults) client.searchResults = new Map();
        client.searchResults.set(interaction.user.id, {
            tracks,
            guildId: interaction.guild.id,
            voiceChannelId: interaction.member.voice.channel?.id,
            textChannelId: interaction.channel.id
        });

        await interaction.editReply({ embeds: [embed], components: [row] });
    }
};

