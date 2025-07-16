const mongoose = require('mongoose');

const eventConfigSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: true },
    channels: { type: [String], default: [] }, // Multiple channel support
    webhooks: { type: [String], default: [] }, // Webhook support
    excludeUsers: { type: [String], default: [] }, // User filtering
    excludeRoles: { type: [String], default: [] }, // Role filtering
    template: { type: String, default: '' }, // Custom message template
    channel: { type: String, default: null } // Legacy single channel
}, { _id: false });

const modLogSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },

    enabled: {
        type: Boolean,
        default: false
    },

    defaultChannel: {
        type: String,
        default: null
    },

    events: {
        memberJoin: { type: eventConfigSchema, default: () => ({}) },
        memberLeave: { type: eventConfigSchema, default: () => ({}) },
        memberUpdate: { type: eventConfigSchema, default: () => ({}) },
        memberBan: { type: eventConfigSchema, default: () => ({}) },
        memberUnban: { type: eventConfigSchema, default: () => ({}) },
        memberKick: { type: eventConfigSchema, default: () => ({}) },
        memberTimeout: { type: eventConfigSchema, default: () => ({}) },
        userUpdate: { type: eventConfigSchema, default: () => ({}) },
        presenceUpdate: { type: eventConfigSchema, default: () => ({}) },
        messageDelete: { type: eventConfigSchema, default: () => ({}) },
        messageUpdate: { type: eventConfigSchema, default: () => ({}) },
        messageBulkDelete: { type: eventConfigSchema, default: () => ({}) },
        messageReactionAdd: { type: eventConfigSchema, default: () => ({}) },
        messageReactionRemove: { type: eventConfigSchema, default: () => ({}) },
        channelCreate: { type: eventConfigSchema, default: () => ({}) },
        channelDelete: { type: eventConfigSchema, default: () => ({}) },
        channelUpdate: { type: eventConfigSchema, default: () => ({}) },
        channelPinsUpdate: { type: eventConfigSchema, default: () => ({}) },
        roleCreate: { type: eventConfigSchema, default: () => ({}) },
        roleDelete: { type: eventConfigSchema, default: () => ({}) },
        roleUpdate: { type: eventConfigSchema, default: () => ({}) },
        guildUpdate: { type: eventConfigSchema, default: () => ({}) },
        emojiCreate: { type: eventConfigSchema, default: () => ({}) },
        emojiDelete: { type: eventConfigSchema, default: () => ({}) },
        emojiUpdate: { type: eventConfigSchema, default: () => ({}) },
        stickerCreate: { type: eventConfigSchema, default: () => ({}) },
        stickerDelete: { type: eventConfigSchema, default: () => ({}) },
        stickerUpdate: { type: eventConfigSchema, default: () => ({}) },
        voiceStateUpdate: { type: eventConfigSchema, default: () => ({}) },
        inviteCreate: { type: eventConfigSchema, default: () => ({}) },
        inviteDelete: { type: eventConfigSchema, default: () => ({}) },
        threadCreate: { type: eventConfigSchema, default: () => ({}) },
        threadDelete: { type: eventConfigSchema, default: () => ({}) },
        threadUpdate: { type: eventConfigSchema, default: () => ({}) },
        threadMemberUpdate: { type: eventConfigSchema, default: () => ({}) },
        integrationCreate: { type: eventConfigSchema, default: () => ({}) },
        integrationDelete: { type: eventConfigSchema, default: () => ({}) },
        integrationUpdate: { type: eventConfigSchema, default: () => ({}) },
        webhookUpdate: { type: eventConfigSchema, default: () => ({}) },
        stageInstanceCreate: { type: eventConfigSchema, default: () => ({}) },
        stageInstanceDelete: { type: eventConfigSchema, default: () => ({}) },
        stageInstanceUpdate: { type: eventConfigSchema, default: () => ({}) },
        guildScheduledEventCreate: { type: eventConfigSchema, default: () => ({}) },
        guildScheduledEventDelete: { type: eventConfigSchema, default: () => ({}) },
        guildScheduledEventUpdate: { type: eventConfigSchema, default: () => ({}) },
        guildScheduledEventUserAdd: { type: eventConfigSchema, default: () => ({}) },
        guildScheduledEventUserRemove: { type: eventConfigSchema, default: () => ({}) }
    },

    localization: {
        type: String,
        default: 'en'
    },

    configLog: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

// Migration logic to update schema if new events are added
modLogSchema.statics.migrateSchema = async function (modLog) {
    const defaultEvents = [
        "memberJoin", "memberLeave", "memberUpdate", "memberBan", "memberUnban", "memberKick", "memberTimeout",
        "userUpdate", "presenceUpdate", "messageDelete", "messageUpdate", "messageBulkDelete", "messageReactionAdd", "messageReactionRemove",
        "channelCreate", "channelDelete", "channelUpdate", "channelPinsUpdate",
        "roleCreate", "roleDelete", "roleUpdate",
        "guildUpdate", "emojiCreate", "emojiDelete", "emojiUpdate", "stickerCreate", "stickerDelete", "stickerUpdate",
        "voiceStateUpdate", "inviteCreate", "inviteDelete",
        "threadCreate", "threadDelete", "threadUpdate", "threadMemberUpdate",
        "integrationCreate", "integrationDelete", "integrationUpdate",
        "webhookUpdate", "stageInstanceCreate", "stageInstanceDelete", "stageInstanceUpdate",
        "guildScheduledEventCreate", "guildScheduledEventDelete", "guildScheduledEventUpdate", "guildScheduledEventUserAdd", "guildScheduledEventUserRemove"
    ];
    let updated = false;
    for (const event of defaultEvents) {
        if (!modLog.events[event]) {
            modLog.events[event] = {};
            updated = true;
        }
    }
    if (updated) await modLog.save();
};

// Static method to get or create modlog settings for a guild
modLogSchema.statics.getOrCreate = async function(guildId) {
    let modLog = await this.findOne({ guildId });
    if (!modLog) {
        modLog = new this({ guildId });
        await modLog.save();
    } else {
        await this.migrateSchema(modLog);
    }
    return modLog;
};

// Method to get the appropriate channels/webhooks for an event
modLogSchema.methods.getEventTargets = function(eventType) {
    if (!this.enabled) return [];
    const eventConfig = this.events[eventType];
    if (!eventConfig || !eventConfig.enabled) return [];
    // Support legacy single channel
    let targets = [];
    if (eventConfig.channels && eventConfig.channels.length > 0) {
        targets = targets.concat(eventConfig.channels);
    }
    if (eventConfig.channel) {
        targets.push(eventConfig.channel);
    }
    if (eventConfig.webhooks && eventConfig.webhooks.length > 0) {
        targets = targets.concat(eventConfig.webhooks);
    }
    if (targets.length === 0 && this.defaultChannel) {
        targets.push(this.defaultChannel);
    }
    return targets;
};

// Method to check if an event is enabled
modLogSchema.methods.isEventEnabled = function(eventType) {
    if (!this.enabled) return false;
    const eventConfig = this.events[eventType];
    return eventConfig && eventConfig.enabled;
};

// Method to check if a user/role should be excluded
modLogSchema.methods.isExcluded = function(eventType, userId, roleIds = []) {
    const eventConfig = this.events[eventType];
    if (!eventConfig) return false;
    if (eventConfig.excludeUsers && eventConfig.excludeUsers.includes(userId)) return true;
    if (eventConfig.excludeRoles && roleIds.some(rid => eventConfig.excludeRoles.includes(rid))) return true;
    return false;
};

// Method to get custom template for an event
modLogSchema.methods.getTemplate = function(eventType) {
    const eventConfig = this.events[eventType];
    return eventConfig && eventConfig.template ? eventConfig.template : '';
};

// Method to log configuration changes
modLogSchema.methods.logConfigChange = function(change) {
    this.configLog.push(`[${new Date().toISOString()}] ${change}`);
    return this.save();
};

module.exports = mongoose.model('ModLog', modLogSchema);
