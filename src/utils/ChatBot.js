const axios = require('axios');
const Guild = require('../schemas/Guild');
const Utils = require('./utils');
const logger = require('./logger');

class ChatBot {
    constructor() {
        this.cooldowns = new Map();
        this.conversations = new Map(); // Store conversation history per user
        this.maxConversationLength = 10; // Keep last 10 messages per user
        this.conversationTimeout = 30 * 60 * 1000; // 30 minutes timeout
    }

    /**
     * Check if the bot should respond to a message
     */
    async shouldRespond(message, guildSettings) {
        try {
            // Don't respond to bots if configured
            if (guildSettings.chatbot.ignoreBots && message.author.bot) {
                return false;
            }

            // Don't respond to the bot itself
            if (message.author.id === message.client.user.id) {
                return false;
            }

            // Check if chatbot is enabled
            if (!guildSettings.chatbot.enabled) {
                return false;
            }

            // Check API key
            if (!guildSettings.chatbot.apiKey) {
                return false;
            }

            // Check cooldown
            const cooldownKey = `${message.guild.id}-${message.author.id}`;
            const now = Date.now();
            const cooldownEnd = this.cooldowns.get(cooldownKey);
            
            if (cooldownEnd && now < cooldownEnd) {
                return false;
            }

            // Check channel permissions
            if (!this.isChannelAllowed(message.channel.id, guildSettings)) {
                return false;
            }

            // Check if bot is mentioned
            const botMentioned = message.mentions.has(message.client.user);
            
            // If mention is required, only respond when mentioned
            if (guildSettings.chatbot.requireMention) {
                return botMentioned;
            }

            // If mentioned, always respond (ignoring chance)
            if (botMentioned) {
                return true;
            }

            // Check response chance
            const chance = Math.random() * 100;
            return chance < guildSettings.chatbot.responseChance;

        } catch (error) {
            logger.error('Error checking if chatbot should respond:', error);
            return false;
        }
    }

    /**
     * Check if a channel is allowed for chatbot responses
     */
    isChannelAllowed(channelId, guildSettings) {
        const { channelMode, whitelistedChannels, blacklistedChannels } = guildSettings.chatbot;

        switch (channelMode) {
            case 'whitelist':
                return whitelistedChannels.includes(channelId);
            case 'blacklist':
                return !blacklistedChannels.includes(channelId);
            case 'all':
            default:
                return true;
        }
    }

    /**
     * Generate AI response
     */
    async generateResponse(message, guildSettings) {
        try {
            const { apiUrl, apiKey, model, maxTokens, temperature, systemPrompt } = guildSettings.chatbot;
            const userId = message.author.id;
            const guildId = message.guild.id;

            // Clean the message content
            let content = message.content;
            
            // Remove bot mentions from the message
            content = content.replace(/<@!?\d+>/g, '').trim();
            
            if (!content) {
                content = "Hello!";
            }

            // Get conversation history
            const conversationHistory = this.getConversationHistory(userId, guildId);
            
            // Build messages array starting with system prompt
            const messages = [
                {
                    role: 'system',
                    content: systemPrompt
                }
            ];

            // Add conversation history
            conversationHistory.forEach(msg => {
                messages.push({
                    role: msg.role,
                    content: msg.content
                });
            });

            // Add current user message
            const currentMessage = `${message.author.username}: ${content}`;
            messages.push({
                role: 'user',
                content: currentMessage
            });

            // Prepare the request
            const requestData = {
                model: model,
                messages: messages,
                max_tokens: maxTokens,
                temperature: temperature,
                stream: false
            };

            // Make API request
            const response = await axios.post(`${apiUrl}/chat/completions`, requestData, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            if (response.data && response.data.choices && response.data.choices[0]) {
                const aiResponse = response.data.choices[0].message.content.trim();
                
                // Add user message to conversation history
                this.addToConversationHistory(userId, guildId, 'user', content, message.author.username);
                
                // Add AI response to conversation history
                this.addToConversationHistory(userId, guildId, 'assistant', aiResponse);
                
                // Truncate if too long
                if (aiResponse.length > guildSettings.chatbot.maxMessageLength) {
                    return aiResponse.substring(0, guildSettings.chatbot.maxMessageLength - 3) + '...';
                }
                
                return aiResponse;
            } else {
                throw new Error('Invalid API response format');
            }

        } catch (error) {
            logger.error('Error generating AI response:', error);
            
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                
                if (status === 401) {
                    return 'AI service authentication failed. Please check the API key.';
                } else if (status === 429) {
                    return 'AI service rate limit exceeded. Please try again later.';
                } else if (status === 400) {
                    return 'Invalid request to AI service. Please check the configuration.';
                } else {
                    return `AI service error (${status}). Please try again later.`;
                }
            } else if (error.code === 'ECONNABORTED') {
                return 'AI service request timed out. Please try again later.';
            } else {
                return 'Sorry, I encountered an error while processing your message.';
            }
        }
    }

    /**
     * Process a message and potentially respond
     */
    async processMessage(message) {
        try {
            // Get guild settings
            const guildSettings = await Guild.findByGuildId(message.guild.id);
            if (!guildSettings) {
                return;
            }

            // Check if we should respond
            if (!(await this.shouldRespond(message, guildSettings))) {
                return;
            }

            // Set cooldown
            const cooldownKey = `${message.guild.id}-${message.author.id}`;
            const cooldownEnd = Date.now() + guildSettings.chatbot.cooldown;
            this.cooldowns.set(cooldownKey, cooldownEnd);

            // Show typing indicator
            await message.channel.sendTyping();

            // Generate response
            const response = await this.generateResponse(message, guildSettings);

            if (response) {
                await message.reply(response);
                
                // Log the interaction
                logger.info(`Chatbot responded in guild ${message.guild.id} (${message.guild.name})`);
            }

        } catch (error) {
            logger.error('Error processing chatbot message:', error);
        }
    }

    /**
     * Test API connection
     */
    async testConnection(apiUrl, apiKey, model) {
        try {
            const response = await axios.post(`${apiUrl}/chat/completions`, {
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: 'Hello, this is a test message. Please respond with "Test successful".'
                    }
                ],
                max_tokens: 50,
                temperature: 0.5
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            return {
                success: true,
                response: response.data.choices[0]?.message?.content || 'Test completed'
            };

        } catch (error) {
            let errorMessage = 'Unknown error';
            
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                
                if (status === 401) {
                    errorMessage = 'Authentication failed - Invalid API key';
                } else if (status === 404) {
                    errorMessage = 'API endpoint not found - Check the API URL';
                } else if (status === 400) {
                    errorMessage = `Bad request - ${data.error?.message || 'Invalid parameters'}`;
                } else {
                    errorMessage = `HTTP ${status} - ${data.error?.message || 'Server error'}`;
                }
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Connection timeout - Check API URL and network';
            } else if (error.code === 'ENOTFOUND') {
                errorMessage = 'DNS resolution failed - Check API URL';
            } else {
                errorMessage = error.message;
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Clean up expired cooldowns and conversations periodically
     */
    cleanupCooldowns() {
        const now = Date.now();
        
        // Clean up expired cooldowns
        for (const [key, expiry] of this.cooldowns.entries()) {
            if (now >= expiry) {
                this.cooldowns.delete(key);
            }
        }
        
        // Clean up expired conversations
        for (const [key, conversation] of this.conversations.entries()) {
            if (now - conversation.lastActivity > this.conversationTimeout) {
                this.conversations.delete(key);
            }
        }
    }

    /**
     * Get conversation key for a user
     */
    getConversationKey(userId, guildId) {
        return `${guildId}-${userId}`;
    }

    /**
     * Get conversation history for a user
     */
    getConversationHistory(userId, guildId) {
        const key = this.getConversationKey(userId, guildId);
        const conversation = this.conversations.get(key);
        
        if (!conversation) {
            return [];
        }

        // Check if conversation has expired
        const now = Date.now();
        if (now - conversation.lastActivity > this.conversationTimeout) {
            this.conversations.delete(key);
            return [];
        }

        return conversation.messages || [];
    }

    /**
     * Add message to conversation history
     */
    addToConversationHistory(userId, guildId, role, content, username = null) {
        const key = this.getConversationKey(userId, guildId);
        const now = Date.now();
        
        let conversation = this.conversations.get(key);
        if (!conversation) {
            conversation = {
                messages: [],
                lastActivity: now
            };
        }

        // Add the message
        const messageEntry = {
            role: role,
            content: content,
            timestamp: now
        };
        
        if (username && role === 'user') {
            messageEntry.content = `${username}: ${content}`;
        }

        conversation.messages.push(messageEntry);
        conversation.lastActivity = now;

        // Keep only the last N messages
        if (conversation.messages.length > this.maxConversationLength) {
            conversation.messages = conversation.messages.slice(-this.maxConversationLength);
        }

        this.conversations.set(key, conversation);
    }

    /**
     * Clear conversation history for a user
     */
    clearConversationHistory(userId, guildId) {
        const key = this.getConversationKey(userId, guildId);
        this.conversations.delete(key);
    }

    /**
     * Reset conversation for a user
     */
    resetConversation(userId, guildId) {
        const key = this.getConversationKey(userId, guildId);
        const conversation = this.conversations.get(key);
        
        if (conversation) {
            // Remove last message from history
            conversation.messages.pop();
            
            // If no more messages, clear the conversation
            if (conversation.messages.length === 0) {
                this.conversations.delete(key);
            } else {
                // Update last activity time
                conversation.lastActivity = Date.now();
                this.conversations.set(key, conversation);
            }
        }
    }
}

module.exports = new ChatBot();
