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

        // Update ticket activity if this is a ticket channel
        if (message.client.ticketManager) {
            await updateTicketActivity(message);
        }
    }
};

async function updateTicketActivity(message) {
    try {
        const Ticket = require('../schemas/Ticket');
        
        // Check if this is a ticket channel
        const ticket = await Ticket.findOne({ 
            channelId: message.channel.id,
            status: 'open'
        });
        
        if (ticket) {
            ticket.lastActivity = new Date();
            await ticket.save();
        }
    } catch (error) {
        console.error('Error updating ticket activity:', error);
    }
}
