#!/usr/bin/env node

/**
 * Test script for the AI Chatbot module
 * This script tests various components of the chatbot system
 */

const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// Import necessary modules
const Guild = require('./src/schemas/Guild');
const ChatBot = require('./src/utils/ChatBot');

async function testChatbotModule() {
    console.log('🤖 Testing AI Chatbot Module...\n');

    try {
        // Connect to database
        console.log('1. Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/discord-music-bot');
        console.log('✅ Database connected\n');

        // Test 1: Guild Schema Extension
        console.log('2. Testing Guild Schema Extension...');
        const testGuild = new Guild({
            guildId: 'test-guild-123',
            guildName: 'Test Guild'
        });

        // Check if chatbot fields exist
        const chatbotFields = [
            'enabled', 'apiUrl', 'apiKey', 'model', 'maxTokens', 'temperature',
            'systemPrompt', 'responseChance', 'channelMode', 'whitelistedChannels',
            'blacklistedChannels', 'ignoreBots', 'requireMention', 'cooldown', 'maxMessageLength'
        ];

        console.log('Checking chatbot schema fields...');
        for (const field of chatbotFields) {
            if (testGuild.chatbot[field] !== undefined) {
                console.log(`  ✅ ${field}: ${typeof testGuild.chatbot[field]} = ${JSON.stringify(testGuild.chatbot[field])}`);
            } else {
                console.log(`  ❌ ${field}: missing`);
            }
        }
        console.log('');

        // Test 2: ChatBot Utility Functions
        console.log('3. Testing ChatBot Utility Functions...');
        
        // Test channel permission checking
        const testChannelAllowed = ChatBot.isChannelAllowed('test-channel', {
            chatbot: {
                channelMode: 'all',
                whitelistedChannels: [],
                blacklistedChannels: []
            }
        });
        console.log(`✅ Channel permission check (all mode): ${testChannelAllowed}`);

        const testChannelWhitelist = ChatBot.isChannelAllowed('test-channel', {
            chatbot: {
                channelMode: 'whitelist',
                whitelistedChannels: ['test-channel'],
                blacklistedChannels: []
            }
        });
        console.log(`✅ Channel permission check (whitelist mode): ${testChannelWhitelist}`);

        const testChannelBlacklist = ChatBot.isChannelAllowed('test-channel', {
            chatbot: {
                channelMode: 'blacklist',
                whitelistedChannels: [],
                blacklistedChannels: ['test-channel']
            }
        });
        console.log(`✅ Channel permission check (blacklist mode): ${testChannelBlacklist}`);

        // Test cooldown cleanup
        console.log('✅ Cooldown cleanup function exists');
        ChatBot.cleanupCooldowns();
        console.log('');

        // Test 3: API Connection Test (if credentials provided)
        console.log('4. Testing API Connection...');
        if (process.env.OPENAI_API_KEY || process.env.TEST_API_KEY) {
            const apiKey = process.env.OPENAI_API_KEY || process.env.TEST_API_KEY;
            const apiUrl = process.env.TEST_API_URL || 'https://api.openai.com/v1';
            const model = process.env.TEST_MODEL || 'gpt-3.5-turbo';

            console.log(`Testing with: ${apiUrl} using model: ${model}`);
            const connectionTest = await ChatBot.testConnection(apiUrl, apiKey, model);
            
            if (connectionTest.success) {
                console.log(`✅ API connection successful: ${connectionTest.response}`);
            } else {
                console.log(`❌ API connection failed: ${connectionTest.error}`);
            }
        } else {
            console.log('⏭️  Skipping API test (no credentials provided)');
            console.log('   Set OPENAI_API_KEY or TEST_API_KEY environment variable to test API connection');
        }
        console.log('');

        // Test 4: Mock Message Processing
        console.log('5. Testing Message Processing Logic...');
        
        // Create a mock guild with chatbot enabled
        testGuild.chatbot.enabled = true;
        testGuild.chatbot.apiKey = 'mock-key';
        testGuild.chatbot.responseChance = 100; // Always respond for testing
        
        // Mock message object
        const mockMessage = {
            content: 'Hello bot!',
            author: {
                id: 'test-user-123',
                bot: false,
                username: 'TestUser'
            },
            guild: {
                id: 'test-guild-123',
                name: 'Test Guild'
            },
            channel: {
                id: 'test-channel-123',
                name: 'general'
            },
            client: {
                user: {
                    id: 'bot-user-123'
                }
            },
            mentions: {
                has: () => false
            }
        };

        const shouldRespond = await ChatBot.shouldRespond(mockMessage, testGuild);
        console.log(`✅ Should respond to test message: ${shouldRespond}`);

        // Test with bot mention
        mockMessage.mentions.has = () => true;
        const shouldRespondMentioned = await ChatBot.shouldRespond(mockMessage, testGuild);
        console.log(`✅ Should respond when mentioned: ${shouldRespondMentioned}`);
        console.log('');

        // Test 5: Command Structure Validation
        console.log('6. Validating Command Files...');
        
        const fs = require('fs');
        const commandFiles = ['chatbot.js', 'ask.js'];
        
        for (const file of commandFiles) {
            const filePath = path.join(__dirname, 'src', 'commands', 'ai', file);
            if (fs.existsSync(filePath)) {
                console.log(`✅ Command file exists: ${file}`);
                
                // Try to require the command
                try {
                    const command = require(filePath);
                    if (command.data && command.execute) {
                        console.log(`  ✅ Command structure valid: ${command.data.name}`);
                    } else {
                        console.log(`  ❌ Command structure invalid: missing data or execute`);
                    }
                } catch (error) {
                    console.log(`  ❌ Command require error: ${error.message}`);
                }
            } else {
                console.log(`❌ Command file missing: ${file}`);
            }
        }
        console.log('');

        // Test 6: Event Handler Validation
        console.log('7. Validating Event Handler...');
        const eventPath = path.join(__dirname, 'src', 'events', 'messageCreate.js');
        if (fs.existsSync(eventPath)) {
            console.log('✅ messageCreate event handler exists');
            try {
                const eventHandler = require(eventPath);
                if (eventHandler.name && eventHandler.execute) {
                    console.log('✅ Event handler structure valid');
                } else {
                    console.log('❌ Event handler structure invalid');
                }
            } catch (error) {
                console.log(`❌ Event handler require error: ${error.message}`);
            }
        } else {
            console.log('❌ messageCreate event handler missing');
        }
        console.log('');

        console.log('🎉 Chatbot Module Test Complete!\n');
        
        // Cleanup
        await mongoose.connection.close();
        console.log('✅ Database connection closed');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Configuration check
function checkConfiguration() {
    console.log('📋 Configuration Check:\n');
    
    const requiredEnvVars = ['DISCORD_TOKEN', 'MONGODB_URI'];
    const optionalEnvVars = ['OPENAI_API_KEY', 'TEST_API_KEY', 'TEST_API_URL', 'TEST_MODEL'];
    
    console.log('Required Environment Variables:');
    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar];
        console.log(`  ${envVar}: ${value ? '✅ Set' : '❌ Missing'}`);
    }
    
    console.log('\nOptional Environment Variables (for API testing):');
    for (const envVar of optionalEnvVars) {
        const value = process.env[envVar];
        console.log(`  ${envVar}: ${value ? '✅ Set' : '⏭️  Not set'}`);
    }
    console.log('');
}

// Main execution
async function main() {
    console.log('🧪 AI Chatbot Module Test Suite\n');
    
    checkConfiguration();
    await testChatbotModule();
}

// Handle script execution
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testChatbotModule, checkConfiguration };
