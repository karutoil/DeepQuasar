const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for music across different sources')
        .addStringOption(option =>
            option
                .setName('query')
                .setDescription('What to search for (song name, artist, playlist, etc.)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('source')
                .setDescription('Source to search from')
                .setRequired(false)
                .addChoices(
                    { name: 'YouTube', value: 'youtube' },
                    { name: 'YouTube Music', value: 'ytmusic' },
                    { name: 'Spotify', value: 'spotify' },
                    { name: 'SoundCloud', value: 'soundcloud' },
                    { name: 'Apple Music', value: 'applemusic' },
                    { name: 'Deezer', value: 'deezer' },
                    { name: 'All Sources', value: 'all' }
                )
        )
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Type of content to search for')
                .setRequired(false)
                .addChoices(
                    { name: 'Songs', value: 'track' },
                    { name: 'Playlists', value: 'playlist' },
                    { name: 'Albums', value: 'album' },
                    { name: 'Artists', value: 'artist' },
                    { name: 'All Types', value: 'all' }
                )
        )
        .addIntegerOption(option =>
            option
                .setName('limit')
                .setDescription('Number of results to show (1-25)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(25)
        ),
    
    permissions: [],
    
    async execute(interaction, client) {
        try {
            const query = interaction.options.getString('query');
            const source = interaction.options.getString('source') || 'youtube';
            const type = interaction.options.getString('type') || 'track';
            const limit = interaction.options.getInteger('limit') || 10;

            await interaction.deferReply();

            // Check if user is in a voice channel for playing results
            const voiceCheck = Utils.checkVoiceChannel(interaction.member);
            const canPlay = voiceCheck.inVoice;

            // Perform the search
            const searchResults = await performSearch(client, query, source, type, limit);

            if (!searchResults || searchResults.length === 0) {
                const embed = Utils.createInfoEmbed(
                    'No Results Found',
                    `No ${type === 'all' ? 'content' : type + 's'} found for "${query}" on ${source === 'all' ? 'any source' : source}.`
                );
                return interaction.editReply({ embeds: [embed] });
            }

            const embed = createSearchEmbed(query, source, type, searchResults, canPlay);
            const components = createSearchComponents(searchResults, canPlay);

            await interaction.editReply({ embeds: [embed], components });

        } catch (error) {
            client.logger.error('Error in search command:', error);
            
            const embed = Utils.createErrorEmbed(
                'Search Error',
                'An error occurred while searching for music. Please try again.'
            );
            
            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({ embeds: [embed] });
            } else {
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }
};

async function performSearch(client, query, source, type, limit) {
    try {
        // Use the music player's search functionality directly
        const results = await client.musicPlayer.search(query, source);

        if (!results || !results.tracks || results.tracks.length === 0) {
            return [];
        }

        // Format results with additional metadata
        return results.tracks.slice(0, limit).map((track, index) => ({
            position: index + 1,
            title: track.info?.title || track.title || 'Unknown Title',
            author: track.info?.author || track.author || 'Unknown Artist',
            duration: track.info?.length || track.length || 0,
            uri: track.info?.uri || track.uri,
            source: track.info?.sourceName || track.sourceName || detectSource(track.info?.uri || track.uri),
            thumbnail: track.info?.artworkUrl || track.artworkUrl || null,
            isPlaylist: track.info?.isPlaylist || false,
            trackCount: track.info?.trackCount || null,
            encoded: track.encoded || track.track
        }));

    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

function detectSource(uri) {
    if (!uri) return 'Unknown';
    
    if (uri.includes('youtube.com') || uri.includes('youtu.be')) return 'YouTube';
    if (uri.includes('spotify.com')) return 'Spotify';
    if (uri.includes('soundcloud.com')) return 'SoundCloud';
    if (uri.includes('music.apple.com')) return 'Apple Music';
    if (uri.includes('deezer.com')) return 'Deezer';
    
    return 'Unknown';
}

function createSearchEmbed(query, source, type, results, canPlay) {
    const embed = new EmbedBuilder()
        .setTitle('🔍 Search Results')
        .setDescription(`Search for: **${query}**\nSource: **${source === 'all' ? 'All Sources' : source}**\nType: **${type === 'all' ? 'All Types' : type}**`)
        .setColor(0x3498db)
        .setTimestamp();

    let description = '';
    results.forEach((result, index) => {
        const emoji = getSourceEmoji(result.source);
        const typeIcon = result.isPlaylist ? '📁' : '🎵';
        
        description += `\`${result.position}.\` ${emoji} ${typeIcon} **${Utils.truncate(result.title, 40)}**\n`;
        description += `👤 *${Utils.truncate(result.author, 30)}*`;
        
        if (result.isPlaylist && result.trackCount) {
            description += ` • ${result.trackCount} tracks`;
        } else if (result.duration > 0) {
            description += ` • \`${Utils.formatDuration(result.duration)}\``;
        }
        
        description += `\n\n`;
    });

    embed.addFields({
        name: `Found ${results.length} result${results.length !== 1 ? 's' : ''}`,
        value: description || 'No results to display',
        inline: false
    });

    if (!canPlay) {
        embed.addFields({
            name: '⚠️ Note',
            value: 'Join a voice channel to play these results!',
            inline: false
        });
    }

    return embed;
}

function createSearchComponents(results, canPlay) {
    const components = [];

    // Create select menu with up to 25 options (Discord limit)
    const selectOptions = results.slice(0, 25).map(result => {
        const emoji = getSourceEmoji(result.source);
        const typeIcon = result.isPlaylist ? '📁' : '🎵';
        
        return {
            label: Utils.truncate(result.title, 90),
            description: Utils.truncate(`${result.author} • ${result.source}`, 90),
            value: `search_play_${result.position - 1}`,
            emoji: typeIcon
        };
    });

    if (selectOptions.length > 0) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('search_select')
            .setPlaceholder(canPlay ? 'Select a track to play...' : 'Join a voice channel to play tracks')
            .setDisabled(!canPlay)
            .addOptions(selectOptions);

        components.push(new ActionRowBuilder().addComponents(selectMenu));
    }

    // Add control buttons
    const buttonRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('search_play_all')
                .setLabel('Play All')
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!canPlay),
            new ButtonBuilder()
                .setCustomId('search_queue_all')
                .setLabel('Queue All')
                .setEmoji('➕')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(!canPlay),
            new ButtonBuilder()
                .setCustomId('search_refresh')
                .setLabel('Refresh')
                .setEmoji('🔄')
                .setStyle(ButtonStyle.Secondary)
        );

    components.push(buttonRow);

    return components;
}

function getSourceEmoji(source) {
    const emojis = {
        'YouTube': '🔴',
        'Spotify': '🟢',
        'SoundCloud': '🔶',
        'Apple Music': '⚪',
        'Deezer': '🟣',
        'Unknown': '❓'
    };
    
    return emojis[source] || '❓';
}

// Export search results for use in button interactions
module.exports.performSearch = performSearch;
module.exports.createSearchEmbed = createSearchEmbed;
module.exports.createSearchComponents = createSearchComponents;
