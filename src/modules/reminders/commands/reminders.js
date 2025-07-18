const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
const Reminder = require('../../../schemas/Reminder');
const timeParser = require('../../../utils/timeParser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reminders')
        .setDescription('Manage your reminders')
        .addSubcommand(sub => sub.setName('list').setDescription('List your active reminders')),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'list') {
            const reminders = await Reminder.find({ user_id: interaction.user.id }).sort({ trigger_timestamp: 1 });
            if (!reminders.length) {
                return interaction.reply({ content: 'You have no active reminders.', ephemeral: true });
            }

            // Selection menu for reminders
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('reminder_select')
                .setPlaceholder('Select a reminder to preview')
                .addOptions(reminders.map(reminder => ({
                    label: reminder.task_description.length > 80 ? reminder.task_description.slice(0, 77) + '...' : reminder.task_description,
                    description: `<t:${Math.floor(reminder.trigger_timestamp/1000)}:F>`,
                    value: reminder.reminder_id
                })));

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({
                content: `Select a reminder to preview and manage:`,
                components: [row],
                ephemeral: true
            });
        }
    }
};
