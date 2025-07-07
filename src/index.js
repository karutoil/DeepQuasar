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
        this.client.manager.on('nodeConnect', (node) => {
            logger.info(`Moonlink node "${node.identifier}" connected successfully`);
        });

        this.client.manager.on('nodeDisconnect', (node) => {
            logger.warn(`Moonlink node "${node.identifier}" disconnected`);
        });

        this.client.manager.on('nodeError', (node, error) => {
            logger.error(`Moonlink node "${node.identifier}" error:`, error);
        });

        this.client.manager.on('nodeReconnect', (node) => {
            logger.info(`Moonlink node "${node.identifier}" reconnecting...`);
        });

        // Track events
        this.client.manager.on('trackStart', (player, track) => {
/*             const channel = this.client.channels.cache.get(player.textChannelId);
            if (channel) {
                // logger.info(`Now playing: ${track.title} in ${player.guildId}`);
                // Send now playing message (optional - you can customize this)
                // channel.send(`🎵 Now playing: **${track.title}**`);
            } */
        });

        // Player connection events
        this.client.manager.on('playerConnect', (player) => {
            logger.info(`Player connected to voice channel ${player.voiceChannelId} in guild ${player.guildId}`);
        });

        this.client.manager.on('playerDisconnect', (player) => {
            logger.info(`Player disconnected from voice channel in guild ${player.guildId}`);
        });

        this.client.manager.on('playerDestroy', (player) => {
            logger.info(`Player destroyed in guild ${player.guildId}`);
        });

        this.client.manager.on('playerCreate', (player) => {
            logger.info(`Player created for guild ${player.guildId}, voice channel ${player.voiceChannelId}`);
        });

        this.client.manager.on('trackEnd', (player, track) => {
            logger.debug(`Track ended: ${track.title} in ${player.guildId}`);
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

        // Add voice connection events
        this.client.manager.on('playerMove', (player, oldChannelId, newChannelId) => {
            logger.info(`Player moved from channel ${oldChannelId} to ${newChannelId} in guild ${player.guildId}`);
        });

        this.client.manager.on('playerUpdate', (player) => {
            logger.debug(`Player updated for guild ${player.guildId}, connected: ${player.connected}, state: ${player.state}`);
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
                                ? this.client.logger.warn(`[TempVC] Failed to delete channel ${channel.id}: ${err}`)
                                : null;
                        }
                    }
                }
                if (cleanedUpCount > 0) {
                    logger.info(`[TempVC] Deleted ${cleanedUpCount} empty temp voice channel(s) on startup.`);
                }
            } catch (err) {
                this.client.logger?.error
                    ? this.client.logger.error(`[TempVC] Error during startup cleanup: ${err}`)
                    : console.error(`[TempVC] Error during startup cleanup: ${err}`);
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
                                logger.info(`Destroying player for guild: ${guildId}`);
                                await player.destroy();
                                destroyedCount++;
                            } catch (error) {
                                logger.error(`Error destroying player for guild ${guildId}:`, error);
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
                                    logger.info(`Disconnected from Moonlink node: ${id}`);
                                }
                            } catch (error) {
                                logger.error(`Error disconnecting from Moonlink node ${id}:`, error);
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

process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    bot.shutdown();
});

// Handle Docker stop signal
process.on('SIGQUIT', () => {
    logger.info('Received SIGQUIT');
    bot.shutdown();
});

// Start the bot
bot.start();
