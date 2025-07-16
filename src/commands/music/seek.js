const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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

        // Check if user is in the same voice channel
        if (!client.musicPlayerManager.isInSameVoiceChannel(interaction.member, player)) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ You need to be in the same voice channel as the bot to use this command!')
                ],
                ephemeral: true
            });
        }

        const positionInput = interaction.options.getString('position');
        const positionMs = parseTimeToMs(positionInput);
        if (positionMs < 0 || isNaN(positionMs)) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ Invalid time format! Use formats like: `1:30`, `90s`, `2m30s`')
                ],
                ephemeral: true
            });
        }

        if (positionMs === null) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ Invalid time format! Use formats like: `1:30`, `90s`, `2m30s`')
                ],
                ephemeral: true
            });
        }

        const track = player.current;
        
        // Check if position is within track duration
        if (positionMs > track.duration) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription(`❌ The specified time exceeds the track duration of ${client.musicPlayerManager.formatDuration(track.duration)}.`)
                ],
                ephemeral: true
            });
        }

        // Seek to position
        await player.seek(positionMs);

        return interaction.reply({
            embeds: [client.musicPlayerManager.createBeautifulEmbed({
                title: 'Seek',
                description: `⏩ Seeked to: **${client.musicPlayerManager.formatDuration(positionMs)}**`,
                color: '#43b581'
            })]
        });
    }
};

/**
 * Parse time string to milliseconds
 * Supports formats like: 1:30, 90s, 2m30s, etc.
 */
function parseTimeToMs(timeString) {
    if (!timeString) return null;
    
    // Remove spaces
    timeString = timeString.replace(/\s/g, '');
    
    // Format: MM:SS or HH:MM:SS
    const colonMatch = timeString.match(/^(?:(\d+):)?(\d+):(\d+)$/);
    if (colonMatch) {
        const hours = parseInt(colonMatch[1] || '0', 10);
        const minutes = parseInt(colonMatch[2], 10);
        const seconds = parseInt(colonMatch[3], 10);
        return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }
    
    // Format: XmYs (e.g., 2m30s)
    const complexMatch = timeString.match(/^(?:(\d+)m)?(?:(\d+)s)?$/);
    if (complexMatch) {
        const minutes = parseInt(complexMatch[1] || '0', 10);
        const seconds = parseInt(complexMatch[2] || '0', 10);
        return (minutes * 60 + seconds) * 1000;
    }
    
    // Format: Xs (e.g., 90s)
    const secondsMatch = timeString.match(/^(\d+)s?$/);
    if (secondsMatch) {
        const seconds = parseInt(secondsMatch[1], 10);
        return seconds * 1000;
    }
    
    // Format: Xm (e.g., 2m)
    const minutesMatch = timeString.match(/^(\d+)m$/);
    if (minutesMatch) {
        const minutes = parseInt(minutesMatch[1], 10);
        return minutes * 60 * 1000;
    }
    
    return null;
}
