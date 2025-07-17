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
    // Get the queue from our queue management system
    const guildQueue = client.musicPlayerManager.queues.get(player.guildId);
    const queue = guildQueue ? guildQueue.tracks : [];
    
    const tracksPerPage = client.config.itemsPerPage || 10;
    const totalPages = Math.max(1, Math.ceil(queue.length / tracksPerPage));
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const start = (currentPage - 1) * tracksPerPage;
    const end = start + tracksPerPage;
    const tracks = queue.slice(start, end);

    let description = '';
    if (guildQueue && guildQueue.current) {
        let artist = guildQueue.current.author || guildQueue.current.artist || 'Unknown';
        let url = guildQueue.current.uri || guildQueue.current.url || undefined;
        let nowPlaying = url ? `[${guildQueue.current.title}](${url})` : guildQueue.current.title;
        description += `**Now Playing:**\n`;
        description += `${nowPlaying} | 👤 ${artist}\n\n`;
    }
    if (tracks.length > 0) {
        description += `**Up Next (Page ${currentPage} of ${totalPages}):**\n`;
        tracks.forEach((track, i) => {
            description += formatTrackLine(track, start + i + 1) + '\n';
        });
    } else if (!guildQueue || !guildQueue.current) {
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
        // Always use update for button interactions, reply for slash
        if (interaction.isButton && interaction.isButton()) {
            return interaction.update({ embeds: [embed], components });
        } else {
            return interaction.reply({ embeds: [embed], components });
        }
    }
};

module.exports.createQueueDisplay = createQueueDisplay;
