const Utils = require('../../../utils/utils');

class MusicSelectMenuHandler {
    static async handleSelectMenuInteraction(interaction, client) {
        const customId = interaction.customId;
        
        try {
            // Handle search select menu
            if (customId === 'search_select' || customId.startsWith('search_select_')) {
                const selectedValues = interaction.values;
                
                // Check if user is in voice channel
                const voiceCheck = Utils.checkVoiceChannel(interaction.member);
                if (!voiceCheck.inVoice) {
                    const embed = Utils.createErrorEmbed(
                        'Not in Voice Channel',
                        'You need to be in a voice channel to use music commands.'
                    );
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                await interaction.deferReply({ ephemeral: true });
                
                try {
                    // Get or create player
                    let player = client.musicPlayerManager.getPlayer(interaction.guildId);
                    
                    if (!player) {
                        player = client.musicPlayerManager.createPlayer({
                            guildId: interaction.guildId,
                            voiceChannelId: voiceCheck.channel.id,
                            textChannelId: interaction.channelId,
                            autoPlay: true
                        });
                        await player.connect();
                    } else {
                        // Check if user is in the same voice channel as the bot
                        if (player.voiceChannelId !== voiceCheck.channel.id) {
                            return interaction.editReply({ content: 'You need to be in the same voice channel as the bot to add songs.' });
                        }
                    }

                    const addedTracks = [];
                    for (const trackData of selectedValues) {
                        try {
                            // Parse track data (assuming it's JSON-encoded)
                            const track = JSON.parse(trackData);
                            
                            // Add requester info
                            track.requester = {
                                id: interaction.user.id,
                                username: interaction.user.username,
                                discriminator: interaction.user.discriminator
                            };
                            
                            player.queue.add(track);
                            addedTracks.push(track);
                        } catch (error) {
                            client.logger.error('Error parsing track data:', error);
                        }
                    }

                    // Start playing if not already playing
                    if (!player.playing && !player.paused && player.queue.size > 0) {
                        await player.play();
                    }
                    
                    await interaction.editReply({ 
                        content: `🎵 Added ${addedTracks.length} track${addedTracks.length !== 1 ? 's' : ''} to the queue!` 
                    });
                    
                } catch (error) {
                    client.logger.error('Error in search select handler:', error);
                    await interaction.editReply({ content: 'Failed to add the selected tracks to the queue.' });
                }
                
                return true;
            }

            return false;
        } catch (error) {
            client.logger.error(`Error handling music select menu interaction ${customId}:`, error);
            const embed = Utils.createErrorEmbed(
                'Music Select Menu Error',
                'An error occurred while processing this music select menu interaction.'
            );

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            return true;
        }
    }
}

module.exports = MusicSelectMenuHandler;