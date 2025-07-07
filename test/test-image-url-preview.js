#!/usr/bin/env node

/**
 * Test image URL validation and preview functionality for welcome embeds
 */

const EmbedBuilderHandler = require('../src/utils/EmbedBuilderHandler');

console.log('🧪 Testing Image URL Validation for Preview...\n');

// Test various URL types
const testUrls = [
    // Discord CDN URLs (should be valid)
    'https://cdn.discordapp.com/avatars/123456789/abc123def456.webp?size=1024',
    'https://cdn.discordapp.com/icons/987654321/xyz789.png',
    'https://media.discordapp.net/attachments/123/456/image.jpg',
    
    // Regular image URLs (should be valid)
    'https://example.com/image.png',
    'https://example.com/photo.jpg?v=123',
    'https://example.com/pic.gif',
    
    // Invalid URLs (should be invalid)
    'None',
    'not-a-url',
    'https://example.com/notanimage.txt',
    
    // Empty/null (should be valid - means no image)
    '',
    null,
    undefined
];

testUrls.forEach((url, index) => {
    const isValid = EmbedBuilderHandler.isValidImageUrl(url);
    const urlDisplay = url === null ? 'null' : url === undefined ? 'undefined' : `"${url}"`;
    const status = isValid ? '✅ VALID' : '❌ INVALID';
    console.log(`${index + 1}. ${status} - ${urlDisplay}`);
});

console.log('\n🧪 Testing Preview Embed Creation...\n');

// Test embed data with various image URLs
const testEmbedData = {
    title: 'Test Welcome',
    description: 'Welcome to our server!',
    thumbnail: { 
        url: 'https://cdn.discordapp.com/avatars/123456789/abc123def456.webp?size=1024' 
    },
    image: { 
        url: 'https://cdn.discordapp.com/icons/987654321/xyz789.png' 
    },
    author: { 
        name: 'Test Author',
        iconURL: 'https://cdn.discordapp.com/avatars/111111111/author123.webp' 
    },
    footer: { 
        text: 'Test Footer',
        iconURL: 'https://cdn.discordapp.com/icons/222222222/footer456.png' 
    }
};

try {
    const previewEmbed = EmbedBuilderHandler.createPreviewEmbed(testEmbedData);
    
    console.log('✅ Preview embed created successfully!');
    console.log('Embed data:');
    console.log(`- Title: ${previewEmbed.data.title || 'None'}`);
    console.log(`- Description: ${previewEmbed.data.description || 'None'}`);
    console.log(`- Thumbnail: ${previewEmbed.data.thumbnail?.url || 'None'}`);
    console.log(`- Image: ${previewEmbed.data.image?.url || 'None'}`);
    console.log(`- Author Icon: ${previewEmbed.data.author?.icon_url || 'None'}`);
    console.log(`- Footer Icon: ${previewEmbed.data.footer?.icon_url || 'None'}`);
    
} catch (error) {
    console.log('❌ Error creating preview embed:', error.message);
    console.log('Full error:', error);
}

console.log('\n🧪 Testing with empty image URLs...\n');

const testEmbedDataEmpty = {
    title: 'Test Welcome',
    description: 'Welcome to our server!',
    thumbnail: { url: '' },
    image: { url: '' },
    author: { 
        name: 'Test Author',
        iconURL: '' 
    },
    footer: { 
        text: 'Test Footer',
        iconURL: '' 
    }
};

try {
    const previewEmbed = EmbedBuilderHandler.createPreviewEmbed(testEmbedDataEmpty);
    console.log('✅ Preview embed with empty URLs created successfully!');
} catch (error) {
    console.log('❌ Error creating preview embed with empty URLs:', error.message);
}

console.log('\n✨ Test completed!');
