/**
 * Autorole Module for DeepQuasar Bot
 * Handles automatic role assignment commands and functionality
 */

const fs = require('fs');
const path = require('path');

const moduleInfo = {
    name: 'Autorole Module',
    description: 'Commands for configuring automatic role assignment',
    version: '1.0.0',
    commands: ['autorole'],
    category: 'Autorole Command'
};

/**
 * Load Autorole module commands and managers
 */
async function load(client) {
    const commandsPath = path.join(__dirname, 'commands');
    const managersPath = path.join(__dirname, 'managers');
    
    let loadedCommands = 0;

    // Load autorole manager first
    if (fs.existsSync(managersPath)) {
        const managerFiles = fs.readdirSync(managersPath).filter(file => file.endsWith('.js'));
        
        for (const file of managerFiles) {
            const filePath = path.join(managersPath, file);
            
            try {
                delete require.cache[require.resolve(filePath)];
                const AutoRoleManager = require(filePath);
                
                // Initialize AutoRoleManager if not already initialized
                if (file === 'AutoRoleManager.js' && !client.autoRoleManager) {
                    client.autoRoleManager = new AutoRoleManager(client);
                    client.logger.debug('Initialized AutoRoleManager');
                }
            } catch (error) {
                client.logger.error(`Error loading autorole manager ${file}:`, error);
            }
        }
    }

    // Load commands
    if (!fs.existsSync(commandsPath)) {
        client.logger.warn('Autorole module commands directory not found');
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
                client.logger.warn(`Autorole command at ${filePath} is missing required properties`);
                continue;
            }

            // Set the command in the collection
            client.commands.set(command.data.name, command);
            client.logger.debug(`Loaded Autorole command: ${command.data.name}`);
            loadedCommands++;

        } catch (error) {
            client.logger.error(`Error loading Autorole command ${file}:`, error);
        }
    }

    return { commandCount: loadedCommands };
}

/**
 * Unload Autorole module
 */
async function unload(client) {
    const commands = ['autorole'];
    
    commands.forEach(commandName => {
        if (client.commands.has(commandName)) {
            client.commands.delete(commandName);
            client.logger.debug(`Unloaded Autorole command: ${commandName}`);
        }
    });
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};