// --- Fallback for very early errors (before logger loads) ---
process.on('uncaughtException', (err) => {
    try {
        // Try to use logger if available
        if (global.logger && typeof global.logger.error === 'function') {
            global.logger.error('Early uncaught exception:', err);
        }
    } catch {}
    // Always log to console as last resort
    console.error('Early uncaught exception:', err);
});
process.on('unhandledRejection', (err) => {
    try {
        if (global.logger && typeof global.logger.error === 'function') {
            global.logger.error('Early unhandled rejection:', err);
        }
    } catch {}
    console.error('Early unhandled rejection:', err);
});
// --- End fallback ---

require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { Manager } = require('moonlink.js');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Import utilities
const logger = require('./utils/logger');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { deployCommands } = require('./utils/deployCommands');
const config = require('./config/bot');
const MusicPlayerManager = require('./utils/MusicPlayerManager');
const ChatBot = require('./utils/ChatBot');
const AutoRoleManager = require('./utils/AutoRoleManager');
const SelfRoleManager = require('./utils/SelfRoleManager');
const TicketManager = require('./utils/TicketManager');

 // Import database models
require('./schemas/Guild');
require('./schemas/User');
require('./schemas/SelfRole');
require('./schemas/EmbedTemplate');
require('./schemas/Reminder'); // <-- Ensure Reminder schema is initialized

// Import ReminderManager
const ReminderManager = require('./reminderManager');

class MusicBot {
    constructor() {
        // Initialize Discord client
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildInvites
            ]
        });

        // Initialize collections
        this.client.commands = new Collection();
        this.client.cooldowns = new Collection();
        this.client.config = config;
        this.client.logger = logger;
        this.client.players = new Collection(); // Store active players

        // Initialize embed builder sessions
        this.client.embedBuilderSessions = new Map();
        this.client.embedBuilderMessageContent = new Map();
        this.client.embedBuilderEditIndex = new Map();
        this.client.embedBuilderMessages = new Map();

        // Initialize Music Player Manager
        this.client.musicPlayerManager = new MusicPlayerManager(this.client);

        // Initialize Chatbot service
        this.client.chatBot = ChatBot;

        // Initialize AutoRole Manager
        this.client.autoRoleManager = new AutoRoleManager(this.client);

        // Initialize SelfRole Manager
        this.client.selfRoleManager = new SelfRoleManager(this.client);

        // Initialize Ticket Manager
        this.client.ticketManager = new TicketManager(this.client);

        // Initialize Temp VC Manager
        const TempVCManager = require('./utils/TempVCManager');
        this.client.tempVCManager = new TempVCManager(this.client);

        // Initialize Moonlink Manager
        this.setupMoonlink();
    }

    setupMoonlink() {
        // Create Moonlink Manager instance
        logger.info('Setting up Moonlink with config:', {
            host: config.lavalink.host,
            port: config.lavalink.port,
            secure: config.lavalink.secure
        });

        this.client.manager = new Manager({
            nodes: [{
                identifier: 'main',
                host: config.lavalink.host,
                port: config.lavalink.port,
                password: config.lavalink.password,
                secure: config.lavalink.secure || false,
            }],
            sendPayload: (guildId, payload) => {
                const guild = this.client.guilds.cache.get(guildId);
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
            }
        });


        // Setup Moonlink event handlers
        this.setupMoonlinkEvents();

        // Handle raw events for voice state updates
        this.client.on('raw', (packet) => {
            this.client.manager.packetUpdate(packet);
        });
    }

    setupMoonlinkEvents() {
        // Node connection events
        // Node connection events (Moonlink.js 4.44.4 event names)
        this.client.manager.on('nodeReady', (node, stats) => {
            logger.info(`Moonlink node "${node.identifier}" is ready. Stats:`, stats);
        });

        this.client.manager.on('nodeConnected', (node) => {
            logger.info(`Moonlink node "${node.identifier}" connected successfully`);

            // Log Moonlink.js and Lavalink versions
            const moonlinkVersion = require('moonlink.js').version || 'Unknown';
            const lavalinkVersion = node.version || 'Unknown';

            if (lavalinkVersion === 'Unknown') {
                logger.warn('Lavalink server version could not be determined. Ensure the server is running and accessible.');
            }

            const formatBoxLine = (content, width = 60) => {
                const padding = width - content.length;
                const leftPad = Math.floor(padding / 2);
                const rightPad = padding - leftPad;
                return `║${' '.repeat(leftPad)}${content}${' '.repeat(rightPad)}║`;
            };

            const boxWidth = 60;
            const boxLines = [
                'Moonlink.js Initialized',
                '',
                `Moonlink.js Version: ${moonlinkVersion}`,
                `Lavalink Server Version: ${lavalinkVersion}`,
                '',
                `Node Identifier: ${node.identifier}`,
                `Host: ${node.host}`,
                `Port: ${node.port}`,
                `Secure: ${node.secure ? 'No' : 'Yes'}`,
                ''
            ];

            const formattedBox = [
                `╔${'═'.repeat(boxWidth)}╗`,
                ...boxLines.map(line => formatBoxLine(line, boxWidth)),
                `╚${'═'.repeat(boxWidth)}╝`
            ].join('\n');

            logger.info(formattedBox);
        });

        this.client.manager.on('nodeDisconnected', (node, code, reason) => {
            logger.warn(`Moonlink node "${node.identifier}" disconnected. Code: ${code}, Reason: ${reason || 'Unknown'}`);
        });

        this.client.manager.on('nodeError', (node, error) => {
            logger.error(`Moonlink node "${node.identifier}" error:`, error || 'Unknown error');
        });

        this.client.manager.on('nodeReconnect', (node) => {
            logger.info(`Moonlink node "${node.identifier}" reconnecting...`);
        });

        // Track events
        this.client.manager.on('trackStart', (player, track) => {
            // Optionally log or send a message
        });

        this.client.manager.on('trackEnd', (player, track, type, payload) => {
            logger.debug(`Track ended: ${track?.title || 'Unknown'} in ${player.guildId} (type: ${type || 'Unknown'})`);
        });

        this.client.manager.on('queueEnd', (player) => {
            const channel = this.client.channels.cache.get(player.textChannelId);
            if (channel) {
                channel.send('Queue ended. Disconnecting in 30 seconds if no new tracks are added.');
            }
            
            // Disconnect after a delay if no new tracks are added
            setTimeout(() => {
                if (!player.playing && player.queue.size === 0) {
                    player.destroy();
                    if (channel) {
                        channel.send('Disconnected due to inactivity.');
                    }
                }
            }, 30000);
        });

        // Player events
        this.client.manager.on('playerCreate', (player) => {
            logger.info(`Player created for guild ${player.guildId}, voice channel ${player.voiceChannelId || 'Unknown'}`);
        });

        this.client.manager.on('playerDestroy', (player, reason) => {
            logger.info(`Player destroyed in guild ${player.guildId}. Reason: ${reason || 'Unknown'}`);
        });

        this.client.manager.on('playerConnected', (player) => {
            logger.info(`Player connected to voice channel ${player.voiceChannelId || 'Unknown'} in guild ${player.guildId}`);
        });

        this.client.manager.on('playerDisconnected', (player) => {
            logger.info(`Player disconnected from voice channel in guild ${player.guildId || 'Unknown'}`);
        });

        this.client.manager.on('playerMoved', (player, oldChannel, newChannel) => {
            logger.info(`Player moved from channel ${oldChannel || 'Unknown'} to ${newChannel || 'Unknown'} in guild ${player.guildId}`);
        });

        this.client.manager.on('playerUpdate', (player, track, payload) => {
            logger.debug(`Player updated for guild ${player.guildId}, connected: ${player.connected || 'Unknown'}, state: ${player.state || 'Unknown'}`);
        });
    }

    async connectDatabase() {
        try {
            // Try to connect to MongoDB
            await mongoose.connect(config.database.uri);
            logger.info('Connected to MongoDB successfully');
        } catch (error) {
            logger.error('Failed to connect to MongoDB:', error);
            
            // In development, provide helpful error messages
            if (process.env.NODE_ENV === 'development') {
                logger.info('');
                logger.info('🗄️  MongoDB Connection Failed - Development Tips:');
                logger.info('1. Make sure MongoDB is installed and running');
                logger.info('2. Start MongoDB: sudo systemctl start mongod');
                logger.info('3. Or use Docker: docker run --name mongo-dev -p 27017:27017 -d mongo');
                logger.info('4. Check your MONGODB_URI in .env file');
                logger.info('');
                logger.info('Run: node setup-dev.js for setup assistance');
                logger.info('');
            }
            
            process.exit(1);
        }
    }

    async loadHandlers() {
        try {
            // Load commands
            await loadCommands(this.client);
            logger.info('Commands loaded successfully');

            // Load events
            await loadEvents(this.client);
            logger.info('Events loaded successfully');
        } catch (error) {
            logger.error('Failed to load handlers:', error);
            process.exit(1);
        }
    }

    async start() {
        try {
            // Connect to database
            await this.connectDatabase();

            // Load handlers
            await this.loadHandlers();

            // Deploy commands automatically (can be disabled with AUTO_DEPLOY_COMMANDS=false)
            const autoDeployEnabled = process.env.AUTO_DEPLOY_COMMANDS !== 'false';
            if (autoDeployEnabled) {
                logger.info('🚀 Auto-deploying slash commands...');
                const deploySuccess = await deployCommands(this.client);
                
                if (!deploySuccess) {
                    logger.warn('⚠️  Command deployment failed, but continuing startup...');
                }
            } else {
                logger.info('⏭️  Auto-deployment disabled via AUTO_DEPLOY_COMMANDS=false');
            }

            // Login to Discord
            await this.client.login(config.bot.token);
            logger.info('Bot started successfully');

            // Set bot activity
            this.client.user.setActivity('🚀 Starting up...', { type: ActivityType.Playing });

            // --- ReminderManager Startup ---
            this.client.reminderManager = new ReminderManager(this.client);
            this.client.reminderManager.loadReminders();

            // --- Temp VC Cleanup on Startup ---
            try {
                const TempVCInstance = require('./schemas/TempVCInstance');
                const TempVCUserSettings = require('./schemas/TempVCUserSettings');
                let cleanedUpCount = 0;
                const tempVCs = await TempVCInstance.find({});
                for (const instance of tempVCs) {
                    const guild = this.client.guilds.cache.get(instance.guildId);
                    if (!guild) continue;
                    const channel = guild.channels.cache.get(instance.channelId);
                    if (!channel || channel.type !== 2) continue; // 2 = GuildVoice
                    if (channel.members.size === 0) {
                        try {
                            // Delete the channel
                            await channel.delete('Auto-cleanup: empty temp VC on startup');
                            // Persist blocked users if needed (as in deleteTempChannel)
                            try {
                                if (instance && instance.ownerId && instance.permissions && Array.isArray(instance.permissions.blockedUsers)) {
                                    const userSettings = await TempVCUserSettings.findByUser(instance.guildId, instance.ownerId);
                                    if (userSettings) {
                                        userSettings.defaultSettings.blockedUsers = instance.permissions.blockedUsers;
                                        await userSettings.save();
                                    } else {
                                        await TempVCUserSettings.createOrUpdate(
                                            instance.guildId,
                                            instance.ownerId,
                                            { defaultSettings: { blockedUsers: instance.permissions.blockedUsers } }
                                        );
                                    }
                                }
                            } catch (err) {
                                this.client.logger?.error
                                    ? this.client.logger.error('Failed to persist blocked users for temp VC:', err)
                                    : console.error('Failed to persist blocked users for temp VC:', err);
                            }
                            // Delete the instance record
                            await TempVCInstance.deleteOne({ _id: instance._id });
                            cleanedUpCount++;
                        } catch (err) {
                            this.client.logger?.warn
                                ? this.client.logger.warn(`[TempVC] Failed to delete channel ${channel?.id || 'Unknown'}: ${err || 'Unknown error'}`)
                                : null;
                        }
                    }
                }
                if (cleanedUpCount > 0) {
                    logger.info(`[TempVC] Deleted ${cleanedUpCount} empty temp voice channel(s) on startup.`);
                }
            } catch (err) {
                this.client.logger?.error
                    ? this.client.logger.error(`[TempVC] Error during startup cleanup: ${err || 'Unknown error'}`)
                    : console.error(`[TempVC] Error during startup cleanup: ${err || 'Unknown error'}`);
            }
            // --- End Temp VC Cleanup ---

            // Setup chatbot cleanup interval (every 5 minutes)
            setInterval(() => {
                this.client.chatBot.cleanupCooldowns();
            }, 5 * 60 * 1000);

        } catch (error) {
            logger.error('Failed to start bot:', error);
            process.exit(1);
        }
    }

    // Graceful shutdown
    async shutdown() {
        logger.info('Shutting down bot...');
        
        // Set a timeout to force shutdown if it takes too long
        const shutdownTimeout = setTimeout(() => {
            logger.warn('Shutdown timeout reached, forcing exit...');
            process.exit(1);
        }, 10000); // 10 seconds timeout

        try {
            // Destroy all music players and disconnect from voice channels
            if (this.client.manager && this.client.manager.players) {
                logger.info('Closing all music players...');
                
                let destroyedCount = 0;
                try {
                    // Moonlink.js V4 PlayerManager has a cache property
                    if (this.client.manager.players.cache) {
                        for (const [guildId, player] of this.client.manager.players.cache) {
                            try {
                                logger.info(`Destroying player for guild: ${guildId || 'Unknown'}`);
                                await player.destroy();
                                destroyedCount++;
                            } catch (error) {
                                logger.error(`Error destroying player for guild ${guildId || 'Unknown'}:`, error || 'Unknown error');
                            }
                        }
                    }
                } catch (error) {
                    logger.error('Error accessing players:', error);
                }
                
                logger.info(`Closed ${destroyedCount} music players`);
            }

            // Close Moonlink connections
            if (this.client.manager && this.client.manager.nodes) {
                logger.info('Closing Moonlink connections...');
                try {
                    if (this.client.manager.nodes.cache) {
                        for (const [id, node] of this.client.manager.nodes.cache) {
                            try {
                                if (node.disconnect) {
                                    node.disconnect();
                                    logger.info(`Disconnected from Moonlink node: ${id || 'Unknown'}`);
                                }
                            } catch (error) {
                                logger.error(`Error disconnecting from Moonlink node ${id || 'Unknown'}:`, error || 'Unknown error');
                            }
                        }
                    }
                } catch (error) {
                    logger.error('Error accessing nodes:', error);
                }
            }

            // Close database connection
            if (mongoose.connection.readyState === 1) {
                logger.info('Closing database connection...');
                await mongoose.connection.close();
                logger.info('Database connection closed');
            }
            
        } catch (error) {
            logger.error('Error during shutdown:', error);
        }

        // Clear the timeout since we completed successfully
        clearTimeout(shutdownTimeout);

        // Destroy Discord client
        logger.info('Destroying Discord client...');
        this.client.destroy();
        
        logger.info('Bot shutdown complete');
        process.exit(0);
    }
}

// Initialize bot
const bot = new MusicBot();

// Handle process events
process.on('SIGINT', () => {
    logger.info('Received SIGINT (Ctrl+C)');
    bot.shutdown();
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM');
    bot.shutdown();
});

process.on('SIGHUP', () => {
    logger.info('Received SIGHUP');
    bot.shutdown();
});

const util = require('util');

// Diagnose stuck Node.js event loop
try {
    require('why-is-node-running');
    console.log('why-is-node-running enabled: will print open handles if process does not exit.');
} catch (e) {
    console.warn('why-is-node-running not installed. Run: npm install why-is-node-running');
}

// Ensure all errors are logged to console as well as logger
function logErrorDetails(prefix, error) {
    try {
        logger.error(`${prefix}:`, util.inspect(error || 'Unknown error', { depth: 5, colors: false }));
        console.error(`${prefix}:`, util.inspect(error || 'Unknown error', { depth: 5, colors: true }));

        // Log stack trace if available
        if (error && error.stack) {
            logger.error('Stack trace:', error.stack);
            console.error('Stack trace:', error.stack);
        }

        // Log error object properties
        if (error && typeof error === 'object') {
            logger.error('Error details (JSON):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            console.error('Error details (JSON):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        }
    } catch (e) {
        console.error('Failed to log error details:', e || 'Unknown error');
    }
}

process.on('unhandledRejection', (error) => {
    logErrorDetails('Unhandled promise rejection', error);
});

process.on('uncaughtException', (error) => {
    logErrorDetails('Uncaught exception', error);
    bot.shutdown();
});

// Handle Docker stop signal
process.on('SIGQUIT', () => {
    logger.info('Received SIGQUIT');
    bot.shutdown();
});

/**
 * Start the bot and log full error stack if startup fails
 */
// Ensure startup errors are logged to console as well as logger
// Ensure startup errors are logged with full details
// Ensure startup errors are logged with full details
// --- TEST: Simulate a startup error to confirm logging works ---
// Uncomment the next line to test error logging on startup
// throw new Error('Simulated startup error for logging test');
// --- END TEST ---

(async () => {
    try {
        await bot.start();
        console.log('Bot startup completed.'); // Confirm startup reached here
    } catch (err) {
        logErrorDetails('Fatal error during bot startup', err);
        process.exit(1);
    }
    // If process is still running and no error, log a message
    setTimeout(() => {
        logErrorDetails('Startup appears to be stuck. No error was thrown, but bot did not finish startup.', {});
        // Force an error to test error logging
        try {
            throw new Error('Forced error: Startup stuck after 15 seconds');
        } catch (err) {
            logErrorDetails('Forced error thrown after 15s', err);
        }
    }, 15000);
})();
