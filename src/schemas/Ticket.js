const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true
    },
    
    guildId: {
        type: String,
        required: true
    },
    
    channelId: {
        type: String,
        required: true,
        unique: true
    },
    
    userId: {
        type: String,
        required: true
    },
    
    username: {
        type: String,
        required: true
    },
    
    type: {
        type: String,
        required: true
    },
    
    reason: {
        type: String,
        required: true
    },
    
    status: {
        type: String,
        enum: ['open', 'closed', 'deleted'],
        default: 'open'
    },
    
    assignedTo: {
        userId: {
            type: String,
            default: null
        },
        username: {
            type: String,
            default: null
        },
        assignedAt: {
            type: Date,
            default: null
        },
        note: {
            type: String,
            default: null
        }
    },
    
    tags: [{
        type: String
    }],
    
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    
    closedBy: {
        userId: {
            type: String,
            default: null
        },
        username: {
            type: String,
            default: null
        },
        reason: {
            type: String,
            default: null
        },
        closedAt: {
            type: Date,
            default: null
        }
    },
    
    reopenedBy: {
        userId: {
            type: String,
            default: null
        },
        username: {
            type: String,
            default: null
        },
        reopenedAt: {
            type: Date,
            default: null
        },
        reason: {
            type: String,
            default: null
        }
    },
    
    transcript: {
        generated: {
            type: Boolean,
            default: false
        },
        url: {
            type: String,
            default: null
        },
        messageCount: {
            type: Number,
            default: 0
        }
    },
    
    autoCloseScheduled: {
        type: Date,
        default: null
    },
    
    lastActivity: {
        type: Date,
        default: Date.now
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    },

    // Soft delete support
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
});

// Update the updatedAt field on save
ticketSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for better performance
ticketSchema.index({ guildId: 1, status: 1 });
ticketSchema.index({ userId: 1, guildId: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
