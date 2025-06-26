const mongoose = require('mongoose');

const tempVCUserSettingsSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        index: true
    },
    
    userId: {
        type: String,
        required: true
    },
    
    // User's saved default settings
    defaultSettings: {
        customName: {
            type: String,
            default: null // null means use auto-generated name
        },
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
    
    // Auto-save preference
    autoSave: {
        type: Boolean,
        default: true
    },
    
    // Tracking
    lastSaved: {
        type: Date,
        default: Date.now
    },
    
    lastUsed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to ensure one settings record per user per guild
tempVCUserSettingsSchema.index({ guildId: 1, userId: 1 }, { unique: true });

// Static methods
tempVCUserSettingsSchema.statics.findByUser = async function(guildId, userId) {
    return await this.findOne({ guildId, userId });
};

tempVCUserSettingsSchema.statics.createOrUpdate = async function(guildId, userId, settings) {
    const updateData = {
        ...settings,
        lastSaved: new Date(),
        lastUsed: new Date()
    };
    
    return await this.findOneAndUpdate(
        { guildId, userId },
        updateData,
        { upsert: true, new: true }
    );
};

// Instance methods
tempVCUserSettingsSchema.methods.updateLastUsed = function() {
    this.lastUsed = new Date();
    return this.save();
};

tempVCUserSettingsSchema.methods.updateSettings = function(newSettings) {
    if (newSettings.customName !== undefined) this.defaultSettings.customName = newSettings.customName;
    if (newSettings.userLimit !== undefined) this.defaultSettings.userLimit = newSettings.userLimit;
    if (newSettings.bitrate !== undefined) this.defaultSettings.bitrate = newSettings.bitrate;
    if (newSettings.locked !== undefined) this.defaultSettings.locked = newSettings.locked;
    if (newSettings.hidden !== undefined) this.defaultSettings.hidden = newSettings.hidden;
    if (newSettings.region !== undefined) this.defaultSettings.region = newSettings.region;
    
    this.lastSaved = new Date();
    return this.save();
};

module.exports = mongoose.model('TempVCUserSettings', tempVCUserSettingsSchema);
