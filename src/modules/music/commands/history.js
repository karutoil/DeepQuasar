const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../../schemas/User');
const MusicPlayerManager = require('../../../utils/MusicPlayerManager');

const PAGE_SIZE = 10;
const MAX_RESULTS = 100;

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('View and play from your music play history.'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const member = interaction.member;
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: 'You must be in a voice channel to use this command.', ephemeral: true });
        }

        // Helper to ensure history is always an array and deduplicate tracks
        const deduplicateTracks = (tracks) => {
            const seenUris = new Set();
            return tracks.filter(track => {
                if (!track.uri) return true; // Keep tracks with missing URI
                if (seenUris.has(track.uri)) return false;
                seenUris.add(track.uri);
                return true;
            });
        };
        function toHistoryArray(historyField) {
            if (Array.isArray(historyField)) return historyField;
            if (historyField && typeof historyField === 'object' && typeof historyField.values === 'function') {
                return Array.from(historyField.values());
            }
            return [];
        }

        // Fetch user history
        let userData = await User.findByUserId(userId);
        // Debug log for userData and userData.history
        //console.log('DEBUG /history userData:', userData);
        //console.log('DEBUG /history userData.history:', userData?.history);
        let history = toHistoryArray(userData?.history?.tracks);
        // Deduplicate by uri (show only one of the same song, most recent first)
        const seen = new Set();
        history = history.filter(track => {
            if (!track.uri || seen.has(track.uri)) return false;
            seen.add(track.uri);
            return true;
        });
        if (history.length === 0) {
            return interaction.reply({ content: 'You have no play history yet.', ephemeral: true });
        }
        history = history.slice(0, MAX_RESULTS);
        let page = 1;
        const totalPages = Math.ceil(history.length / PAGE_SIZE);

        // Helper to build embed and components
        function getSourceEmoji(source) {
            if (!source) return '';
            const s = source.toLowerCase();
            if (s === 'youtube') return '🔴'; // red
            if (s === 'spotify') return '🟢'; // green
            if (s === 'soundcloud') return '🟠'; // orange
            return '';
        }
        function buildEmbed(page) {
            const start = (page - 1) * PAGE_SIZE;
            const end = start + PAGE_SIZE;
            const tracks = history.slice(start, end);
            return interaction.client.musicPlayerManager.createBeautifulEmbed({
                title: 'Your Play History',
                description: tracks.map((track, i) => {
                    const url = track.uri || track.url || null;
                    const title = track.title || 'Unknown Title';
                    return url
                        ? `${getSourceEmoji(track.source)} ${start + i + 1}. [${title}](${url})`
                        : `${getSourceEmoji(track.source)} ${start + i + 1}. ${title}`;
                }).join('\n') || 'No tracks.',
                color: '#7289da',
                footer: { text: `Page ${page}/${totalPages}` }
            });
        }
        function buildComponents(page) {
            const start = (page - 1) * PAGE_SIZE;
            const end = start + PAGE_SIZE;
            const tracks = history.slice(start, end);
            const select = new StringSelectMenuBuilder()
                .setCustomId('history_select')
                .setPlaceholder('Select a song to play')
                .addOptions(tracks.map((track, i) => ({
                    label: `${getSourceEmoji(track.source)} ${track.title && track.title.length > 97 ? track.title.slice(0, 97) + '...' : (track.title || 'Unknown Title')}`,
                    value: String(start + i),
                    description: track.artist ? `by ${track.artist}` : undefined
                })));
            const row1 = new ActionRowBuilder().addComponents(select);
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('history_back').setLabel('⬅️ Back').setStyle(ButtonStyle.Secondary).setDisabled(page === 1),
                new ButtonBuilder().setCustomId('history_forward').setLabel('Forward ➡️').setStyle(ButtonStyle.Secondary).setDisabled(page === totalPages)
            );
            return [row1, row2];
        }

        // Helper to fetch and slice history fresh from DB
        async function getHistory() {
            const freshUser = await User.findByUserId(userId);
            //console.log('DEBUG /history freshUser:', freshUser);
            //console.log('DEBUG /history freshUser.history:', freshUser?.history);
            let freshHistory = toHistoryArray(freshUser?.history?.tracks);
            const seen = new Set();
            freshHistory = freshHistory.filter(track => {
                if (!track.uri || seen.has(track.uri)) return false;
                seen.add(track.uri);
                return true;
            });
            return freshHistory.slice(0, MAX_RESULTS);
        }

        await interaction.reply({ embeds: [buildEmbed(page)], components: buildComponents(page), ephemeral: true });

        // Collector for buttons and select menu
        const collectorTimeout = interaction.client.config.collectorTimeout || 60_000; // Configurable timeout
        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: collectorTimeout,
            idle: collectorTimeout
        });

        collector.on('collect', async i => {
            if (i.customId === 'history_back' || i.customId === 'history_forward') {
                if (i.customId === 'history_back') {
                    page = Math.max(1, page - 1);
                } else {
                    page = Math.min(totalPages, page + 1);
                }
                await i.update({ embeds: [buildEmbed(page)], components: buildComponents(page) });
            } else if (i.customId === 'history_select') {
                const idx = parseInt(i.values[0], 10);
                const track = history[idx];
                
                const result = await client.musicPlayerManager.playOrQueue({
                    guildId,
                    voiceChannelId: voiceChannel.id,
                    textChannelId: interaction.channelId,
                    query: track.uri,
                    source: track.source || 'youtube',
                    requester: userId
                });

                await i.deferUpdate();

                let replyEmbed;
                if (result.error) {
                    replyEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Error')
                        .setDescription(result.error);
                } else if (result.searchResult.loadType === 'PLAYLIST_LOADED') {
                    replyEmbed = new EmbedBuilder()
                        .setTitle('🎶 Playlist Queued')
                        .setDescription(`Queued **${result.searchResult.tracks.length}** tracks from [${result.searchResult.playlistInfo?.name || 'playlist'}](${track.uri})`)
                        .setColor('#00b894');
                } else {
                    replyEmbed = client.musicPlayerManager.createNowPlayingEmbed(result.searchResult.tracks[0], result.player);
                }
                
                await interaction.followUp({ embeds: [replyEmbed], ephemeral: false });
                collector.stop();
            }
        });
        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => {});
        });
    }
};
