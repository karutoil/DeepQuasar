const { ActivityType } = require('discord.js');
const Guild = require('../schemas/Guild');
const WelcomeSystem = require('../utils/WelcomeSystem');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        client.logger.info(`✅ ${client.user.tag} is now online and ready!`);
        client.logger.info(`📊 Serving ${client.guilds.cache.size} guilds with ${client.users.cache.size} users`);

        // Initialize Moonlink Manager
        client.manager.init(client.user.id);
        client.logger.info('🎵 Moonlink Manager initialized');
        
        // Log node status
        setTimeout(() => {
            try {
                const nodeCount = client.manager.nodes.cache ? client.manager.nodes.cache.size : 0;
                client.logger.info(`Moonlink nodes: ${nodeCount}`);
                
                if (client.manager.nodes.cache) {
                    for (const [id, node] of client.manager.nodes.cache) {
                        client.logger.info(`Node ${id}: connected=${node.connected}, host=${node.host}:${node.port}`);
                    }
                }
            } catch (error) {
                client.logger.error('Error checking node status:', error);
            }
        }, 2000);

        // Set bot status
        const activities = [
            { name: '🎵 Music for everyone!', type: ActivityType.Listening },
            { name: `${client.guilds.cache.size} servers`, type: ActivityType.Watching },
            { name: 'slash commands', type: ActivityType.Listening },
            { name: 'your favorite songs', type: ActivityType.Playing }
        ];

        let activityIndex = 0;
        const updateActivity = () => {
            const activity = activities[activityIndex];
            client.user.setActivity(activity.name, { type: activity.type });
            activityIndex = (activityIndex + 1) % activities.length;
        };

        updateActivity();
        setInterval(updateActivity, 30000); // Change activity every 30 seconds

        // Initialize guild data for all guilds
        await initializeGuilds(client);

        // Initialize invite cache for all guilds
        await initializeInviteCaches(client);

        // Start periodic tasks
        startPeriodicTasks(client);
    }
};

async function initializeGuilds(client) {
    client.logger.info('Initializing guild data...');
    
    let initializedCount = 0;
    let errorCount = 0;

    for (const [guildId, guild] of client.guilds.cache) {
        try {
            let guildData = await Guild.findByGuildId(guildId);
            
            if (!guildData) {
                guildData = await Guild.createDefault(guildId, guild.name);
                initializedCount++;
                client.logger.debug(`Created default settings for guild: ${guild.name} (${guildId})`);
            } else {
                // Update guild name if it changed
                if (guildData.guildName !== guild.name) {
                    guildData.guildName = guild.name;
                    await guildData.save();
                }
            }
        } catch (error) {
            errorCount++;
            client.logger.error(`Failed to initialize guild ${guild.name} (${guildId}):`, error);
        }
    }

    client.logger.info(`Guild initialization complete. Created: ${initializedCount}, Errors: ${errorCount}`);
}

function startPeriodicTasks(client) {
    // Clean up inactive players every 5 minutes
    setInterval(() => {
        cleanupInactivePlayers(client);
    }, 5 * 60 * 1000);

    // Update statistics every hour
    setInterval(() => {
        updateBotStatistics(client);
    }, 60 * 60 * 1000);

    // Check premium expiration daily
    setInterval(() => {
        checkPremiumExpiration(client);
    }, 24 * 60 * 60 * 1000);
}

function cleanupInactivePlayers(client) {
    const players = client.musicPlayerManager.getAllPlayers();
    let cleanedCount = 0;

    players.forEach(async (player) => {
        // Remove players that have been inactive for more than 10 minutes
        if (!player.isPlaying && !player.isPaused && player.size === 0) {
            const lastActivity = player.lastActivity || Date.now();
            const inactiveTime = Date.now() - lastActivity;
            
            if (inactiveTime > 10 * 60 * 1000) { // 10 minutes
                await client.musicPlayerManager.destroy(player.guildId);
                cleanedCount++;
            }
        }
    });

    if (cleanedCount > 0) {
        client.logger.info(`Cleaned up ${cleanedCount} inactive players`);
    }
}

async function initializeInviteCaches(client) {
    client.logger.info('Initializing invite caches for all guilds...');
    
    let initializedCount = 0;
    
    for (const [guildId, guild] of client.guilds.cache) {
        try {
            await WelcomeSystem.initializeInviteCache(guild, client);
            initializedCount++;
        } catch (error) {
            // Guild might not have MANAGE_GUILD permission, skip silently
            client.logger.debug(`Could not initialize invite cache for guild: ${guild.name} (${guildId})`);
        }
    }
    
    client.logger.info(`Initialized invite caches for ${initializedCount}/${client.guilds.cache.size} guilds`);
}

async function updateBotStatistics(client) {
    try {
        const totalGuilds = client.guilds.cache.size;
        const totalUsers = client.users.cache.size;
        const totalPlayers = client.musicPlayerManager.getPlayerCount();

        client.logger.info(`📊 Bot Statistics - Guilds: ${totalGuilds}, Users: ${totalUsers}, Active Players: ${totalPlayers}`);

        // Update activities with current stats
        client.user.setActivity(`${totalGuilds} servers`, { type: ActivityType.Watching });
    } catch (error) {
        client.logger.error('Failed to update bot statistics:', error);
    }
}

async function checkPremiumExpiration(client) {
    try {
        const expiredGuilds = await Guild.find({
            'premium.enabled': true,
            'premium.expiresAt': { $lt: new Date() }
        });

        for (const guild of expiredGuilds) {
            guild.premium.enabled = false;
            guild.premium.features = [];
            await guild.save();

            client.logger.info(`Premium expired for guild: ${guild.guildName} (${guild.guildId})`);

            // Notify the guild if possible
            try {
                const discordGuild = client.guilds.cache.get(guild.guildId);
                if (discordGuild && guild.logging.channelId) {
                    const logChannel = discordGuild.channels.cache.get(guild.logging.channelId);
                    if (logChannel) {
                        const embed = client.utils.createWarningEmbed(
                            'Premium Expired',
                            'Your server\'s premium subscription has expired. Some features may no longer be available.'
                        );
                        await logChannel.send({ embeds: [embed] });
                    }
                }
            } catch (notifyError) {
                client.logger.warn(`Failed to notify guild ${guild.guildId} about premium expiration:`, notifyError);
            }
        }

        if (expiredGuilds.length > 0) {
            client.logger.info(`Processed ${expiredGuilds.length} expired premium subscriptions`);
        }
    } catch (error) {
        client.logger.error('Failed to check premium expiration:', error);
    }
}
