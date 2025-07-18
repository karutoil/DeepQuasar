/**
 * Selfrole Module for DeepQuasar Bot
 * Handles self-assignable role commands and functionality
 */

const fs = require('fs');
const path = require('path');

const moduleInfo = {
    name: 'Selfrole Module',
    description: 'Commands for managing self-assignable roles',
    version: '1.0.0',
    commands: ['selfrole', 'selfrole-advanced', 'selfrole-setup'],
    category: 'Selfrole Commands'
};

/**
 * Load Selfrole module commands and managers
 */
async function load(client) {
    const commandsPath = path.join(__dirname, 'commands');
    const managersPath = path.join(__dirname, 'managers');
    
    let loadedCommands = 0;

    // Initialize SelfRoleManager from utils if not already initialized
    if (!client.selfRoleManager) {
        const SelfRoleManager = require('../../utils/SelfRoleManager');
        client.selfRoleManager = new SelfRoleManager(client);
        client.logger.debug('Initialized SelfRoleManager from utils');
    }

    // Load commands
    if (!fs.existsSync(commandsPath)) {
        client.logger.warn('Selfrole module commands directory not found');
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
                client.logger.warn(`Selfrole command at ${filePath} is missing required properties`);
                continue;
            }

            // Set the command in the collection
            client.commands.set(command.data.name, command);
            client.logger.debug(`Loaded Selfrole command: ${command.data.name}`);
            loadedCommands++;

        } catch (error) {
            client.logger.error(`Error loading Selfrole command ${file}:`, error);
        }
    }

    return { commandCount: loadedCommands };
}

/**
 * Unload Selfrole module
 */
async function unload(client) {
    const commands = ['selfrole', 'selfrole-advanced', 'selfrole-setup'];
    
    commands.forEach(commandName => {
        if (client.commands.has(commandName)) {
            client.commands.delete(commandName);
            client.logger.debug(`Unloaded Selfrole command: ${commandName}`);
        }
    });
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};