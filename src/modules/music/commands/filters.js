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
                embeds: [client.musicPlayerManager.createBeautifulEmbed({
                    title: 'Error',
                    description: '❌ There is nothing playing in this server!',
                    color: '#ED4245'
                })],
                ephemeral: true
            });
        }

        // Check if user is in the same voice channel
        if (!client.musicPlayerManager.isInSameVoiceChannel(interaction.member, player)) {
            return interaction.reply({
                embeds: [client.musicPlayerManager.createBeautifulEmbed({
                    title: 'Error',
                    description: '❌ You need to be in the same voice channel as the bot to use this command!',
                    color: '#ED4245'
                })],
                ephemeral: true
            });
        }

        const filter = interaction.options.getString('filter');

        if (!filter) {
            // Show current filters
            const activeFilters = player.filters || {};
            const filterNames = Object.keys(activeFilters).filter(key => activeFilters[key]);
            return interaction.reply({
                embeds: [client.musicPlayerManager.createBeautifulEmbed({
                    title: 'Audio Filters',
                    description: filterNames.length > 0 ? 
                        `**Active filters:**\n${filterNames.join(', ')}` : 
                        'No filters are currently active.',
                    color: '#0099ff'
                })]
            });
        }

        await interaction.deferReply();

        try {
            switch (filter) {
                case 'clear':
                    player.filters.resetFilters();
                    break;
                case 'bassboost':
                    player.filters.setEqualizer([
                        { band: 0, gain: 0.6 },
                        { band: 1, gain: 0.7 },
                        { band: 2, gain: 0.8 },
                        { band: 3, gain: 0.55 },
                        { band: 4, gain: 0.25 }
                    ]);
                    break;
                case 'nightcore':
                    player.filters.setTimescale({
                        speed: 1.2,
                        pitch: 1.2,
                        rate: 1.0
                    });
                    break;
                case 'vaporwave':
                    player.filters.setTimescale({
                        speed: 0.8,
                        pitch: 0.8,
                        rate: 1.0
                    });
                    break;
                case '8d':
                    player.filters.setRotation({
                        rotationHz: 0.2
                    });
                    break;
                case 'karaoke':
                    player.filters.setKaraoke({
                        level: 1.0,
                        monoLevel: 1.0,
                        filterBand: 220.0,
                        filterWidth: 100.0
                    });
                    break;
                case 'vibrato':
                    player.filters.setVibrato({
                        frequency: 10.0,
                        depth: 0.9
                    });
                    break;
                case 'tremolo':
                    player.filters.setTremolo({
                        frequency: 10.0,
                        depth: 0.5
                    });
                    break;
                default:
                    client.logger.warn(`Unsupported filter requested: ${filter}`);
                    return interaction.editReply({
                        embeds: [client.musicPlayerManager.createBeautifulEmbed({
                            title: 'Error',
                            description: '❌ Unknown filter!',
                            color: '#ED4245'
                        })]
                    });
            }

            return interaction.editReply({
                embeds: [client.musicPlayerManager.createBeautifulEmbed({
                    title: 'Filter Applied',
                    description: `🎛️ Applied filter: **${filter}**`,
                    color: '#43b581'
                })]
            });

        } catch (error) {
            client.logger.error('Error applying filter:', error);
            return interaction.editReply({
                embeds: [client.musicPlayerManager.createBeautifulEmbed({
                    title: 'Error',
                    description: '❌ Failed to apply filter. Please try again.',
                    color: '#ED4245'
                })]
            });
        }
    }
};
