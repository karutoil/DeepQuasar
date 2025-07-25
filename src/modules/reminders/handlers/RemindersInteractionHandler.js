const Utils = require('../../../utils/utils');

class RemindersInteractionHandler {
    static async handleButtonInteraction(interaction, client) {
        const customId = interaction.customId;
        
        try {
            // Reminder Edit Handler
            if (customId.startsWith('reminder_edit_')) {
                const reminderId = customId.replace('reminder_edit_', '');
                const Reminder = require('../../../schemas/Reminder');
                const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
                const reminder = await Reminder.findOne({ reminder_id: reminderId });
                if (!reminder) {
                    await interaction.reply({
                        content: '❌ Reminder not found.',
                        ephemeral: true
                    });
                    return true;
                }
                // Show modal to edit the reminder task description
                const modal = new ModalBuilder()
                    .setCustomId(`reminder_edit_modal_${reminderId}`)
                    .setTitle('Edit Reminder');

                const taskInput = new TextInputBuilder()
                    .setCustomId('reminder_task_description')
                    .setLabel('Task Description')
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(reminder.task_description)
                    .setMaxLength(200)
                    .setRequired(true);

                const row = new ActionRowBuilder().addComponents(taskInput);
                modal.addComponents(row);

                await interaction.showModal(modal);
                return true;
            }

            // Reminder Delete Handler
            if (customId.startsWith('reminder_delete_')) {
                const reminderId = customId.replace('reminder_delete_', '');
                const Reminder = require('../../../schemas/Reminder');
                const reminder = await Reminder.findOne({ reminder_id: reminderId });
                if (!reminder) {
                    await interaction.reply({
                        content: '❌ Reminder not found.',
                        ephemeral: true
                    });
                    return true;
                }
                await Reminder.deleteOne({ reminder_id: reminderId });
                // Cancel scheduled timer if any
                if (client.reminderManager) {
                    client.reminderManager.cancelReminder(reminderId);
                }
                await interaction.update({
                    content: '🗑️ Reminder deleted.',
                    embeds: [],
                    components: []
                });
                return true;
            }

            return false;
        } catch (error) {
            client.logger.error(`Error handling reminders button interaction ${customId}:`, error);
            const embed = Utils.createErrorEmbed(
                'Reminders Button Error',
                'An error occurred while processing this reminders button interaction.'
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

module.exports = RemindersInteractionHandler;