const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function formatTrackLine(track, index) {
    // Try to get artist and url, fallback if missing
    let artist = track.author || track.artist || track.uploader || 'Unknown';
    let url = track.uri || track.url || track.permalink_url || undefined;
    // If url is missing, just show plain text
    let title = url ? `[${track.title}](${url})` : track.title;
    return `${index}. ${title} | 👤 ${artist}`;
}

function createQueueDisplay(client, player, page = 1) {
    // Get the queue as an array
    let queue = [];
    if (player.queue && typeof player.queue.toArray === 'function') {
        queue = player.queue.toArray();
    } else if (Array.isArray(player.queue?.tracks)) {
        queue = player.queue.tracks;
    } else if (Array.isArray(player.queue)) {
        queue = player.queue;
    }
    const tracksPerPage = client.config.itemsPerPage || 10;
    const totalPages = Math.max(1, Math.ceil(queue.length / tracksPerPage));
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const start = (currentPage - 1) * tracksPerPage;
    const end = start + tracksPerPage;
    const tracks = queue.slice(start, end);

    let description = '';
    if (player.current) {
        let artist = player.current.author || player.current.artist || player.current.uploader || 'Unknown';
        let url = player.current.uri || player.current.url || player.current.permalink_url || undefined;
        let nowPlaying = url ? `[${player.current.title}](${url})` : player.current.title;
        description += `**Now Playing:**\n`;
        description += `${nowPlaying} | 👤 ${artist}\n\n`;
    }
    if (tracks.length > 0) {
        description += `**Up Next (Page ${currentPage} of ${totalPages}):**\n`;
        tracks.forEach((track, i) => {
            description += formatTrackLine(track, start + i + 1) + '\n';
        });
    } else if (!player.current) {
        description += '_No more tracks in the queue._';
    }

    const embed = client.musicPlayerManager.createBeautifulEmbed({
        title: 'Music Queue',
        description: description,
        color: '#5865F2',
        footer: { text: `Page ${currentPage}/${totalPages}` }
    });

    // Add navigation buttons if there are multiple pages
    let components = [];
    if (totalPages > 1) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`queue_prev_${currentPage}`)
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage <= 1),
                new ButtonBuilder()
                    .setCustomId(`queue_next_${currentPage}`)
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage >= totalPages)
            );
        components = [row];
    }

    return { embed, components };
}

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current queue')
        .addIntegerOption(option =>
            option
                .setName('page')
                .setDescription('Page number to display')
                .setRequired(false)
                .setMinValue(1)
        ),

    async execute(interaction, client) {
        // Music module toggle check
        if (interaction.guildData && interaction.guildData.musicEnabled === false) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ED4245')
                    .setTitle('❌ Music Disabled')
                    .setDescription('The music module is currently disabled on this server. An admin can enable it with `/settings music-toggle state:on`.')],
                ephemeral: true
            });
        }

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

        // Check if there are tracks in the queue or currently playing
        if (!player.current && (!player.queue || player.queue.size === 0)) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ There are no tracks in the queue!')
                ],
                ephemeral: true
            });
        }

        // Always get page from customId if present (for button interaction)
        let page = interaction.options?.getInteger?.('page') || 1;
        // If this is a button interaction, get the page from the button customId
        if (interaction.isButton && interaction.isButton()) {
            const match = interaction.customId.match(/queue_(prev|next)_(\d+)/);
            if (match) {
                const currentPage = parseInt(match[2], 10);
                page = match[1] === 'prev' ? Math.max(1, currentPage - 1) : Math.min(currentPage + 1, 1000);
            }
        }

        const { embed, components } = createQueueDisplay(client, player, page);
        const reply = await interaction.reply({ embeds: [embed], components, fetchReply: true });

        if (components.length > 0) {
            const collector = reply.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 180000 // 3 minutes
            });

            collector.on('collect', async i => {
                const match = i.customId.match(/queue_(prev|next)_(\d+)/);
                if (match) {
                    const currentPage = parseInt(match[2], 10);
                    const newPage = match[1] === 'prev' ? currentPage - 1 : currentPage + 1;
                    const { embed, components } = createQueueDisplay(client, player, newPage);
                    await i.update({ embeds: [embed], components });
                }
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] }).catch(() => {});
            });
        }
    }
};

module.exports.createQueueDisplay = createQueueDisplay;
