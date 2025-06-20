const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const TicketConfig = require('../../schemas/TicketConfig');
const Utils = require('../../utils/utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fix-tickets')
        .setDescription('Fix ticket system modal configurations')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            let config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('No Configuration', 'No ticket configuration found. Please run `/tickets setup` first.')]
                });
            }

            // Reset modal configurations with proper defaults
            config.modalConfig.clear();
            
            config.modalConfig.set('support', {
                title: 'Support Request',
                questions: [{
                    id: 'reason',
                    label: 'What do you need help with?',
                    placeholder: 'Please describe your issue in detail...',
                    required: true,
                    maxLength: 1000,
                    minLength: 10,
                    style: 'Paragraph'
                }]
            });
            
            config.modalConfig.set('bug', {
                title: 'Bug Report',
                questions: [{
                    id: 'description',
                    label: 'Bug Description',
                    placeholder: 'Describe the bug you encountered...',
                    required: true,
                    maxLength: 1000,
                    minLength: 10,
                    style: 'Paragraph'
                }, {
                    id: 'steps',
                    label: 'Steps to Reproduce',
                    placeholder: '1. First step\n2. Second step\n3. Bug occurs',
                    required: true,
                    maxLength: 500,
                    minLength: 10,
                    style: 'Paragraph'
                }]
            });
            
            config.modalConfig.set('partnership', {
                title: 'Partnership Request',
                questions: [{
                    id: 'details',
                    label: 'Partnership Details',
                    placeholder: 'Tell us about your server/project and partnership proposal...',
                    required: true,
                    maxLength: 1000,
                    minLength: 50,
                    style: 'Paragraph'
                }]
            });

            await config.save();

            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed(
                    'Ticket System Fixed',
                    'Modal configurations have been reset. The ticket panel buttons should now work properly!'
                )]
            });

        } catch (error) {
            console.error('Error fixing tickets:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to fix ticket system. Please try again.')]
            });
        }
    }
};
