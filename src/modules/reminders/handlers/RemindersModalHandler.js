const Utils = require('../../../utils/utils');

class RemindersModalHandler {
    static async handleModalSubmit(interaction, client) {
        const customId = interaction.customId;
        
        try {
            // Handle reminder edit modal
            if (customId.startsWith('reminder_edit_modal_')) {
                const reminderId = customId.replace('reminder_edit_modal_', '');
                const Reminder = require('../../../schemas/Reminder');
                const newTaskDescription = interaction.fields.getTextInputValue('reminder_task_description');
                
                const reminder = await Reminder.findOne({ reminder_id: reminderId });
                if (!reminder) {
                    await interaction.reply({
                        content: '❌ Reminder not found.',
                        ephemeral: true
                    });
                    return true;
                }
                
                reminder.task_description = newTaskDescription;
                await reminder.save();
                
                const embed = Utils.createSuccessEmbed(
                    'Reminder Updated',
                    `The reminder task has been updated to: "${newTaskDescription}"`
                );
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return true;
            }

            return false;
        } catch (error) {
            client.logger.error(`Error handling reminders modal submit ${customId}:`, error);
            const embed = Utils.createErrorEmbed(
                'Reminders Modal Error',
                'An error occurred while processing this reminders modal submission.'
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

module.exports = RemindersModalHandler;