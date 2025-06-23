const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show information about the currently playing track'),

    async execute(interaction, client) {
        const player = client.musicPlayerManager.getPlayer(interaction.guild.id);
        
        if (!player || !player.current) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ There is nothing playing right now!')
                ],
                ephemeral: true
            });
        }

        let track = player.current;
        // Ensure full track data is loaded (for duration, url, etc.)
        if (typeof track.isPartialTrack === 'function' && track.isPartialTrack()) {
            await track.resolveData();
        }
        // --- Fix broken variables and formatting ---
        const url = track.url || track.uri || track.permalink_url || null;
        const requester = track.requestedBy?.id ? `<@${track.requestedBy.id}>` : (track.requester?.id ? `<@${track.requester.id}>` : (track.requester ? `<@${track.requester}>` : 'Unknown'));
        const artist = track.author || track.artist || track.uploader || 'Unknown';
        const title = url ? `[${track.title}](${url})` : track.title;
        const volume = player.volume ? `${player.volume}%` : 'N/A';
        const queueSize = player.queue?.size || player.queue?.length || 0;
        // --- Robust duration/position handling ---
        let durationMs = typeof track.duration === 'number' ? track.duration : 0;
        // Use player.position for current playback position (updated by event), fallback to player.player?.position
        let positionMs = (typeof player.time === 'number' && player.time > 0)
            ? player.time
            : (typeof player.player?.time === 'number' ? player.player.time : 0);
        // Clamp position to duration
        if (durationMs > 0) positionMs = Math.min(positionMs, durationMs);
        // Format times
        const duration = durationMs > 0 ? client.musicPlayerManager.formatDuration(durationMs) : 'LIVE';
        const posStr = durationMs > 0 ? client.musicPlayerManager.formatDuration(positionMs) : 'LIVE';
        // --- Progress bar ---
        let progressBar = '';
        const barLength = 14;
        if (durationMs > 0 && isFinite(durationMs)) {
            const progress = Math.round((positionMs / durationMs) * barLength);
            progressBar =
                '─'.repeat(Math.max(0, progress - 1)) +
                '🔵' +
                '─'.repeat(Math.max(0, barLength - progress));
        } else {
            progressBar = '🔴 LIVE';
        }

        // --- Embed formatting ---
        const embed = new EmbedBuilder()
            .setColor('#43b581')
            .setTitle('🎶 Now Playing')
            .setDescription(`${title}`)
            .addFields(
                { name: '⏱️ Duration', value: duration, inline: true },
                { name: '🙋 Requested by', value: requester, inline: true },
                { name: '🔊 Volume', value: volume, inline: true },
                { name: '📋 Queue', value: `${queueSize} track(s) in queue`, inline: true },
                { name: '📊 Progress', value: durationMs > 0 ? `\`${posStr}  ${progressBar}  ${duration}\`` : `\`${progressBar}\``, inline: false },
                { name: '🎤 Artist', value: artist, inline: true },
                { name: '🔄 Loop', value: player.loop === 'track' ? '🔂 Track' : player.loop === 'queue' ? '🔁 Queue' : 'Off', inline: true }
            );
        if (track.artworkUrl || track.thumbnail) embed.setThumbnail(track.artworkUrl || track.thumbnail);
        if (player.paused) {
            embed.addFields({ name: '⏸️ Status', value: 'Paused', inline: true });
        }
        embed.setFooter({ text: `DeepQuasar Music`, iconURL: client.user.displayAvatarURL() });
        embed.setTimestamp();
        return interaction.reply({ embeds: [embed] });
    }
};
