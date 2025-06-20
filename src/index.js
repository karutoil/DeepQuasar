require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { Shoukaku, Connectors } = require('shoukaku');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Import utilities
const logger = require('./utils/logger');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { deployCommands } = require('./utils/deployCommands');
const config = require('./config/bot');
const MusicPlayerManager = require('./utils/MusicPlayer');
const ChatBot = require('./utils/ChatBot');
const AutoRoleManager = require('./utils/AutoRoleManager');
const SelfRoleManager = require('./utils/SelfRoleManager');
const TicketManager = require('./utils/TicketManager');

// Import database models
require('./schemas/Guild');
require('./schemas/User');
require('./schemas/SelfRole');

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

        // Initialize Music Player Manager
        this.client.musicPlayer = new MusicPlayerManager(this.client);

        // Initialize Chatbot service
        this.client.chatBot = ChatBot;

        // Initialize AutoRole Manager
        this.client.autoRoleManager = new AutoRoleManager(this.client);

        // Initialize SelfRole Manager
        this.client.selfRoleManager = new SelfRoleManager(this.client);

        // Initialize Ticket Manager
        this.client.ticketManager = new TicketManager(this.client);

        // Initialize Lavalink
        this.setupLavalink();
    }

    setupLavalink() {
        // Shoukaku configuration
        const shoukakuOptions = {
            resume: true,
            resumeTimeout: 30,
            resumeByLibrary: true,
            reconnectTries: 10,
            restTimeout: 60000
        };

        const lavalinkNodes = [{
            name: 'main',
            url: `${config.lavalink.host}:${config.lavalink.port}`,
            auth: config.lavalink.password,
            secure: config.lavalink.secure || false
        }];

        // Initialize Shoukaku
        this.client.shoukaku = new Shoukaku(
            new Connectors.DiscordJS(this.client),
            lavalinkNodes,
            shoukakuOptions
        );

        // Lavalink event handlers
        this.setupLavalinkEvents();
    }

    setupLavalinkEvents() {
        this.client.shoukaku.on('ready', (name) => {
            logger.info(`Lavalink node "${name}" connected successfully`);
        });

        this.client.shoukaku.on('error', (name, error) => {
            logger.error(`Lavalink node "${name}" error:`, error);
        });

        this.client.shoukaku.on('close', (name, code, reason) => {
            logger.warn(`Lavalink node "${name}" closed with code ${code}: ${reason}`);
        });

        this.client.shoukaku.on('disconnect', (name, players, moved) => {
            logger.warn(`Lavalink node "${name}" disconnected. Players: ${players}, Moved: ${moved}`);
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
            this.client.user.setActivity('🎵 Music for everyone!', { type: ActivityType.Listening });

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
            if (this.client.musicPlayer) {
                logger.info('Closing all music players...');
                const players = this.client.musicPlayer.getAllPlayers();
                
                let destroyedCount = 0;
                for (const [guildId, player] of players) {
                    try {
                        logger.info(`Destroying player for guild: ${guildId}`);
                        await player.destroy();
                        destroyedCount++;
                    } catch (error) {
                        logger.error(`Error destroying player for guild ${guildId}:`, error);
                    }
                }
                
                logger.info(`Closed ${destroyedCount}/${players.size} music players`);
            }

            // Close Lavalink connections
            if (this.client.shoukaku) {
                logger.info('Closing Lavalink connections...');
                for (const [name, node] of this.client.shoukaku.nodes) {
                    try {
                        node.disconnect();
                        logger.info(`Disconnected from Lavalink node: ${name}`);
                    } catch (error) {
                        logger.error(`Error disconnecting from Lavalink node ${name}:`, error);
                    }
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
