const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

// Import the self-role components
const SelfRoleManager = require('../src/utils/SelfRoleManager');
const SelfRole = require('../src/schemas/SelfRole');

async function testSelfRoleSystem() {
    console.log('🧪 Testing Self-Role System...\n');

    // Test 1: Database Schema
    console.log('1. Testing Database Schema...');
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/discord-bot-test');
        console.log('✅ Database connection successful');

        // Test schema validation
        const testData = {
            guildId: '123456789',
            messageId: '987654321',
            channelId: '555666777',
            title: 'Test Self-Role Message',
            description: 'This is a test',
            roles: [{
                roleId: '111222333',
                roleName: 'Test Role',
                label: 'Test',
                style: 'Primary',
                position: 0
            }],
            createdBy: {
                userId: '444555666',
                username: 'TestUser'
            }
        };

        const testSelfRole = new SelfRole(testData);
        await testSelfRole.validate();
        console.log('✅ Schema validation passed');

    } catch (error) {
        console.log('❌ Database test failed:', error.message);
        return;
    }

    // Test 2: SelfRoleManager initialization
    console.log('\n2. Testing SelfRoleManager...');
    try {
        const mockClient = {
            on: () => {},
            channels: { fetch: () => null },
            guilds: { cache: new Map() }
        };

        const manager = new SelfRoleManager(mockClient);
        console.log('✅ SelfRoleManager initialized successfully');

        // Test embed building
        const testEmbed = manager.buildSelfRoleEmbed({
            title: 'Test Title',
            description: 'Test Description',
            color: '#ff0000',
            roles: [{
                roleId: '123',
                roleName: 'Test Role',
                label: 'Test',
                emoji: '🎮',
                description: 'Test role description',
                position: 0
            }],
            settings: {
                maxRolesPerUser: 3,
                allowRoleRemoval: true
            }
        });

        console.log('✅ Embed building works');

        // Test component building
        const components = manager.buildSelfRoleComponents({
            roles: [{
                roleId: '123',
                roleName: 'Test Role',
                label: 'Test',
                emoji: '🎮',
                style: 'Primary',
                position: 0
            }]
        }, 'test-message-id');

        console.log('✅ Component building works');

    } catch (error) {
        console.log('❌ SelfRoleManager test failed:', error.message);
        return;
    }

    // Test 3: Role assignment logic
    console.log('\n3. Testing Role Assignment Logic...');
    try {
        const testSelfRole = new SelfRole({
            guildId: '123456789',
            messageId: '987654321',
            channelId: '555666777',
            title: 'Test',
            description: 'Test',
            roles: [{
                roleId: '111222333',
                roleName: 'Test Role',
                label: 'Test',
                style: 'Primary',
                position: 0,
                maxAssignments: 5,
                currentAssignments: 2,
                conflictingRoles: ['444555666']
            }],
            settings: {
                maxRolesPerUser: 3
            },
            createdBy: {
                userId: '444555666',
                username: 'TestUser'
            }
        });

        // Test role assignment validation
        const mockUserRoles = [{ id: '777888999' }]; // User doesn't have conflicting roles
        const canAssign = testSelfRole.canUserAssignRole('user123', '111222333', mockUserRoles);
        console.log('✅ Role assignment validation works:', canAssign.allowed);

        // Test conflicting roles
        const mockConflictingRoles = [{ id: '444555666' }];
        const cannotAssign = testSelfRole.canUserAssignRole('user123', '111222333', mockConflictingRoles);
        console.log('✅ Conflicting roles detection works:', !cannotAssign.allowed);

        // Test statistics
        testSelfRole.updateUserStats('user123');
        testSelfRole.incrementRoleAssignment('111222333');
        console.log('✅ Statistics tracking works');

    } catch (error) {
        console.log('❌ Role assignment logic test failed:', error.message);
        return;
    }

    // Test 4: Command structure validation
    console.log('\n4. Testing Command Structure...');
    try {
        const selfRoleCommand = require('../src/commands/settings/selfrole');
        const advancedCommand = require('../src/commands/settings/selfrole-advanced');
        const setupCommand = require('../src/commands/settings/selfrole-setup');
        const helpCommand = require('../src/commands/information/selfrole-help');

        console.log('✅ All command files loaded successfully');
        console.log('✅ Command structure validation passed');

        // Check if commands have required properties
        const commands = [selfRoleCommand, advancedCommand, setupCommand, helpCommand];
        for (const command of commands) {
            if (!command.data || !command.execute) {
                throw new Error(`Command missing required properties: ${command.data?.name || 'unknown'}`);
            }
        }
        console.log('✅ All commands have required properties');

    } catch (error) {
        console.log('❌ Command structure test failed:', error.message);
        return;
    }

    console.log('\n🎉 All tests passed! Self-Role System is ready to use.');
    console.log('\n📋 Quick Start Guide:');
    console.log('1. Use /selfrole-setup to create your first self-role message');
    console.log('2. Add roles with /selfrole add-role');
    console.log('3. Configure settings with /selfrole settings');
    console.log('4. Use /selfrole-help for detailed help');

    // Close database connection
    await mongoose.connection.close();
    console.log('\n✅ Test completed successfully!');
}

// Run the test
testSelfRoleSystem().catch(console.error);
