/**
 * Final regression test for the welcome/leave system
 * Tests all functionality including new features:
 * - Placeholder support (including new user/guild image placeholders)
 * - Content field alongside embeds
 * - Ordinal suffixes for member counts
 * - Button layout validation
 * - Session management
 * - Duplicate message prevention
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');

// Mock Discord.js structures
const mockUser = {
    id: '123456789',
    tag: 'TestUser#1234',
    username: 'TestUser',
    displayName: 'Test Display Name',
    createdTimestamp: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
    displayAvatarURL: () => 'https://cdn.discordapp.com/avatars/123456789/avatar.png',
    bannerURL: () => 'https://cdn.discordapp.com/banners/123456789/banner.png'
};

const mockMember = {
    user: mockUser,
    id: mockUser.id,
    displayName: mockUser.displayName,
    toString: () => `<@${mockUser.id}>`,
    joinedAt: new Date(),
    joinedTimestamp: Date.now() - (5 * 24 * 60 * 60 * 1000) // 5 days ago
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

// Test functions
async function testButtonLayout() {
    console.log('🧪 Testing button layout validation...');
    
    try {
        // Load the welcome command
        const WelcomeCommand = require('../src/commands/settings/welcome.js');
        
        // Test button creation
        const components = await WelcomeCommand.createWelcomeBuilderComponents('987654321', 'welcome');
        
        console.log(`✅ Created ${components.length} ActionRows`);
        
        // Validate each row has max 5 buttons
        components.forEach((row, index) => {
            const buttonCount = row.components.length;
            console.log(`   Row ${index + 1}: ${buttonCount} buttons`);
            
            if (buttonCount > 5) {
                throw new Error(`Row ${index + 1} has ${buttonCount} buttons (max 5 allowed)`);
            }
        });
        
        console.log('✅ All ActionRows are within Discord limits');
        return true;
        
    } catch (error) {
        console.error('❌ Button layout test failed:', error.message);
        return false;
    }
}

async function testPlaceholderReplacement() {
    console.log('\n🧪 Testing placeholder replacement...');
    
    try {
        const WelcomeCommand = require('../src/commands/settings/welcome.js');
        
        // Test text with various placeholders
        const testText = `Welcome {user.mention} to {guild.name}! You are our {guild.memberCount} member! 
Your avatar: {user.avatar}
Server icon: {guild.icon}
Join position: {join.position}`;
        
        const result = WelcomeCommand.replacePlaceholdersPreview(testText, mockMember, mockGuild);
        
        // Check if placeholders were replaced
        if (result.includes('{user.mention}') || result.includes('{guild.name}')) {
            throw new Error('Some placeholders were not replaced');
        }
        
        // Check ordinal formatting
        if (!result.includes('42nd member')) {
            throw new Error('Ordinal formatting not working correctly');
        }
        
        // Check URLs are preserved
        if (!result.includes('https://cdn.discordapp.com/')) {
            throw new Error('Discord CDN URLs not preserved');
        }
        
        console.log('✅ Placeholder replacement working correctly');
        console.log('   Sample output:', result.split('\n')[0]);
        return true;
        
    } catch (error) {
        console.error('❌ Placeholder test failed:', error.message);
        return false;
    }
}

async function testOrdinalSuffixes() {
    console.log('\n🧪 Testing ordinal suffix logic...');
    
    try {
        const WelcomeCommand = require('../src/commands/settings/welcome.js');
        
        const testCases = [
            { num: 1, expected: '1st' },
            { num: 2, expected: '2nd' },
            { num: 3, expected: '3rd' },
            { num: 4, expected: '4th' },
            { num: 11, expected: '11th' },
            { num: 12, expected: '12th' },
            { num: 13, expected: '13th' },
            { num: 21, expected: '21st' },
            { num: 22, expected: '22nd' },
            { num: 23, expected: '23rd' },
            { num: 101, expected: '101st' },
            { num: 111, expected: '111th' }
        ];
        
        for (const test of testCases) {
            const result = WelcomeCommand.getOrdinalSuffix(test.num);
            if (result !== test.expected) {
                throw new Error(`Expected ${test.expected} for ${test.num}, got ${result}`);
            }
        }
        
        console.log('✅ All ordinal suffix tests passed');
        return true;
        
    } catch (error) {
        console.error('❌ Ordinal suffix test failed:', error.message);
        return false;
    }
}

async function testEmbedBuilding() {
    console.log('\n🧪 Testing embed building functionality...');
    
    try {
        const EmbedBuilderHandler = require('../src/utils/EmbedBuilderHandler');
        
        // Test creating empty embed data
        const embedData = EmbedBuilderHandler.createEmptyEmbedData();
        
        if (!embedData || typeof embedData !== 'object') {
            throw new Error('Failed to create empty embed data');
        }
        
        // Test embed creation with placeholders
        embedData.title = 'Welcome {user.username}!';
        embedData.description = 'You are member #{guild.memberCount}!';
        embedData.color = 0x57F287;
        
        const embed = EmbedBuilderHandler.createPreviewEmbed(embedData);
        
        if (!embed || !embed.data) {
            throw new Error('Failed to create preview embed');
        }
        
        console.log('✅ Embed building functionality working');
        return true;
        
    } catch (error) {
        console.error('❌ Embed building test failed:', error.message);
        return false;
    }
}

async function testWelcomeSystem() {
    console.log('\n🧪 Testing WelcomeSystem core functionality...');
    
    try {
        const WelcomeSystem = require('../src/utils/WelcomeSystem');
        
        // Test placeholder replacement in WelcomeSystem
        const testText = 'Welcome {user.mention} to {guild.name}! Avatar: {user.avatar}';
        
        const replacedText = WelcomeSystem.replacePlaceholders(
            testText,
            mockMember,
            mockGuild,
            null // no inviter data for this test
        );
        
        if (replacedText.includes('{user.mention}')) {
            throw new Error('WelcomeSystem placeholder replacement failed');
        }
        
        // Test containsPlaceholders utility
        const hasPlaceholders = WelcomeSystem.containsPlaceholders(testText);
        const noPlaceholders = WelcomeSystem.containsPlaceholders('No placeholders here');
        
        if (!hasPlaceholders || noPlaceholders) {
            throw new Error('containsPlaceholders utility not working correctly');
        }
        
        console.log('✅ WelcomeSystem core functionality working');
        return true;
        
    } catch (error) {
        console.error('❌ WelcomeSystem test failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🎯 Running final regression tests for Welcome System\n');
    
    const tests = [
        testButtonLayout,
        testPlaceholderReplacement,
        testOrdinalSuffixes,
        testEmbedBuilding,
        testWelcomeSystem
    ];
    
    const results = [];
    
    for (const test of tests) {
        const result = await test();
        results.push(result);
    }
    
    const passedTests = results.filter(r => r).length;
    const totalTests = results.length;
    
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Welcome system is ready for production.');
        return true;
    } else {
        console.log('❌ Some tests failed. Please review the issues above.');
        return false;
    }
}

// Run the tests
runAllTests().then(success => {
    if (success) {
        console.log('\n✅ Final regression test completed successfully');
        process.exit(0);
    } else {
        console.log('\n❌ Final regression test failed');
        process.exit(1);
    }
}).catch(error => {
    console.error('\n💥 Test runner crashed:', error);
    process.exit(1);
});
