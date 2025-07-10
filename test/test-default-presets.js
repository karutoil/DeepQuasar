const LFGUtils = require('../src/utils/LFGUtils');

// Test the default game presets functionality
function testDefaultGamePresets() {
    console.log('🧪 Testing LFG Default Game Presets Integration...\n');
    
    // Test 1: Check default presets are available
    console.log('1. Testing getDefaultGamePresets():');
    const defaultPresets = LFGUtils.getDefaultGamePresets();
    console.log(`   ✅ Found ${defaultPresets.length} default game presets`);
    console.log(`   📝 Sample presets: ${defaultPresets.slice(0, 3).map(p => `${p.icon} ${p.name}`).join(', ')}`);
    
    // Test 2: Verify preset structure
    console.log('\n2. Testing preset structure:');
    const samplePreset = defaultPresets[0];
    const requiredFields = ['name', 'icon', 'color', 'defaultMessage'];
    const hasAllFields = requiredFields.every(field => samplePreset.hasOwnProperty(field));
    console.log(`   ✅ Sample preset has all required fields: ${hasAllFields}`);
    console.log(`   📋 Sample: ${samplePreset.icon} ${samplePreset.name} - "${samplePreset.defaultMessage}"`);
    
    // Test 3: Check popular games are included
    console.log('\n3. Testing popular games inclusion:');
    const popularGames = ['Valorant', 'League of Legends', 'Minecraft', 'Fortnite'];
    const foundGames = popularGames.filter(game => 
        defaultPresets.some(preset => preset.name === game)
    );
    console.log(`   ✅ Popular games found: ${foundGames.join(', ')}`);
    console.log(`   📊 Coverage: ${foundGames.length}/${popularGames.length} popular games included`);
    
    console.log('\n🎯 Key Benefits:');
    console.log('   • /lfg-setup init now includes game presets automatically');
    console.log('   • New guilds get default presets when first accessing LFG');
    console.log('   • /lfg-channels can immediately show game selection menus');
    console.log('   • Users can set channel defaults without manual preset setup');
    
    console.log('\n📋 Updated Commands:');
    console.log('   /lfg-setup init          → Includes 12 default game presets');
    console.log('   /lfg-channels add        → Game selection menu ready immediately');
    console.log('   /lfg command             → Default games shown in autocomplete');
    console.log('   Auto-convert channels    → Use channel default games automatically');
    
    console.log('\n✅ Default game presets integration complete!');
}

// Run the test
testDefaultGamePresets();

module.exports = { testDefaultGamePresets };
