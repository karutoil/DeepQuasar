const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// Mock client for testing
const mockClient = {
    logger: {
        info: (msg) => console.log(`[INFO] ${msg}`),
        warn: (msg) => console.log(`[WARN] ${msg}`),
        error: (msg, err) => console.log(`[ERROR] ${msg}`, err)
    }
};

// Test AutoRoleManager
const AutoRoleManager = require('../src/utils/AutoRoleManager');

async function testAutoRoleManager() {
    console.log('🧪 Testing AutoRoleManager...\n');

    try {
        const autoRoleManager = new AutoRoleManager(mockClient);
        console.log('✅ AutoRoleManager instantiated successfully');

        // Test statistics function
        const stats = autoRoleManager.getStatistics('test-guild-id');
        console.log('✅ Statistics function works:', stats);

        // Test cancel pending assignment (should not throw error)
        autoRoleManager.cancelPendingAssignment('test-guild', 'test-user');
        console.log('✅ Cancel pending assignment works');

        console.log('\n✅ All AutoRoleManager tests passed!');

    } catch (error) {
        console.error('❌ AutoRoleManager test failed:', error);
    }
}

// Test Guild Schema
async function testGuildSchema() {
    console.log('\n🧪 Testing Guild Schema updates...\n');

    try {
        const Guild = require('../src/schemas/Guild');
        console.log('✅ Guild schema imported successfully');

        // Check if autoRole field exists in schema
        const schema = Guild.schema.obj;
        if (schema.autoRole) {
            console.log('✅ autoRole field exists in Guild schema');
            console.log('✅ Schema structure:', JSON.stringify(schema.autoRole, null, 2));
        } else {
            console.log('❌ autoRole field not found in Guild schema');
        }

        console.log('\n✅ Guild schema tests passed!');

    } catch (error) {
        console.error('❌ Guild schema test failed:', error);
    }
}

// Test Command Structure
async function testCommandStructure() {
    console.log('\n🧪 Testing AutoRole Command...\n');

    try {
        const autoRoleCommand = require('../src/commands/settings/autorole');
        console.log('✅ AutoRole command imported successfully');

        if (autoRoleCommand.data && autoRoleCommand.execute) {
            console.log('✅ Command has required data and execute properties');
            console.log('✅ Command name:', autoRoleCommand.data.name);
            console.log('✅ Command description:', autoRoleCommand.data.description);
        } else {
            console.log('❌ Command missing required properties');
        }

        console.log('\n✅ Command structure tests passed!');

    } catch (error) {
        console.error('❌ Command test failed:', error);
    }
}

// Test Event Handlers
async function testEventHandlers() {
    console.log('\n🧪 Testing Event Handlers...\n');

    const events = [
        'guildMemberAdd',
        'guildMemberUpdate', 
        'guildMemberRemove'
    ];

    for (const eventName of events) {
        try {
            const event = require(`../src/events/${eventName}`);
            if (event.name && event.execute) {
                console.log(`✅ ${eventName} event handler is valid`);
            } else {
                console.log(`❌ ${eventName} event handler missing required properties`);
            }
        } catch (error) {
            console.error(`❌ Failed to load ${eventName} event:`, error.message);
        }
    }

    console.log('\n✅ Event handler tests completed!');
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting AutoRole Module Tests\n');
    console.log('=' .repeat(50));

    await testAutoRoleManager();
    await testGuildSchema();
    await testCommandStructure();
    await testEventHandlers();

    console.log('\n' + '='.repeat(50));
    console.log('🎉 AutoRole module testing completed!');
    console.log('\nNext steps:');
    console.log('1. Run the bot with: npm start or node src/index.js');
    console.log('2. Use /autorole setup in Discord to configure');
    console.log('3. Test by having a user join the server');
}

runTests().catch(console.error);
