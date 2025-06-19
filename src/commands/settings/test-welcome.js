const { SlashCommandBuilder } = require('discord.js');
const WelcomeSystem = require('../../utils/WelcomeSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-welcome')
        .setDescription('Test the welcome system (Developer only)')
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Type of event to simulate')
                .setRequired(true)
                .addChoices(
                    { name: 'Join', value: 'join' },
                    { name: 'Leave', value: 'leave' }
                )
        ),

    async execute(interaction) {
        // Check if user is bot owner/developer
        const config = require('../../config/bot');
        if (!config.owners.includes(interaction.user.id)) {
            return interaction.reply({
                content: '❌ This command is only available to bot developers.',
                ephemeral: true
            });
        }

        const type = interaction.options.getString('type');

        try {
            if (type === 'join') {
                await WelcomeSystem.handleMemberJoin(interaction.member, interaction.client);
                await interaction.reply({
                    content: '✅ Simulated member join event. Check your welcome channel!',
                    ephemeral: true
                });
            } else if (type === 'leave') {
                await WelcomeSystem.handleMemberLeave(interaction.member, interaction.client);
                await interaction.reply({
                    content: '✅ Simulated member leave event. Check your leave channel!',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error in test-welcome command:', error);
            await interaction.reply({
                content: '❌ An error occurred while testing the welcome system.',
                ephemeral: true
            });
        }
    }
};
