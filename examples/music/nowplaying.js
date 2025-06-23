const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show information about the currently playing track')
        .addBooleanOption(option =>
            option
                .setName('controls')
                .setDescription('Show playback control buttons')
                .setRequired(false)
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

            const showControls = interaction.options.getBoolean('controls') || false;
            const track = player.current;
            const position = player.position || 0;
            const duration = track.info.length;

            // Create progress bar
            const progressBar = createProgressBar(position, duration, 25);
            const progressPercentage = duration > 0 ? Math.round((position / duration) * 100) : 0;

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('🎵 Now Playing')
                .setDescription(`**${track.info.title}**\n${track.info.author}`)
                .setColor(client.config.colors.music)
                .setTimestamp();

            // Add thumbnail if available
            if (track.info.artworkUrl) {
                embed.setThumbnail(track.info.artworkUrl);
            }

            // Progress information
            embed.addFields({
                name: '⏱️ Progress',
                value: `${progressBar}\n\`${Utils.formatDuration(position)} / ${Utils.formatDuration(duration)}\` (${progressPercentage}%)`,
                inline: false
            });

            // Track information
            const trackInfo = [
                `${Utils.getSourceEmoji(track.info.sourceName)} **Source:** ${Utils.capitalize(track.info.sourceName)}`,
                `👤 **Requested by:** <@${track.requester.id}>`,
                `🔊 **Volume:** ${player.volume}%`,
                `🔄 **Loop:** ${player.loop === 'none' ? 'Off' : player.loop === 'track' ? 'Current Track' : 'Queue'}`
            ];

            embed.addFields({
                name: 'ℹ️ Track Information',
                value: trackInfo.join('\n'),
                inline: false
            });

            // Queue information
            if (player.queue.length > 0) {
                const nextTrack = player.queue[0];
                embed.addFields({
                    name: '⏭️ Up Next',
                    value: `**${Utils.truncate(nextTrack.info.title, 40)}** - ${Utils.truncate(nextTrack.info.author, 30)}\n\`${Utils.formatDuration(nextTrack.info.length)}\` • Requested by <@${nextTrack.requester.id}>`,
                    inline: false
                });

                embed.addFields({
                    name: '📜 Queue Status',
                    value: `${player.queue.length} track${player.queue.length !== 1 ? 's' : ''} remaining`,
                    inline: true
                });
            } else if (player.loop === 'none') {
                embed.addFields({
                    name: '📜 Queue Status',
                    value: 'This is the last track',
                    inline: true
                });
            }

            // Player status
            const playerStatus = player.playing ? '▶️ Playing' : 
                               player.paused ? '⏸️ Paused' : 
                               '⏹️ Stopped';
            
            embed.addFields({
                name: '🎚️ Player Status',
                value: playerStatus,
                inline: true
            });

            // Add URL if available and not too long
            if (track.info.uri && track.info.uri.length < 200) {
                embed.setURL(track.info.uri);
            }

            embed.setFooter({
                text: `Player ID: ${player.guildId} • ${new Date().toLocaleString()}`,
                iconURL: client.user.displayAvatarURL()
            });

            // Create components if requested
            let components = [];
            if (showControls) {
                // Check if user can control the player
                const voiceCheck = Utils.checkVoiceChannel(interaction.member);
                const canControl = voiceCheck.inVoice && voiceCheck.channel.id === player.voiceChannelId;

                const controlRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('play_pause')
                            .setEmoji(player.playing ? '⏸️' : '▶️')
                            .setLabel(player.playing ? 'Pause' : 'Play')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(!canControl),
                        new ButtonBuilder()
                            .setCustomId('skip')
                            .setEmoji('⏭️')
                            .setLabel('Skip')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(!canControl),
                        new ButtonBuilder()
                            .setCustomId('stop')
                            .setEmoji('⏹️')
                            .setLabel('Stop')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(!canControl),
                        new ButtonBuilder()
                            .setCustomId('loop')
                            .setEmoji(player.loop === 'none' ? '➡️' : player.loop === 'track' ? '🔂' : '🔁')
                            .setLabel('Loop')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(!canControl)
                    );

                const utilityRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('queue_show')
                            .setEmoji('📜')
                            .setLabel('Show Queue')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('lyrics')
                            .setEmoji('📝')
                            .setLabel('Lyrics')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true), // Lyrics feature can be implemented later
                        new ButtonBuilder()
                            .setCustomId('refresh_np')
                            .setEmoji('🔄')
                            .setLabel('Refresh')
                            .setStyle(ButtonStyle.Secondary)
                    );

                components = [controlRow, utilityRow];

                if (!canControl) {
                    embed.addFields({
                        name: '⚠️ Control Notice',
                        value: 'You need to be in the same voice channel as the bot to use the control buttons.',
                        inline: false
                    });
                }
            }

            await interaction.reply({ embeds: [embed], components });

            // Log the action
            client.logger.music('nowplaying', {
                guildId: interaction.guildId,
                userId: interaction.user.id,
                trackTitle: track.info.title,
                showControls
            });
        } catch (error) {
            client.logger.error('Error in nowplaying command:', error);
            const embed = Utils.createErrorEmbed(
                'Command Error',
                'An error occurred while fetching the current track information.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};

function createProgressBar(current, total, length = 25) {
    if (!total || total === 0) return '▬'.repeat(length);
    
    const progress = Math.round((current / total) * length);
    const filledBars = Math.max(0, progress);
    const emptyBars = Math.max(0, length - progress);
    
    let progressBar = '';
    
    // Add filled portion
    if (filledBars > 0) {
        progressBar += '█'.repeat(Math.max(0, filledBars - 1)) + '🔘';
    } else {
        progressBar += '🔘';
    }
    
    // Add empty portion
    if (emptyBars > 0) {
        progressBar += '▬'.repeat(emptyBars - (filledBars === 0 ? 1 : 0));
    }
    
    return progressBar.substring(0, length);
}
