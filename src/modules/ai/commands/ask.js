const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Guild = require('../../../schemas/Guild');
const Utils = require('../../../utils/utils');
const ChatBot = require('../../../utils/ChatBot');

module.exports = {
    category: 'AI',
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask the AI chatbot a question directly')
        .addStringOption(option =>
            option
                .setName('message')
                .setDescription('Your message to the AI')
                .setRequired(true)
                .setMaxLength(1000)
        ),

    async execute(interaction) {
        try {
            const message = interaction.options.getString('message');

            // Get guild settings
            const guildSettings = await Guild.findByGuildId(interaction.guild.id);
            if (!guildSettings) {
                return await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Server Not Found', 'Guild settings not found. Please try again.')],
                    ephemeral: true
                });
            }

            // Check if chatbot is enabled
            if (!guildSettings.chatbot.enabled) {
                return await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Chatbot Disabled', 'The AI chatbot is not enabled on this server. Ask an administrator to enable it with `/chatbot toggle`.')],
                    ephemeral: true
                });
            }

            // Check if API key is set
            if (!guildSettings.chatbot.apiKey) {
                return await interaction.reply({
                    embeds: [Utils.createErrorEmbed('API Key Missing', 'The AI chatbot is not properly configured. Ask an administrator to set up the API connection with `/chatbot api`.')],
                    ephemeral: true
                });
            }

            // Check cooldown
            const cooldownKey = `${interaction.guild.id}-${interaction.user.id}`;
            const now = Date.now();
            const cooldownEnd = ChatBot.cooldowns.get(cooldownKey);
            
            if (cooldownEnd && now < cooldownEnd) {
                const remainingTime = Math.ceil((cooldownEnd - now) / 1000);
                return await interaction.reply({
                    embeds: [Utils.createWarningEmbed('Cooldown Active', `Please wait ${remainingTime} more seconds before asking another question.`)],
                    ephemeral: true
                });
            }

            // Defer reply since AI generation can take time
            await interaction.deferReply();

            try {
                // Create a mock message object for the ChatBot to process
                const mockMessage = {
                    content: message,
                    author: interaction.user,
                    channel: interaction.channel,
                    guild: interaction.guild,
                    client: interaction.client
                };

                // Generate AI response
                const response = await ChatBot.generateResponse(mockMessage, guildSettings);

                if (response) {
                    // Set cooldown
                    const cooldownEnd = Date.now() + guildSettings.chatbot.cooldown;
                    ChatBot.cooldowns.set(cooldownKey, cooldownEnd);

                    // Create embed for the response
                    const embed = Utils.createEmbed({
                        title: '🤖 AI Response',
                        description: response,
                        color: 0x5865F2,
                        footer: {
                            text: `Asked by ${interaction.user.username}`,
                            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                        }
                    });

                    await interaction.editReply({ embeds: [embed] });
                } else {
                    await interaction.editReply({
                        embeds: [Utils.createErrorEmbed('No Response', 'The AI did not provide a response. Please try again.')]
                    });
                }

            } catch (error) {
                console.error('AI response error:', error);
                await interaction.editReply({
                    embeds: [Utils.createErrorEmbed('AI Error', 'There was an error generating the AI response. Please try again later.')]
                });
            }

        } catch (error) {
            console.error('Ask command error:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Command Error', 'An error occurred while processing your request.')],
                    ephemeral: true
                });
            }
        }
    }
};
