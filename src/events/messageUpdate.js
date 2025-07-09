const { Events } = require('discord.js');
const LFGMessageHandler = require('../handlers/lfg/LFGMessageHandler');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        // Skip if message is from a webhook or system
        if (newMessage.webhookId || newMessage.system) {
            return;
        }

        // Skip if not in a guild
        if (!newMessage.guild) {
            return;
        }

        // Handle LFG message updates
        await LFGMessageHandler.handleMessageUpdate(oldMessage, newMessage);
    }
};
