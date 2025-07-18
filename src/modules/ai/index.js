/**
 * AI Module for DeepQuasar Bot
 * Handles AI-related commands like chatbot and ask
 */

const fs = require('fs');
const path = require('path');

const moduleInfo = {
    name: 'AI Module',
    description: 'AI-powered commands including chatbot and ask functionality',
    version: '1.0.0',
    commands: ['ask', 'chatbot'],
    category: 'AI Commands'
};

/**
 * Load AI module commands
 */
async function load(client) {
    const commandsPath = path.join(__dirname, 'commands');
    
    if (!fs.existsSync(commandsPath)) {
        client.logger.warn('AI module commands directory not found');
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
                client.logger.warn(`AI command at ${filePath} is missing required properties`);
                continue;
            }

            // Set the command in the collection
            client.commands.set(command.data.name, command);
            client.logger.debug(`Loaded AI command: ${command.data.name}`);
            loadedCommands++;

        } catch (error) {
            client.logger.error(`Error loading AI command ${file}:`, error);
        }
    }

    return { commandCount: loadedCommands };
}

/**
 * Unload AI module
 */
async function unload(client) {
    const commands = ['ask', 'chatbot'];
    
    commands.forEach(commandName => {
        if (client.commands.has(commandName)) {
            client.commands.delete(commandName);
            client.logger.debug(`Unloaded AI command: ${commandName}`);
        }
    });
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};