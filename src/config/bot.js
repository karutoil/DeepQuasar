module.exports = {
    bot: {
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.CLIENT_ID,
        guildId: process.env.GUILD_ID, // Optional: for guild-specific commands during development
        prefix: process.env.BOT_PREFIX || '!',
        owners: process.env.BOT_OWNERS?.split(',') || [],
        defaultVolume: parseInt(process.env.DEFAULT_VOLUME) || 50,
        maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE) || 100,
        premiumMaxQueueSize: parseInt(process.env.PREMIUM_MAX_QUEUE_SIZE) || 500,
        commandCooldown: parseInt(process.env.COMMAND_COOLDOWN) || 3000,
        premiumCommandCooldown: parseInt(process.env.PREMIUM_COMMAND_COOLDOWN) || 1000
    },

    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/discord-music-bot'
    },

    lavalink: {
        host: process.env.LAVALINK_HOST || 'localhost',
        port: parseInt(process.env.LAVALINK_PORT) || 2333,
        password: process.env.LAVALINK_PASSWORD || 'your_lavalink_password_here',
        secure: process.env.LAVALINK_SECURE === 'true'
    },

    spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    },

    youtube: {
        refreshToken: process.env.YOUTUBE_REFRESH_TOKEN
    },

    web: {
        port: parseInt(process.env.WEB_PORT) || 3000,
        secret: process.env.WEB_SECRET || 'your_web_dashboard_secret_here'
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
        filePath: process.env.LOG_FILE_PATH || './logs'
    },

    // Music settings
    music: {
        searchSources: ['youtube', 'soundcloud', 'spotify'],
        maxSearchResults: 10,
        maxPlaylistSize: 50,
        premiumMaxPlaylistSize: 200,
        defaultVolume: 50,
        maxVolume: 150,
        premiumMaxVolume: 200,
        trackHistoryLimit: 50,
        premiumTrackHistoryLimit: 200
    },

    // Command categories
    categories: {
        music: '🎵 Music',
        queue: '📜 Queue',
        settings: '⚙️ Settings',
        info: 'ℹ️ Information',
        admin: '👑 Admin'
    },

    // Colors for embeds
    colors: {
        primary: 0x5865F2,
        success: 0x57F287,
        warning: 0xFEE75C,
        error: 0xED4245,
        info: 0x5DADE2,
        music: 0x9B00FF
    },

    // Emojis
    emojis: {
        play: '▶️',
        pause: '⏸️',
        stop: '⏹️',
        skip: '⏭️',
        previous: '⏮️',
        shuffle: '🔀',
        repeat: '🔁',
        repeatOne: '🔂',
        volume: '🔊',
        mute: '🔇',
        queue: '📜',
        music: '🎵',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        loading: '⏳',
        premium: '⭐'
    },

    // Permission levels
    permissions: {
        everyone: 0,
        dj: 1,
        moderator: 2,
        admin: 3,
        owner: 4
    }
};
