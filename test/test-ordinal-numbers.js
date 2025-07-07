#!/usr/bin/env node

/**
 * Test ordinal number formatting for welcome system placeholders
 */

const WelcomeSystem = require('../src/utils/WelcomeSystem');

console.log('🧪 Testing Ordinal Number Formatting...\n');

// Test various numbers to ensure ordinal suffixes are correct
const testNumbers = [
    1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25,
    31, 32, 33, 34, 101, 102, 103, 104, 111, 112, 113, 121, 122, 123, 1001, 1002, 1003, 1011, 1012, 1013
];

testNumbers.forEach(num => {
    const ordinal = WelcomeSystem.getOrdinalSuffix(num);
    console.log(`${num} -> ${ordinal}`);
});

console.log('\n🧪 Testing Placeholder Replacement with Ordinal Numbers...\n');

// Mock member and guild objects for testing
const mockMember = {
    user: {
        tag: 'TestUser#1234',
        username: 'TestUser',
        displayName: 'Test User',
        id: '123456789',
        displayAvatarURL: () => 'https://cdn.discordapp.com/avatars/123456789/avatar.png',
        bannerURL: () => null,
        createdTimestamp: Date.now() - (365 * 24 * 60 * 60 * 1000) // 1 year ago
    },
    displayName: 'Test User',
    toString: () => '<@123456789>',
    joinedAt: new Date(),
    joinedTimestamp: Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days ago
};

const mockGuild = {
    name: 'Test Server',
    memberCount: 1337, // Should become "1337th"
    id: '987654321',
    iconURL: () => 'https://cdn.discordapp.com/icons/987654321/icon.png',
    bannerURL: () => null,
    description: 'A test server',
    premiumTier: 2,
    premiumSubscriptionCount: 15
};

// Test basic placeholder replacement
const testMessage = 'Welcome {user.mention} to {guild.name}! You are our {guild.memberCount} member at position {join.position}!';

const result = WelcomeSystem.replacePlaceholdersExtended(testMessage, mockMember, mockGuild);

console.log('Input message:');
console.log(testMessage);
console.log('\nReplaced message:');
console.log(result);

console.log('\n🧪 Testing Different Member Counts...\n');

const testCounts = [1, 2, 3, 11, 21, 22, 23, 101, 102, 103, 111, 121, 1001];

testCounts.forEach(count => {
    const testGuild = { ...mockGuild, memberCount: count };
    const testMsg = 'You are our {guild.memberCount} member!';
    const result = WelcomeSystem.replacePlaceholders(testMsg, mockMember, testGuild);
    console.log(`Count ${count}: "${result}"`);
});

console.log('\n✨ Test completed!');
