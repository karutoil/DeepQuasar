const Utils = require('../../../utils/utils');

class TemplatesModalHandler {
    static async handleModalSubmit(interaction, client) {
        const customId = interaction.customId;
        
        try {
            // Handle embed modals
            if (customId.startsWith('embed_modal_')) {
                const EmbedBuilderHandler = require('../../../utils/EmbedBuilderHandler');
                await EmbedBuilderHandler.handleModalSubmit(interaction, client);
                return true;
            }

            // Handle welcome modals  
            if (customId.startsWith('welcome_modal_')) {
                const WelcomeEmbedHandler = require('../../../utils/WelcomeEmbedHandler');
                await WelcomeEmbedHandler.handleWelcomeEmbedModal(interaction);
                return true;
            }

            return false;
        } catch (error) {
            client.logger.error(`Error handling templates modal submit ${customId}:`, error);
            const embed = Utils.createErrorEmbed(
                'Templates Modal Error',
                'An error occurred while processing this templates modal submission.'
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

module.exports = TemplatesModalHandler;