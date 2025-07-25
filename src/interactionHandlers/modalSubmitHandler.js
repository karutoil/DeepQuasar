const Utils = require('../utils/utils');
const LFGInteractionHandler = require('../modules/lfg/handlers/LFGInteractionHandler');
const RemindersModalHandler = require('../modules/reminders/handlers/RemindersModalHandler');
const TemplatesModalHandler = require('../modules/templates/handlers/TemplatesModalHandler');
const TempVCModalHandler = require('../modules/tempvc/handlers/TempVCModalHandler');
const TicketsModalHandler = require('../modules/tickets/handlers/TicketsModalHandler');

async function handleModalSubmit(interaction, client) {
    try {
        const customId = interaction.customId;

        // Handle LFG modals
        const lfgHandled = await LFGInteractionHandler.handleModalSubmit ? 
            await LFGInteractionHandler.handleModalSubmit(interaction) : false;
        if (lfgHandled) return;

        // Handle Reminders modals
        const remindersHandled = await RemindersModalHandler.handleModalSubmit(interaction, client);
        if (remindersHandled) return;

        // Handle Templates modals
        const templatesHandled = await TemplatesModalHandler.handleModalSubmit(interaction, client);
        if (templatesHandled) return;

        // Handle Temp VC modals
        const tempVCHandled = await TempVCModalHandler.handleModalSubmit(interaction, client);
        if (tempVCHandled) return;

        // Handle Tickets modals
        const ticketsHandled = await TicketsModalHandler.handleModalSubmit(interaction, client);
        if (ticketsHandled) return;

        // If no handler processed the modal, log a warning
        client.logger.warn(`Unhandled modal submit interaction: ${customId}`);
        
        // Send a generic response
        const embed = Utils.createWarningEmbed(
            'Unknown Modal',
            'This modal submission is not currently supported.'
        );
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

    } catch (error) {
        client.logger.error('Error handling modal submit:', error);
        
        const errorEmbed = Utils.createErrorEmbed(
            'Modal Error',
            'An error occurred while processing this modal submission.'
        );

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

module.exports = { handleModalSubmit };