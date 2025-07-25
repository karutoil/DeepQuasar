const Utils = require('../../../utils/utils');

class TempVCModalHandler {
    static async handleModalSubmit(interaction, client) {
        const customId = interaction.customId;
        
        try {
            // Handle temp VC modals
            if (customId.startsWith('tempvc_')) {
                if (!client.tempVCManager) {
                    return interaction.reply({
                        content: '❌ Temp VC system is not available.',
                        ephemeral: true
                    });
                }

                try {
                    await client.tempVCManager.controlHandlers.handleModalSubmission(interaction);
                    return true;
                } catch (error) {
                    client.logger.error('Error handling temp VC modal:', error);
                    
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ An error occurred while processing your submission.',
                            ephemeral: true
                        });
                    }
                    return true;
                }
            }

            return false;
        } catch (error) {
            client.logger.error(`Error handling temp VC modal submit ${customId}:`, error);
            const embed = Utils.createErrorEmbed(
                'Temp VC Modal Error',
                'An error occurred while processing this temp VC modal submission.'
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

module.exports = TempVCModalHandler;