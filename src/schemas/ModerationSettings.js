const mongoose = require('mongoose');

const moderationSettingsSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    
    // Moderation channels
    modLogChannel: {
        type: String,
        default: null
    },
    
    // Mute role configuration
    muteRoleId: {
        type: String,
        default: null
    },
    
    // Auto-moderation settings
    autoModEnabled: {
        type: Boolean,
        default: false
    },
    
    // Warning system settings
    warnLimitBeforeBan: {
        type: Number,
        default: 5,
        min: 1,
        max: 20
    },
    
    warnLimitBeforeKick: {
        type: Number,
        default: 3,
        min: 1,
        max: 15
    },
    
    warnLimitBeforeMute: {
        type: Number,
        default: 2,
        min: 1,
        max: 10
    },
    
    // Auto-action settings
    autoActions: {
        enabled: {
            type: Boolean,
            default: false
        },
        muteOnWarns: {
            type: Number,
            default: 3
        },
        kickOnWarns: {
            type: Number,
            default: 5
        },
        banOnWarns: {
            type: Number,
            default: 7
        }
    },
    
    // Default moderation roles (fallback permissions)
    defaultModRoles: [{
        type: String
    }],
    
    // Default admin roles
    defaultAdminRoles: [{
        type: String
    }],
    
    // Command-specific role permissions
    commandPermissions: {
        // Basic moderation
        warn: [{ type: String }],
        kick: [{ type: String }],
        ban: [{ type: String }],
        unban: [{ type: String }],
        mute: [{ type: String }],
        unmute: [{ type: String }],
        
        // Advanced moderation
        lock: [{ type: String }],
        unlock: [{ type: String }],
        slowmode: [{ type: String }],
        strike: [{ type: String }],
        softban: [{ type: String }],
        
        // Administrative
        modhistory: [{ type: String }],
        reason: [{ type: String }],
        note: [{ type: String }],
        pardon: [{ type: String }],
        appeal: [{ type: String }],
        warnlist: [{ type: String }]
    },
    
    // Punishment durations (in milliseconds)
    defaultDurations: {
        mute: {
            type: Number,
            default: 3600000 // 1 hour
        },
        tempban: {
            type: Number,
            default: 86400000 // 24 hours
        }
    },
    
    // DM settings
    dmSettings: {
        dmOnWarn: {
            type: Boolean,
            default: true
        },
        dmOnKick: {
            type: Boolean,
            default: true
        },
        dmOnBan: {
            type: Boolean,
            default: true
        },
        dmOnMute: {
            type: Boolean,
            default: true
        }
    },
    
    // Strike system settings
    strikeSystem: {
        enabled: {
            type: Boolean,
            default: false
        },
        strikesBeforeAction: {
            type: Number,
            default: 3
        },
        strikeAction: {
            type: String,
            enum: ['warn', 'mute', 'kick', 'ban'],
            default: 'kick'
        }
    },
    
    // Appeal system settings
    appealSystem: {
        enabled: {
            type: Boolean,
            default: true
        },
        appealChannel: {
            type: String,
            default: null
        },
        cooldownPeriod: {
            type: Number,
            default: 86400000 // 24 hours
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ModerationSettings', moderationSettingsSchema);
