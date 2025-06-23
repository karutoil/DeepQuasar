const { SlashCommandBuilder } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current track or multiple tracks')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Number of tracks to skip (default: 1)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)
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
                    'You need to be in the same voice channel as the bot to skip tracks.'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const amount = interaction.options.getInteger('amount') || 1;
            const currentTrack = player.current;

            if (amount === 1) {
                // Skip single track
                if (player.queue.length === 0 && player.loop === 'none') {
                    // This is the last track
                    await client.musicPlayer.destroy(interaction.guildId);
                    const embed = Utils.createSuccessEmbed(
                        'Track Skipped',
                        `Skipped **${Utils.truncate(currentTrack.info.title, 50)}**\n\nQueue is now empty. Leaving voice channel.`
                    );
                    return interaction.reply({ embeds: [embed] });
                } else {
                    await client.musicPlayer.skip(interaction.guildId);
                    const nextTrack = player.queue[0];
                    const embed = Utils.createSuccessEmbed(
                        'Track Skipped',
                        `Skipped **${Utils.truncate(currentTrack.info.title, 50)}**${nextTrack ? `\n\nNext: **${Utils.truncate(nextTrack.info.title, 50)}**` : ''}`
                    );
                    return interaction.reply({ embeds: [embed] });
                }
            } else {
                // Skip multiple tracks
                if (amount > player.queue.length + 1) {
                    const embed = Utils.createErrorEmbed(
                        'Not Enough Tracks',
                        `Cannot skip ${amount} tracks. Only ${player.queue.length + 1} tracks available (including current track).`
                    );
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                // Skip current track and remove additional tracks from queue
                const skippedTracks = [currentTrack];
                for (let i = 0; i < amount - 1; i++) {
                    if (player.queue.length > 0) {
                        skippedTracks.push(player.queue.shift());
                    }
                }

                if (player.queue.length === 0 && player.loop === 'none') {
                    // No more tracks after skipping
                    await client.musicPlayer.destroy(interaction.guildId);
                    const embed = Utils.createSuccessEmbed(
                        'Tracks Skipped',
                        `Skipped ${amount} tracks including **${Utils.truncate(currentTrack.info.title, 40)}**\n\nQueue is now empty. Leaving voice channel.`
                    );
                    return interaction.reply({ embeds: [embed] });
                } else {
                    await client.musicPlayer.skip(interaction.guildId);
                    const nextTrack = player.queue[0];
                    const embed = Utils.createSuccessEmbed(
                        'Tracks Skipped',
                        `Skipped ${amount} tracks including **${Utils.truncate(currentTrack.info.title, 40)}**${nextTrack ? `\n\nNow playing: **${Utils.truncate(nextTrack.info.title, 40)}**` : ''}`
                    );
                    return interaction.reply({ embeds: [embed] });
                }
            }
        } catch (error) {
            client.logger.error('Error in skip command:', error);
            const embed = Utils.createErrorEmbed(
                'Command Error',
                'An error occurred while skipping the track.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
