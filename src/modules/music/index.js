/**
 * Music Module for DeepQuasar Bot
 * Handles music-related commands and functionality
 */

const fs = require('fs');
const path = require('path');

const moduleInfo = {
    name: 'Music Module',
    description: 'Music playback commands and player management',
    version: '1.0.0',
    commands: ['play', 'pause', 'resume', 'stop', 'skip', 'queue', 'nowplaying', 'volume', 'seek', 'loop', 'filters', 'history', 'search', 'music-status'],
    category: 'Music Commands'
};

/**
 * Load Music module commands and managers
 */
async function load(client) {
    const commandsPath = path.join(__dirname, 'commands');
    const managersPath = path.join(__dirname, 'managers');
    
    let loadedCommands = 0;

    // Load music managers first
    if (fs.existsSync(managersPath)) {
        const managerFiles = fs.readdirSync(managersPath).filter(file => file.endsWith('.js'));
        
        for (const file of managerFiles) {
            const filePath = path.join(managersPath, file);
            
            try {
                delete require.cache[require.resolve(filePath)];
                const Manager = require(filePath);
                
                // Initialize MusicPlayerManager if not already initialized
                if (file === 'MusicPlayerManager.js' && !client.musicPlayerManager) {
                    client.musicPlayerManager = new Manager(client);
                    client.logger.debug('Initialized MusicPlayerManager');
                }
            } catch (error) {
                client.logger.error(`Error loading music manager ${file}:`, error);
            }
        }
    }

    // Load commands
    if (!fs.existsSync(commandsPath)) {
        client.logger.warn('Music module commands directory not found');
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
                client.logger.warn(`Music command at ${filePath} is missing required properties`);
                continue;
            }

            // Set the command in the collection
            client.commands.set(command.data.name, command);
            client.logger.debug(`Loaded Music command: ${command.data.name}`);
            loadedCommands++;

        } catch (error) {
            client.logger.error(`Error loading Music command ${file}:`, error);
        }
    }

    return { commandCount: loadedCommands };
}

/**
 * Unload Music module
 */
async function unload(client) {
    const commands = ['play', 'pause', 'resume', 'stop', 'skip', 'queue', 'nowplaying', 'volume', 'seek', 'loop', 'filters', 'history', 'search', 'music-status'];
    
    commands.forEach(commandName => {
        if (client.commands.has(commandName)) {
            client.commands.delete(commandName);
            client.logger.debug(`Unloaded Music command: ${commandName}`);
        }
    });
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};