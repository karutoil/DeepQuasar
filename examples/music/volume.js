const { SlashCommandBuilder } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Adjust the volume of the music player')
        .addIntegerOption(option =>
            option
                .setName('level')
                .setDescription('Volume level (1-200, premium users can go up to 200)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(200)
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
                    'You need to be in the same voice channel as the bot to adjust volume.'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const newVolume = interaction.options.getInteger('level');

            // If no volume specified, show current volume
            if (newVolume === null) {
                const embed = Utils.createInfoEmbed(
                    'Current Volume',
                    `The current volume is **${player.volume}%**\n\nUse \`/volume <level>\` to change it.`
                );
                return interaction.reply({ embeds: [embed] });
            }

            // Check volume limits based on premium status
            const isPremium = interaction.guildData?.isPremium() || false;
            const maxVolume = isPremium ? 
                (interaction.guildData?.musicSettings?.maxVolume || 200) : 
                Math.min(interaction.guildData?.musicSettings?.maxVolume || 150, 150);

            if (newVolume > maxVolume) {
                const embed = Utils.createErrorEmbed(
                    'Volume Too High',
                    `Maximum volume is **${maxVolume}%**${!isPremium ? '\n\nUpgrade to premium for higher volume limits!' : ''}`
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Set the new volume
            const oldVolume = player.volume;
            await client.musicPlayer.setVolume(interaction.guildId, newVolume);

            // Create response embed with volume visualization
            const volumeBar = createVolumeBar(newVolume, maxVolume);
            const volumeEmoji = getVolumeEmoji(newVolume);

            const embed = Utils.createSuccessEmbed(
                'Volume Changed',
                `${volumeEmoji} Volume changed from **${oldVolume}%** to **${newVolume}%**\n\n${volumeBar}`
            );

            await interaction.reply({ embeds: [embed] });

            // Log the action
            client.logger.music('volume', {
                guildId: interaction.guildId,
                userId: interaction.user.id,
                oldVolume,
                newVolume
            });

            // Update user preferences if userData is available
            if (interaction.userData) {
                const userGuildSettings = interaction.userData.getGuildSettings(interaction.guildId);
                userGuildSettings.volume = newVolume;
                await interaction.userData.save();
            }
        } catch (error) {
            client.logger.error('Error in volume command:', error);
            const embed = Utils.createErrorEmbed(
                'Command Error',
                'An error occurred while adjusting the volume.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};

function createVolumeBar(volume, maxVolume = 200, length = 20) {
    const percentage = Math.round((volume / maxVolume) * length);
    const filledBars = Math.max(0, percentage);
    const emptyBars = Math.max(0, length - percentage);
    
    let volumeBar = '';
    
    // Different emojis based on volume level
    if (volume === 0) {
        volumeBar = '🔇' + '▬'.repeat(length - 1);
    } else if (volume <= 30) {
        // Ensure we have at least 1 filled bar for non-zero volume, but prevent negative repeat count
        const barCount = Math.max(0, filledBars - 1);
        volumeBar = '🔈' + '█'.repeat(barCount) + '▬'.repeat(emptyBars);
    } else if (volume <= 70) {
        const barCount = Math.max(0, filledBars - 1);
        volumeBar = '🔉' + '█'.repeat(barCount) + '▬'.repeat(emptyBars);
    } else {
        const barCount = Math.max(0, filledBars - 1);
        volumeBar = '🔊' + '█'.repeat(barCount) + '▬'.repeat(emptyBars);
    }
    
    return `\`${volumeBar}\` ${volume}%`;
}

function getVolumeEmoji(volume) {
    if (volume === 0) return '🔇';
    if (volume <= 30) return '🔈';
    if (volume <= 70) return '🔉';
    return '🔊';
}
