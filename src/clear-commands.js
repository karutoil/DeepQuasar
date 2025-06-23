require('dotenv').config();
const { REST, Routes } = require('discord.js');

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Clear all commands
(async () => {
    try {
        const guildId = process.env.GUILD_ID;
        const clientId = process.env.CLIENT_ID;

        if (!clientId) {
            console.error('❌ CLIENT_ID is required in .env file');
            process.exit(1);
        }

        console.log('🧹 Started clearing application (/) commands...');

        let data;

        if (guildId) {
            // Clear guild-specific commands
            console.log(`🎯 Clearing commands from guild: ${guildId}`);
            
            // First, get existing commands to show what's being cleared
            const existingCommands = await rest.get(
                Routes.applicationGuildCommands(clientId, guildId)
            );
            
            console.log(`📋 Found ${existingCommands.length} existing guild commands:`);
            existingCommands.forEach(command => {
                console.log(`   - /${command.name}: ${command.description}`);
            });

            // Clear all guild commands by sending empty array
            data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: [] }
            );
            
            console.log(`✅ Successfully cleared ${existingCommands.length} guild commands.`);
        } else {
            // Clear global commands
            console.log('🌍 Clearing global commands...');
            
            // First, get existing commands to show what's being cleared
            const existingCommands = await rest.get(
                Routes.applicationCommands(clientId)
            );
            
            console.log(`📋 Found ${existingCommands.length} existing global commands:`);
            existingCommands.forEach(command => {
                console.log(`   - /${command.name}: ${command.description}`);
            });

            // Clear all global commands by sending empty array
            data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: [] }
            );
            
            console.log(`✅ Successfully cleared ${existingCommands.length} global commands.`);
        }

        console.log('\n🎉 Command clearing completed successfully!');

        if (guildId) {
            console.log('\n⚠️  Commands were cleared from a specific guild.');
            console.log('💡 Remove GUILD_ID from .env to clear global commands instead.');
        } else {
            console.log('\n🌍 Global commands were cleared.');
            console.log('⏰ Note: Global command changes may take up to 1 hour to propagate.');
        }

        console.log('\n💡 To redeploy commands, run: npm run deploy');

    } catch (error) {
        console.error('❌ Error clearing commands:', error);
        
        if (error.status === 401) {
            console.error('\n🔑 Invalid bot token. Please check your DISCORD_TOKEN in .env');
        } else if (error.status === 403) {
            console.error('\n🚫 Bot lacks permissions. Make sure the bot is invited with proper permissions.');
        } else if (error.status === 404) {
            console.error('\n🔍 Application not found. Please check your CLIENT_ID in .env');
        } else if (error.rawError && error.rawError.message) {
            console.error(`\n📝 Discord API Error: ${error.rawError.message}`);
        }
        
        process.exit(1);
    }
})();
