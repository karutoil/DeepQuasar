/**
 * Quick test to validate the new placeholder functionality
 */

// Mock Discord.js objects for testing
const mockUser = {
    id: '123456789',
    tag: 'TestUser#1234',
    username: 'TestUser',
    createdTimestamp: Date.now() - (365 * 24 * 60 * 60 * 1000), // 1 year ago
    createdAt: new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)), // 1 year ago as Date object
    displayAvatarURL: () => 'https://cdn.discordapp.com/avatars/123456789/test.png',
    bannerURL: () => 'https://cdn.discordapp.com/banners/123456789/banner.png'
};

const mockMember = {
    user: mockUser,
    displayName: 'Test Display Name',
    joinedTimestamp: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
    joinedAt: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)),
    toString: () => '<@123456789>'
};

const mockGuild = {
    id: '987654321',
    name: 'Test Server',
    memberCount: 150,
    description: 'A test server for validation',
    premiumTier: 2,
    premiumSubscriptionCount: 10,
    iconURL: () => 'https://cdn.discordapp.com/icons/987654321/icon.png',
    bannerURL: () => 'https://cdn.discordapp.com/banners/987654321/banner.png'
};

// Test string with all new placeholders
const testString = `
Welcome {user.mention} ({user.tag}) to {guild.name}!

User Info:
- Username: {user.username}
- Display Name: {user.displayName}
- ID: {user.id}
- Avatar: {user.avatar}
- Banner: {user.banner}

Server Info:
- Name: {guild.name}
- ID: {guild.id}
- Members: {guild.memberCount}
- Icon: {guild.icon}
- Banner: {guild.banner}
- Description: {guild.description}
- Boost Level: {guild.boostLevel}
- Boost Count: {guild.boostCount}

Time Info:
- Current Time: {time}
- Current Date: {date}
- Timestamp: {timestamp}
- Short Timestamp: {timestamp.short}
- Account Created: {account.created}
- Account Age: {account.age}
- Join Position: {join.position}
- Join Date: {join.date}
`;

try {
    // Load the WelcomeSystem module
    const WelcomeSystem = require('../src/utils/WelcomeSystem');
    
    console.log('🧪 Testing new placeholder functionality...\n');
    
    // Test the replacePlaceholdersExtended method
    const result = WelcomeSystem.replacePlaceholdersExtended(testString, mockMember, mockGuild);
    
    console.log('✅ Placeholder replacement successful!');
    console.log('\n📝 Result:');
    console.log('----------------------------------------');
    console.log(result);
    console.log('----------------------------------------\n');
    
    // Check that key placeholders were replaced
    const checks = [
        { placeholder: '{user.avatar}', expected: 'https://cdn.discordapp.com' },
        { placeholder: '{guild.icon}', expected: 'https://cdn.discordapp.com' },
        { placeholder: '{guild.boostLevel}', expected: '2' },
        { placeholder: '{timestamp}', expected: '<t:' },
        { placeholder: '{account.created}', expected: '<t:' }
    ];
    
    let allPassed = true;
    console.log('🔍 Checking specific placeholders:');
    
    checks.forEach(check => {
        const replaced = result.includes(check.expected);
        console.log(`${replaced ? '✅' : '❌'} ${check.placeholder}: ${replaced ? 'Replaced' : 'Not replaced'}`);
        if (!replaced) allPassed = false;
    });
    
    console.log(`\n${allPassed ? '🎉' : '⚠️'} All tests ${allPassed ? 'passed' : 'had issues'}!`);
    
} catch (error) {
    console.error('❌ Error testing placeholders:', error.message);
    process.exit(1);
}
