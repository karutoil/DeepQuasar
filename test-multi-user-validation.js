// Test script to validate multi-user ban/unban functionality
const { UserSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

console.log('Testing UserSelectMenuBuilder multi-user configuration...');

// Test ban user select menu
const banUserSelectMenu = new UserSelectMenuBuilder()
    .setCustomId('tempvc_ban_user_select_123456789')
    .setPlaceholder('Search and select a user to ban...')
    .setMaxValues(10)
    .setMinValues(1);

console.log('✅ Ban user select menu created with maxValues:', banUserSelectMenu.data.max_values);

// Test unban user select menu
const unbanUserSelectMenu = new UserSelectMenuBuilder()
    .setCustomId('tempvc_unban_user_select_123456789')
    .setPlaceholder('Search and select a user to unban...')
    .setMaxValues(10)
    .setMinValues(1);

console.log('✅ Unban user select menu created with maxValues:', unbanUserSelectMenu.data.max_values);

// Test customId parsing for ban/unban user selection
const testCustomIds = [
    'tempvc_ban_user_select_123456789',
    'tempvc_unban_user_select_987654321'
];

testCustomIds.forEach(customId => {
    const parts = customId.split('_');
    const action = parts.slice(1, -3).join('_'); // Everything between 'tempvc' and last 3 parts
    const channelId = parts[parts.length - 1];
    
    console.log(`CustomId: ${customId}`);
    console.log(`  Parsed action: "${action}"`);
    console.log(`  Parsed channelId: "${channelId}"`);
    console.log(`  Expected action: "${customId.includes('ban_user') ? 'ban_user_select' : 'unban_user_select'}"`);
    console.log('');
});

console.log('Multi-user validation test completed!');
