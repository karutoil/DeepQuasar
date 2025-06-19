const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

async function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    
    if (!fs.existsSync(commandsPath)) {
        client.logger.warn('Commands directory not found, creating it...');
        fs.mkdirSync(commandsPath, { recursive: true });
        return;
    }

    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        
        if (!fs.statSync(folderPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            
            try {
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath);

                // Validate command structure
                if (!command.data || !command.execute) {
                    client.logger.warn(`Command at ${filePath} is missing required properties`);
                    continue;
                }

                // Set the command in the collection
                client.commands.set(command.data.name, command);
                client.logger.debug(`Loaded command: ${command.data.name}`);

            } catch (error) {
                client.logger.error(`Error loading command ${file}:`, error);
            }
        }
    }

    client.logger.info(`Loaded ${client.commands.size} commands`);
}

async function reloadCommand(client, commandName) {
    const command = client.commands.get(commandName);
    
    if (!command) {
        throw new Error(`Command ${commandName} not found`);
    }

    // Find the command file
    const commandsPath = path.join(__dirname, '../commands');
    const commandFolders = fs.readdirSync(commandsPath);
    
    let commandPath = null;
    
    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        if (!fs.statSync(folderPath).isDirectory()) continue;
        
        const files = fs.readdirSync(folderPath);
        const file = files.find(f => f.endsWith('.js'));
        
        if (file) {
            const filePath = path.join(folderPath, file);
            const tempCommand = require(filePath);
            
            if (tempCommand.data && tempCommand.data.name === commandName) {
                commandPath = filePath;
                break;
            }
        }
    }
    
    if (!commandPath) {
        throw new Error(`Command file for ${commandName} not found`);
    }
    
    // Delete from cache and reload
    delete require.cache[require.resolve(commandPath)];
    const newCommand = require(commandPath);
    
    // Validate new command
    if (!newCommand.data || !newCommand.execute) {
        throw new Error(`Reloaded command ${commandName} is missing required properties`);
    }
    
    // Update the command in the collection
    client.commands.set(newCommand.data.name, newCommand);
    
    return newCommand;
}

async function getCommandCategories(client) {
    const categories = new Collection();
    
    client.commands.forEach(command => {
        const category = command.category || 'Other';
        
        if (!categories.has(category)) {
            categories.set(category, []);
        }
        
        categories.get(category).push(command);
    });
    
    return categories;
}

module.exports = {
    loadCommands,
    reloadCommand,
    getCommandCategories
};
