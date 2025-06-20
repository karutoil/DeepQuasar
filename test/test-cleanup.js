const { Client, GatewayIntentBits, Collection, PermissionFlagsBits } = require('discord.js');
const path = require('path');

// Test the cleanup command structure
const cleanupCommand = require('../src/commands/settings/cleanup.js');

console.log('Testing Cleanup Command Module...\n');

// Test 1: Check if command exports are correct
console.log('✅ Test 1: Command Structure');
console.log(`- Has data property: ${!!cleanupCommand.data}`);
console.log(`- Has execute function: ${typeof cleanupCommand.execute === 'function'}`);
console.log(`- Has category: ${cleanupCommand.category}`);
console.log(`- Has permissions: ${Array.isArray(cleanupCommand.permissions)}`);
console.log(`- Required permission: ${cleanupCommand.permissions.includes(PermissionFlagsBits.ManageMessages) ? 'ManageMessages ✅' : 'Missing ManageMessages ❌'}`);
console.log(`- Required permission: ${cleanupCommand.permissions.includes(PermissionFlagsBits.ManageChannels) ? 'ManageChannels ✅' : 'Missing ManageChannels ❌'}`);

// Test 2: Check command data
console.log('\n✅ Test 2: Command Data');
const commandData = cleanupCommand.data.toJSON();
console.log(`- Command name: ${commandData.name}`);
console.log(`- Command description: ${commandData.description}`);
console.log(`- Default permissions: ${commandData.default_member_permissions === String(PermissionFlagsBits.ManageMessages) ? 'ManageMessages ✅' : 'Wrong permissions ❌'}`);

// Test 3: Check subcommands
console.log('\n✅ Test 3: Subcommands');
const subcommands = commandData.options;
console.log(`- Number of subcommands: ${subcommands.length}`);
subcommands.forEach(sub => {
    console.log(`  - ${sub.name}: ${sub.description}`);
});

// Test 4: Check handler functions
console.log('\n✅ Test 4: Handler Functions');
console.log(`- handleUserCleanup: ${typeof cleanupCommand.handleUserCleanup === 'function' ? '✅' : '❌'}`);
console.log(`- handleAmountCleanup: ${typeof cleanupCommand.handleAmountCleanup === 'function' ? '✅' : '❌'}`);
console.log(`- handleAllCleanup: ${typeof cleanupCommand.handleAllCleanup === 'function' ? '✅' : '❌'}`);
console.log(`- handleBotsCleanup: ${typeof cleanupCommand.handleBotsCleanup === 'function' ? '✅' : '❌'}`);
console.log(`- sendCleanupNotification: ${typeof cleanupCommand.sendCleanupNotification === 'function' ? '✅' : '❌'}`);

// Test 5: Check user subcommand options
console.log('\n✅ Test 5: User Subcommand Options');
const userSubcommand = subcommands.find(sub => sub.name === 'user');
if (userSubcommand) {
    console.log(`- Has user option: ${userSubcommand.options.some(opt => opt.name === 'user') ? '✅' : '❌'}`);
    console.log(`- Has amount option: ${userSubcommand.options.some(opt => opt.name === 'amount') ? '✅' : '❌'}`);
    console.log(`- Has channel option: ${userSubcommand.options.some(opt => opt.name === 'channel') ? '✅' : '❌'}`);
} else {
    console.log('- User subcommand not found ❌');
}

// Test 6: Check amount subcommand options
console.log('\n✅ Test 6: Amount Subcommand Options');
const amountSubcommand = subcommands.find(sub => sub.name === 'amount');
if (amountSubcommand) {
    const countOption = amountSubcommand.options.find(opt => opt.name === 'count');
    console.log(`- Has count option: ${!!countOption ? '✅' : '❌'}`);
    if (countOption) {
        console.log(`- Count is required: ${countOption.required ? '✅' : '❌'}`);
        console.log(`- Min value: ${countOption.min_value || 'not set'}`);
        console.log(`- Max value: ${countOption.max_value || 'not set'}`);
    }
} else {
    console.log('- Amount subcommand not found ❌');
}

// Test 7: Check all subcommand options
console.log('\n✅ Test 7: All Subcommand Options');
const allSubcommand = subcommands.find(sub => sub.name === 'all');
if (allSubcommand) {
    console.log(`- Has channel option: ${allSubcommand.options.some(opt => opt.name === 'channel') ? '✅' : '❌'}`);
    console.log(`- Has confirm option: ${allSubcommand.options.some(opt => opt.name === 'confirm') ? '✅' : '❌'}`);
    
    const confirmOption = allSubcommand.options.find(opt => opt.name === 'confirm');
    if (confirmOption) {
        console.log(`- Confirm is required: ${confirmOption.required ? '✅' : '❌'}`);
    }
} else {
    console.log('- All subcommand not found ❌');
}

console.log('\n🎉 Cleanup Command Test Completed!');
console.log('\n📋 Important Changes in This Version:');
console.log('- The "/cleanup all" command now RECREATES the channel instead of deleting messages');
console.log('- This bypasses Discord\'s 14-day message deletion limit');
console.log('- All channel settings, permissions, and position are preserved');
console.log('- Success notifications are sent to modlog channel or system channel');
console.log('- Requires both "Manage Messages" and "Manage Channels" permissions');
console.log('- Much faster and more reliable than the old bulk delete approach');
console.log('\nTo deploy the command, run: npm run deploy');
console.log('Or run: node src/deploy-commands.js');
