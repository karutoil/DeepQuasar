const { Events } = require('discord.js');
const ChatBot = require('../utils/ChatBot');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Skip if message is from a webhook or system
        if (message.webhookId || message.system) {
            return;
        }

        // Skip if not in a guild
        if (!message.guild) {
            return;
        }

        // Process the message with the chatbot
        await ChatBot.processMessage(message);
    }
};
