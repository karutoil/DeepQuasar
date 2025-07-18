/**
 * General Module for DeepQuasar Bot
 * Handles general bot configuration and utility commands
 */

const fs = require('fs');
const path = require('path');

const moduleInfo = {
    name: 'General Module',
    description: 'General bot configuration and utility commands',
    version: '1.0.0',
    commands: ['settings', 'cleanup', 'create-guild-data', 'debug-welcome', 'embed-builder', 'modlog', 'test-welcome', 'welcome'],
    category: 'General Commands'
};

/**
 * Load General module commands
 */
async function load(client) {
    const commandsPath = path.join(__dirname, 'commands');
    
    if (!fs.existsSync(commandsPath)) {
        client.logger.warn('General module commands directory not found');
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
                client.logger.warn(`General command at ${filePath} is missing required properties`);
                continue;
            }

            // Set the command in the collection
            client.commands.set(command.data.name, command);
            client.logger.debug(`Loaded General command: ${command.data.name}`);
            loadedCommands++;

        } catch (error) {
            client.logger.error(`Error loading General command ${file}:`, error);
        }
    }

    return { commandCount: loadedCommands };
}

/**
 * Unload General module
 */
async function unload(client) {
    const commands = ['settings', 'cleanup', 'create-guild-data', 'debug-welcome', 'embed-builder', 'modlog', 'test-welcome', 'welcome'];
    
    commands.forEach(commandName => {
        if (client.commands.has(commandName)) {
            client.commands.delete(commandName);
            client.logger.debug(`Unloaded General command: ${commandName}`);
        }
    });
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};