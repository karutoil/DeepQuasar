const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('filters')
        .setDescription('Apply audio filters to the player')
        .addStringOption(option =>
            option
                .setName('filter')
                .setDescription('Filter to apply')
                .setRequired(false)
                .addChoices(
                    { name: 'Clear All', value: 'clear' },
                    { name: 'Bassboost', value: 'bassboost' },
                    { name: 'Nightcore', value: 'nightcore' },
                    { name: 'Vaporwave', value: 'vaporwave' },
                    { name: '8D', value: '8d' },
                    { name: 'Karaoke', value: 'karaoke' },
                    { name: 'Vibrato', value: 'vibrato' },
                    { name: 'Tremolo', value: 'tremolo' }
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

        const filter = interaction.options.getString('filter');

        if (!filter) {
            // Show current filters
            const activeFilters = getActiveFilters(player);
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('🎛️ Audio Filters')
                    .setDescription(activeFilters.length > 0 ? 
                        `**Active filters:**\n${activeFilters.join(', ')}` : 
                        'No filters are currently active.')
                ]
            });
        }

        await interaction.deferReply();

        try {
            let filterName = '';
            let filterSettings = {};

            async function applyFilter(player, filterSettings) {
                client.logger.error('player constructor:', player.constructor?.name);
                client.logger.error('player own props:', Object.getOwnPropertyNames(player));
                if (player.player) {
                    client.logger.error('player.player constructor:', player.player.constructor?.name);
                    client.logger.error('player.player own props:', Object.getOwnPropertyNames(player.player));
                }
                if (typeof player.setFilter === 'function') {
                    return await player.setFilter(filterSettings);
                } else if (typeof player.setFilters === 'function') {
                    return await player.setFilters(filterSettings);
                } else if (player.player && typeof player.player.setFilter === 'function') {
                    return await player.player.setFilter(filterSettings);
                } else if (player.player && typeof player.player.setFilters === 'function') {
                    return await player.player.setFilters(filterSettings);
                } else {
                    throw new Error('No filter method found on player');
                }
            }

            switch (filter) {
                case 'clear':
                    await applyFilter(player, {});
                    filterName = 'Cleared all filters';
                    break;
                case 'bassboost':
                    filterSettings = {
                        equalizer: [
                            { band: 0, gain: 0.6 },
                            { band: 1, gain: 0.7 },
                            { band: 2, gain: 0.8 },
                            { band: 3, gain: 0.55 },
                            { band: 4, gain: 0.25 },
                            { band: 5, gain: 0 },
                            { band: 6, gain: -0.25 },
                            { band: 7, gain: -0.45 },
                            { band: 8, gain: -0.55 },
                            { band: 9, gain: -0.7 },
                            { band: 10, gain: -0.3 },
                            { band: 11, gain: -0.25 },
                            { band: 12, gain: 0 },
                            { band: 13, gain: 0 },
                            { band: 14, gain: 0 }
                        ]
                    };
                    filterName = 'Bassboost';
                    await applyFilter(player, filterSettings);
                    break;
                case 'nightcore':
                    filterSettings = {
                        timescale: { speed: 1.2, pitch: 1.2, rate: 1 }
                    };
                    filterName = 'Nightcore';
                    await applyFilter(player, filterSettings);
                    break;
                case 'vaporwave':
                    filterSettings = {
                        timescale: { speed: 0.8, pitch: 0.8, rate: 1 }
                    };
                    filterName = 'Vaporwave';
                    await applyFilter(player, filterSettings);
                    break;
                case '8d':
                    filterSettings = {
                        rotation: { rotationHz: 0.2 }
                    };
                    filterName = '8D Audio';
                    await applyFilter(player, filterSettings);
                    break;
                case 'karaoke':
                    filterSettings = {
                        karaoke: {
                            level: 1.0,
                            monoLevel: 1.0,
                            filterBand: 220.0,
                            filterWidth: 100.0
                        }
                    };
                    filterName = 'Karaoke';
                    await applyFilter(player, filterSettings);
                    break;
                case 'vibrato':
                    filterSettings = {
                        vibrato: { frequency: 10.0, depth: 0.9 }
                    };
                    filterName = 'Vibrato';
                    await applyFilter(player, filterSettings);
                    break;
                case 'tremolo':
                    filterSettings = {
                        tremolo: { frequency: 10.0, depth: 0.5 }
                    };
                    filterName = 'Tremolo';
                    await applyFilter(player, filterSettings);
                    break;
                default:
                    return interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('#ff0000')
                            .setDescription('❌ Unknown filter!')
                        ]
                    });
            }

            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#00ff00')
                    .setDescription(`🎛️ Applied filter: **${filterName}**`)
                ]
            });

        } catch (error) {
            client.logger.error('Error applying filter:', error);
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ Failed to apply filter. Please try again.')
                ]
            });
        }
    }
};

/**
 * Get list of active filters
 */
function getActiveFilters(player) {
    const filters = [];
    
    if (player.filters?.equalizer?.length > 0) {
        filters.push('Equalizer');
    }
    
    if (player.filters?.timescale) {
        if (player.filters.timescale.speed > 1) {
            filters.push('Nightcore');
        } else if (player.filters.timescale.speed < 1) {
            filters.push('Vaporwave');
        }
    }
    
    if (player.filters?.rotation) {
        filters.push('8D Audio');
    }
    
    if (player.filters?.karaoke) {
        filters.push('Karaoke');
    }
    
    if (player.filters?.vibrato) {
        filters.push('Vibrato');
    }
    
    if (player.filters?.tremolo) {
        filters.push('Tremolo');
    }
    
    return filters;
}
