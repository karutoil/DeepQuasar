const { SlashCommandBuilder } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('filters')
        .setDescription('Apply audio filters to the music')
        .addSubcommand(subcommand =>
            subcommand
                .setName('bass')
                .setDescription('Apply bass boost filter')
                .addIntegerOption(option =>
                    option
                        .setName('level')
                        .setDescription('Bass level (0-100)')
                        .setRequired(false)
                        .setMinValue(0)
                        .setMaxValue(100)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('speed')
                .setDescription('Change playback speed')
                .addNumberOption(option =>
                    option
                        .setName('rate')
                        .setDescription('Speed rate (0.5-2.0)')
                        .setRequired(false)
                        .setMinValue(0.5)
                        .setMaxValue(2.0)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('nightcore')
                .setDescription('Apply nightcore effect')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('vaporwave')
                .setDescription('Apply vaporwave effect')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear all filters')
        ),

    async execute(interaction, client) {
        try {
            const player = client.musicPlayer.getPlayer(interaction.guildId);
            
            if (!player) {
                const embed = Utils.createErrorEmbed(
                    'No Active Player',
                    'There is no music player active in this server.'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Voice channel check
            const voiceCheck = Utils.checkVoiceChannel(interaction.member);
            if (!voiceCheck.inVoice || voiceCheck.channel.id !== player.voiceChannelId) {
                const embed = Utils.createErrorEmbed(
                    'Voice Channel Required',
                    'You need to be in the same voice channel as the bot to apply filters.'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const subcommand = interaction.options.getSubcommand();
            let filterApplied = false;
            let filterName = '';
            let filterSettings = {};

            switch (subcommand) {
                case 'bass':
                    const bassLevel = interaction.options.getInteger('level') || 50;
                    filterSettings = {
                        equalizer: [
                            { band: 0, gain: bassLevel / 100 * 0.6 },
                            { band: 1, gain: bassLevel / 100 * 0.7 },
                            { band: 2, gain: bassLevel / 100 * 0.8 },
                            { band: 3, gain: bassLevel / 100 * 0.55 },
                            { band: 4, gain: bassLevel / 100 * 0.25 }
                        ]
                    };
                    filterName = `Bass Boost (${bassLevel}%)`;
                    break;

                case 'speed':
                    const speed = interaction.options.getNumber('rate') || 1.25;
                    filterSettings = {
                        timescale: { speed: speed }
                    };
                    filterName = `Speed (${speed}x)`;
                    break;

                case 'nightcore':
                    filterSettings = {
                        timescale: { speed: 1.3, pitch: 1.3 }
                    };
                    filterName = 'Nightcore';
                    break;

                case 'vaporwave':
                    filterSettings = {
                        timescale: { speed: 0.8, pitch: 0.8 }
                    };
                    filterName = 'Vaporwave';
                    break;

                case 'clear':
                    filterSettings = {};
                    filterName = 'Filters Cleared';
                    break;
            }

            try {
                if (subcommand === 'clear') {
                    await player.clearFilters();
                    filterApplied = true;
                } else {
                    await player.setFilters(filterSettings);
                    filterApplied = true;
                }
            } catch (error) {
                client.logger.error('Error applying filters:', error);
            }

            if (filterApplied || subcommand === 'clear') {
                const embed = Utils.createSuccessEmbed(
                    'Filter Applied',
                    `🎛️ **${filterName}** has been applied to the music player.${subcommand !== 'clear' ? '\n\n*Note: Filters may affect audio quality and playback performance.*' : ''}`
                );

                await interaction.reply({ embeds: [embed] });

                // Log the action
                client.logger.music('filter_applied', {
                    guildId: interaction.guildId,
                    userId: interaction.user.id,
                    filter: filterName,
                    settings: filterSettings
                });
            } else {
                const embed = Utils.createErrorEmbed(
                    'Filter Failed',
                    'Unable to apply the audio filter. Please try again.'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            client.logger.error('Error in filters command:', error);
            const embed = Utils.createErrorEmbed(
                'Command Error',
                'An error occurred while applying the filter.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
