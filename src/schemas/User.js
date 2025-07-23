const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    
    username: {
        type: String,
        required: true
    },

    discriminator: {
        type: String,
        default: '0'
    },

    // Premium features
    premium: {
        enabled: {
            type: Boolean,
            default: false
        },
        expiresAt: {
            type: Date,
            default: null
        },
        tier: {
            type: String,
            enum: ['bronze', 'silver', 'gold', 'platinum'],
            default: 'bronze'
        }
    },

    // User preferences
    preferences: {
        volume: {
            type: Number,
            default: 50,
            min: 1,
            max: 150
        },
        searchEngine: {
            type: String,
            enum: ['youtube', 'soundcloud', 'spotify', 'apple'],
            default: 'youtube'
        },
        autoplay: {
            type: Boolean,
            default: false
        },
        repeatMode: {
            type: String,
            enum: ['off', 'track', 'queue'],
            default: 'off'
        },
        filters: {
            nightcore: { type: Boolean, default: false },
            bassboost: { type: Boolean, default: false },
            pop: { type: Boolean, default: false },
            soft: { type: Boolean, default: false },
            treblebass: { type: Boolean, default: false },
            vaporwave: { type: Boolean, default: false }
        },
        notifications: {
            trackStart: { type: Boolean, default: true },
            trackEnd: { type: Boolean, default: false },
            queueEnd: { type: Boolean, default: true },
            errors: { type: Boolean, default: true }
        }
    },

    // Listening history
    history: {
        tracks: [{
            title: String,
            artist: String,
            uri: String,
            source: String,
            playedAt: { type: Date, default: Date.now },
            duration: Number,
            guildId: String,
            guildName: String
        }],
        playlists: [{
            name: String,
            source: String,
            url: String,
            trackCount: Number,
            playedAt: { type: Date, default: Date.now },
            guildId: String,
            guildName: String
        }]
    },

    // Personal playlists
    playlists: [{
        name: {
            type: String,
            required: true
        },
        tracks: [{
            title: String,
            artist: String,
            uri: String,
            source: String,
            addedAt: { type: Date, default: Date.now },
            duration: Number
        }],
        isPublic: {
            type: Boolean,
            default: false
        },
        description: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Favorites
    favorites: {
        tracks: [{
            title: String,
            artist: String,
            uri: String,
            source: String,
            addedAt: { type: Date, default: Date.now },
            duration: Number
        }],
        artists: [{
            name: String,
            addedAt: { type: Date, default: Date.now }
        }],
        albums: [{
            title: String,
            artist: String,
            addedAt: { type: Date, default: Date.now }
        }]
    },

    // Statistics
    stats: {
        commandsUsed: {
            type: Number,
            default: 0
        },
        songsPlayed: {
            type: Number,
            default: 0
        },
        totalListeningTime: {
            type: Number,
            default: 0
        },
        favoriteGenres: [{
            genre: String,
            count: Number
        }],
        topArtists: [{
            name: String,
            playCount: Number
        }],
        lastActive: {
            type: Date,
            default: Date.now
        }
    },

    // Guild-specific settings
    guildSettings: [{
        guildId: String,
        volume: { type: Number, default: 50 },
        autoplay: { type: Boolean, default: false },
        filters: {
            nightcore: { type: Boolean, default: false },
            bassboost: { type: Boolean, default: false },
            pop: { type: Boolean, default: false },
            soft: { type: Boolean, default: false },
            treblebass: { type: Boolean, default: false },
            vaporwave: { type: Boolean, default: false }
        }
    }],

    // Metadata
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'users'
});

// Indexes for better performance (userId already indexed by unique: true)
userSchema.index({ 'premium.enabled': 1 });
userSchema.index({ 'premium.expiresAt': 1 });
userSchema.index({ 'stats.lastActive': 1 });
userSchema.index({ 'history.tracks.playedAt': -1 });

// Middleware to update timestamps
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Methods
userSchema.methods.isPremium = function() {
    return this.premium.enabled && (!this.premium.expiresAt || this.premium.expiresAt > new Date());
};

userSchema.methods.addToHistory = function(trackInfo, guildInfo) {
    const historyEntry = {
        ...trackInfo,
        playedAt: new Date(),
        guildId: guildInfo.id,
        guildName: guildInfo.name
    };

    this.history.tracks.unshift(historyEntry);
    
    // Keep only the latest entries based on premium status
    const maxHistory = this.isPremium() ? 200 : 50;
    if (this.history.tracks.length > maxHistory) {
        this.history.tracks = this.history.tracks.slice(0, maxHistory);
    }

    this.stats.songsPlayed += 1;
    this.stats.lastActive = new Date();
};

userSchema.methods.addToFavorites = function(type, item) {
    if (!['tracks', 'artists', 'albums'].includes(type)) {
        throw new Error('Invalid favorite type');
    }

    const favorites = this.favorites[type];
    const exists = favorites.some(fav => {
        if (type === 'tracks') return fav.uri === item.uri;
        if (type === 'artists') return fav.name === item.name;
        if (type === 'albums') return fav.title === item.title && fav.artist === item.artist;
    });

    if (!exists) {
        favorites.push({
            ...item,
            addedAt: new Date()
        });
        return true;
    }
    return false;
};

userSchema.methods.removeFromFavorites = function(type, identifier) {
    if (!['tracks', 'artists', 'albums'].includes(type)) {
        throw new Error('Invalid favorite type');
    }

    const favorites = this.favorites[type];
    const initialLength = favorites.length;

    this.favorites[type] = favorites.filter(fav => {
        if (type === 'tracks') return fav.uri !== identifier;
        if (type === 'artists') return fav.name !== identifier;
        if (type === 'albums') return fav.title !== identifier;
    });

    return favorites.length < initialLength;
};

userSchema.methods.createPlaylist = function(name, tracks = [], options = {}) {
    const playlist = {
        name,
        tracks: tracks.map(track => ({
            ...track,
            addedAt: new Date()
        })),
        isPublic: options.isPublic || false,
        description: options.description || '',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    this.playlists.push(playlist);
    return playlist;
};

userSchema.methods.getPlaylist = function(name) {
    return this.playlists.find(playlist => playlist.name.toLowerCase() === name.toLowerCase());
};

userSchema.methods.deletePlaylist = function(name) {
    const initialLength = this.playlists.length;
    this.playlists = this.playlists.filter(playlist => 
        playlist.name.toLowerCase() !== name.toLowerCase()
    );
    return this.playlists.length < initialLength;
};

userSchema.methods.addTrackToPlaylist = function(playlistName, track) {
    const playlist = this.getPlaylist(playlistName);
    if (!playlist) {
        throw new Error('Playlist not found');
    }

    const trackExists = playlist.tracks.some(t => t.uri === track.uri);
    if (trackExists) {
        return false; // Track already exists
    }

    playlist.tracks.push({
        title: track.title,
        artist: track.author,
        uri: track.uri,
        source: track.sourceName,
        duration: track.duration,
        addedAt: new Date()
    });

    playlist.updatedAt = new Date();
    return true;
};

userSchema.methods.getGuildSettings = function(guildId) {
    let guildSettings = this.guildSettings.find(settings => settings.guildId === guildId);
    
    if (!guildSettings) {
        guildSettings = {
            guildId,
            volume: this.preferences.volume,
            autoplay: this.preferences.autoplay,
            filters: { ...this.preferences.filters }
        };
        this.guildSettings.push(guildSettings);
    }
    
    return guildSettings;
};

userSchema.methods.updateGuildSettings = function(guildId, settings) {
    let guildSettings = this.guildSettings.find(s => s.guildId === guildId);
    
    if (!guildSettings) {
        guildSettings = { guildId };
        this.guildSettings.push(guildSettings);
    }
    
    Object.assign(guildSettings, settings);
    return guildSettings;
};

userSchema.methods.setTimezone = function(timezone) {
    this.timezone = timezone;
    return this.save();
};

userSchema.methods.getTimezone = function() {
    return this.timezone || 'UTC';
};

// Static methods
userSchema.statics.findByUserId = function(userId) {
    return this.findOne({ userId });
};

userSchema.statics.createDefault = function(userId, username, discriminator = '0', timezone = null) {
    return this.create({ userId, username, discriminator, timezone });
};

userSchema.statics.getPremiumUsers = function() {
    return this.find({ 
        'premium.enabled': true,
        $or: [
            { 'premium.expiresAt': { $exists: false } },
            { 'premium.expiresAt': null },
            { 'premium.expiresAt': { $gt: new Date() } }
        ]
    });
};

userSchema.statics.getTopUsers = function(limit = 10) {
    return this.find()
        .sort({ 'stats.songsPlayed': -1, 'stats.totalListeningTime': -1 })
        .limit(limit)
        .select('userId username stats');
};

userSchema.add({
    timezone: {
        type: String,
        default: null
    }
});

module.exports = mongoose.model('User', userSchema);
