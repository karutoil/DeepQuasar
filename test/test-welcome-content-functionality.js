/**
 * Test script to verify content field functionality in the welcome custom embed builder
 * Tests:
 * - Content field preview in embed builder
 * - Content field in test embed output
 * - Content field persistence in saved embeds
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');

// Mock Discord.js structures
const mockUser = {
    id: '123456789',
    tag: 'TestUser#1234',
    username: 'TestUser',
    displayName: 'Test Display Name',
    createdTimestamp: Date.now() - (30 * 24 * 60 * 60 * 1000),
    displayAvatarURL: () => 'https://cdn.discordapp.com/avatars/123456789/avatar.png',
    bannerURL: () => 'https://cdn.discordapp.com/banners/123456789/banner.png'
};

const mockMember = {
    user: mockUser,
    id: mockUser.id,
    displayName: mockUser.displayName,
    toString: () => `<@${mockUser.id}>`,
    joinedAt: new Date(),
    joinedTimestamp: Date.now() - (5 * 24 * 60 * 60 * 1000)
};

const mockGuild = {
    id: '987654321',
    name: 'Test Server',
    memberCount: 42,
    description: 'A test server',
    premiumTier: 2,
    premiumSubscriptionCount: 8,
    iconURL: () => 'https://cdn.discordapp.com/icons/987654321/icon.png',
    bannerURL: () => 'https://cdn.discordapp.com/banners/987654321/banner.png'
};

async function testContentPreviewInBuilder() {
    console.log('🧪 Testing content preview in embed builder...');
    
    try {
        const EmbedBuilderHandler = require('../src/utils/EmbedBuilderHandler');
        const WelcomeEmbedHandler = require('../src/utils/WelcomeEmbedHandler');
        const WelcomeCommand = require('../src/commands/settings/welcome');
        
        // Create a session with content
        const session = EmbedBuilderHandler.getSession('testuser123');
        session.welcomeContext = {
            type: 'welcome',
            isWelcomeBuilder: true
        };
        session.embedData = EmbedBuilderHandler.createEmptyEmbedData();
        session.messageContent = 'Welcome {user.mention} to our amazing server! 🎉';
        
        // Mock interaction for updateWelcomeDisplay
        const mockInteraction = {
            member: mockMember,
            guild: mockGuild
        };
        
        // Mock message reference
        let capturedMessageData = null;
        session.messageRef = {
            edit: async (data) => {
                capturedMessageData = data;
                return { id: 'mockMessage' };
            }
        };
        
        // Test updateWelcomeDisplay
        await WelcomeEmbedHandler.updateWelcomeDisplay(mockInteraction, session);
        
        // Verify content preview was included
        if (!capturedMessageData) {
            throw new Error('No message data captured');
        }
        
        if (!capturedMessageData.content) {
            throw new Error('Content preview not included in message data');
        }
        
        if (!capturedMessageData.content.includes('Welcome <@123456789> to our amazing server!')) {
            throw new Error('Content preview does not contain expected processed content');
        }
        
        console.log('✅ Content preview working in embed builder');
        console.log('   Preview content:', capturedMessageData.content);
        return true;
        
    } catch (error) {
        console.error('❌ Content preview test failed:', error.message);
        return false;
    }
}

async function testContentInTestEmbed() {
    console.log('\n🧪 Testing content in test embed output...');
    
    try {
        const EmbedBuilderHandler = require('../src/utils/EmbedBuilderHandler');
        const WelcomeEmbedHandler = require('../src/utils/WelcomeEmbedHandler');
        
        // Create a session with content
        const session = EmbedBuilderHandler.getSession('testuser456');
        session.welcomeContext = {
            type: 'welcome',
            isWelcomeBuilder: true
        };
        session.embedData = EmbedBuilderHandler.createEmptyEmbedData();
        session.messageContent = 'Hey {user.mention}! Welcome to {guild.name}! 🚀';
        
        // Mock interaction for test embed
        let capturedReplyData = null;
        const mockInteraction = {
            member: mockMember,
            guild: mockGuild,
            reply: async (data) => {
                capturedReplyData = data;
                return { id: 'mockReply' };
            }
        };
        
        // Test testWelcomeEmbed
        await WelcomeEmbedHandler.testWelcomeEmbed(mockInteraction, session);
        
        // Verify content was included in test output
        if (!capturedReplyData) {
            throw new Error('No reply data captured');
        }
        
        if (!capturedReplyData.content) {
            throw new Error('Content not included in test embed reply');
        }
        
        if (!capturedReplyData.content.includes('Hey <@123456789>! Welcome to Test Server!')) {
            throw new Error('Test embed content does not contain expected processed content');
        }
        
        console.log('✅ Content working in test embed output');
        console.log('   Test content:', capturedReplyData.content);
        return true;
        
    } catch (error) {
        console.error('❌ Test embed content test failed:', error.message);
        return false;
    }
}

async function testContentWithoutMessage() {
    console.log('\n🧪 Testing embed builder without content...');
    
    try {
        const EmbedBuilderHandler = require('../src/utils/EmbedBuilderHandler');
        const WelcomeEmbedHandler = require('../src/utils/WelcomeEmbedHandler');
        
        // Create a session without content
        const session = EmbedBuilderHandler.getSession('testuser789');
        session.welcomeContext = {
            type: 'welcome',
            isWelcomeBuilder: true
        };
        session.embedData = EmbedBuilderHandler.createEmptyEmbedData();
        session.messageContent = ''; // Empty content
        
        // Mock interaction for updateWelcomeDisplay
        const mockInteraction = {
            member: mockMember,
            guild: mockGuild
        };
        
        // Mock message reference
        let capturedMessageData = null;
        session.messageRef = {
            edit: async (data) => {
                capturedMessageData = data;
                return { id: 'mockMessage' };
            }
        };
        
        // Test updateWelcomeDisplay
        await WelcomeEmbedHandler.updateWelcomeDisplay(mockInteraction, session);
        
        // Verify no content preview when content is empty
        if (!capturedMessageData) {
            throw new Error('No message data captured');
        }
        
        if (capturedMessageData.content !== undefined) {
            throw new Error('Content should be undefined when no content is set');
        }
        
        console.log('✅ No content preview when content is empty');
        return true;
        
    } catch (error) {
        console.error('❌ Empty content test failed:', error.message);
        return false;
    }
}

async function testContentPersistence() {
    console.log('\n🧪 Testing content field persistence in saved embeds...');
    
    try {
        const EmbedBuilderHandler = require('../src/utils/EmbedBuilderHandler');
        
        // Create embed data with content
        const embedData = EmbedBuilderHandler.createEmptyEmbedData();
        embedData.title = 'Welcome!';
        embedData.messageContent = 'Welcome {user.mention}! You are awesome!';
        
        // Test cleanEmbedData preserves messageContent
        const cleanedData = EmbedBuilderHandler.cleanEmbedData(embedData);
        
        if (cleanedData.messageContent !== embedData.messageContent) {
            throw new Error('messageContent not preserved in cleanEmbedData');
        }
        
        console.log('✅ Content field persistence working');
        console.log('   Preserved content:', cleanedData.messageContent);
        return true;
        
    } catch (error) {
        console.error('❌ Content persistence test failed:', error.message);
        return false;
    }
}

async function runContentTests() {
    console.log('🎯 Running content functionality tests for Welcome System\n');
    
    const tests = [
        testContentPreviewInBuilder,
        testContentInTestEmbed,
        testContentWithoutMessage,
        testContentPersistence
    ];
    
    const results = [];
    
    for (const test of tests) {
        const result = await test();
        results.push(result);
    }
    
    const passedTests = results.filter(r => r).length;
    const totalTests = results.length;
    
    console.log(`\n📊 Content Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All content functionality tests passed!');
        return true;
    } else {
        console.log('❌ Some content tests failed. Please review the issues above.');
        return false;
    }
}

// Run the tests
runContentTests().then(success => {
    if (success) {
        console.log('\n✅ Content functionality test completed successfully');
        process.exit(0);
    } else {
        console.log('\n❌ Content functionality test failed');
        process.exit(1);
    }
}).catch(error => {
    console.error('\n💥 Content test runner crashed:', error);
    process.exit(1);
});
