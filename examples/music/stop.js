const { SlashCommandBuilder } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the music and clear the queue'),

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
                    'You need to be in the same voice channel as the bot to stop music.'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const currentTrack = player.current;
            const queueSize = player.queue.length;

            // Destroy the player
            await client.musicPlayer.destroy(interaction.guildId);

            const embed = Utils.createSuccessEmbed(
                'Music Stopped',
                `⏹️ Stopped the music and cleared the queue${currentTrack ? `\n\nWas playing: **${Utils.truncate(currentTrack.info.title, 50)}**` : ''}${queueSize > 0 ? `\nRemoved ${queueSize} track${queueSize !== 1 ? 's' : ''} from queue` : ''}\n\nLeft the voice channel.`
            );

            await interaction.reply({ embeds: [embed] });

            // Log the action
            client.logger.music('stop', {
                guildId: interaction.guildId,
                userId: interaction.user.id,
                trackTitle: currentTrack?.info.title,
                queueSize
            });
        } catch (error) {
            client.logger.error('Error in stop command:', error);
            const embed = Utils.createErrorEmbed(
                'Command Error',
                'An error occurred while stopping the music.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
