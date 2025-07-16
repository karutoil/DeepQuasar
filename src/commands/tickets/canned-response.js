const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const TicketConfig = require('../../schemas/TicketConfig');
const Utils = require('../../utils/utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('canned-response')
        .setDescription('Manage canned responses for quick replies')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new canned response')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name/identifier for the response')
                        .setRequired(true)
                        .setMaxLength(50))
                .addStringOption(option =>
                    option
                        .setName('content')
                        .setDescription('The response content')
                        .setRequired(true)
                        .setMaxLength(1000)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all canned responses'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing canned response')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name of the response to edit')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a canned response')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name of the response to delete')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('use')
                .setDescription('Send a canned response in this channel')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name of the response to send')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'create':
                await this.createResponse(interaction);
                break;
            case 'list':
                await this.listResponses(interaction);
                break;
            case 'edit':
                await this.editResponse(interaction);
                break;
            case 'delete':
                await this.deleteResponse(interaction);
                break;
            case 'use':
                await this.useResponse(interaction);
                break;
        }
    },

    async createResponse(interaction) {
        const name = interaction.options.getString('name').toLowerCase();
        const content = interaction.options.getString('content');

        try {
            await interaction.deferReply({ ephemeral: true });

            let config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config) {
                config = new TicketConfig({ guildId: interaction.guild.id });
            }

            // Initialize canned responses if not exists
            if (!config.cannedResponses) {
                config.cannedResponses = {};
            }

            // Check if response already exists
            if (config.cannedResponses[name]) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Response Exists', 
                        `A canned response with the name "${name}" already exists. Use \`/canned-response edit\` to modify it.`)]
                });
            }

            // Add the response
            config.cannedResponses[name] = {
                content: content,
                createdBy: interaction.user.id,
                createdAt: new Date(),
                usageCount: 0
            };

            await config.save();

            const successEmbed = Utils.createSuccessEmbed(
                'Canned Response Created',
                `Successfully created canned response "${name}".\n\nUse \`/canned-response use name:${name}\` to send it.`
            );

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error creating canned response:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to create canned response.')]
            });
        }
    },

    async listResponses(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config || !config.cannedResponses || Object.keys(config.cannedResponses).length === 0) {
                return interaction.editReply({
                    embeds: [Utils.createEmbed({
                        title: '📝 Canned Responses',
                        description: 'No canned responses found.\n\nCreate one using `/canned-response create`.',
                        color: 0x99AAB5
                    })]
                });
            }

            const responses = Object.entries(config.cannedResponses).map(([name, data]) => {
                const creator = interaction.guild.members.cache.get(data.createdBy);
                return `**${name}**\n` +
                       `Usage: ${data.usageCount || 0} times\n` +
                       `Created by: ${creator ? creator.displayName : 'Unknown'}\n` +
                       `Preview: ${data.content.length > 100 ? data.content.substring(0, 100) + '...' : data.content}`;
            }).join('\n\n');

            const embed = Utils.createEmbed({
                title: '📝 Canned Responses',
                description: responses,
                color: 0x5865F2,
                footer: { text: `Total: ${Object.keys(config.cannedResponses).length} responses` }
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error listing canned responses:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to list canned responses.')]
            });
        }
    },

    async editResponse(interaction) {
        const name = interaction.options.getString('name').toLowerCase();

        try {
            const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config || !config.cannedResponses || !config.cannedResponses[name]) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Not Found', 
                        `No canned response found with the name "${name}".`)],
                    ephemeral: true
                });
            }

            const currentResponse = config.cannedResponses[name];

            // Create modal for editing
            const modal = new ModalBuilder()
                .setCustomId(`edit_canned_response_${name}`)
                .setTitle(`Edit Canned Response: ${name}`);

            const contentInput = new TextInputBuilder()
                .setCustomId('content')
                .setLabel('Response Content')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(currentResponse.content)
                .setRequired(true)
                .setMaxLength(1000);

            modal.addComponents(new ActionRowBuilder().addComponents(contentInput));

            await interaction.showModal(modal);

        } catch (error) {
            console.error('Error editing canned response:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to edit canned response.')],
                ephemeral: true
            });
        }
    },

    async deleteResponse(interaction) {
        const name = interaction.options.getString('name').toLowerCase();

        try {
            await interaction.deferReply({ ephemeral: true });

            const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config || !config.cannedResponses || !config.cannedResponses[name]) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Not Found', 
                        `No canned response found with the name "${name}".`)]
                });
            }

            delete config.cannedResponses[name];
            await config.save();

            const successEmbed = Utils.createSuccessEmbed(
                'Canned Response Deleted',
                `Successfully deleted canned response "${name}".`
            );

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error deleting canned response:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to delete canned response.')]
            });
        }
    },

    async useResponse(interaction) {
        const name = interaction.options.getString('name').toLowerCase();

        try {
            const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config || !config.cannedResponses || !config.cannedResponses[name]) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Not Found', 
                        `No canned response found with the name "${name}".`)],
                    ephemeral: true
                });
            }

            const response = config.cannedResponses[name];

            // Increment usage count
            response.usageCount = (response.usageCount || 0) + 1;
            config.cannedResponses[name] = response;
            await config.save();

            // Send the canned response
            await interaction.reply({
                content: response.content,
                allowedMentions: { parse: ['users', 'roles'] }
            });

        } catch (error) {
            console.error('Error using canned response:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to send canned response.')],
                ephemeral: true
            });
        }
    }
};
