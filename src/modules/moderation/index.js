/**
 * Moderation Module for DeepQuasar Bot
 * Handles moderation commands and functionality
 */

const fs = require('fs');
const path = require('path');

const moduleInfo = {
    name: 'Moderation Module',
    description: 'Commands for server moderation and user management',
    version: '1.0.0',
    commands: ['ban', 'kick', 'mute', 'unmute', 'warn', 'strike', 'unban', 'softban', 'lock', 'unlock', 'slowmode', 'note', 'modhistory', 'warnlist', 'reason', 'pardon', 'appeal', 'setup-moderation'],
    category: 'Moderation Commands'
};

/**
 * Load Moderation module commands
 */
async function load(client) {
    const commandsPath = path.join(__dirname, 'commands');
    
    if (!fs.existsSync(commandsPath)) {
        client.logger.warn('Moderation module commands directory not found');
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
                client.logger.warn(`Moderation command at ${filePath} is missing required properties`);
                continue;
            }

            // Set the command in the collection
            client.commands.set(command.data.name, command);
            client.logger.debug(`Loaded Moderation command: ${command.data.name}`);
            loadedCommands++;

        } catch (error) {
            client.logger.error(`Error loading Moderation command ${file}:`, error);
        }
    }

    return { commandCount: loadedCommands };
}

/**
 * Unload Moderation module
 */
async function unload(client) {
    const commands = ['ban', 'kick', 'mute', 'unmute', 'warn', 'strike', 'unban', 'softban', 'lock', 'unlock', 'slowmode', 'note', 'modhistory', 'warnlist', 'reason', 'pardon', 'appeal', 'setup-moderation'];
    
    commands.forEach(commandName => {
        if (client.commands.has(commandName)) {
            client.commands.delete(commandName);
            client.logger.debug(`Unloaded Moderation command: ${commandName}`);
        }
    });
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};