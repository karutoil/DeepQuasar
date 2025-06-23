const { SlashCommandBuilder } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the paused music'),

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
                    'You need to be in the same voice channel as the bot to resume music.'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (!player.paused) {
                const embed = Utils.createInfoEmbed(
                    'Music Not Paused',
                    'The music is already playing.'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const success = await client.musicPlayer.pause(interaction.guildId, false);
            
            if (success) {
                const embed = Utils.createSuccessEmbed(
                    'Music Resumed',
                    `▶️ Resumed **${Utils.truncate(player.current?.info?.title || 'Unknown Track', 50)}**`
                );

                await interaction.reply({ embeds: [embed] });

                // Log the action
                client.logger.music('resume', {
                    guildId: interaction.guildId,
                    userId: interaction.user.id,
                    trackTitle: player.current?.info?.title
                });
            } else {
                const embed = Utils.createErrorEmbed(
                    'Resume Failed',
                    'Unable to resume the music. Please try again.'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            client.logger.error('Error in resume command:', error);
            const embed = Utils.createErrorEmbed(
                'Command Error',
                'An error occurred while resuming the music.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
