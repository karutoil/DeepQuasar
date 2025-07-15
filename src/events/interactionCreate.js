const { handleSlashCommand } = require('../interactionHandlers/slashCommandHandler');
const { handleAutocomplete } = require('../interactionHandlers/autocompleteHandler');
const { handleButtonInteraction } = require('../interactionHandlers/buttonInteractionHandler');
const { handleSelectMenuInteraction } = require('../interactionHandlers/selectMenuInteractionHandler');
const { handleModalSubmit } = require('../interactionHandlers/modalSubmitHandler');
const ticketAssignModalHandler = require('../interactionHandlers/ticketAssignModalHandler');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Handle ticket staff assignment select menu
        if (
            typeof interaction.isStringSelectMenu === 'function' &&
            interaction.isStringSelectMenu()
        ) {
            if (interaction.customId && interaction.customId.startsWith('assign_staff_select_')) {
                await ticketAssignModalHandler.execute(interaction, client);
                return;
            }
        }

        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            await handleSlashCommand(interaction, client);
        }
        // Handle autocomplete
        else if (interaction.isAutocomplete()) {
            await handleAutocomplete(interaction, client);
        }
        // Handle button interactions
        else if (interaction.isButton()) {
            await handleButtonInteraction(interaction, client);
        }
        // Handle select menu interactions
        else if (interaction.isAnySelectMenu()) {
            await handleSelectMenuInteraction(interaction, client);
        }
        // Handle modal submissions
        else if (interaction.isModalSubmit()) {
            await handleModalSubmit(interaction, client);
        }
    }
};
