const Utils = require('../utils/utils');
const LFGInteractionHandler = require('../modules/lfg/handlers/LFGInteractionHandler');
const MusicInteractionHandler = require('../modules/music/handlers/MusicInteractionHandler');
const RemindersInteractionHandler = require('../modules/reminders/handlers/RemindersInteractionHandler');
const TicketsInteractionHandler = require('../modules/tickets/handlers/TicketsInteractionHandler');
const { ModerationInteractionHandler } = require('../modules/moderation/handlers/ModerationInteractionHandler');
const TempVCInteractionHandler = require('../modules/tempvc/handlers/TempVCInteractionHandler');
const SelfRoleInteractionHandler = require('../modules/selfrole/handlers/SelfRoleInteractionHandler');
const TemplatesInteractionHandler = require('../modules/templates/handlers/TemplatesInteractionHandler');
const UtilsInteractionHandler = require('../modules/utils/handlers/UtilsInteractionHandler');

async function handleButtonInteraction(interaction, client) {
    // Always define customId at the top for use in all branches and in catch
    const customId = interaction.customId;
    
    try {
        // Handle LFG button interactions first
        const lfgHandled = await LFGInteractionHandler.handleButtonInteraction(interaction);
        if (lfgHandled) return;

        // Handle Music interactions
        const musicHandled = await MusicInteractionHandler.handleButtonInteraction(interaction, client);
        if (musicHandled) return;

        // Handle Reminders interactions
        const remindersHandled = await RemindersInteractionHandler.handleButtonInteraction(interaction, client);
        if (remindersHandled) return;

        // Handle Tickets interactions
        const ticketsHandled = await TicketsInteractionHandler.handleButtonInteraction(interaction, client);
        if (ticketsHandled) return;

        // Handle Moderation interactions
        const moderationHandled = await ModerationInteractionHandler.handleButtonInteraction(interaction, client);
        if (moderationHandled) return;

        // Handle Temp VC interactions
        const tempVCHandled = await TempVCInteractionHandler.handleButtonInteraction(interaction, client);
        if (tempVCHandled) return;

        // Handle Self-role interactions
        const selfRoleHandled = await SelfRoleInteractionHandler.handleButtonInteraction(interaction, client);
        if (selfRoleHandled) return;

        // Handle Templates interactions
        const templatesHandled = await TemplatesInteractionHandler.handleButtonInteraction(interaction, client);
        if (templatesHandled) return;

        // Handle Utils interactions
        const utilsHandled = await UtilsInteractionHandler.handleButtonInteraction(interaction, client);
        if (utilsHandled) return;

        // If no handler processed the interaction, log a warning
        client.logger.warn(`Unhandled button interaction: ${customId}`);
        
        // Send a generic response
        const embed = Utils.createWarningEmbed(
            'Unknown Button',
            'This button interaction is not currently supported.'
        );
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

    } catch (error) {
        // customId is always defined at the top, but fallback just in case
        const safeCustomId = typeof customId !== 'undefined' ? customId : '[unknown]';
        client.logger.error(`Error handling button interaction ${safeCustomId}:`, error);
        
        const errorEmbed = Utils.createErrorEmbed(
            'Button Error',
            'An error occurred while processing this button interaction.'
        );

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

// Export the handleModLogEventToggle function for backward compatibility
const { handleModLogEventToggle } = require('../modules/moderation/handlers/ModerationInteractionHandler');

module.exports = { handleButtonInteraction, handleModLogEventToggle };