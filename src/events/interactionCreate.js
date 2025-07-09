const { handleSlashCommand } = require('../interactionHandlers/slashCommandHandler');
const { handleAutocomplete } = require('../interactionHandlers/autocompleteHandler');
const { handleButtonInteraction } = require('../interactionHandlers/buttonInteractionHandler');
const { handleSelectMenuInteraction } = require('../interactionHandlers/selectMenuInteractionHandler');
const { handleModalSubmit } = require('../interactionHandlers/modalSubmitHandler');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
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