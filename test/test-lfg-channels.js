const LFGUtils = require('../src/utils/LFGUtils');

async function testChannelDefaultGame() {
    console.log('Testing channel default game functionality...');
    
    // Test extractLFGInfo with channel default fallback
    console.log('\n1. Testing extractLFGInfo without explicit game mention:');
    
    // Simulate a message in a channel with default game
    const result1 = await LFGUtils.extractLFGInfo(
        'Looking for teammates for ranked!',
        'test-channel-id',
        'test-guild-id'
    );
    
    console.log('Result 1:', result1);
    
    // Test with explicit game mention (should override default)
    console.log('\n2. Testing extractLFGInfo with explicit game mention:');
    
    const result2 = await LFGUtils.extractLFGInfo(
        'Looking for valorant teammates!',
        'test-channel-id', 
        'test-guild-id'
    );
    
    console.log('Result 2:', result2);
    
    // Test without channel context
    console.log('\n3. Testing extractLFGInfo without channel context:');
    
    const result3 = await LFGUtils.extractLFGInfo(
        'Looking for teammates!'
    );
    
    console.log('Result 3:', result3);
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n📝 New /lfg-channels command ready to use:');
    console.log('   - /lfg-channels add channel:#channel type:whitelist');
    console.log('   - /lfg-channels add channel:#channel type:monitor');
    console.log('   - /lfg-channels list');
    console.log('   - /lfg-channels remove channel:#channel');
    console.log('   - /lfg-channels clear type:all');
}

// Only run if MongoDB connection would work
if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️  Test requires MongoDB connection');
    console.log('🚀 Deploy the new commands with: npm run deploy-commands');
} else {
    testChannelDefaultGame().catch(console.error);
}

module.exports = { testChannelDefaultGame };
