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
        .addIntegerOption(option =>
            option
                .setName('limit')
                .setDescription('Number of results to show (1-10)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)
        ),

    async execute(interaction, client) {
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const source = interaction.options.getString('source') || 'youtube';
        const limit = interaction.options.getInteger('limit') || 10;

        // Check if user is in a voice channel
        if (!interaction.member.voice.channel) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ You need to join a voice channel first!')
                ]
            });
        }

        // Search for tracks
        const searchResult = await client.musicPlayerManager.search({
            query: query,
            source: source,
            requester: interaction.user.id
        });

        if (!searchResult.tracks.length) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ No results found!')
                ]
            });
        }

        // Limit results
        const tracks = searchResult.tracks.slice(0, limit);

        // Create embed with search results (classic style)
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({ name: `Search Results`, iconURL: client.user.displayAvatarURL() })
            .setTitle(`🔍 ${query}`)
            .setDescription(`**Source:** ${source.charAt(0).toUpperCase() + source.slice(1)}\n**Results:** ${tracks.length}`)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        // Add track list to embed (classic style)
        const trackList = tracks.map((track, index) => {
            const duration = client.musicPlayerManager.formatDuration(track.duration);
            const url = track.uri || track.url || track.permalink_url || null;
            const title = url ? `[${track.title}](${url})` : track.title;
            return `**${index + 1}.** ${title}\n└ ${track.author} • ${duration}`;
        }).join('\n\n');

        embed.addFields({
            name: '🎵 Tracks',
            value: trackList.length > 1024 ? trackList.substring(0, 1021) + '...' : trackList
        });

        // Create select menu for track selection (allow multiple selection)
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`search_select_${interaction.user.id}`)
            .setPlaceholder('Select one or more tracks to add to queue')
            .setMinValues(1)
            .setMaxValues(tracks.length > 10 ? 10 : tracks.length) // Discord max is 25, but we limit to 10
            .addOptions(
                tracks.map((track, index) => ({
                    label: track.title.length > 100 ? track.title.substring(0, 97) + '...' : track.title,
                    description: `${track.author} • ${client.musicPlayerManager.formatDuration(track.duration)}`,
                    value: `${index}`
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Edit reply with embed and select menu, and delete after 3 minutes
        const reply = await interaction.editReply({
            embeds: [embed],
            components: [row]
        });

        // Store search results for the select menu handler
        client.searchResults = client.searchResults || new Map();
        client.searchResults.set(interaction.user.id, {
            tracks: tracks,
            guildId: interaction.guild.id,
            voiceChannelId: interaction.member.voice.channel.id,
            textChannelId: interaction.channel.id,
            timestamp: Date.now()
        });

        // Clean up and remove the message after 3 minutes
        setTimeout(async () => {
            if (client.searchResults.has(interaction.user.id)) {
                const searchData = client.searchResults.get(interaction.user.id);
                if (Date.now() - searchData.timestamp > 180000) { // 3 minutes
                    client.searchResults.delete(interaction.user.id);
                    try {
                        await interaction.deleteReply();
                    } catch (e) { /* ignore if already deleted */ }
                }
            }
        }, 180000);
    }
};
