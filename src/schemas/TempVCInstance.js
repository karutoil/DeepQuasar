const mongoose = require('mongoose');

const tempVCInstanceSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        index: true
    },
    
    channelId: {
        type: String,
        required: true,
        unique: true
    },
    
    ownerId: {
        type: String,
        required: true
    },
    
    // Channel metadata
    originalName: {
        type: String,
        required: true
    },
    
    currentName: {
        type: String,
        required: true
    },
    
    // Current settings
    settings: {
        userLimit: {
            type: Number,
            default: 0
        },
        bitrate: {
            type: Number,
            default: 64000
        },
        locked: {
            type: Boolean,
            default: false
        },
        hidden: {
            type: Boolean,
            default: false
        },
        region: {
            type: String,
            default: null
        }
    },
    
    // Permissions
    permissions: {
        allowedUsers: [{
            type: String
        }],
        blockedUsers: [{
            type: String
        }],
        moderators: [{
            type: String
        }]
    },
    
    // Activity tracking
    activity: {
        lastActive: {
            type: Date,
            default: Date.now
        },
        totalTimeActive: {
            type: Number,
            default: 0
        },
        memberCount: {
            type: Number,
            default: 0
        },
        peakMemberCount: {
            type: Number,
            default: 0
        }
    },
    
    // Control panel
    controlPanel: {
        messageId: {
            type: String,
            default: null
        },
        channelId: {
            type: String,
            default: null
        },
        enabled: {
            type: Boolean,
            default: true
        }
    },
    
    // Saved configurations (local session only)
    savedSettings: {
        autoSave: {
            type: Boolean,
            default: true
        }
    },
    
    // Temporary data
    temp: {
        deleteAfter: {
            type: Date,
            default: null
        },
        transferRequests: [{
            userId: String,
            requestedAt: {
                type: Date,
                default: Date.now
            }
        }],
        lastControlPanelUpdate: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true
});

// Indexes for better performance
tempVCInstanceSchema.index({ guildId: 1, ownerId: 1 });
tempVCInstanceSchema.index({ 'activity.lastActive': 1 });

// Static methods
tempVCInstanceSchema.statics.findByChannelId = async function(channelId) {
    return await this.findOne({ channelId });
};

tempVCInstanceSchema.statics.findByOwnerId = async function(guildId, ownerId) {
    return await this.find({ guildId, ownerId });
};

tempVCInstanceSchema.statics.findByGuildId = async function(guildId) {
    return await this.find({ guildId });
};

tempVCInstanceSchema.statics.findInactiveChannels = async function(guildId, inactiveMinutes = 5) {
    const cutoffTime = new Date(Date.now() - (inactiveMinutes * 60 * 1000));
    return await this.find({
        guildId,
        'activity.lastActive': { $lt: cutoffTime },
        'activity.memberCount': 0
    });
};

tempVCInstanceSchema.statics.createInstance = async function(data) {
    const instance = new this(data);
    return await instance.save();
};

// Instance methods
tempVCInstanceSchema.methods.updateActivity = function(memberCount = null) {
    this.activity.lastActive = new Date();
    if (memberCount !== null) {
        this.activity.memberCount = memberCount;
        if (memberCount > this.activity.peakMemberCount) {
            this.activity.peakMemberCount = memberCount;
        }
    }
    return this.save();
};

tempVCInstanceSchema.methods.isOwner = function(userId) {
    return this.ownerId === userId;
};

tempVCInstanceSchema.methods.isModerator = function(userId) {
    return this.permissions.moderators.includes(userId) || this.isOwner(userId);
};

tempVCInstanceSchema.methods.isAllowed = function(userId) {
    if (this.isOwner(userId)) return true;
    if (this.permissions.blockedUsers.includes(userId)) return false;
    if (this.permissions.allowedUsers.length === 0) return true;
    return this.permissions.allowedUsers.includes(userId);
};

tempVCInstanceSchema.methods.addModerator = function(userId) {
    if (!this.permissions.moderators.includes(userId)) {
        this.permissions.moderators.push(userId);
    }
    return this.save();
};

tempVCInstanceSchema.methods.removeModerator = function(userId) {
    this.permissions.moderators = this.permissions.moderators.filter(id => id !== userId);
    return this.save();
};

tempVCInstanceSchema.methods.allowUser = function(userId) {
    if (!this.permissions.allowedUsers.includes(userId)) {
        this.permissions.allowedUsers.push(userId);
    }
    // Remove from blocked if exists
    this.permissions.blockedUsers = this.permissions.blockedUsers.filter(id => id !== userId);
    return this.save();
};

tempVCInstanceSchema.methods.blockUser = function(userId) {
    if (!this.permissions.blockedUsers.includes(userId)) {
        this.permissions.blockedUsers.push(userId);
    }
    // Remove from allowed if exists
    this.permissions.allowedUsers = this.permissions.allowedUsers.filter(id => id !== userId);
    return this.save();
};

tempVCInstanceSchema.methods.transferOwnership = function(newOwnerId) {
    // Add old owner as moderator
    if (!this.permissions.moderators.includes(this.ownerId)) {
        this.permissions.moderators.push(this.ownerId);
    }
    
    // Remove new owner from moderators
    this.permissions.moderators = this.permissions.moderators.filter(id => id !== newOwnerId);
    
    // Transfer ownership
    this.ownerId = newOwnerId;
    
    return this.save();
};

tempVCInstanceSchema.methods.shouldAutoDelete = function() {
    return this.activity.memberCount === 0 && 
           this.temp.deleteAfter && 
           new Date() >= this.temp.deleteAfter;
};

tempVCInstanceSchema.methods.scheduleAutoDelete = function(delayMinutes = 0) {
    if (delayMinutes > 0) {
        this.temp.deleteAfter = new Date(Date.now() + (delayMinutes * 60 * 1000));
    } else {
        this.temp.deleteAfter = new Date();
    }
    return this.save();
};

tempVCInstanceSchema.methods.cancelAutoDelete = function() {
    this.temp.deleteAfter = null;
    return this.save();
};

// Configuration management methods
tempVCInstanceSchema.methods.saveCurrentSettings = async function() {
    // Save current settings to persistent storage
    const TempVCUserSettings = require('./TempVCUserSettings');
    
    await TempVCUserSettings.createOrUpdate(this.guildId, this.ownerId, {
        defaultSettings: {
            customName: this.currentName === this.originalName ? null : this.currentName,
            userLimit: this.settings.userLimit,
            bitrate: this.settings.bitrate,
            locked: this.settings.locked,
            hidden: this.settings.hidden,
            region: this.settings.region
        },
        autoSave: this.savedSettings.autoSave
    });
    
    return this;
};

tempVCInstanceSchema.methods.resetToDefaults = function(guildDefaults) {
    // Reset settings to guild defaults
    this.settings.userLimit = guildDefaults.userLimit || 0;
    this.settings.bitrate = guildDefaults.bitrate || 64000;
    this.settings.locked = guildDefaults.locked || false;
    this.settings.hidden = guildDefaults.hidden || false;
    this.settings.region = guildDefaults.region || null;
    
    // Clear all permissions (bans/allowed users)
    this.permissions.blockedUsers = [];
    this.permissions.allowedUsers = [];
    // Keep moderators but remove all except owner
    this.permissions.moderators = [];
    
    return this.save();
};

tempVCInstanceSchema.methods.loadSavedSettings = async function() {
    // Load previously saved settings from persistent storage
    const TempVCUserSettings = require('./TempVCUserSettings');
    const userSettings = await TempVCUserSettings.findByUser(this.guildId, this.ownerId);
    
    if (userSettings && userSettings.defaultSettings) {
        // Apply custom name if saved (skip if it's null - means use auto-generated)
        if (userSettings.defaultSettings.customName) {
            this.currentName = userSettings.defaultSettings.customName;
        }
        
        this.settings.userLimit = userSettings.defaultSettings.userLimit;
        this.settings.bitrate = userSettings.defaultSettings.bitrate;
        this.settings.locked = userSettings.defaultSettings.locked;
        this.settings.hidden = userSettings.defaultSettings.hidden;
        this.settings.region = userSettings.defaultSettings.region;
        
        // Update auto-save preference
        this.savedSettings.autoSave = userSettings.autoSave;
        
        return this.save();
    }
    return this;
};

tempVCInstanceSchema.methods.autoSaveSettings = async function() {
    if (this.savedSettings.autoSave) {
        return await this.saveCurrentSettings();
    }
    return this;
};

module.exports = mongoose.model('TempVCInstance', tempVCInstanceSchema);
