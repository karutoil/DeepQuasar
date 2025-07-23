const Utils = require('../../../utils/utils');

class TempVCInteractionHandler {
    static async handleButtonInteraction(interaction, client) {
        const customId = interaction.customId;
        
        try {
            // Handle temp VC buttons
            if (customId.startsWith('tempvc_')) {
                if (!client.tempVCManager) {
                    return interaction.reply({
                        content: '❌ Temp VC system is not available.',
                        ephemeral: true
                    });
                }

                try {
                    // Handle delete confirmation
                    if (customId.includes('delete_confirm')) {
                        await client.tempVCManager.controlHandlers.handleDeleteConfirmation(interaction);
                        return true;
                    }
                    
                    // Handle delete cancellation
                    if (customId.includes('delete_cancel')) {
                        await client.tempVCManager.controlHandlers.handleDeleteCancellation(interaction);
                        return true;
                    }
                    
                    // Handle reset confirmation
                    if (customId.includes('reset_confirm')) {
                        await client.tempVCManager.controlHandlers.handleResetConfirmation(interaction);
                        return true;
                    }
                    
                    // Handle reset cancellation
                    if (customId.includes('reset_cancel')) {
                        await client.tempVCManager.controlHandlers.handleResetCancellation(interaction);
                        return true;
                    }
                    
                    // Handle unban confirmation
                    if (customId.includes('unban_confirm')) {
                        await client.tempVCManager.controlHandlers.handleUnbanConfirmation(interaction);
                        return true;
                    }
                    
                    // Handle unban cancellation
                    if (customId.includes('unban_cancel')) {
                        await client.tempVCManager.controlHandlers.handleUnbanCancellation(interaction);
                        return true;
                    }
                    
                    // Handle other control panel actions
                    await client.tempVCManager.handleControlPanelInteraction(interaction);
                    
                } catch (error) {
                    client.logger.error('Error handling temp VC button:', error);
                    
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ An error occurred while processing your request.',
                            ephemeral: true
                        });
                    }
                }
                return true;
            }

            return false;
        } catch (error) {
            client.logger.error(`Error handling temp VC button interaction ${customId}:`, error);
            const embed = Utils.createErrorEmbed(
                'Temp VC Button Error',
                'An error occurred while processing this temp VC button interaction.'
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

module.exports = TempVCInteractionHandler;