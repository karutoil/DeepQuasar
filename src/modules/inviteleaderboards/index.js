const path = require('path');
const fs = require('fs');

const moduleInfo = {
    name: 'Invite Leaderboards Module',
    description: 'Provides a paginated leaderboard of server invites.',
    version: '1.0.0',
    commands: ['inviteleaderboard'],
    category: 'Information'
};

/**
 * Loads commands and other components for the module.
 * @param {Client} client The Discord.js client instance.
 * @returns {object} An object containing the count of loaded commands.
 */
async function load(client) {
    const commandsPath = path.join(__dirname, 'commands');
    let commandCount = 0;
    // moduleInfo.commands = []; // Now hardcoded above

    if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            try {
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath);
                if (command.data && command.execute) {
                    client.commands.set(command.data.name, command);
                    moduleInfo.commands.push(command.data.name);
                    commandCount++;
                    client.logger.debug(`Loaded command: ${command.data.name} from Invite Leaderboards module`);
                } else {
                    client.logger.warn(`Command at ${filePath} is missing 'data' or 'execute' properties.`);
                }
            } catch (error) {
                client.logger.error(`Failed to load command ${file} in Invite Leaderboards module:`, error);
            }
        }
    }
    client.logger.info(`Invite Leaderboards Module loaded with ${commandCount} commands.`);
    return { commandCount };
}

/**
 * Unloads components and performs cleanup for the module.
 * @param {Client} client The Discord.js client instance.
 */
async function unload(client) {
    // Hardcoded command list for unloading
    const commands = ['inviteleaderboard'];
    for (const cmdName of commands) {
        client.logger.info(`[DEBUG] Deleting command from Invite Leaderboards module: ${cmdName}`);
        client.commands.delete(cmdName);
        client.logger.debug(`Unloaded Invite Leaderboards command: ${cmdName}`);
    }
    client.logger.info('Invite Leaderboards Module unloaded.');
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};
