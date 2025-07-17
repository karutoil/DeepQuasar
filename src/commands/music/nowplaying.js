const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show information about the currently playing track'),

    async execute(interaction, client) {
        const player = client.musicPlayerManager.getPlayer(interaction.guild.id);
        const queue = client.musicPlayerManager.queues.get(interaction.guild.id);
        
        if (!player || !queue || !queue.current) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ There is nothing playing right now!')
                ],
                ephemeral: true
            });
        }

        let track = queue.current;
        
        // --- Fix broken variables and formatting ---
        const url = track.uri || track.url || null;
        const requester = track.requester ? `<@${track.requester}>` : 'Unknown';
        const artist = track.author || track.artist || track.uploader || 'Unknown';
        const title = url ? `[${track.title}](${url})` : track.title;
        const volume = player.volume ? `${Math.round(player.volume * 100)}%` : 'N/A';
        const queueSize = player.queue?.size || 0;
        
        // --- Robust duration/position handling ---
        let durationMs = typeof track.duration === 'number' ? track.duration : 0;
        // Get current position from player (Shoukaku provides this)
        let positionMs = player.position || 0;
        
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
        const beautifulEmbed = client.musicPlayerManager.createBeautifulEmbed({
            title: 'Now Playing',
            description: `${title}`,
            color: '#43b581',
            thumbnail: track.thumbnail,
            fields: [
                { name: '⏱️ Duration', value: duration, inline: true },
                { name: '🙋 Requested by', value: requester, inline: true },
                { name: '🔊 Volume', value: volume, inline: true },
                { name: '📋 Queue', value: `${queueSize} track(s) in queue`, inline: true },
                { name: '📊 Progress', value: durationMs > 0 ? `\`${posStr}  ${progressBar}  ${duration}\`` : `\`${progressBar}\``, inline: false },
                { name: '🎤 Artist', value: artist, inline: true },
                { name: '🔄 Loop', value: queue.loop ? '🔁 Queue' : 'Off', inline: true },
                ...(player.paused ? [{ name: '⏸️ Status', value: 'Paused', inline: true }] : [])
            ],
            footer: { text: `DeepQuasar Music`, iconURL: client.user.displayAvatarURL() }
        });
        return interaction.reply({ embeds: [beautifulEmbed] });
    }
};
