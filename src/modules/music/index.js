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

    // --- Moonlink Setup and Event Handlers ---
    const config = client.config;
    const logger = client.logger;
    const { Manager } = require('moonlink.js');
    const { EmbedBuilder } = require('discord.js');

    if (!client.manager) {
        logger.info('Setting up Moonlink with config:', {
            host: config.lavalink.host,
            port: config.lavalink.port,
            secure: config.lavalink.secure
        });

        client.manager = new Manager({
            nodes: [{
                identifier: 'main',
                host: config.lavalink.host,
                port: config.lavalink.port,
                password: config.lavalink.password,
                secure: config.lavalink.secure || false,
                retryAmount: 10,
                retryDelay: 5000,
            }],
            sendPayload: (guildId, payload) => {
                const guild = client.guilds.cache.get(guildId);
                if (guild) {
                    let parsedPayload = payload;
                    if (typeof payload === 'string') {
                        try {
                            parsedPayload = JSON.parse(payload);
                        } catch (error) {
                            logger.error('Failed to parse voice payload:', error);
                            return;
                        }
                    }
                    guild.shard.send(parsedPayload);
                }
            },
            options: {
                autoPlay: true,
                disableNativeSources: true,
                resume: true,
                autoResume: true,
                movePlayersOnReconnect: true,
                sortTypeNode: 'players',
            }
        });

        // Setup Moonlink event handlers
        setupMoonlinkEvents(client);

        // Handle raw events for voice state updates
        client.on('raw', (packet) => {
            client.manager.packetUpdate(packet);
        });
    }

    // Start autocleanup of inactive players every 5 minutes
    if (client.musicPlayerManager) {
        if (client._musicCleanupInterval) clearInterval(client._musicCleanupInterval);
        client._musicCleanupInterval = setInterval(async () => {
            try {
                const players = client.musicPlayerManager.getAllPlayers();
                let cleanedCount = 0;
                for (const [guildId, player] of players.entries()) {
                    if (!player.playing && !player.paused && player.queue.size === 0) {
                        const lastActivity = player.lastActivity || Date.now();
                        const inactiveTime = Date.now() - lastActivity;
                        if (inactiveTime > 10 * 60 * 1000) { // 10 minutes
                            try {
                                await player.destroy();
                                cleanedCount++;
                            } catch (error) {
                                client.logger.error(`Error destroying inactive player for guild ${guildId}:`, error);
                            }
                        }
                    }
                }
                if (cleanedCount > 0) {
                    client.logger.info(`Cleaned up ${cleanedCount} inactive players`);
                }
            } catch (err) {
                client.logger.error('Error during music autocleanup:', err);
            }
        }, 5 * 60 * 1000);
    }

    return { commandCount: loadedCommands };
}

function setupMoonlinkEvents(client) {
    const logger = client.logger;
    const { EmbedBuilder } = require('discord.js');
    // (Paste all event handler logic from index.js here)
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

/**
 * Get the number of active music players
 * @param {Client} client - The Discord client
 * @returns {number}
 */
function getActivePlayerCount(client) {
    if (client.musicPlayerManager && typeof client.musicPlayerManager.getPlayerCount === 'function') {
        return client.musicPlayerManager.getPlayerCount();
    }
    return 0;
}

module.exports = {
    info: moduleInfo,
    load,
    unload,
    getActivePlayerCount
};