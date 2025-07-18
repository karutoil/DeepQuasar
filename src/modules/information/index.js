/**
 * Information Module for DeepQuasar Bot
 * Handles information display commands like help, stats, etc.
 */

const fs = require('fs');
const path = require('path');

const moduleInfo = {
    name: 'Information Module',
    description: 'Commands for displaying bot and server information',
    version: '1.0.0',
    commands: ['help', 'stats', 'globalstats', 'linecount', 'selfrole-help'],
    category: 'Information Commands'
};

/**
 * Load Information module commands
 */
async function load(client) {
    const commandsPath = path.join(__dirname, 'commands');
    
    if (!fs.existsSync(commandsPath)) {
        client.logger.warn('Information module commands directory not found');
        return { commandCount: 0 };
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    let loadedCommands = 0;

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        
        try {
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);

            // Validate command structure
            if (!command.data || !command.execute) {
                client.logger.warn(`Information command at ${filePath} is missing required properties`);
                continue;
            }

            // Set the command in the collection
            client.commands.set(command.data.name, command);
            client.logger.debug(`Loaded Information command: ${command.data.name}`);
            loadedCommands++;

        } catch (error) {
            client.logger.error(`Error loading Information command ${file}:`, error);
        }
    }

    return { commandCount: loadedCommands };
}

/**
 * Unload Information module
 */
async function unload(client) {
    const commands = ['help', 'stats', 'globalstats', 'linecount', 'selfrole-help'];
    
    commands.forEach(commandName => {
        if (client.commands.has(commandName)) {
            client.commands.delete(commandName);
            client.logger.debug(`Unloaded Information command: ${commandName}`);
        }
    });
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};