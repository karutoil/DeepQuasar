const mongoose = require('mongoose');

const punishmentLogSchema = new mongoose.Schema({
    // Guild and user information
    guildId: {
        type: String,
        required: true,
        index: true
    },
    
    userId: {
        type: String,
        required: true,
        index: true
    },
    
    // Moderation action details
    action: {
        type: String,
        required: true,
        enum: ['warn', 'kick', 'ban', 'unban', 'mute', 'unmute', 'lock', 'unlock', 'slowmode', 'strike', 'softban', 'note', 'pardon']
    },
    
    moderatorId: {
        type: String,
        required: true
    },
    
    reason: {
        type: String,
        default: 'No reason provided'
    },
    
    // Case management
    caseId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Duration (for temporary actions)
    duration: {
        type: Number, // in milliseconds
        default: null
    },
    
    expiresAt: {
        type: Date,
        default: null
    },
    
    // Status tracking
    status: {
        type: String,
        enum: ['active', 'expired', 'pardoned', 'appealed'],
        default: 'active'
    },
    
    // Additional context
    evidence: [{
        type: {
            type: String,
            enum: ['message', 'image', 'video', 'link', 'other']
        },
        content: String,
        url: String
    }],
    
    // Target information (for channel actions)
    targetChannel: {
        type: String,
        default: null
    },
    
    // Previous value (for reversible actions)
    previousValue: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    
    // Appeal information
    appeal: {
        submitted: {
            type: Boolean,
            default: false
        },
        reason: {
            type: String,
            default: null
        },
        submittedAt: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'denied'],
            default: 'pending'
        },
        reviewedBy: {
            type: String,
            default: null
        },
        reviewedAt: {
            type: Date,
            default: null
        },
        reviewNote: {
            type: String,
            default: null
        }
    },
    
    // System flags
    autoAction: {
        type: Boolean,
        default: false // true if this was triggered by auto-moderation
    },
    
    // Related cases (for tracking patterns)
    relatedCases: [{
        type: String
    }],
    
    // Edit history
    editHistory: [{
        editedBy: String,
        editedAt: {
            type: Date,
            default: Date.now
        },
        oldReason: String,
        newReason: String
    }]
}, {
    timestamps: true
});

// Compound indexes for efficient queries
punishmentLogSchema.index({ guildId: 1, userId: 1 });
punishmentLogSchema.index({ guildId: 1, action: 1 });
punishmentLogSchema.index({ guildId: 1, status: 1 });
punishmentLogSchema.index({ expiresAt: 1 }, { sparse: true });

// Static methods
punishmentLogSchema.statics.generateCaseId = function(guildId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${guildId.slice(-4)}-${timestamp}-${random}`.toUpperCase();
};

punishmentLogSchema.statics.getActiveWarnings = function(guildId, userId) {
    return this.find({
        guildId,
        userId,
        action: { $in: ['warn', 'strike'] },
        status: 'active'
    }).sort({ createdAt: -1 });
};

punishmentLogSchema.statics.getUserHistory = function(guildId, userId, limit = 10) {
    return this.find({
        guildId,
        userId
    }).sort({ createdAt: -1 }).limit(limit);
};

punishmentLogSchema.statics.getExpiredActions = function() {
    return this.find({
        expiresAt: { $lte: new Date() },
        status: 'active',
        action: { $in: ['mute', 'ban'] }
    });
};

module.exports = mongoose.model('PunishmentLog', punishmentLogSchema);
