/**
 * Utils Module for DeepQuasar Bot
 * Contains utility commands and functions
 */

const fs = require('fs');
const path = require('path');

const moduleInfo = {
    name: 'Utils Module', 
    description: 'Utility commands and helper functions',
    version: '1.0.0',
    commands: [],
    category: 'Utils Commands'
};

/**
 * Load Utils module commands
 */
async function load(client) {
    const commandsPath = path.join(__dirname, 'commands');
    
    if (!fs.existsSync(commandsPath)) {
        client.logger.info('Utils module commands directory not found - no utility commands to load');
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
                client.logger.warn(`Utils command at ${filePath} is missing required properties`);
                continue;
            }

            // Set the command in the collection
            client.commands.set(command.data.name, command);
            client.logger.debug(`Loaded Utils command: ${command.data.name}`);
            loadedCommands++;

        } catch (error) {
            client.logger.error(`Error loading Utils command ${file}:`, error);
        }
    }

    return { commandCount: loadedCommands };
}

/**
 * Unload Utils module
 */
async function unload(client) {
    // Utils module contains shared utilities - no commands to unload currently
    client.logger.debug('Utils module unloaded');
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};