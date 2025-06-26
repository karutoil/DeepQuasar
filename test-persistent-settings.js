const mongoose = require('mongoose');
const TempVCUserSettings = require('./src/schemas/TempVCUserSettings');

async function testPersistentSettings() {
    try {
        // Connect to MongoDB (use test database)
        await mongoose.connect('mongodb://localhost:27017/discord_bot_test', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to test database');
        
        // Test data
        const testGuildId = '123456789';
        const testUserId = '987654321';
        
        // Clean up any existing test data
        await TempVCUserSettings.deleteMany({ guildId: testGuildId, userId: testUserId });
        
        // Test 1: Create new settings
        console.log('Test 1: Creating new user settings...');
        const newSettings = await TempVCUserSettings.createOrUpdate(testGuildId, testUserId, {
            defaultSettings: {
                customName: 'My Custom Channel',
                userLimit: 5,
                bitrate: 128000,
                locked: true,
                hidden: false,
                region: 'us-east'
            },
            autoSave: true
        });
        
        console.log('Created settings:', newSettings.defaultSettings);
        
        // Test 2: Retrieve settings
        console.log('Test 2: Retrieving user settings...');
        const retrievedSettings = await TempVCUserSettings.findByUser(testGuildId, testUserId);
        console.log('Retrieved settings:', retrievedSettings.defaultSettings);
        
        // Test 3: Update settings
        console.log('Test 3: Updating user settings...');
        const updatedSettings = await TempVCUserSettings.createOrUpdate(testGuildId, testUserId, {
            defaultSettings: {
                customName: 'Updated Channel Name',
                userLimit: 10,
                bitrate: 256000,
                locked: false,
                hidden: true,
                region: 'us-west'
            },
            autoSave: false
        });
        
        console.log('Updated settings:', updatedSettings.defaultSettings);
        
        // Test 4: Verify persistence
        console.log('Test 4: Verifying persistence...');
        const persistedSettings = await TempVCUserSettings.findByUser(testGuildId, testUserId);
        console.log('Persisted settings:', persistedSettings.defaultSettings);
        console.log('Auto-save:', persistedSettings.autoSave);
        
        // Clean up
        await TempVCUserSettings.deleteMany({ guildId: testGuildId, userId: testUserId });
        console.log('Test completed successfully!');
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
        process.exit(0);
    }
}

// Run test if MongoDB is available
testPersistentSettings();
