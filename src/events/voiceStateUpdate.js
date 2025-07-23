module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState, client) {
        try {
            // Handle temp VC system
            if (client.tempVCManager) {
                await client.tempVCManager.handleVoiceStateUpdate(oldState, newState);
            }
            
            // --- Music Alone Timer Logic ---
            if (!client.musicAloneTimers) client.musicAloneTimers = {};

            // Get the guild and player
            const guild = newState.guild;
            const guildId = guild.id;
            const player = client.musicPlayerManager?.getPlayer(guildId);
            if (!player) return;

            // Get the bot's member and voice channel
            const botMember = guild.members.me;
            const botVoiceChannel = botMember?.voice?.channel;

            // If bot is not in a voice channel, clear any timer
            if (!botVoiceChannel) {
                if (client.musicAloneTimers[guildId]) {
                    clearTimeout(client.musicAloneTimers[guildId]);
                    delete client.musicAloneTimers[guildId];
                }
                return;
            }

            // Get all members in the bot's voice channel
            const members = botVoiceChannel.members;
            // Filter out bots
            const nonBotMembers = members.filter(m => !m.user.bot);

            if (nonBotMembers.size === 0) {
                // Only bots (or bot is alone)
                if (!client.musicAloneTimers[guildId]) {
                    client.musicAloneTimers[guildId] = setTimeout(async () => {
                        // Double-check before destroying
                        const refreshedChannel = guild.channels.cache.get(botVoiceChannel.id);
                        const refreshedMembers = refreshedChannel?.members;
                        const refreshedNonBots = refreshedMembers?.filter(m => !m.user.bot);
                        if (refreshedNonBots?.size === 0) {
                            try {
                                await player.destroy();
                                client.logger.info(`Destroyed music player in guild ${guildId} after being alone for 5 minutes.`);
                            } catch (err) {
                                client.logger.error(`Error destroying player for guild ${guildId}:`, err);
                            }
                        }
                        delete client.musicAloneTimers[guildId];
                    }, 5 * 60 * 1000); // 5 minutes
                    client.logger.info(`Bot is alone in voice channel in guild ${guildId}. Will disconnect in 5 minutes if no humans join.`);
                }
            } else {
                // Humans present, clear any timer
                if (client.musicAloneTimers[guildId]) {
                    clearTimeout(client.musicAloneTimers[guildId]);
                    delete client.musicAloneTimers[guildId];
                    client.logger.info(`Human joined voice channel in guild ${guildId}. Cancelled disconnect timer.`);
                }
            }
            
        } catch (error) {
            client.logger.error('Error in voiceStateUpdate event:', error);
        }
    }
};