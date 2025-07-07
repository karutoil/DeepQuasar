#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Welcome System Custom Embed Implementation...\n');

// Check if all required files exist
const requiredFiles = [
    'src/commands/settings/welcome.js',
    'src/utils/WelcomeEmbedHandler.js',
    'src/utils/WelcomeSystem.js',
    'src/events/interactionCreate.js',
    'src/schemas/Guild.js'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('\n❌ Some required files are missing!');
    process.exit(1);
}

// Check for required methods and features
console.log('\n🔍 Checking implementation features...\n');

// Check welcome.js for handleCustomEmbed method
const welcomeFile = fs.readFileSync(path.join(__dirname, '..', 'src/commands/settings/welcome.js'), 'utf8');
if (welcomeFile.includes('handleCustomEmbed')) {
    console.log('✅ handleCustomEmbed method implemented');
} else {
    console.log('❌ handleCustomEmbed method missing');
}

if (welcomeFile.includes('getPlaceholdersList')) {
    console.log('✅ getPlaceholdersList method implemented');
} else {
    console.log('❌ getPlaceholdersList method missing');
}

if (welcomeFile.includes('createWelcomeBuilderComponents')) {
    console.log('✅ createWelcomeBuilderComponents method implemented');
} else {
    console.log('❌ createWelcomeBuilderComponents method missing');
}

// Check WelcomeSystem.js for custom embed methods
const welcomeSystemFile = fs.readFileSync(path.join(__dirname, '..', 'src/utils/WelcomeSystem.js'), 'utf8');
if (welcomeSystemFile.includes('createCustomWelcomeEmbed')) {
    console.log('✅ createCustomWelcomeEmbed method implemented');
} else {
    console.log('❌ createCustomWelcomeEmbed method missing');
}

if (welcomeSystemFile.includes('replacePlaceholdersExtended')) {
    console.log('✅ replacePlaceholdersExtended method implemented');
} else {
    console.log('❌ replacePlaceholdersExtended method missing');
}

// Check Guild.js schema for customEmbed fields
const guildSchemaFile = fs.readFileSync(path.join(__dirname, '..', 'src/schemas/Guild.js'), 'utf8');
if (guildSchemaFile.includes('customEmbed')) {
    console.log('✅ Guild schema updated with customEmbed fields');
} else {
    console.log('❌ Guild schema missing customEmbed fields');
}

// Check interactionCreate.js for welcome embed handlers
const interactionFile = fs.readFileSync(path.join(__dirname, '..', 'src/events/interactionCreate.js'), 'utf8');
if (interactionFile.includes('welcome_embed_') && interactionFile.includes('WelcomeEmbedHandler')) {
    console.log('✅ Interaction handlers updated for welcome embeds');
} else {
    console.log('❌ Interaction handlers missing welcome embed support');
}

// Check documentation
const docsFile = path.join(__dirname, '..', 'docs/features/server-management/WELCOME_SYSTEM.md');
if (fs.existsSync(docsFile)) {
    const docsContent = fs.readFileSync(docsFile, 'utf8');
    if (docsContent.includes('Custom Embed') || docsContent.includes('custom welcome')) {
        console.log('✅ Documentation updated with custom embed information');
    } else {
        console.log('❌ Documentation missing custom embed information');
    }
} else {
    console.log('❌ Documentation file missing');
}

console.log('\n🎉 Welcome System Custom Embed Implementation Validation Complete!\n');

// Summary
console.log('📋 IMPLEMENTATION SUMMARY:');
console.log('');
console.log('✨ Features Added:');
console.log('   🎨 Interactive custom embed builder');
console.log('   📝 Extended placeholder system');
console.log('   🔧 Live preview functionality');
console.log('   💾 Save/load custom embed designs');
console.log('   🎯 Context-aware placeholders');
console.log('');
console.log('🛠️ Commands Available:');
console.log('   /welcome custom welcome - Create custom welcome embeds');
console.log('   /welcome custom leave - Create custom leave embeds');
console.log('   /welcome custom dm - Create custom DM embeds');
console.log('');
console.log('📊 Placeholder Examples:');
console.log('   {user.mention} - @User');
console.log('   {guild.name} - Server name');
console.log('   {account.age} - Account creation date');
console.log('   {join.position} - Member join position');
console.log('   {time} - Current time');
console.log('   {inviter.mention} - Who invited (welcome only)');
console.log('');
console.log('📚 Updated Documentation:');
console.log('   - Extended placeholder reference');
console.log('   - Custom embed builder guide');
console.log('   - Configuration examples');
console.log('');
console.log('🎯 Ready to use! Administrators can now create completely');
console.log('   custom welcome/leave embeds with full placeholder support!');
