/**
 * Reminders Module for DeepQuasar Bot
 * Handles reminder-related commands and functionality
 */

const fs = require('fs');
const path = require('path');

const moduleInfo = {
    name: 'Reminders Module',
    description: 'Commands for creating and managing reminders',
    version: '1.0.0',
    commands: ['remind', 'reminders'],
    category: 'Reminder Commands'
};

/**
 * Load Reminders module commands and managers
 */
async function load(client) {
    const commandsPath = path.join(__dirname, 'commands');
    const managersPath = path.join(__dirname, 'managers');
    
    let loadedCommands = 0;

    // Load reminder manager first
    if (fs.existsSync(managersPath)) {
        const managerFiles = fs.readdirSync(managersPath).filter(file => file.endsWith('.js'));
        
        for (const file of managerFiles) {
            const filePath = path.join(managersPath, file);
            
            try {
                delete require.cache[require.resolve(filePath)];
                const ReminderManager = require(filePath);
                
                // Initialize ReminderManager if not already initialized
                if (file === 'reminderManager.js' && !client.reminderManager) {
                    client.reminderManager = new ReminderManager(client);
                    client.reminderManager.loadReminders();
                    client.logger.debug('Initialized ReminderManager');
                }
            } catch (error) {
                client.logger.error(`Error loading reminder manager ${file}:`, error);
            }
        }
    }

    // Load commands
    if (!fs.existsSync(commandsPath)) {
        client.logger.warn('Reminders module commands directory not found');
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
                client.logger.warn(`Reminders command at ${filePath} is missing required properties`);
                continue;
            }

            // Set the command in the collection
            client.commands.set(command.data.name, command);
            client.logger.debug(`Loaded Reminders command: ${command.data.name}`);
            loadedCommands++;

        } catch (error) {
            client.logger.error(`Error loading Reminders command ${file}:`, error);
        }
    }

    return { commandCount: loadedCommands };
}

/**
 * Unload Reminders module
 */
async function unload(client) {
    const commands = ['remind', 'reminders'];
    
    commands.forEach(commandName => {
        if (client.commands.has(commandName)) {
            client.commands.delete(commandName);
            client.logger.debug(`Unloaded Reminders command: ${commandName}`);
        }
    });
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};