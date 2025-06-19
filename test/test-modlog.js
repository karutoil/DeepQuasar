const ModLogManager = require('./src/utils/ModLogManager.js');
const ModLog = require('./src/schemas/ModLog.js');

console.log('Testing ModLog Module...\n');

// Test 1: Check event types
console.log('1. Available Event Types:');
const eventTypes = ModLogManager.getEventTypes();
console.log(`Found ${eventTypes.length} event types:`);
eventTypes.forEach(type => {
    console.log(`   - ${type}: ${ModLogManager.getEventDisplayName(type)}`);
});

console.log('\n2. Color Mappings:');
eventTypes.slice(0, 5).forEach(type => {
    console.log(`   - ${type}: ${ModLogManager.colors[type] ? '✅' : '❌'}`);
});

console.log('\n3. Emoji Mappings:');
eventTypes.slice(0, 5).forEach(type => {
    console.log(`   - ${type}: ${ModLogManager.emojis[type] || '❌'}`);
});

console.log('\n4. Schema Default Settings:');
const testSchema = new ModLog({ guildId: 'test123' });
console.log(`Default enabled: ${testSchema.enabled}`);
console.log(`Default memberJoin enabled: ${testSchema.events.memberJoin.enabled}`);
console.log(`Default presenceUpdate enabled: ${testSchema.events.presenceUpdate.enabled}`);

console.log('\n5. Helper Functions:');
console.log(`Format duration (3661s): ${ModLogManager.formatDuration(3661)}`);
console.log(`Format duration (0s): ${ModLogManager.formatDuration(0)}`);
console.log(`Truncate text (short): ${ModLogManager.truncateText('Hello World', 50)}`);
console.log(`Truncate text (long): ${ModLogManager.truncateText('A'.repeat(1030), 1024)}`);

console.log('\n✅ ModLog Module Test Complete');
console.log('\nTo test the full functionality:');
console.log('1. Deploy the commands: npm run deploy');
console.log('2. Use /modlog setup in a Discord server');
console.log('3. Configure events with /modlog configure');
console.log('4. Test events by creating channels, roles, etc.');
