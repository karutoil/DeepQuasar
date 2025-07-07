const mongoose = require('mongoose');

const tempVCSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        index: true
    },
    
    // Core settings
    enabled: {
        type: Boolean,
        default: false
    },
    
    // Join to create channel
    joinToCreateChannelId: {
        type: String,
        default: null
    },
    
    // Category where temp VCs are created
    tempVCCategoryId: {
        type: String,
        default: null
    },
    
    // Overflow categories for when main category is full
    overflowCategories: [{
        categoryId: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        channelCount: {
            type: Number,
            default: 0
        }
    }],
    
    // Overflow settings
    overflowSettings: {
        maxOverflowCategories: {
            type: Number,
            default: 5,
            min: 1,
            max: 10
        },
        namingPattern: {
            type: String,
            default: '{name} ({number})'
        },
        autoCleanup: {
            type: Boolean,
            default: true
        }
    },
    
    // Default channel settings
    defaultSettings: {
        channelName: {
            type: String,
            default: "{user}'s Channel"
        },
        userLimit: {
            type: Number,
            default: 0,
            min: 0,
            max: 99
        },
        bitrate: {
            type: Number,
            default: 64000,
            min: 8000,
            max: 384000
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
    
    // Auto-delete settings
    autoDelete: {
        enabled: {
            type: Boolean,
            default: true
        },
        delayMinutes: {
            type: Number,
            default: 0,
            min: 0,
            max: 60
        }
    },
    
    // User permissions
    permissions: {
        whoCanCreate: {
            type: String,
            enum: ['everyone', 'role', 'specific'],
            default: 'everyone'
        },
        allowedRoles: [{
            type: String
        }],
        allowedUsers: [{
            type: String
        }],
        blacklistedRoles: [{
            type: String
        }],
        blacklistedUsers: [{
            type: String
        }]
    },
    
    // Naming templates
    namingTemplates: [{
        name: {
            type: String,
            required: true
        },
        template: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ''
        }
    }],
    
    // Advanced settings
    advanced: {
        maxChannelsPerUser: {
            type: Number,
            default: 1,
            min: 1,
            max: 10
        },
        cooldownMinutes: {
            type: Number,
            default: 0,
            min: 0,
            max: 60
        },
        requireBotPermissions: {
            type: Boolean,
            default: true
        },
        logChannelId: {
            type: String,
            default: null
        },
        sendControlPanel: {
            type: Boolean,
            default: true
        },
        panelStyle: {
            type: String,
            enum: ['buttons', 'select', 'both'],
            default: 'select'
        }
    }
}, {
    timestamps: true
});

// Index for faster queries
tempVCSchema.index({ guildId: 1, enabled: 1 });

// Static methods
tempVCSchema.statics.getOrCreate = async function(guildId) {
    let config = await this.findOne({ guildId });
    if (!config) {
        config = new this({ guildId });
        await config.save();
    }
    return config;
};

tempVCSchema.statics.findByGuildId = async function(guildId) {
    return await this.findOne({ guildId });
};

tempVCSchema.statics.createDefault = async function(guildId) {
    const config = new this({
        guildId,
        namingTemplates: [
            {
                name: 'User Channel',
                template: "{user}'s Channel",
                description: 'Simple channel with user name'
            },
            {
                name: 'User Activity',
                template: "{user} | {activity}",
                description: 'Channel with user activity'
            },
            {
                name: 'Gaming Style',
                template: "🎮 {user}'s Game",
                description: 'Gaming focused channel'
            },
            {
                name: 'Music Style',
                template: "🎵 {user}'s Music",
                description: 'Music focused channel'
            }
        ]
    });
    return await config.save();
};

// Instance methods
tempVCSchema.methods.isEnabled = function() {
    return this.enabled && this.joinToCreateChannelId && this.tempVCCategoryId;
};

tempVCSchema.methods.canUserCreate = function(userId, userRoles) {
    // Check if user is blacklisted
    if (this.permissions.blacklistedUsers.includes(userId)) {
        return { canCreate: false, reason: 'You are blacklisted from creating temp channels.' };
    }
    
    // Check if user has blacklisted role
    const hasBlacklistedRole = userRoles.some(roleId => 
        this.permissions.blacklistedRoles.includes(roleId)
    );
    if (hasBlacklistedRole) {
        return { canCreate: false, reason: 'Your role is blacklisted from creating temp channels.' };
    }
    
    // Check permission level
    switch (this.permissions.whoCanCreate) {
        case 'everyone':
            return { canCreate: true };
            
        case 'role':
            const hasAllowedRole = userRoles.some(roleId => 
                this.permissions.allowedRoles.includes(roleId)
            );
            if (!hasAllowedRole) {
                return { canCreate: false, reason: 'You need a specific role to create temp channels.' };
            }
            return { canCreate: true };
            
        case 'specific':
            if (!this.permissions.allowedUsers.includes(userId)) {
                return { canCreate: false, reason: 'You are not authorized to create temp channels.' };
            }
            return { canCreate: true };
            
        default:
            return { canCreate: false, reason: 'Invalid permission configuration.' };
    }
};

tempVCSchema.methods.getChannelName = function(user, activity = null, templateName = null) {
    let template = this.defaultSettings.channelName;
    
    // Use specific template if provided
    if (templateName) {
        const foundTemplate = this.namingTemplates.find(t => t.name === templateName);
        if (foundTemplate) {
            template = foundTemplate.template;
        }
    }
    
    // Replace placeholders
    let channelName = template
        .replace(/{user}/g, user.displayName || user.username)
        .replace(/{username}/g, user.username)
        .replace(/{tag}/g, user.tag)
        .replace(/{id}/g, user.id);
    
    if (activity) {
        channelName = channelName.replace(/{activity}/g, activity);
    } else {
        channelName = channelName.replace(/{activity}/g, 'Chilling');
    }
    
    // Replace time placeholders
    const now = new Date();
    channelName = channelName
        .replace(/{time}/g, now.toLocaleTimeString())
        .replace(/{date}/g, now.toLocaleDateString());
    
    return channelName;
};

module.exports = mongoose.model('TempVC', tempVCSchema);
