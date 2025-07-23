const Utils = require('../../../utils/utils');

class TemplatesInteractionHandler {
    static async handleButtonInteraction(interaction, client) {
        const customId = interaction.customId;
        
        try {
            // Handle embed builder buttons
            if (customId.startsWith('embed_')) {
                const embedCommand = client.commands.get('embed');
                if (embedCommand && typeof embedCommand.handleBuilderInteraction === 'function') {
                    await embedCommand.handleBuilderInteraction(interaction);
                } else {
                    const errorEmbed = Utils.createErrorEmbed(
                        'Handler Error',
                        'Embed builder handler is not available.'
                    );
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
                return true;
            }

            // Handle welcome embed builder buttons
            if (customId.startsWith('welcome_embed_')) {
                const WelcomeEmbedHandler = require('../../../utils/WelcomeEmbedHandler');
                const handled = await WelcomeEmbedHandler.handleWelcomeEmbedInteraction(interaction);
                if (handled) return true;
            }

            return false;
        } catch (error) {
            client.logger.error(`Error handling templates button interaction ${customId}:`, error);
            const embed = Utils.createErrorEmbed(
                'Templates Button Error',
                'An error occurred while processing this templates button interaction.'
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

module.exports = TemplatesInteractionHandler;