const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    
    guildName: {
        type: String,
        required: true
    },

    // Music module on/off switch
    musicEnabled: {
        type: Boolean,
        default: true
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
        features: [{
            type: String,
            enum: ['unlimited_queue', 'higher_quality', 'priority_support', 'custom_filters', 'advanced_controls']
        }]
    },

    // DJ and permission settings
    permissions: {
        djRole: {
            type: String,
            default: null
        },
        moderatorRoles: [{
            type: String
        }],
        adminRoles: [{
            type: String
        }],
        allowedChannels: [{
            type: String
        }],
        restrictedChannels: [{
            type: String
        }],
        voiceChannelRestrictions: [{
            type: String
        }]
    },

    // Music settings
    musicSettings: {
        defaultVolume: {
            type: Number,
            default: 50,
            min: 1,
            max: 150
        },
        maxVolume: {
            type: Number,
            default: 150,
            min: 1,
            max: 200
        },
        maxQueueSize: {
            type: Number,
            default: 100,
            min: 1,
            max: 500
        },
        maxPlaylistSize: {
            type: Number,
            default: 50,
            min: 1,
            max: 200
        },
        autoLeave: {
            enabled: {
                type: Boolean,
                default: true
            },
            delay: {
                type: Number,
                default: 300000 // 5 minutes
            }
        },
        searchEngine: {
            type: String,
            enum: ['youtube', 'spotify', 'soundcloud'], // Restrict to valid options
            default: 'youtube'
        },
        allowExplicit: {
            type: Boolean,
            default: true
        },
        enableFilters: {
            type: Boolean,
            default: true
        }
    },

    // Command settings
    commandSettings: {
        cooldown: {
            type: Number,
            default: 3000
        },
        disabledCommands: [{
            type: String
        }],
        commandChannels: [{
            type: String
        }],
        deleteMessages: {
            type: Boolean,
            default: false
        },
        deleteDelay: {
            type: Number,
            default: 5000
        }
    },

    // Queue settings
    queueSettings: {
        autoShuffle: {
            type: Boolean,
            default: false
        },
        repeatMode: {
            type: String,
            enum: ['off', 'track', 'queue'],
            default: 'off'
        },
        skipOnError: {
            type: Boolean,
            default: true
        },
        historySize: {
            type: Number,
            default: 50,
            min: 0,
            max: 200
        }
    },

    // Logging settings
    logging: {
        channelId: {
            type: String,
            default: null
        },
        logCommands: {
            type: Boolean,
            default: false
        },
        logMusic: {
            type: Boolean,
            default: false
        },
        logErrors: {
            type: Boolean,
            default: true
        }
    },

    // Chatbot settings
    chatbot: {
        enabled: {
            type: Boolean,
            default: false
        },
        apiUrl: {
            type: String,
            default: 'https://api.openai.com/v1'
        },
        apiKey: {
            type: String,
            default: null
        },
        model: {
            type: String,
            default: 'gpt-3.5-turbo'
        },
        maxTokens: {
            type: Number,
            default: 500,
            min: 50,
            max: 4000
        },
        temperature: {
            type: Number,
            default: 0.7,
            min: 0,
            max: 2
        },
        systemPrompt: {
            type: String,
            default: 'You are a helpful Discord bot assistant. Be friendly, concise, and helpful.'
        },
        responseChance: {
            type: Number,
            default: 10,
            min: 0,
            max: 100
        },
        channelMode: {
            type: String,
            enum: ['all', 'whitelist', 'blacklist'],
            default: 'all'
        },
        whitelistedChannels: [{
            type: String
        }],
        blacklistedChannels: [{
            type: String
        }],
        ignoreBots: {
            type: Boolean,
            default: true
        },
        requireMention: {
            type: Boolean,
            default: false
        },
        cooldown: {
            type: Number,
            default: 5000,
            min: 1000,
            max: 60000
        },
        maxMessageLength: {
            type: Number,
            default: 2000,
            min: 100,
            max: 4000
        },
        // Note: Conversation history is stored in memory for 30 minutes
        // and is automatically cleaned up. No database storage needed.
        conversationEnabled: {
            type: Boolean,
            default: true
        }
    },

    // Message Link Embed System
    messageLinkEmbed: {
        enabled: {
            type: Boolean,
            default: false
        },
        targetChannelId: {
            type: String,
            default: null
        }
    },

    // Welcome and Leave System
    welcomeSystem: {
        welcome: {
            enabled: {
                type: Boolean,
                default: false
            },
            channelId: {
                type: String,
                default: null
            },
            message: {
                type: String,
                default: 'Welcome {user.mention} to **{guild.name}**! 🎉\n\nYou are our **{guild.memberCount}** member!'
            },
            embedEnabled: {
                type: Boolean,
                default: true
            },
            embedColor: {
                type: String,
                default: '#57F287'
            },
            showAccountAge: {
                type: Boolean,
                default: true
            },
            showJoinPosition: {
                type: Boolean,
                default: true
            },
            showInviter: {
                type: Boolean,
                default: true
            },
            deleteAfter: {
                type: Number,
                default: 0 // 0 means don't delete
            },
            mentionUser: {
                type: Boolean,
                default: true
            },
            customEmbed: {
                enabled: {
                    type: Boolean,
                    default: false
                },
                embedData: {
                    type: Object,
                    default: null
                }
            }
        },
        leave: {
            enabled: {
                type: Boolean,
                default: false
            },
            channelId: {
                type: String,
                default: null
            },
            message: {
                type: String,
                default: '👋 **{user.tag}** has left the server.\n\nWe now have **{guild.memberCount}** members.'
            },
            embedEnabled: {
                type: Boolean,
                default: true
            },
            embedColor: {
                type: String,
                default: '#ED4245'
            },
            showAccountAge: {
                type: Boolean,
                default: true
            },
            showJoinDate: {
                type: Boolean,
                default: true
            },
            showTimeInServer: {
                type: Boolean,
                default: true
            },
            deleteAfter: {
                type: Number,
                default: 0 // 0 means don't delete
            },
            customEmbed: {
                enabled: {
                    type: Boolean,
                    default: false
                },
                embedData: {
                    type: Object,
                    default: null
                }
            }
        },
        dmWelcome: {
            enabled: {
                type: Boolean,
                default: false
            },
            message: {
                type: String,
                default: 'Welcome to **{guild.name}**! 🎉\n\nThanks for joining our community!'
            },
            embedEnabled: {
                type: Boolean,
                default: true
            },
            embedColor: {
                type: String,
                default: '#5865F2'
            },
            customEmbed: {
                enabled: {
                    type: Boolean,
                    default: false
                },
                embedData: {
                    type: Object,
                    default: null
                }
            }
        }
    },

    // Auto Role System
    autoRole: {
        enabled: {
            type: Boolean,
            default: false
        },
        roleId: {
            type: String,
            default: null
        },
        delay: {
            type: Number,
            default: 0, // Delay in seconds before applying role
            min: 0,
            max: 3600 // Maximum 1 hour delay
        },
        botBypass: {
            type: Boolean,
            default: true // Don't apply autorole to bots
        },
        requireVerification: {
            type: Boolean,
            default: false // Only apply to verified members
        }
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
        totalPlaytime: {
            type: Number,
            default: 0
        },
        lastActivity: {
            type: Date,
            default: Date.now
        }
    },

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
    collection: 'guilds'
});

// Indexes for better performance (guildId already indexed by unique: true)
guildSchema.index({ 'premium.enabled': 1 });
guildSchema.index({ 'premium.expiresAt': 1 });
guildSchema.index({ 'stats.lastActivity': 1 });

// Middleware to update timestamps
guildSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Methods
guildSchema.methods.isPremium = function() {
    return this.premium.enabled && (!this.premium.expiresAt || this.premium.expiresAt > new Date());
};

guildSchema.methods.hasPremiumFeature = function(feature) {
    return this.isPremium() && this.premium.features.includes(feature);
};

guildSchema.methods.canUseCommand = function(userId, userRoles, commandName) {
    // Check if command is disabled
    if (this.commandSettings.disabledCommands.includes(commandName)) {
        return false;
    }

    // Owner can always use commands
    if (this.permissions.adminRoles.some(role => userRoles.includes(role))) {
        return true;
    }

    // Check DJ role for music commands
    const musicCommands = ['play', 'pause', 'skip', 'stop', 'volume', 'seek', 'loop', 'shuffle'];
    if (musicCommands.includes(commandName)) {
        if (this.permissions.djRole && !userRoles.includes(this.permissions.djRole)) {
            return false;
        }
    }

    return true;
};

guildSchema.methods.incrementStats = function(type, value = 1) {
    switch (type) {
        case 'commands':
            this.stats.commandsUsed += value;
            break;
        case 'songs':
            this.stats.songsPlayed += value;
            break;
        case 'playtime':
            this.stats.totalPlaytime += value;
            break;
    }
    this.stats.lastActivity = new Date();
};

// Static methods
guildSchema.statics.findByGuildId = function(guildId) {
    return this.findOne({ guildId });
};

guildSchema.statics.createDefault = function(guildId, guildName) {
    return this.create({ guildId, guildName });
};

guildSchema.statics.getPremiumGuilds = function() {
    return this.find({ 
        'premium.enabled': true,
        $or: [
            { 'premium.expiresAt': { $exists: false } },
            { 'premium.expiresAt': null },
            { 'premium.expiresAt': { $gt: new Date() } }
        ]
    });
};

module.exports = mongoose.model('Guild', guildSchema);
