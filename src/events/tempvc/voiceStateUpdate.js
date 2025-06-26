const { Events } = require('discord.js');

module.exports = {
    name: 'tempVCVoiceStateUpdate',
    eventName: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const client = oldState.client || newState.client;
        
        // Handle temp VC system if available
        if (client.tempVCManager) {
            try {
                await client.tempVCManager.handleVoiceStateUpdate(oldState, newState);
            } catch (error) {
                client.logger?.error('Error in temp VC voice state handler:', error);
            }
        }
    }
};
