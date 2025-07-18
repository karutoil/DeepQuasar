/**
 * LFG Module for DeepQuasar Bot
 * Handles Looking For Group commands and functionality
 */

const fs = require('fs');
const path = require('path');

const moduleInfo = {
    name: 'LFG Module',
    description: 'Commands for Looking For Group functionality',
    version: '1.0.0',
    commands: ['lfg', 'my-lfg', 'lfg-channels', 'lfg-presets', 'lfg-setup', 'lfg-admin', 'lfg-test'],
    category: 'LFG Commands'
};

/**
 * Load LFG module commands and handlers
 */
async function load(client) {
    const commandsPath = path.join(__dirname, 'commands');
    const handlersPath = path.join(__dirname, 'handlers');
    
    let loadedCommands = 0;

    // Load LFG handlers first
    if (fs.existsSync(handlersPath)) {
        const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));
        
        for (const file of handlerFiles) {
            const filePath = path.join(handlersPath, file);
            
            try {
                delete require.cache[require.resolve(filePath)];
                require(filePath);
                client.logger.debug(`Loaded LFG handler: ${file}`);
            } catch (error) {
                client.logger.error(`Error loading LFG handler ${file}:`, error);
            }
        }
    }

    // Load commands
    if (!fs.existsSync(commandsPath)) {
        client.logger.warn('LFG module commands directory not found');
        return { commandCount: 0 };
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        
        try {
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);

            // Validate command structure
            if (!command.data || !command.execute) {
                client.logger.warn(`LFG command at ${filePath} is missing required properties`);
                continue;
            }

            // Set the command in the collection
            client.commands.set(command.data.name, command);
            client.logger.debug(`Loaded LFG command: ${command.data.name}`);
            loadedCommands++;

        } catch (error) {
            client.logger.error(`Error loading LFG command ${file}:`, error);
        }
    }

    return { commandCount: loadedCommands };
}

/**
 * Unload LFG module
 */
async function unload(client) {
    const commands = ['lfg', 'my-lfg', 'lfg-channels', 'lfg-presets', 'lfg-setup', 'lfg-admin', 'lfg-test'];
    
    commands.forEach(commandName => {
        if (client.commands.has(commandName)) {
            client.commands.delete(commandName);
            client.logger.debug(`Unloaded LFG command: ${commandName}`);
        }
    });
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};