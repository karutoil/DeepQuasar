/**
 * Templates Module for DeepQuasar Bot
 * Handles embed template management commands
 */

const fs = require('fs');
const path = require('path');

const moduleInfo = {
    name: 'Templates Module',
    description: 'Commands for managing embed templates',
    version: '1.0.0',
    commands: ['templates'],
    category: 'Template Commands'
};

/**
 * Load Templates module commands
 */
async function load(client) {
    const commandsPath = path.join(__dirname, 'commands');

    // Initialize embed builder sessions (only if templates module is enabled)
    client.embedBuilderSessions = new Map();
    client.embedBuilderMessageContent = new Map();
    client.embedBuilderEditIndex = new Map();
    client.embedBuilderMessages = new Map();

    if (!fs.existsSync(commandsPath)) {
        client.logger.warn('Templates module commands directory not found');
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
                client.logger.warn(`Templates command at ${filePath} is missing required properties`);
                continue;
            }

            // Set the command in the collection
            client.commands.set(command.data.name, command);
            client.logger.debug(`Loaded Templates command: ${command.data.name}`);
            loadedCommands++;

        } catch (error) {
            client.logger.error(`Error loading Templates command ${file}:`, error);
        }
    }

    return { commandCount: loadedCommands };
}

/**
 * Unload Templates module
 */
async function unload(client) {
    const commands = ['templates'];
    
    commands.forEach(commandName => {
        if (client.commands.has(commandName)) {
            client.commands.delete(commandName);
            client.logger.debug(`Unloaded Templates command: ${commandName}`);
        }
    });
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};
