const { SlashCommandBuilder } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause or resume the current track'),

    async execute(interaction, client) {
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
                'You need to be in the same voice channel as the bot to pause/resume music.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const isPaused = player.isPaused;
        player.pause(!isPaused);

        const action = isPaused ? 'Resumed' : 'Paused';
        const emoji = isPaused ? '▶️' : '⏸️';
        const track = player.current;

        const embed = Utils.createSuccessEmbed(
            `Music ${action}`,
            `${emoji} ${action} **${Utils.truncate(track.info?.title || 'Unknown Track', 50)}**`
        );

        await interaction.reply({ embeds: [embed] });

        // Log the action
        client.logger.music('pause_resume', {
            guildId: interaction.guildId,
            userId: interaction.user.id,
            action: action.toLowerCase(),
            trackTitle: track.info?.title
        });
    }
};
