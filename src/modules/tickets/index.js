/**
 * Tickets Module for DeepQuasar Bot
 * Handles ticket system commands and functionality
 */

const fs = require('fs');
const path = require('path');

const moduleInfo = {
    name: 'Tickets Module',
    description: 'Commands for managing support ticket system',
    version: '1.0.0',
    commands: ['ticket', 'config', 'panel', 'dashboard', 'mytickets', 'canned-response', 'fix-tickets'],
    category: 'Ticket Commands'
};

/**
 * Load Tickets module commands and managers
 */
async function load(client) {
    const commandsPath = path.join(__dirname, 'commands');
    const managersPath = path.join(__dirname, 'managers');
    
    let loadedCommands = 0;

    // Load ticket manager first
    if (fs.existsSync(managersPath)) {
        const managerFiles = fs.readdirSync(managersPath).filter(file => file.endsWith('.js'));
        
        for (const file of managerFiles) {
            const filePath = path.join(managersPath, file);
            
            try {
                delete require.cache[require.resolve(filePath)];
                const TicketManager = require(filePath);
                
                // Initialize TicketManager if not already initialized
                if (file === 'TicketManager.js' && !client.ticketManager) {
                    client.ticketManager = new TicketManager(client);
                    client.logger.debug('Initialized TicketManager');
                }
            } catch (error) {
                client.logger.error(`Error loading ticket manager ${file}:`, error);
            }
        }
    }

    // Load commands
    if (!fs.existsSync(commandsPath)) {
        client.logger.warn('Tickets module commands directory not found');
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
                client.logger.warn(`Tickets command at ${filePath} is missing required properties`);
                continue;
            }

            // Set the command in the collection
            client.commands.set(command.data.name, command);
            client.logger.debug(`Loaded Tickets command: ${command.data.name}`);
            loadedCommands++;

        } catch (error) {
            client.logger.error(`Error loading Tickets command ${file}:`, error);
        }
    }

    return { commandCount: loadedCommands };
}

/**
 * Unload Tickets module
 */
async function unload(client) {
    const commands = ['ticket', 'config', 'panel', 'dashboard', 'mytickets', 'canned-response', 'fix-tickets'];
    
    commands.forEach(commandName => {
        if (client.commands.has(commandName)) {
            client.commands.delete(commandName);
            client.logger.debug(`Unloaded Tickets command: ${commandName}`);
        }
    });
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};