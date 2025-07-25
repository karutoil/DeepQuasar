const { Events } = require('discord.js');
const LFGMessageHandler = require('../modules/lfg/handlers/LFGMessageHandler');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        // Skip if message is from a webhook or system
        if (message.webhookId || message.system) {
            return;
        }

        // Skip if not in a guild
        if (!message.guild) {
            return;
        }

        // Handle LFG message deletions
        await LFGMessageHandler.handleMessageDelete(message);
    }
};
