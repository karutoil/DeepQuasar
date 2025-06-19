const mongoose = require('mongoose');

const modLogSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    
    // Global modlog settings
    enabled: {
        type: Boolean,
        default: false
    },
    
    // Default channel for all events (if no specific channel is set)
    defaultChannel: {
        type: String,
        default: null
    },
    
    // Individual event settings
    events: {
        // Member Events
        memberJoin: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        memberLeave: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        memberUpdate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        memberBan: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        memberUnban: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        memberKick: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        memberTimeout: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        
        // User Events
        userUpdate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        presenceUpdate: {
            enabled: { type: Boolean, default: false },
            channel: { type: String, default: null }
        },
        
        // Message Events
        messageDelete: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        messageUpdate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        messageBulkDelete: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        messageReactionAdd: {
            enabled: { type: Boolean, default: false },
            channel: { type: String, default: null }
        },
        messageReactionRemove: {
            enabled: { type: Boolean, default: false },
            channel: { type: String, default: null }
        },
        
        // Channel Events
        channelCreate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        channelDelete: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        channelUpdate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        channelPinsUpdate: {
            enabled: { type: Boolean, default: false },
            channel: { type: String, default: null }
        },
        
        // Role Events
        roleCreate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        roleDelete: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        roleUpdate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        
        // Guild Events
        guildUpdate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        emojiCreate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        emojiDelete: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        emojiUpdate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        stickerCreate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        stickerDelete: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        stickerUpdate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        
        // Voice Events
        voiceStateUpdate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        
        // Invite Events
        inviteCreate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        inviteDelete: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        
        // Thread Events
        threadCreate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        threadDelete: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        threadUpdate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        threadMemberUpdate: {
            enabled: { type: Boolean, default: false },
            channel: { type: String, default: null }
        },
        
        // Integration Events
        integrationCreate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        integrationDelete: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        integrationUpdate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        
        // Webhook Events
        webhookUpdate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        
        // Stage Events
        stageInstanceCreate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        stageInstanceDelete: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        stageInstanceUpdate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        
        // Scheduled Event Events
        guildScheduledEventCreate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        guildScheduledEventDelete: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        guildScheduledEventUpdate: {
            enabled: { type: Boolean, default: true },
            channel: { type: String, default: null }
        },
        guildScheduledEventUserAdd: {
            enabled: { type: Boolean, default: false },
            channel: { type: String, default: null }
        },
        guildScheduledEventUserRemove: {
            enabled: { type: Boolean, default: false },
            channel: { type: String, default: null }
        }
    }
}, {
    timestamps: true
});

// Static method to get or create modlog settings for a guild
modLogSchema.statics.getOrCreate = async function(guildId) {
    let modLog = await this.findOne({ guildId });
    if (!modLog) {
        modLog = new this({ guildId });
        await modLog.save();
    }
    return modLog;
};

// Method to get the appropriate channel for an event
modLogSchema.methods.getEventChannel = function(eventType) {
    if (!this.enabled) return null;
    
    const eventConfig = this.events[eventType];
    if (!eventConfig || !eventConfig.enabled) return null;
    
    return eventConfig.channel || this.defaultChannel;
};

// Method to check if an event is enabled
modLogSchema.methods.isEventEnabled = function(eventType) {
    if (!this.enabled) return false;
    
    const eventConfig = this.events[eventType];
    return eventConfig && eventConfig.enabled;
};

module.exports = mongoose.model('ModLog', modLogSchema);
