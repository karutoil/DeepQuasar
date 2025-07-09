const mongoose = require('mongoose');

const lfgPostSchema = new mongoose.Schema({
    messageId: {
        type: String,
        required: true
    },
    
    guildId: {
        type: String,
        required: true
    },
    
    channelId: {
        type: String,
        required: true
    },
    
    userId: {
        type: String,
        required: true
    },
    
    // Post content
    gameName: {
        type: String,
        required: true
    },
    
    message: {
        type: String,
        required: true
    },
    
    // Voice channel info (if applicable)
    voiceChannel: {
        id: String,
        name: String
    },
    
    // Post type
    postType: {
        type: String,
        enum: ['voice', 'dm'],
        required: true
    },
    
    // Expiration
    expiresAt: Date,
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Interaction counts (for analytics)
    interactions: {
        edits: {
            type: Number,
            default: 0
        },
        views: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Index for efficient queries
lfgPostSchema.index({ userId: 1, guildId: 1, isActive: 1 });
lfgPostSchema.index({ guildId: 1, isActive: 1 });
lfgPostSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('LFGPost', lfgPostSchema);
