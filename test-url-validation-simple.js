const embedBuilder = require('./src/commands/settings/embed-builder.js');

console.log('Testing simplified URL validation (requires protocol):');
console.log('Valid URL (https://example.com):', embedBuilder.isValidUrl('https://example.com'));
console.log('Valid URL (http://example.com):', embedBuilder.isValidUrl('http://example.com'));
console.log('Valid URL (https://www.example.com):', embedBuilder.isValidUrl('https://www.example.com'));
console.log('Valid URL (https://sub.domain.com):', embedBuilder.isValidUrl('https://sub.domain.com'));
console.log('Valid URL (https://discord.com):', embedBuilder.isValidUrl('https://discord.com'));
console.log('Valid URL (https://github.com/user/repo):', embedBuilder.isValidUrl('https://github.com/user/repo'));

console.log('\nTesting URLs without protocol (should all be false):');
console.log('Invalid URL (example.com):', embedBuilder.isValidUrl('example.com'));
console.log('Invalid URL (www.example.com):', embedBuilder.isValidUrl('www.example.com'));
console.log('Invalid URL (karutoil.site):', embedBuilder.isValidUrl('karutoil.site'));
console.log('Invalid URL (discord.com):', embedBuilder.isValidUrl('discord.com'));
console.log('Invalid URL (github.com):', embedBuilder.isValidUrl('github.com'));

console.log('\nTesting invalid URLs:');
console.log('Invalid URL (not-a-url):', embedBuilder.isValidUrl('not-a-url'));
console.log('Invalid URL (just-text):', embedBuilder.isValidUrl('just-text'));
console.log('Invalid URL (empty):', embedBuilder.isValidUrl(''));
console.log('Invalid URL (null):', embedBuilder.isValidUrl(null));
console.log('Invalid URL (https://localhost):', embedBuilder.isValidUrl('https://localhost'));
console.log('Invalid URL (https://no-dots):', embedBuilder.isValidUrl('https://no-dots'));
