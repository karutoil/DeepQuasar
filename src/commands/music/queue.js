const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Utils = require('../../utils/utils');

// Helper function to safely get queue length
function getQueueLength(player) {
    return player && player.queue ? player.queue.length : 0;
}

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Manage the music queue')
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('Display the current queue')
                .addIntegerOption(option =>
                    option
                        .setName('page')
                        .setDescription('Page number to display')
                        .setRequired(false)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear the entire queue')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('shuffle')
                .setDescription('Shuffle the queue')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a track from the queue')
                .addIntegerOption(option =>
                    option
                        .setName('position')
                        .setDescription('Position of the track to remove')
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('move')
                .setDescription('Move a track to a different position')
                .addIntegerOption(option =>
                    option
                        .setName('from')
                        .setDescription('Current position of the track')
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addIntegerOption(option =>
                    option
                        .setName('to')
                        .setDescription('New position for the track')
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('loop')
                .setDescription('Set loop mode for the queue')
                .addStringOption(option =>
                    option
                        .setName('mode')
                        .setDescription('Loop mode')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Off', value: 'none' },
                            { name: 'Current Track', value: 'track' },
                            { name: 'Entire Queue', value: 'queue' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('Show recently played tracks')
        ),

    // Export the display function for use in button interactions  
    createQueueDisplay,

    async execute(interaction, client) {
        try {
            // Handle case where no subcommand is provided - default to 'show'
            let subcommand;
            try {
                subcommand = interaction.options.getSubcommand();
            } catch (error) {
                // If no subcommand is provided, default to 'show'
                subcommand = 'show';
            }
            
            const player = client.musicPlayer.getPlayer(interaction.guildId);

            // Check if there's an active player for most commands
            if (!player && !['history'].includes(subcommand)) {
                const embed = Utils.createErrorEmbed(
                    'No Active Player',
                    'There is no music player active in this server.'
                );
                return interaction.reply({ embeds: [embed], flags: 64 }); // flags: 64 = ephemeral
            }

            // Voice channel check for queue manipulation commands
            const manipulationCommands = ['clear', 'shuffle', 'remove', 'move', 'loop'];
            if (manipulationCommands.includes(subcommand)) {
                const voiceCheck = Utils.checkVoiceChannel(interaction.member);
                if (!voiceCheck.inVoice || (player && voiceCheck.channel.id !== player.voiceChannelId)) {
                    const embed = Utils.createErrorEmbed(
                        'Voice Channel Required',
                        'You need to be in the same voice channel as the bot to manage the queue.'
                    );
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }
            }

            switch (subcommand) {
                case 'show':
                    await handleShowQueue(interaction, client, player);
                    break;
                case 'clear':
                    await handleClearQueue(interaction, client, player);
                    break;
                case 'shuffle':
                    await handleShuffleQueue(interaction, client, player);
                    break;
                case 'remove':
                    await handleRemoveTrack(interaction, client, player);
                    break;
                case 'move':
                    await handleMoveTrack(interaction, client, player);
                    break;
                case 'loop':
                    await handleLoopMode(interaction, client, player);
                    break;
                case 'history':
                    await handleShowHistory(interaction, client);
                    break;
            }
        } catch (error) {
            client.logger.error('Error in queue command:', error);
            const embed = Utils.createErrorEmbed(
                'Command Error',
                'An error occurred while managing the queue.'
            );
            
            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({ embeds: [embed] });
            } else {
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }
};

// Create queue embed and components
function createQueueDisplay(client, player, page = 0) {
    const tracksPerPage = 10;
    const queueLength = player.queue ? player.queue.length : 0;
    const totalPages = Math.ceil(queueLength / tracksPerPage);

    const embed = new EmbedBuilder()
        .setTitle('🎵 Music Queue')
        .setColor(client.config.colors.music)
        .setTimestamp();

    // Current track
    if (player.current) {
        const current = player.current;
        const progress = player.position || 0;
        const duration = current.info?.length || current.length || 0;
        const progressBar = createProgressBar(progress, duration);
        
        embed.addFields({
            name: '▶️ Now Playing',
            value: `**${Utils.truncate(current.info?.title || current.title || 'Unknown Track', 40)}** - ${Utils.truncate(current.info?.author || current.author || 'Unknown Artist', 30)}\n` +
                   `${progressBar} \`${Utils.formatDuration(progress)} / ${Utils.formatDuration(duration)}\`\n` +
                   `Requested by: <@${current.requester?.id || 'Unknown'}>`,
            inline: false
        });
    }

    // Queue tracks
    if (player.queue && queueLength > 0) {
        const startIndex = page * tracksPerPage;
        const endIndex = Math.min(startIndex + tracksPerPage, queueLength);
        const tracks = player.queue.slice(startIndex, endIndex);

        let queueText = '';
        tracks.forEach((track, index) => {
            const position = startIndex + index + 1;
            queueText += `\`${position}.\` **${Utils.truncate(track.info?.title || track.title || 'Unknown Track', 35)}** - ${Utils.truncate(track.info?.author || track.author || 'Unknown Artist', 25)}\n`;
            queueText += `⏱️ \`${Utils.formatDuration(track.info?.length || track.length || 0)}\` • 👤 <@${track.requester?.id || 'Unknown'}>\n\n`;
        });

        embed.addFields({
            name: `📜 Queue (${queueLength} tracks)`,
            value: queueText || 'No tracks in queue',
            inline: false
        });

        // Queue statistics
        const totalDuration = player.queue.reduce((acc, track) => acc + (track.info?.length || track.length || 0), 0);
        embed.addFields(
            { name: '⏱️ Total Duration', value: Utils.formatDuration(totalDuration), inline: true },
            { name: '🔄 Loop Mode', value: player.loop === 'none' ? 'Off' : player.loop === 'track' ? 'Track' : 'Queue', inline: true },
            { name: '🔊 Volume', value: `${player.volume}%`, inline: true }
        );

        if (totalPages > 1) {
            embed.setFooter({
                text: `Page ${page + 1} of ${totalPages} • Use buttons to navigate`,
                iconURL: client.user.displayAvatarURL()
            });
        }
    }

    // Create components
    const components = [];
    if (totalPages > 1) {
        components.push(Utils.createPaginationButtons(page, totalPages));
    }

    // Add control buttons
    const controlRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('queue_shuffle')
                .setLabel('Shuffle')
                .setEmoji('🔀')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(queueLength < 2),
            new ButtonBuilder()
                .setCustomId('queue_clear')
                .setLabel('Clear')
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(queueLength === 0),
            new ButtonBuilder()
                .setCustomId('queue_loop')
                .setLabel(`Loop: ${player.loop === 'none' ? 'Off' : player.loop === 'track' ? 'Track' : 'Queue'}`)
                .setEmoji(player.loop === 'none' ? '➡️' : player.loop === 'track' ? '🔂' : '🔁')
                .setStyle(ButtonStyle.Primary)
        );

    components.push(controlRow);

    return { embed, components, totalPages };
}

async function handleShowQueue(interaction, client, player) {
    await interaction.deferReply();

    if (!player || ((!player.queue || !player.queue.length) && !player.current)) {
        const embed = Utils.createInfoEmbed(
            'Empty Queue',
            'The queue is currently empty. Use `/play` to add some music!'
        );
        return interaction.editReply({ embeds: [embed] });
    }

    const page = (interaction.options.getInteger('page') || 1) - 1;
    const { embed, components, totalPages } = createQueueDisplay(client, player, page);

    if (page >= totalPages && totalPages > 0) {
        const errorEmbed = Utils.createErrorEmbed(
            'Invalid Page',
            `Page ${page + 1} doesn't exist. There are only ${totalPages} pages.`
        );
        return interaction.editReply({ embeds: [errorEmbed] });
    }

    await interaction.editReply({ embeds: [embed], components });
}

async function handleClearQueue(interaction, client, player) {
    const queueLength = getQueueLength(player);
    if (queueLength === 0) {
        const embed = Utils.createInfoEmbed(
            'Queue Already Empty',
            'The queue is already empty.'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const clearedCount = queueLength;
    await client.musicPlayer.clearQueue(interaction.guildId);

    const embed = Utils.createSuccessEmbed(
        'Queue Cleared',
        `Removed ${clearedCount} tracks from the queue.`
    );

    await interaction.reply({ embeds: [embed] });

    client.logger.music('queue_clear', {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        clearedTracks: clearedCount
    });
}

async function handleShuffleQueue(interaction, client, player) {
    const queueLength = getQueueLength(player);
    if (queueLength < 2) {
        const embed = Utils.createInfoEmbed(
            'Cannot Shuffle',
            'Need at least 2 tracks in the queue to shuffle.'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await client.musicPlayer.shuffleQueue(interaction.guildId);

    const embed = Utils.createSuccessEmbed(
        'Queue Shuffled',
        `Shuffled ${queueLength} tracks in the queue.`
    );

    await interaction.reply({ embeds: [embed] });

    client.logger.music('queue_shuffle', {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        queueSize: queueLength
    });
}

async function handleRemoveTrack(interaction, client, player) {
    const position = interaction.options.getInteger('position');
    const queueLength = getQueueLength(player);

    if (position > queueLength) {
        const embed = Utils.createErrorEmbed(
            'Invalid Position',
            `There are only ${queueLength} tracks in the queue.`
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const removedTrack = player.queue[position - 1];
    await client.musicPlayer.removeTrack(interaction.guildId, position - 1);

    const embed = Utils.createSuccessEmbed(
        'Track Removed',
        `Removed **${removedTrack.info.title}** from position ${position}.`
    );

    await interaction.reply({ embeds: [embed] });

    client.logger.music('queue_remove', {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        position,
        trackTitle: removedTrack.info.title
    });
}

async function handleMoveTrack(interaction, client, player) {
    const from = interaction.options.getInteger('from');
    const to = interaction.options.getInteger('to');
    const queueLength = getQueueLength(player);

    if (from > queueLength || to > queueLength) {
        const embed = Utils.createErrorEmbed(
            'Invalid Position',
            `There are only ${queueLength} tracks in the queue.`
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (from === to) {
        const embed = Utils.createInfoEmbed(
            'Same Position',
            'The track is already at that position.'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const track = player.queue[from - 1];
    await client.musicPlayer.moveTrack(interaction.guildId, from - 1, to - 1);

    const embed = Utils.createSuccessEmbed(
        'Track Moved',
        `Moved **${track.info.title}** from position ${from} to position ${to}.`
    );

    await interaction.reply({ embeds: [embed] });

    client.logger.music('queue_move', {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        from,
        to,
        trackTitle: track.info.title
    });
}

async function handleLoopMode(interaction, client, player) {
    const mode = interaction.options.getString('mode');
    await client.musicPlayer.setLoop(interaction.guildId, mode);

    const modeNames = {
        none: 'Off',
        track: 'Current Track',
        queue: 'Entire Queue'
    };

    const embed = Utils.createSuccessEmbed(
        'Loop Mode Changed',
        `Loop mode set to: **${modeNames[mode]}**`
    );

    await interaction.reply({ embeds: [embed] });

    client.logger.music('loop_mode', {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        mode
    });
}

async function handleShowHistory(interaction, client) {
    await interaction.deferReply();

    const userData = await Utils.getUserData(interaction.user.id);
    
    if (!userData || !userData.history.tracks.length) {
        const embed = Utils.createInfoEmbed(
            'No History',
            'You haven\'t played any tracks yet. Use `/play` to start building your history!'
        );
        return interaction.editReply({ embeds: [embed] });
    }

    const recentTracks = userData.history.tracks.slice(0, 10);
    
    const embed = new EmbedBuilder()
        .setTitle('🕒 Your Recent Tracks')
        .setColor(client.config.colors.info)
        .setTimestamp()
        .setFooter({
            text: `Showing last ${recentTracks.length} tracks`,
            iconURL: interaction.user.displayAvatarURL()
        });

    let historyText = '';
    recentTracks.forEach((track, index) => {
        historyText += `\`${index + 1}.\` **${Utils.truncate(track.title, 35)}** - ${Utils.truncate(track.artist, 25)}\n`;
        historyText += `${Utils.getSourceEmoji(track.source)} ${Utils.capitalize(track.source)} • ${Utils.timeAgo(track.playedAt)} • ${track.guildName}\n\n`;
    });

    embed.setDescription(historyText);

    await interaction.editReply({ embeds: [embed] });
}

function createProgressBar(current, total, length = 20) {
    if (!total || total === 0) return '▬'.repeat(length);
    
    const progress = Math.round((current / total) * length);
    const progressBar = '▬'.repeat(Math.max(0, progress - 1)) + '🔘' + '▬'.repeat(Math.max(0, length - progress));
    
    return progressBar;
}
