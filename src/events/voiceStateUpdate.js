module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState, client) {
        try {
            // Handle temp VC system
            if (client.tempVCManager) {
                await client.tempVCManager.handleVoiceStateUpdate(oldState, newState);
            }
            
            // Add any other voice state update handling here if needed
            
        } catch (error) {
            client.logger.error('Error in voiceStateUpdate event:', error);
        }
    }
};