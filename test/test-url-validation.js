/**
 * Test to validate that URL checkers now accept placeholders
 */

const WelcomeEmbedHandler = require('../src/utils/WelcomeEmbedHandler');
const EmbedBuilderHandler = require('../src/utils/EmbedBuilderHandler');

console.log('🧪 Testing URL validation with placeholders...\n');

// Test cases with placeholders
const testCases = [
    // Valid placeholder URLs
    { url: '{user.avatar}', expected: true, type: 'User avatar placeholder' },
    { url: '{guild.icon}', expected: true, type: 'Guild icon placeholder' },
    { url: '{user.banner}', expected: true, type: 'User banner placeholder' },
    { url: '{guild.banner}', expected: true, type: 'Guild banner placeholder' },
    { url: 'https://example.com/image.png', expected: true, type: 'Valid HTTP URL' },
    { url: 'https://cdn.discordapp.com/avatars/{user.id}/avatar.png', expected: true, type: 'Mixed URL with placeholder' },
    
    // Valid URLs
    { url: 'https://example.com/image.jpg', expected: true, type: 'Valid HTTPS image URL' },
    { url: 'https://example.com', expected: true, type: 'Valid HTTPS URL' },
    
    // Invalid URLs (should still fail)
    { url: 'not-a-url', expected: false, type: 'Invalid string' },
    { url: 'ftp://example.com', expected: false, type: 'Invalid protocol' },
    { url: '', expected: true, type: 'Empty string (should be valid)' }
];

let allPassed = true;

console.log('🔍 Testing WelcomeEmbedHandler.isValidUrl():');
testCases.forEach((testCase, index) => {
    const result = WelcomeEmbedHandler.isValidUrl(testCase.url);
    const passed = result === testCase.expected;
    console.log(`${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.type}`);
    console.log(`   Input: "${testCase.url}"`);
    console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
    if (!passed) allPassed = false;
});

console.log('\n🔍 Testing WelcomeEmbedHandler.isValidImageUrl():');
const imageTestCases = [
    { url: '{user.avatar}', expected: true, type: 'User avatar placeholder' },
    { url: '{guild.icon}', expected: true, type: 'Guild icon placeholder' },
    { url: 'https://example.com/image.png', expected: true, type: 'Valid image URL' },
    { url: 'https://example.com/image.jpg', expected: true, type: 'Valid JPG URL' },
    { url: 'https://example.com', expected: false, type: 'URL without image extension' },
    { url: 'not-a-url.png', expected: false, type: 'Invalid URL with image extension' }
];

imageTestCases.forEach((testCase, index) => {
    const result = WelcomeEmbedHandler.isValidImageUrl(testCase.url);
    const passed = result === testCase.expected;
    console.log(`${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.type}`);
    console.log(`   Input: "${testCase.url}"`);
    console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
    if (!passed) allPassed = false;
});

console.log('\n🔍 Testing EmbedBuilderHandler.isValidUrl():');
testCases.forEach((testCase, index) => {
    const result = EmbedBuilderHandler.isValidUrl(testCase.url);
    const passed = result === testCase.expected;
    console.log(`${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.type}`);
    console.log(`   Input: "${testCase.url}"`);
    console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
    if (!passed) allPassed = false;
});

console.log('\n🔍 Testing EmbedBuilderHandler.isValidImageUrl():');
imageTestCases.forEach((testCase, index) => {
    const result = EmbedBuilderHandler.isValidImageUrl(testCase.url);
    const passed = result === testCase.expected;
    console.log(`${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.type}`);
    console.log(`   Input: "${testCase.url}"`);
    console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
    if (!passed) allPassed = false;
});

console.log('\n🔍 Testing placeholder detection:');
const placeholderTests = [
    { input: '{user.avatar}', expected: true },
    { input: '{guild.icon}', expected: true },
    { input: '{some.random.placeholder}', expected: true },
    { input: 'https://example.com', expected: false },
    { input: 'not a placeholder', expected: false },
    { input: '{invalid-placeholder}', expected: false }, // Should fail due to dash
    { input: 'Text with {user.tag} placeholder', expected: true }
];

placeholderTests.forEach((test, index) => {
    const result = WelcomeEmbedHandler.containsPlaceholders(test.input);
    const passed = result === test.expected;
    console.log(`${passed ? '✅' : '❌'} Test ${index + 1}: "${test.input}"`);
    console.log(`   Expected: ${test.expected}, Got: ${result}`);
    if (!passed) allPassed = false;
});

console.log(`\n${allPassed ? '🎉' : '⚠️'} ${allPassed ? 'All tests passed!' : 'Some tests failed!'}`);

if (allPassed) {
    console.log('\n✅ URL validation now properly supports placeholders!');
    console.log('✅ Users can now use placeholders like {user.avatar} and {guild.icon} in embed URLs!');
    console.log('✅ Schema validation will also accept placeholders!');
} else {
    console.log('\n❌ Some validation issues detected.');
    process.exit(1);
}
