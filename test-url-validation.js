const embedBuilder = require('./src/commands/settings/embed-builder.js');

console.log('Testing improved URL validation:');
console.log('Valid URL (https://example.com):', embedBuilder.isValidUrl('https://example.com'));
console.log('Valid URL (example.com):', embedBuilder.isValidUrl('example.com'));
console.log('Valid URL (www.example.com):', embedBuilder.isValidUrl('www.example.com'));
console.log('Valid URL (sub.domain.com):', embedBuilder.isValidUrl('sub.domain.com'));
console.log('Valid URL (discord.com):', embedBuilder.isValidUrl('discord.com'));
console.log('Valid URL (github.com/user/repo):', embedBuilder.isValidUrl('github.com/user/repo'));

console.log('\nTesting potentially invalid URLs:');
console.log('Invalid URL (karutoil.site):', embedBuilder.isValidUrl('karutoil.site'));
console.log('Invalid URL (not-a-url):', embedBuilder.isValidUrl('not-a-url'));
console.log('Invalid URL (just-text):', embedBuilder.isValidUrl('just-text'));
console.log('Invalid URL (empty):', embedBuilder.isValidUrl(''));
console.log('Invalid URL (null):', embedBuilder.isValidUrl(null));
console.log('Invalid URL (localhost):', embedBuilder.isValidUrl('localhost'));
console.log('Invalid URL (no-dots):', embedBuilder.isValidUrl('no-dots'));
