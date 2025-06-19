const { SlashCommandBuilder } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Seek to a specific position in the current track')
        .addStringOption(option =>
            option
                .setName('position')
                .setDescription('Position to seek to (e.g., 1:30, 90s, 2m30s)')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        try {
            const player = client.musicPlayer.getPlayer(interaction.guildId);
            
            if (!player || !player.current) {
                const embed = Utils.createErrorEmbed(
                    'Nothing Playing',
                    'There is no track currently playing.'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Voice channel check
            const voiceCheck = Utils.checkVoiceChannel(interaction.member);
            if (!voiceCheck.inVoice || voiceCheck.channel.id !== player.voiceChannelId) {
                const embed = Utils.createErrorEmbed(
                    'Voice Channel Required',
                    'You need to be in the same voice channel as the bot to seek.'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const positionString = interaction.options.getString('position');
            const position = Utils.parseTimeString(positionString);

            if (position === null) {
                const embed = Utils.createErrorEmbed(
                    'Invalid Position',
                    'Please provide a valid time format (e.g., 1:30, 90s, 2m30s).'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const duration = player.current.info.length;
            if (position > duration) {
                const embed = Utils.createErrorEmbed(
                    'Position Too Long',
                    `Cannot seek to ${Utils.formatDuration(position)}. Track duration is ${Utils.formatDuration(duration)}.`
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const success = await player.seek(position);
            
            if (success) {
                const embed = Utils.createSuccessEmbed(
                    'Seek Successful',
                    `⏩ Seeked to **${Utils.formatDuration(position)}** in **${Utils.truncate(player.current.info.title, 50)}**`
                );

                await interaction.reply({ embeds: [embed] });

                // Log the action
                client.logger.music('seek', {
                    guildId: interaction.guildId,
                    userId: interaction.user.id,
                    position,
                    trackTitle: player.current.info.title
                });
            } else {
                const embed = Utils.createErrorEmbed(
                    'Seek Failed',
                    'Unable to seek to the requested position.'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            client.logger.error('Error in seek command:', error);
            const embed = Utils.createErrorEmbed(
                'Command Error',
                'An error occurred while seeking.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
