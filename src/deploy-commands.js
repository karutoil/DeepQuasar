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

// Deploy commands
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

        if (guildId) {
            // Deploy to specific guild (for development)
            console.log(`Deploying commands to guild: ${guildId}`);
            data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            );
        } else {
            // Deploy globally (for production)
            console.log('Deploying commands globally...');
            data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );
        }

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);

        // Log deployed commands
        console.log('\nDeployed commands:');
        data.forEach(command => {
            console.log(`- /${command.name}: ${command.description}`);
        });

        console.log('\n✅ Command deployment completed successfully!');

        if (guildId) {
            console.log('\n⚠️  Commands were deployed to a specific guild for development.');
            console.log('Remove GUILD_ID from .env to deploy globally for production.');
        } else {
            console.log('\n🌍 Commands were deployed globally.');
            console.log('Note: Global commands may take up to 1 hour to propagate.');
        }

    } catch (error) {
        console.error('Error deploying commands:', error);
        
        if (error.status === 401) {
            console.error('\n❌ Invalid bot token. Please check your DISCORD_TOKEN in .env');
        } else if (error.status === 403) {
            console.error('\n❌ Bot lacks permissions. Make sure the bot is invited with proper permissions.');
        } else if (error.status === 404) {
            console.error('\n❌ Application not found. Please check your CLIENT_ID in .env');
        }
        
        process.exit(1);
    }
})();
