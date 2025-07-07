#!/usr/bin/env node

/**
 * Test session management for welcome embed builder
 * Verifies that sessions are properly cleared after saving to prevent data carryover
 */

const EmbedBuilderHandler = require('../src/utils/EmbedBuilderHandler');

console.log('🧪 Testing Welcome Embed Builder Session Management...\n');

// Test 1: Create a session and populate it with data
console.log('1. Creating session with welcome embed data...');
const testUserId = 'test-user-123';
const session = EmbedBuilderHandler.getSession(testUserId);

// Simulate welcome embed builder session
session.welcomeContext = {
    type: 'welcome',
    guildData: { /* mock guild data */ },
    isWelcomeBuilder: true
};

session.embedData.title = 'Welcome to My Server!';
session.embedData.description = 'Hello {user.mention}! You are our {guild.memberCount} member!';
session.embedData.color = 0x57F287;
session.embedData.thumbnail = { url: '{user.avatar}' };

console.log('✅ Session created with data:');
console.log(`   - Title: ${session.embedData.title}`);
console.log(`   - Description: ${session.embedData.description}`);
console.log(`   - Color: #${session.embedData.color.toString(16)}`);
console.log(`   - Welcome Context: ${session.welcomeContext ? 'Present' : 'Missing'}`);

// Test 2: Simulate saving the embed (which should clear the session)
console.log('\n2. Simulating embed save (clearing session)...');
EmbedBuilderHandler.clearSession(testUserId);

// Test 3: Get session again (should be fresh)
console.log('\n3. Getting session after clear...');
const newSession = EmbedBuilderHandler.getSession(testUserId);

console.log('✅ New session state:');
console.log(`   - Title: ${newSession.embedData.title || 'null'}`);
console.log(`   - Description: ${newSession.embedData.description || 'null'}`);
console.log(`   - Color: ${newSession.embedData.color || 'null'}`);
console.log(`   - Welcome Context: ${newSession.welcomeContext ? 'Present' : 'Missing'}`);

// Test 4: Verify session is truly clean
console.log('\n4. Verifying session cleanliness...');
const isEmpty = (
    !newSession.embedData.title &&
    !newSession.embedData.description &&
    !newSession.embedData.color &&
    !newSession.welcomeContext &&
    newSession.embedData.fields.length === 0
);

console.log(isEmpty ? '✅ Session is properly cleared!' : '❌ Session still contains old data!');

// Test 5: Test reset method
console.log('\n5. Testing reset method (keeps session but clears data)...');
newSession.embedData.title = 'Test Title';
newSession.welcomeContext = { test: true };
newSession.messageRef = { id: 'test-message' };

console.log('   Before reset:');
console.log(`     - Title: ${newSession.embedData.title}`);
console.log(`     - Welcome Context: ${newSession.welcomeContext ? 'Present' : 'Missing'}`);
console.log(`     - Message Ref: ${newSession.messageRef ? 'Present' : 'Missing'}`);

EmbedBuilderHandler.resetSession(testUserId);
const resetSession = EmbedBuilderHandler.getSession(testUserId);

console.log('   After reset:');
console.log(`     - Title: ${resetSession.embedData.title || 'null'}`);
console.log(`     - Welcome Context: ${resetSession.welcomeContext ? 'Present' : 'Missing'}`);
console.log(`     - Message Ref: ${resetSession.messageRef ? 'Present' : 'Missing'}`);

console.log('\n✨ Session management test completed!');
console.log('\n📝 Summary:');
console.log('   - clearSession(): Completely removes the session');
console.log('   - resetSession(): Keeps session but clears embed data and welcome context');
console.log('   - Both methods prevent carryover of welcome embed data to other uses');
