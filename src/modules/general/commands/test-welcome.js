const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const WelcomeSystem = require('../../utils/WelcomeSystem');
const Utils = require('../../utils/utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-welcome')
        .setDescription('Test the welcome system (Developer only)')
        .setDefaultMemberPermissions(null) // Hide from all users by default
        .setDMPermission(false),

    async execute(interaction) {
        // Check if user is bot owner/developer
        const permissionCheck = Utils.checkTestingPermissions(interaction);
        if (!permissionCheck.hasPermission) {
            return interaction.reply({
                content: permissionCheck.reason,
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
