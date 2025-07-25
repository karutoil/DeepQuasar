const Utils = require('../../../utils/utils');

class UtilsInteractionHandler {
    static async handleButtonInteraction(interaction, client) {
        const customId = interaction.customId;
        
        try {
            // Handle settings buttons
            if (customId.startsWith('settings_')) {
                // Settings button logic
                await interaction.deferUpdate();
                return true;
            }

            return false;
        } catch (error) {
            client.logger.error(`Error handling utils button interaction ${customId}:`, error);
            const embed = Utils.createErrorEmbed(
                'Utils Button Error',
                'An error occurred while processing this utils button interaction.'
            );

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            return true;
        }
    }
}

module.exports = UtilsInteractionHandler;