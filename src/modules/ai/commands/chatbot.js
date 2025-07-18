const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Guild = require('../../schemas/Guild');
const Utils = require('../../utils/utils');
const ChatBot = require('../../utils/ChatBot');

module.exports = {
    category: 'Settings',
    permissions: [PermissionFlagsBits.Administrator], // Will be overridden by custom permission check
    data: new SlashCommandBuilder()
        .setName('chatbot')
        .setDescription('Configure AI chatbot settings for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Show current chatbot configuration')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Enable or disable the chatbot')
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('Enable or disable the chatbot')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('api')
                .setDescription('Configure API connection settings')
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('OpenAI-compatible API URL (e.g., https://api.openai.com/v1)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('key')
                        .setDescription('API key for authentication')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('model')
                        .setDescription('Model to use (e.g., gpt-3.5-turbo, gpt-4)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('behavior')
                .setDescription('Configure chatbot behavior settings')
                .addIntegerOption(option =>
                    option
                        .setName('chance')
                        .setDescription('Percentage chance to respond (0-100)')
                        .setRequired(false)
                        .setMinValue(0)
                        .setMaxValue(100)
                )
                .addBooleanOption(option =>
                    option
                        .setName('require-mention')
                        .setDescription('Only respond when bot is mentioned')
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option
                        .setName('cooldown')
                        .setDescription('Cooldown between responses in seconds (1-60)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(60)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('channels')
                .setDescription('Configure which channels the bot can respond in')
                .addStringOption(option =>
                    option
                        .setName('mode')
                        .setDescription('Channel restriction mode')
                        .setRequired(true)
                        .addChoices(
                            { name: 'All Channels', value: 'all' },
                            { name: 'Whitelist Only', value: 'whitelist' },
                            { name: 'Blacklist (Exclude)', value: 'blacklist' }
                        )
                )
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to add/remove from list')
                        .setRequired(false)
                        .addChannelTypes(ChannelType.GuildText)
                )
                .addStringOption(option =>
                    option
                        .setName('action')
                        .setDescription('Add or remove channel from list')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Add', value: 'add' },
                            { name: 'Remove', value: 'remove' },
                            { name: 'Clear All', value: 'clear' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('advanced')
                .setDescription('Configure advanced AI parameters')
                .addIntegerOption(option =>
                    option
                        .setName('max-tokens')
                        .setDescription('Maximum tokens in response (50-4000)')
                        .setRequired(false)
                        .setMinValue(50)
                        .setMaxValue(4000)
                )
                .addNumberOption(option =>
                    option
                        .setName('temperature')
                        .setDescription('AI creativity/randomness (0.0-2.0)')
                        .setRequired(false)
                        .setMinValue(0.0)
                        .setMaxValue(2.0)
                )
                .addIntegerOption(option =>
                    option
                        .setName('max-length')
                        .setDescription('Maximum message length (100-2000)')
                        .setRequired(false)
                        .setMinValue(100)
                        .setMaxValue(2000)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('prompt')
                .setDescription('Set the system prompt for the AI')
                .addStringOption(option =>
                    option
                        .setName('text')
                        .setDescription('The system prompt to use')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('conversation')
                .setDescription('Manage conversation history')
                .addStringOption(option =>
                    option
                        .setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Clear My History', value: 'clear' },
                            { name: 'Show My History', value: 'show' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Test the current API configuration')
        ),

    async execute(interaction) {
        // Check permissions first - Only server owners can configure chatbot
        const permissionCheck = Utils.checkChatbotPermissions(interaction);
        if (!permissionCheck.hasPermission) {
            return interaction.reply({
                content: permissionCheck.reason,
                ephemeral: true
            });
        }

        try {
            const subcommand = interaction.options.getSubcommand();
            const guildId = interaction.guild.id;
            const guildName = interaction.guild.name;

            switch (subcommand) {
                case 'status':
                    await this.handleStatus(interaction, guildId, guildName);
                    break;
                case 'toggle':
                    await this.handleToggle(interaction, guildId, guildName);
                    break;
                case 'api':
                    await this.handleApi(interaction, guildId, guildName);
                    break;
                case 'behavior':
                    await this.handleBehavior(interaction, guildId, guildName);
                    break;
                case 'channels':
                    await this.handleChannels(interaction, guildId, guildName);
                    break;
                case 'advanced':
                    await this.handleAdvanced(interaction, guildId, guildName);
                    break;
                case 'prompt':
                    await this.handlePrompt(interaction, guildId, guildName);
                    break;
                case 'conversation':
                    await this.handleConversation(interaction, guildId, guildName);
                    break;
                case 'test':
                    await this.handleTest(interaction, guildId, guildName);
                    break;
                default:
                    await interaction.reply({
                        embeds: [Utils.createErrorEmbed('Error', 'Unknown subcommand')],
                        ephemeral: true
                    });
            }

        } catch (error) {
            console.error('Chatbot command error:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Error', 'An error occurred while processing the command')],
                    ephemeral: true
                });
            }
        }
    },

    async handleStatus(interaction, guildId, guildName) {
        // Get fresh guild settings
        let guildSettings = await Guild.findByGuildId(guildId);
        if (!guildSettings) {
            guildSettings = await Guild.createDefault(guildId, guildName);
        }

        const chatbot = guildSettings.chatbot;
        
        const embed = Utils.createEmbed({
            title: '🤖 Chatbot Configuration',
            color: chatbot.enabled ? 0x57F287 : 0x747F8D
        });

        // Basic settings
        embed.addFields(
            {
                name: '⚙️ Basic Settings',
                value: [
                    `**Status:** ${chatbot.enabled ? '✅ Enabled' : '❌ Disabled'}`,
                    `**API URL:** ${chatbot.apiUrl || 'Not set'}`,
                    `**Model:** ${chatbot.model}`,
                    `**API Key:** ${chatbot.apiKey ? '✅ Set' : '❌ Not set'}`
                ].join('\n'),
                inline: true
            },
            {
                name: '🎯 Behavior',
                value: [
                    `**Response Chance:** ${chatbot.responseChance}%`,
                    `**Require Mention:** ${chatbot.requireMention ? 'Yes' : 'No'}`,
                    `**Cooldown:** ${chatbot.cooldown / 1000}s`,
                    `**Ignore Bots:** ${chatbot.ignoreBots ? 'Yes' : 'No'}`
                ].join('\n'),
                inline: true
            }
        );

        // Channel settings
        let channelInfo = '';
        switch (chatbot.channelMode) {
            case 'all':
                channelInfo = 'All channels allowed';
                break;
            case 'whitelist':
                channelInfo = `Whitelist mode (${chatbot.whitelistedChannels.length} channels)`;
                break;
            case 'blacklist':
                channelInfo = `Blacklist mode (${chatbot.blacklistedChannels.length} channels excluded)`;
                break;
        }

        embed.addFields({
            name: '📋 Channel Settings',
            value: channelInfo,
            inline: false
        });

        // Advanced settings
        embed.addFields({
            name: '🔧 Advanced Settings',
            value: [
                `**Max Tokens:** ${chatbot.maxTokens}`,
                `**Temperature:** ${chatbot.temperature}`,
                `**Max Message Length:** ${chatbot.maxMessageLength}`,
                `**Conversation Memory:** ${chatbot.conversationEnabled ? 'Enabled' : 'Disabled'} (30min timeout)`
            ].join('\n'),
            inline: false
        });

        // System prompt (truncated)
        const promptPreview = chatbot.systemPrompt.length > 100 
            ? chatbot.systemPrompt.substring(0, 100) + '...'
            : chatbot.systemPrompt;
        
        embed.addFields({
            name: '💬 System Prompt',
            value: `\`\`\`${promptPreview}\`\`\``,
            inline: false
        });

        await interaction.reply({ embeds: [embed] });
    },

    async handleToggle(interaction, guildId, guildName) {
        // Get fresh guild settings
        let guildSettings = await Guild.findByGuildId(guildId);
        if (!guildSettings) {
            guildSettings = await Guild.createDefault(guildId, guildName);
        }

        const enabled = interaction.options.getBoolean('enabled');
        
        guildSettings.chatbot.enabled = enabled;
        await guildSettings.save();

        const embed = Utils.createSuccessEmbed(
            'Chatbot Updated',
            `Chatbot has been **${enabled ? 'enabled' : 'disabled'}**`
        );

        await interaction.reply({ embeds: [embed] });
    },

    async handleApi(interaction, guildId, guildName) {
        // Get fresh guild settings
        let guildSettings = await Guild.findByGuildId(guildId);
        if (!guildSettings) {
            guildSettings = await Guild.createDefault(guildId, guildName);
        }

        const url = interaction.options.getString('url');
        const key = interaction.options.getString('key');
        const model = interaction.options.getString('model');

        let changes = [];

        if (url !== null) {
            // Validate URL format
            try {
                new URL(url);
                guildSettings.chatbot.apiUrl = url.endsWith('/') ? url.slice(0, -1) : url;
                changes.push(`**API URL:** ${guildSettings.chatbot.apiUrl}`);
            } catch (error) {
                return await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Invalid URL', 'Please provide a valid URL')],
                    ephemeral: true
                });
            }
        }

        if (key !== null) {
            guildSettings.chatbot.apiKey = key;
            changes.push(`**API Key:** ${key ? 'Updated' : 'Removed'}`);
        }

        if (model !== null) {
            guildSettings.chatbot.model = model;
            changes.push(`**Model:** ${model}`);
        }

        if (changes.length === 0) {
            return await interaction.reply({
                embeds: [Utils.createErrorEmbed('No Changes', 'Please specify at least one setting to update')],
                ephemeral: true
            });
        }

        await guildSettings.save();

        const embed = Utils.createSuccessEmbed(
            'API Settings Updated',
            changes.join('\n')
        );

        await interaction.reply({ embeds: [embed] });
    },

    async handleBehavior(interaction, guildId, guildName) {
        // Get fresh guild settings
        let guildSettings = await Guild.findByGuildId(guildId);
        if (!guildSettings) {
            guildSettings = await Guild.createDefault(guildId, guildName);
        }

        const chance = interaction.options.getInteger('chance');
        const requireMention = interaction.options.getBoolean('require-mention');
        const cooldown = interaction.options.getInteger('cooldown');

        let changes = [];

        if (chance !== null) {
            guildSettings.chatbot.responseChance = chance;
            changes.push(`**Response Chance:** ${chance}%`);
        }

        if (requireMention !== null) {
            guildSettings.chatbot.requireMention = requireMention;
            changes.push(`**Require Mention:** ${requireMention ? 'Yes' : 'No'}`);
        }

        if (cooldown !== null) {
            guildSettings.chatbot.cooldown = cooldown * 1000;
            changes.push(`**Cooldown:** ${cooldown}s`);
        }

        if (changes.length === 0) {
            return await interaction.reply({
                embeds: [Utils.createErrorEmbed('No Changes', 'Please specify at least one setting to update')],
                ephemeral: true
            });
        }

        await guildSettings.save();

        const embed = Utils.createSuccessEmbed(
            'Behavior Settings Updated',
            changes.join('\n')
        );

        await interaction.reply({ embeds: [embed] });
    },

    async handleChannels(interaction, guildId, guildName) {
        // Get fresh guild settings
        let guildSettings = await Guild.findByGuildId(guildId);
        if (!guildSettings) {
            guildSettings = await Guild.createDefault(guildId, guildName);
        }

        const mode = interaction.options.getString('mode');
        const channel = interaction.options.getChannel('channel');
        const action = interaction.options.getString('action');

        // Update mode
        guildSettings.chatbot.channelMode = mode;

        let message = `**Channel Mode:** ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;

        // Handle channel actions
        if (channel && action) {
            const channelId = channel.id;
            
            if (mode === 'whitelist') {
                switch (action) {
                    case 'add':
                        if (!guildSettings.chatbot.whitelistedChannels.includes(channelId)) {
                            guildSettings.chatbot.whitelistedChannels.push(channelId);
                            message += `\n**Added:** ${channel.name} to whitelist`;
                        } else {
                            message += `\n**Notice:** ${channel.name} already in whitelist`;
                        }
                        break;
                    case 'remove':
                        const whiteIndex = guildSettings.chatbot.whitelistedChannels.indexOf(channelId);
                        if (whiteIndex > -1) {
                            guildSettings.chatbot.whitelistedChannels.splice(whiteIndex, 1);
                            message += `\n**Removed:** ${channel.name} from whitelist`;
                        } else {
                            message += `\n**Notice:** ${channel.name} not in whitelist`;
                        }
                        break;
                    case 'clear':
                        guildSettings.chatbot.whitelistedChannels = [];
                        message += '\n**Cleared:** All whitelisted channels';
                        break;
                }
            } else if (mode === 'blacklist') {
                switch (action) {
                    case 'add':
                        if (!guildSettings.chatbot.blacklistedChannels.includes(channelId)) {
                            guildSettings.chatbot.blacklistedChannels.push(channelId);
                            message += `\n**Added:** ${channel.name} to blacklist`;
                        } else {
                            message += `\n**Notice:** ${channel.name} already in blacklist`;
                        }
                        break;
                    case 'remove':
                        const blackIndex = guildSettings.chatbot.blacklistedChannels.indexOf(channelId);
                        if (blackIndex > -1) {
                            guildSettings.chatbot.blacklistedChannels.splice(blackIndex, 1);
                            message += `\n**Removed:** ${channel.name} from blacklist`;
                        } else {
                            message += `\n**Notice:** ${channel.name} not in blacklist`;
                        }
                        break;
                    case 'clear':
                        guildSettings.chatbot.blacklistedChannels = [];
                        message += '\n**Cleared:** All blacklisted channels';
                        break;
                }
            }
        } else if (action === 'clear') {
            // Clear all lists regardless of mode
            guildSettings.chatbot.whitelistedChannels = [];
            guildSettings.chatbot.blacklistedChannels = [];
            message += '\n**Cleared:** All channel lists';
        }

        await guildSettings.save();

        const embed = Utils.createSuccessEmbed(
            'Channel Settings Updated',
            message
        );

        await interaction.reply({ embeds: [embed] });
    },

    async handleAdvanced(interaction, guildId, guildName) {
        // Get fresh guild settings
        let guildSettings = await Guild.findByGuildId(guildId);
        if (!guildSettings) {
            guildSettings = await Guild.createDefault(guildId, guildName);
        }

        const maxTokens = interaction.options.getInteger('max-tokens');
        const temperature = interaction.options.getNumber('temperature');
        const maxLength = interaction.options.getInteger('max-length');

        let changes = [];

        if (maxTokens !== null) {
            guildSettings.chatbot.maxTokens = maxTokens;
            changes.push(`**Max Tokens:** ${maxTokens}`);
        }

        if (temperature !== null) {
            guildSettings.chatbot.temperature = temperature;
            changes.push(`**Temperature:** ${temperature}`);
        }

        if (maxLength !== null) {
            guildSettings.chatbot.maxMessageLength = maxLength;
            changes.push(`**Max Message Length:** ${maxLength}`);
        }

        if (changes.length === 0) {
            return await interaction.reply({
                embeds: [Utils.createErrorEmbed('No Changes', 'Please specify at least one setting to update')],
                ephemeral: true
            });
        }

        await guildSettings.save();

        const embed = Utils.createSuccessEmbed(
            'Advanced Settings Updated',
            changes.join('\n')
        );

        await interaction.reply({ embeds: [embed] });
    },

    async handlePrompt(interaction, guildId, guildName) {
        // Get fresh guild settings
        let guildSettings = await Guild.findByGuildId(guildId);
        if (!guildSettings) {
            guildSettings = await Guild.createDefault(guildId, guildName);
        }

        const prompt = interaction.options.getString('text');

        if (prompt.length > 1000) {
            return await interaction.reply({
                embeds: [Utils.createErrorEmbed('Prompt Too Long', 'System prompt must be 1000 characters or less')],
                ephemeral: true
            });
        }

        guildSettings.chatbot.systemPrompt = prompt;
        await guildSettings.save();

        const embed = Utils.createSuccessEmbed(
            'System Prompt Updated',
            `System prompt has been updated:\n\`\`\`${prompt.substring(0, 500)}${prompt.length > 500 ? '...' : ''}\`\`\``
        );

        await interaction.reply({ embeds: [embed] });
    },

    async handleTest(interaction, guildId, guildName) {
        // Get fresh guild settings
        let guildSettings = await Guild.findByGuildId(guildId);
        if (!guildSettings) {
            guildSettings = await Guild.createDefault(guildId, guildName);
        }

        const { apiUrl, apiKey, model } = guildSettings.chatbot;

        if (!apiKey) {
            return await interaction.reply({
                embeds: [Utils.createErrorEmbed('API Key Missing', 'Please set an API key first using `/chatbot api`')],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const result = await ChatBot.testConnection(apiUrl, apiKey, model);

        if (result.success) {
            const embed = Utils.createSuccessEmbed(
                'API Test Successful',
                `✅ Connection test passed!\n\n**Response:** ${result.response}`
            );
            await interaction.editReply({ embeds: [embed] });
        } else {
            const embed = Utils.createErrorEmbed(
                'API Test Failed',
                `❌ Connection test failed!\n\n**Error:** ${result.error}`
            );
            await interaction.editReply({ embeds: [embed] });
        }
    },

    async handleConversation(interaction, guildId, guildName) {
        const action = interaction.options.getString('action');
        const userId = interaction.user.id;

        if (action === 'clear') {
            ChatBot.clearConversationHistory(userId, guildId);
            
            const embed = Utils.createSuccessEmbed(
                'Conversation Cleared',
                'Your conversation history has been cleared. The bot will start fresh in your next conversation.'
            );
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
            
        } else if (action === 'show') {
            const history = ChatBot.getConversationHistory(userId, guildId);
            
            if (history.length === 0) {
                const embed = Utils.createEmbed({
                    title: '💬 Conversation History',
                    description: 'No conversation history found. Start chatting with the bot to build conversation context!',
                    color: 0x5865F2
                });
                
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            // Build conversation history display
            let historyText = '';
            const maxLength = 1800; // Leave room for embed formatting
            
            for (let i = 0; i < history.length; i++) {
                const msg = history[i];
                const role = msg.role === 'user' ? '👤' : '🤖';
                const timeAgo = Math.floor((Date.now() - msg.timestamp) / 60000); // minutes ago
                const entry = `${role} **${timeAgo}m ago:** ${msg.content}\n\n`;
                
                if (historyText.length + entry.length > maxLength) {
                    historyText += `... (${history.length - i} more messages)`;
                    break;
                }
                
                historyText += entry;
            }

            const embed = Utils.createEmbed({
                title: '💬 Your Conversation History',
                description: historyText || 'No conversation history to display.',
                color: 0x5865F2,
                footer: {
                    text: `Conversations expire after 30 minutes of inactivity • ${history.length} messages stored`
                }
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
