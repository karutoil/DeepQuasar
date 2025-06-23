const { SlashCommandBuilder } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Set the loop mode for the music player')
        .addStringOption(option =>
            option
                .setName('mode')
                .setDescription('Loop mode to set')
                .setRequired(false)
                .addChoices(
                    { name: 'Off', value: 'none' },
                    { name: 'Current Track', value: 'track' },
                    { name: 'Queue', value: 'queue' }
                )
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
                    'You need to be in the same voice channel as the bot to change loop mode.'
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const mode = interaction.options.getString('mode');

            // If no mode specified, cycle through modes
            if (!mode) {
                let newMode;
                switch (player.loop) {
                    case 'none':
                        newMode = 'track';
                        break;
                    case 'track':
                        newMode = 'queue';
                        break;
                    case 'queue':
                        newMode = 'none';
                        break;
                    default:
                        newMode = 'track';
                }
                
                await client.musicPlayer.setLoop(interaction.guildId, newMode);
                
                const modeNames = {
                    none: 'Off',
                    track: 'Current Track',
                    queue: 'Queue'
                };

                const modeEmojis = {
                    none: '➡️',
                    track: '🔂',
                    queue: '🔁'
                };

                const embed = Utils.createSuccessEmbed(
                    'Loop Mode Changed',
                    `${modeEmojis[newMode]} Loop mode set to: **${modeNames[newMode]}**`
                );

                await interaction.reply({ embeds: [embed] });

                // Log the action
                client.logger.music('loop_mode', {
                    guildId: interaction.guildId,
                    userId: interaction.user.id,
                    mode: newMode
                });
            } else {
                await client.musicPlayer.setLoop(interaction.guildId, mode);

                const modeNames = {
                    none: 'Off',
                    track: 'Current Track',
                    queue: 'Queue'
                };

                const modeEmojis = {
                    none: '➡️',
                    track: '🔂',
                    queue: '🔁'
                };

                const embed = Utils.createSuccessEmbed(
                    'Loop Mode Set',
                    `${modeEmojis[mode]} Loop mode set to: **${modeNames[mode]}**`
                );

                await interaction.reply({ embeds: [embed] });

                // Log the action
                client.logger.music('loop_mode', {
                    guildId: interaction.guildId,
                    userId: interaction.user.id,
                    mode
                });
            }
        } catch (error) {
            client.logger.error('Error in loop command:', error);
            const embed = Utils.createErrorEmbed(
                'Command Error',
                'An error occurred while changing the loop mode.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
