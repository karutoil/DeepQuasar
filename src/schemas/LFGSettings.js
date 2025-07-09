const mongoose = require('mongoose');

const lfgSettingsSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    
    // Trigger configuration
    triggerMode: {
        type: String,
        enum: ['slash', 'message', 'both'],
        default: 'slash'
    },
    
    // Channels to monitor for message-based triggers
    monitorChannels: [{
        type: String // Channel IDs
    }],
    
    // LFG role management
    lfgRole: {
        roleId: String, // Role to assign when posting LFG
        requireRole: String, // Role required to post LFG
        autoAssign: {
            type: Boolean,
            default: false
        }
    },
    
    // Cooldown settings (in milliseconds)
    cooldown: {
        enabled: {
            type: Boolean,
            default: true
        },
        duration: {
            type: Number,
            default: 300000 // 5 minutes
        }
    },
    
    // Game presets
    gamePresets: [{
        name: String,
        icon: String,
        color: String,
        defaultMessage: String,
        defaultChannel: String
    }],
    
    // Embed customization
    embed: {
        color: {
            type: String,
            default: '#5865F2'
        },
        icon: String,
        footerText: String
    },
    
    // Audit logging
    auditLog: {
        enabled: {
            type: Boolean,
            default: false
        },
        channelId: String
    },
    
    // Post expiration
    expiration: {
        enabled: {
            type: Boolean,
            default: false
        },
        duration: {
            type: Number,
            default: 1800000 // 30 minutes
        }
    },
    
    // Channel whitelist with default games
    allowedChannels: [{
        channelId: {
            type: String,
            required: true
        },
        defaultGame: {
            type: String, // Game name from presets
            default: null
        }
    }],
    
    // Feature toggles
    features: {
        voiceChannelEmbeds: {
            type: Boolean,
            default: true
        },
        dmEmbeds: {
            type: Boolean,
            default: true
        },
        editPosts: {
            type: Boolean,
            default: true
        },
        deletePosts: {
            type: Boolean,
            default: true
        }
    },
    
    // Message triggers configuration
    messageTriggers: {
        keywords: [{
            type: String,
            default: ['lfg', 'looking for group', 'looking for']
        }],
        requirePrefix: {
            type: Boolean,
            default: false
        },
        prefix: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LFGSettings', lfgSettingsSchema);
