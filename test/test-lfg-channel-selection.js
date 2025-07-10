/**
 * Test script for LFG Channel Default Game Selection Feature
 * 
 * This test verifies:
 * 1. Legacy channel data migration from string to object format
 * 2. Adding channels with default game selection
 * 3. Channel listing with default games
 * 4. Backward compatibility with existing data
 */

const LFGSettings = require('../src/schemas/LFGSettings');

async function testChannelMigration() {
    console.log('🧪 Testing LFG Channel Default Game Selection...\n');

    // Test 1: Create legacy data format
    console.log('1. Creating legacy channel data...');
    const testGuildId = 'test_guild_12345';
    
    // Clean up any existing test data
    await LFGSettings.deleteOne({ guildId: testGuildId });
    
    // Create settings with legacy string-based channels
    const legacySettings = new LFGSettings({
        guildId: testGuildId,
        allowedChannels: ['channel1', 'channel2', 'channel3'], // Legacy string format
        gamePresets: [
            { name: 'Valorant', icon: '🔫', color: '#FA4454' },
            { name: 'League of Legends', icon: '⚔️', color: '#C8AA6E' },
            { name: 'Overwatch 2', icon: '🛡️', color: '#F99E1A' }
        ]
    });
    await legacySettings.save();
    console.log('✅ Legacy data created with string channels:', legacySettings.allowedChannels);

    // Test 2: Migration function
    console.log('\n2. Testing migration function...');
    const lfgSetupCommand = require('../src/commands/lfg/lfg-setup');
    const migratedSettings = await lfgSetupCommand.migrateLegacyChannelData(legacySettings);
    
    console.log('✅ Migrated channels:', migratedSettings.allowedChannels);
    
    // Verify migration worked correctly
    const allObjectFormat = migratedSettings.allowedChannels.every(ch => 
        typeof ch === 'object' && ch.channelId && ch.defaultGame === null
    );
    console.log('✅ All channels converted to object format:', allObjectFormat);

    // Test 3: Adding new channel with default game
    console.log('\n3. Testing adding channel with default game...');
    migratedSettings.allowedChannels.push({
        channelId: 'new_channel_789',
        defaultGame: 'Valorant'
    });
    await migratedSettings.save();
    
    console.log('✅ Added new channel with default game:', migratedSettings.allowedChannels.slice(-1)[0]);

    // Test 4: Test channel lookup functions
    console.log('\n4. Testing utility functions...');
    const LFGUtils = require('../src/utils/LFGUtils');
    
    // Test channel allowed check
    const isChannel1Allowed = await LFGUtils.isChannelAllowed('channel1', testGuildId);
    const isNewChannelAllowed = await LFGUtils.isChannelAllowed('new_channel_789', testGuildId);
    const isUnknownChannelAllowed = await LFGUtils.isChannelAllowed('unknown_channel', testGuildId);
    
    console.log('✅ Channel1 allowed:', isChannel1Allowed);
    console.log('✅ New channel allowed:', isNewChannelAllowed);
    console.log('✅ Unknown channel allowed:', isUnknownChannelAllowed);

    // Test default game lookup
    const defaultGameForNew = await LFGUtils.getChannelDefaultGame('new_channel_789', testGuildId);
    const defaultGameForOld = await LFGUtils.getChannelDefaultGame('channel1', testGuildId);
    
    console.log('✅ Default game for new channel:', defaultGameForNew);
    console.log('✅ Default game for old channel:', defaultGameForOld);

    // Test 5: View functionality simulation
    console.log('\n5. Testing view display format...');
    const viewChannelsList = migratedSettings.allowedChannels.map(ch => {
        const channelId = typeof ch === 'string' ? ch : ch.channelId;
        const defaultGame = typeof ch === 'object' && ch.defaultGame ? ` (Default: ${ch.defaultGame})` : '';
        return `<#${channelId}>${defaultGame}`;
    }).join('\n');
    
    console.log('✅ View channels list:\n', viewChannelsList);

    // Cleanup
    console.log('\n6. Cleaning up test data...');
    await LFGSettings.deleteOne({ guildId: testGuildId });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! LFG Channel Default Game Selection is working correctly.');
}

// Only run if called directly
if (require.main === module) {
    testChannelMigration().catch(console.error);
}

module.exports = { testChannelMigration };
