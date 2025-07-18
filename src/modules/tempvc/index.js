/**
 * TempVC Module for DeepQuasar Bot
 * Handles temporary voice channel commands and functionality
 */

const fs = require('fs');
const path = require('path');

const moduleInfo = {
    name: 'TempVC Module',
    description: 'Commands for managing temporary voice channels',
    version: '1.0.0',
    commands: ['tempvc', 'vc', 'list', 'templates'],
    category: 'TempVC Commands'
};

/**
 * Load TempVC module commands and managers
 */
async function load(client) {
    const commandsPath = path.join(__dirname, 'commands');
    const managersPath = path.join(__dirname, 'managers');
    
    let loadedCommands = 0;

    // Load tempvc manager first
    if (fs.existsSync(managersPath)) {
        const managerFiles = fs.readdirSync(managersPath).filter(file => file.endsWith('.js'));
        
        for (const file of managerFiles) {
            const filePath = path.join(managersPath, file);
            
            try {
                delete require.cache[require.resolve(filePath)];
                const TempVCManager = require(filePath);
                
                // Initialize TempVCManager if not already initialized
                if (file === 'TempVCManager.js' && !client.tempVCManager) {
                    client.tempVCManager = new TempVCManager(client);
                    client.logger.debug('Initialized TempVCManager');
                }
            } catch (error) {
                client.logger.error(`Error loading tempvc manager ${file}:`, error);
            }
        }
    }

    // Load commands
    if (!fs.existsSync(commandsPath)) {
        client.logger.warn('TempVC module commands directory not found');
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
                client.logger.warn(`TempVC command at ${filePath} is missing required properties`);
                continue;
            }

            // Set the command in the collection
            client.commands.set(command.data.name, command);
            client.logger.debug(`Loaded TempVC command: ${command.data.name}`);
            loadedCommands++;

        } catch (error) {
            client.logger.error(`Error loading TempVC command ${file}:`, error);
        }
    }

    return { commandCount: loadedCommands };
}

/**
 * Unload TempVC module
 */
async function unload(client) {
    const commands = ['tempvc', 'vc', 'list', 'templates'];
    
    commands.forEach(commandName => {
        if (client.commands.has(commandName)) {
            client.commands.delete(commandName);
            client.logger.debug(`Unloaded TempVC command: ${commandName}`);
        }
    });
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};