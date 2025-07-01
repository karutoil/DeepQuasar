const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

async function deployCommands(client) {
    const commands = [];
    const foldersPath = path.join(__dirname, '../commands');

    // Recursively read all command files
    function readCommands(dir) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                readCommands(filePath);
            } else if (file.endsWith('.js')) {
                delete require.cache[require.resolve(filePath)]; // Clear cache
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                } else {
                    client.logger.warn(`Command at ${filePath} is missing required "data" or "execute" property.`);
                }
            }
        }
    }

    // Check if commands directory exists
    if (!fs.existsSync(foldersPath)) {
        client.logger.error('Commands directory not found!');
        return false;
    }

    readCommands(foldersPath);

    if (commands.length === 0) {
        client.logger.warn('No commands found to deploy');
        return false;
    }

    try {
        client.logger.info(`🔄 Refreshing ${commands.length} application (/) commands...`);

        // Construct and prepare an instance of the REST module
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);

        const clientId = process.env.CLIENT_ID;
        const guildId = process.env.GUILD_ID;

        if (!clientId) {
            client.logger.error('CLIENT_ID is required in .env file');
            return false;
        }

        let data;

        if (guildId) {
            // Deploy to specific guild (for development)
            client.logger.info(`Deploying commands to guild: ${guildId}`);
            
            data = await rest.put( // Deploy new commands
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            );

        // Clear existing guild commands first
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
        client.logger.info('✅ Cleared existing guild commands');
        } else {
            // Deploy globally (for production)
            client.logger.info('Deploying commands globally...');
            
            // Clear existing global commands first
            await rest.put(Routes.applicationCommands(clientId), { body: [] });
            client.logger.info('✅ Cleared existing global commands');
            
            // Deploy new commands
            data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );
        }

        client.logger.info(`✅ Successfully reloaded ${data.length} application (/) commands`);

        // Log deployed commands for debugging
        const commandNames = data.map(cmd => `/${cmd.name}`).join(', ');
        client.logger.info(`📋 Deployed commands: ${commandNames}`);

        if (guildId) {
            client.logger.info('⚠️  Commands deployed to specific guild (development mode)');
        } else {
            client.logger.info('🌍 Commands deployed globally (may take up to 1 hour to propagate)');
        }

        return true;

    } catch (error) {
        client.logger.error('❌ Error deploying commands:');

        // Log more detailed error information from the Discord API
        if (error.rawError) {
            client.logger.error('Discord API Response:', JSON.stringify(error.rawError, null, 2));
        } else {
            client.logger.error(error);
        }

        if (error.status === 401) {
            client.logger.error('Invalid bot token. Please check your DISCORD_TOKEN in .env');
        } else if (error.status === 403) {
            client.logger.error('Bot lacks permissions. Ensure it was invited with the "applications.commands" scope.');
        } else if (error.status === 404) {
            client.logger.error('Application not found. Please check your CLIENT_ID in .env');
        } else if (error.status === 429) {
            const retryAfter = error.rawError?.retry_after ?? 'unknown';
            client.logger.error(`Rate limited by Discord. Please wait ${retryAfter} seconds and try again.`);
        } else if (error.status >= 500) {
            client.logger.error('Discord server error. This is an issue on Discord\'s end. Please try again later.');
        }
        return false;
    }
}

module.exports = { deployCommands };
