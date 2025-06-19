const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('searchv2')
        .setDescription('Search for music with Components V2 interface')
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
                    { name: 'Deezer', value: 'deezer' }
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
    
    permissions: [],
    
    async execute(interaction, client) {
        try {
            const query = interaction.options.getString('query');
            const source = interaction.options.getString('source') || 'youtube';
            const limit = interaction.options.getInteger('limit') || 5;

            await interaction.deferReply();

            // Check if user is in a voice channel for playing results
            const voiceCheck = Utils.checkVoiceChannel(interaction.member);
            const canPlay = voiceCheck.inVoice;

            // Perform the search
            const searchResults = await performSearch(client, query, source, limit);

            if (!searchResults || searchResults.length === 0) {
                const noResultsContainer = new ContainerBuilder()
                    .setAccentColor(0xff6b6b)
                    .addTextDisplayComponents(
                        textDisplay => textDisplay
                            .setContent(`## 🔍 No Results Found\n\nNo results found for **${query}** on ${source}.\n\nTry:\n• Different search terms\n• Different source\n• Check spelling`)
                    );

                return interaction.editReply({ 
                    components: [noResultsContainer],
                    flags: MessageFlags.IsComponentsV2 
                });
            }

            const searchContainer = createSearchContainerV2(query, source, searchResults, canPlay);
            const actionRows = createSearchActionRows(searchResults, canPlay);

            const components = [searchContainer, ...actionRows];

            await interaction.editReply({ 
                components,
                flags: MessageFlags.IsComponentsV2 
            });

        } catch (error) {
            client.logger.error('Error in searchv2 command:', error);
            
            const errorContainer = new ContainerBuilder()
                .setAccentColor(0xff6b6b)
                .addTextDisplayComponents(
                    textDisplay => textDisplay
                        .setContent(`## ❌ Search Error\n\nAn error occurred while searching for music. Please try again.`)
                );
            
            const components = [errorContainer];
            
            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({ 
                    components,
                    flags: MessageFlags.IsComponentsV2 
                });
            } else {
                return interaction.reply({ 
                    components,
                    flags: MessageFlags.IsComponentsV2,
                    ephemeral: true 
                });
            }
        }
    }
};

async function performSearch(client, query, source, limit) {
    try {
        // Use the music player's search functionality
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

function createSearchContainerV2(query, source, results, canPlay) {
    const container = new ContainerBuilder()
        .setAccentColor(0x3498db);

    // Header
    container.addTextDisplayComponents(
        textDisplay => textDisplay
            .setContent(`## 🔍 Search Results\n\n**Query:** ${query}\n**Source:** ${source}\n**Results:** ${results.length}`)
    );

    // Separator
    container.addSeparatorComponents(separator => separator);

    // Results
    let resultsText = '';
    results.forEach((result, index) => {
        const emoji = getSourceEmoji(result.source);
        resultsText += `${emoji} **${index + 1}.** ${Utils.truncate(result.title, 35)}\n`;
        resultsText += `👤 *${Utils.truncate(result.author, 30)}*`;
        
        if (result.duration > 0) {
            resultsText += ` • \`${Utils.formatDuration(result.duration)}\``;
        }
        
        resultsText += '\n\n';
    });

    container.addTextDisplayComponents(
        textDisplay => textDisplay
            .setContent(resultsText)
    );

    // Voice channel warning if needed
    if (!canPlay) {
        container.addSeparatorComponents(separator => separator);
        container.addTextDisplayComponents(
            textDisplay => textDisplay
                .setContent(`⚠️ **Note:** Join a voice channel to play these results!`)
        );
    }

    return container;
}

function createSearchActionRows(results, canPlay) {
    const actionRows = [];

    // Select menu for individual tracks
    if (results.length > 0) {
        const selectOptions = results.map(result => ({
            label: Utils.truncate(result.title, 90),
            description: Utils.truncate(`${result.author} • ${result.source}`, 90),
            value: `searchv2_play_${result.position - 1}`,
            emoji: '🎵'
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('searchv2_select')
            .setPlaceholder(canPlay ? 'Select a track to play...' : 'Join a voice channel to play tracks')
            .setDisabled(!canPlay)
            .addOptions(selectOptions);

        actionRows.push(new ActionRowBuilder().addComponents(selectMenu));
    }

    // Control buttons
    const buttonRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('searchv2_play_all')
                .setLabel('Play All')
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!canPlay),
            new ButtonBuilder()
                .setCustomId('searchv2_queue_all')
                .setLabel('Queue All')
                .setEmoji('➕')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(!canPlay),
            new ButtonBuilder()
                .setCustomId('searchv2_refresh')
                .setLabel('Refresh')
                .setEmoji('🔄')
                .setStyle(ButtonStyle.Secondary)
        );

    actionRows.push(buttonRow);

    return actionRows;
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

// Export functions for use in button interactions
module.exports.performSearch = performSearch;
module.exports.createSearchContainerV2 = createSearchContainerV2;
module.exports.createSearchActionRows = createSearchActionRows;
