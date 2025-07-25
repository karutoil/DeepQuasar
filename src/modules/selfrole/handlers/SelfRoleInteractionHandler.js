const Utils = require('../../../utils/utils');

class SelfRoleInteractionHandler {
    static async handleButtonInteraction(interaction, client) {
        const customId = interaction.customId;
        
        try {
            // Handle selfrole buttons
            if (customId.startsWith('selfrole_')) {
                if (client.selfRoleManager) {
                    await client.selfRoleManager.handleSelfRoleInteraction(interaction);
                } else {
                    await interaction.reply({
                        embeds: [Utils.createErrorEmbed('Module Error', 'Self-role system is not available.')],
                        ephemeral: true
                    });
                }
                return true;
            }

            return false;
        } catch (error) {
            client.logger.error(`Error handling self-role button interaction ${customId}:`, error);
            const embed = Utils.createErrorEmbed(
                'Self-Role Button Error',
                'An error occurred while processing this self-role button interaction.'
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

module.exports = SelfRoleInteractionHandler;