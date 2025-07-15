const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Reminder = require('../../schemas/Reminder');
const timeParser = require('../../utils/timeParser');

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

            const embeds = [];
            const components = [];
            for (const reminder of reminders.slice(0, 5)) {
                const embed = new EmbedBuilder()
                    .setTitle('⏰ Reminder')
                    .setDescription(reminder.task_description)
                    .addFields(
                        { name: 'Time', value: `<t:${Math.floor(reminder.trigger_timestamp/1000)}:F>`, inline: true },
                        { name: 'Target', value: reminder.target_type === 'self' ? 'You (DM)' : reminder.target_type === 'user' ? `<@${reminder.target_id}>` : `<#${reminder.target_id}>`, inline: true }
                    )
                    .setFooter({ text: `ID: ${reminder.reminder_id}` })
                    .setColor(0x5865F2);
                embeds.push(embed);

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`reminder_edit_${reminder.reminder_id}`)
                            .setLabel('Edit')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`reminder_delete_${reminder.reminder_id}`)
                            .setLabel('Delete')
                            .setStyle(ButtonStyle.Danger)
                    );
                components.push(row);
            }

            await interaction.reply({
                embeds,
                components,
                ephemeral: true
            });
        }
    }
};
