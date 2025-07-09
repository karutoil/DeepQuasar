const Utils = require('../utils/utils');
const EmbedBuilderHandler = require('../utils/EmbedBuilderHandler');
const LFGInteractionHandler = require('./lfg/LFGInteractionHandler');

// Temp VC interaction handlers
async function handleTempVCModal(interaction, client) {
    if (!client.tempVCManager) {
        return interaction.reply({
            content: '❌ Temp VC system is not available.',
            ephemeral: true
        });
    }

    try {
        await client.tempVCManager.controlHandlers.handleModalSubmission(interaction);
        
    } catch (error) {
        client.logger.error('Error handling temp VC modal:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ An error occurred while processing your submission.',
                ephemeral: true
            });
        }
    }
}

async function handleModalSubmit(interaction, client) {
    try {
        // Handle LFG modal submissions first
        const lfgHandled = await LFGInteractionHandler.handleModalSubmission(interaction);
        if (lfgHandled) return;

        const customId = interaction.customId;
        
        // Handle embed builder modals
        if (customId.startsWith('embed_modal_')) {
            const handled = await EmbedBuilderHandler.handleModalSubmit(interaction);
            if (handled) return;
        }

        // Handle welcome embed builder modals
        if (customId.startsWith('welcome_modal_')) {
            const WelcomeEmbedHandler = require('../utils/WelcomeEmbedHandler');
            const handled = await WelcomeEmbedHandler.handleWelcomeModalSubmit(interaction);
            if (handled) return;
        }
        
        // Handle ticket creation modals
        if (customId.startsWith('ticket_modal_')) {
            const ticketManager = client.ticketManager;
            await ticketManager.handleModalSubmit(interaction);
            return;
        }

        // Handle ticket close reason modals
        if (customId.startsWith('ticket_close_reason_')) {
            const ticketId = customId.replace('ticket_close_reason_', '');
            const reason = interaction.fields.getTextInputValue('reason');
            
            const Ticket = require('../schemas/Ticket');
            const TicketConfig = require('../schemas/TicketConfig');
            
            const ticket = await Ticket.findOne({ ticketId });
            if (!ticket) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Error', 'Ticket not found.')],
                    ephemeral: true
                });
            }

            const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            const ticketManager = client.ticketManager;
            
            await ticketManager.processCloseTicket(interaction, ticket, reason, config);
            return;
        }

        // Handle temp VC modals
        if (customId.startsWith('tempvc_')) {
            await handleTempVCModal(interaction, client);
            return;
        }

        // Handle other modals...
        
    } catch (error) {
        console.error('Error handling modal submit:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'An error occurred while processing your submission.')],
                ephemeral: true
            });
        }
    }
}

module.exports = { handleModalSubmit };