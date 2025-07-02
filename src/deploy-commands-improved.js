require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const foldersPath = path.join(__dirname, 'commands');

// Recursively read all command files
function readCommands(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            readCommands(filePath);
        } else if (file.endsWith('.js')) {
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
                console.log(`Loaded command: ${command.data.name}`);
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }
}

// Check if commands directory exists
if (fs.existsSync(foldersPath)) {
    readCommands(foldersPath);
} else {
    console.error('Commands directory not found!');
    process.exit(1);
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Add timeout to REST requests
rest.options.timeout = 30000; // 30 second timeout

// Deploy commands with better error handling and chunking
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Determine deployment type
        const guildId = process.env.GUILD_ID;
        const clientId = process.env.CLIENT_ID;

        if (!clientId) {
            console.error('CLIENT_ID is required in .env file');
            process.exit(1);
        }

        let data;

        // Clear existing commands before deploying new ones
        if (guildId) {
            console.log(`Clearing existing commands for guild: ${guildId}`);
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
        } else {
            console.log('Clearing existing global commands...');
            await rest.put(Routes.applicationCommands(clientId), { body: [] });
        }

        console.log('✅ Successfully cleared existing commands.');

        // For global deployment, try chunked approach if we have many commands
        if (!guildId && commands.length > 20) {
            console.log('⚠️  Large number of commands detected. Using chunked deployment...');
            
            const chunkSize = 10;
            const chunks = [];
            for (let i = 0; i < commands.length; i += chunkSize) {
                chunks.push(commands.slice(i, i + chunkSize));
            }

            let totalDeployed = 0;
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                console.log(`Deploying chunk ${i + 1}/${chunks.length} (${chunk.length} commands)...`);
                
                try {
                    // Wait between chunks to avoid rate limits
                    if (i > 0) {
                        console.log('Waiting 2 seconds between chunks...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                    
                    // For chunked deployment, we need to get existing commands and append
                    const existingCommands = await rest.get(Routes.applicationCommands(clientId));
                    const allCommands = [...existingCommands, ...chunk];
                    
                    const chunkData = await rest.put(
                        Routes.applicationCommands(clientId),
                        { body: allCommands }
                    );
                    
                    totalDeployed += chunk.length;
                    console.log(`✅ Chunk ${i + 1} deployed successfully`);
                    
                } catch (chunkError) {
                    console.error(`❌ Failed to deploy chunk ${i + 1}:`, chunkError.message);
                    throw chunkError;
                }
            }
            
            data = { length: totalDeployed };
            console.log('✅ All chunks deployed successfully');
            
        } else {
            // Deploy all commands at once
            if (guildId) {
                console.log(`Deploying commands to guild: ${guildId}`);
                data = await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commands }
                );
            } else {
                console.log('Deploying commands globally...');
                console.log('⏳ This may take longer for global deployment...');
                
                data = await rest.put(
                    Routes.applicationCommands(clientId),
                    { body: commands }
                );
            }
        }

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);

        // Log deployed commands (only first 10 to avoid spam)
        console.log('\nDeployed commands (showing first 10):');
        const commandsToShow = Array.isArray(data) ? data.slice(0, 10) : commands.slice(0, 10);
        commandsToShow.forEach(command => {
            const name = command.name || command.data?.name;
            const description = command.description || command.data?.description;
            console.log(`- /${name}: ${description}`);
        });
        
        if (commands.length > 10) {
            console.log(`... and ${commands.length - 10} more commands`);
        }

        console.log('\n✅ Command deployment completed successfully!');

        if (guildId) {
            console.log('\n⚠️  Commands were deployed to a specific guild for development.');
            console.log('Remove GUILD_ID from .env to deploy globally for production.');
        } else {
            console.log('\n🌍 Commands were deployed globally.');
            console.log('Note: Global commands may take up to 1 hour to propagate.');
        }

    } catch (error) {
        console.error('❌ Error deploying commands:');

        // Log more detailed error information from the Discord API
        if (error.rawError) {
            console.error('Discord API Response:', JSON.stringify(error.rawError, null, 2));
        } else {
            console.error(error);
        }

        if (error.status === 401) {
            console.error('\n❌ Invalid bot token. Please check your DISCORD_TOKEN in .env');
        } else if (error.status === 403) {
            console.error('\n❌ Bot lacks permissions. Ensure it was invited with the "applications.commands" scope.');
        } else if (error.status === 404) {
            console.error('\n❌ Application not found. Please check your CLIENT_ID in .env');
        } else if (error.status === 429) {
            const retryAfter = error.rawError?.retry_after ?? 'unknown';
            console.error(`\n❌ Rate limited by Discord. Please wait ${retryAfter} seconds and try again.`);
        } else if (error.status >= 500) {
            console.error('\n❌ Discord server error. This is an issue on Discord\'s end. Please try again later.');
        } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            console.error('\n❌ Network timeout. Try again in a few minutes.');
            console.error('💡 Tip: Global command deployment can be slow. Consider deploying to a guild first for testing.');
        }
        process.exit(1);
    }
})();
