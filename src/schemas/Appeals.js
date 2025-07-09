const mongoose = require('mongoose');

const appealsSchema = new mongoose.Schema({
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
    
    caseId: {
        type: String,
        required: true,
        index: true
    },
    
    // Appeal details
    appealReason: {
        type: String,
        required: true,
        maxlength: 2000
    },
    
    additionalInfo: {
        type: String,
        maxlength: 1000,
        default: ''
    },
    
    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'under_review', 'approved', 'denied', 'withdrawn'],
        default: 'pending'
    },
    
    // Review information
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
        maxlength: 1000,
        default: null
    },
    
    // Original punishment details (cached for reference)
    originalPunishment: {
        action: String,
        reason: String,
        moderatorId: String,
        createdAt: Date
    },
    
    // Evidence/attachments
    evidence: [{
        type: {
            type: String,
            enum: ['image', 'video', 'document', 'link', 'text']
        },
        content: String,
        url: String,
        description: String
    }],
    
    // Appeal conversation/updates
    updates: [{
        type: {
            type: String,
            enum: ['user_message', 'staff_message', 'status_change', 'evidence_added']
        },
        content: String,
        authorId: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        isInternal: {
            type: Boolean,
            default: false // Internal notes only visible to staff
        }
    }],
    
    // Cooldown tracking
    previousAppeals: [{
        submittedAt: Date,
        status: String
    }],
    
    // Auto-expiry
    expiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days
        }
    },
    
    // Metrics
    responseTime: {
        type: Number, // milliseconds from submission to first review
        default: null
    },
    
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    }
}, {
    timestamps: true
});

// Compound indexes
appealsSchema.index({ guildId: 1, userId: 1 });
appealsSchema.index({ guildId: 1, status: 1 });
appealsSchema.index({ guildId: 1, caseId: 1 }, { unique: true });
appealsSchema.index({ expiresAt: 1 }, { sparse: true });

// Pre-save middleware
appealsSchema.pre('save', function(next) {
    // Calculate response time when first reviewed
    if (this.isModified('status') && this.status === 'under_review' && !this.responseTime) {
        this.responseTime = Date.now() - this.createdAt.getTime();
    }
    
    // Set reviewedAt when status changes to reviewed states
    if (this.isModified('status') && ['approved', 'denied'].includes(this.status) && !this.reviewedAt) {
        this.reviewedAt = new Date();
    }
    
    next();
});

// Static methods
appealsSchema.statics.canUserAppeal = async function(guildId, userId, caseId) {
    // Check if user has already appealed this case
    const existingAppeal = await this.findOne({
        guildId,
        userId,
        caseId,
        status: { $in: ['pending', 'under_review'] }
    });
    
    if (existingAppeal) {
        return { canAppeal: false, reason: 'Appeal already pending' };
    }
    
    // Check cooldown period
    const recentAppeal = await this.findOne({
        guildId,
        userId,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    if (recentAppeal) {
        return { canAppeal: false, reason: 'Must wait 24 hours between appeals' };
    }
    
    return { canAppeal: true };
};

appealsSchema.statics.getPendingAppeals = function(guildId, limit = 10) {
    return this.find({
        guildId,
        status: { $in: ['pending', 'under_review'] }
    }).sort({ createdAt: 1 }).limit(limit);
};

appealsSchema.statics.getUserAppealHistory = function(guildId, userId) {
    return this.find({
        guildId,
        userId
    }).sort({ createdAt: -1 });
};

appealsSchema.statics.addUpdate = function(guildId, userId, caseId, updateData) {
    return this.findOneAndUpdate(
        { guildId, userId, caseId },
        {
            $push: {
                updates: {
                    ...updateData,
                    timestamp: new Date()
                }
            }
        },
        { new: true }
    );
};

module.exports = mongoose.model('Appeals', appealsSchema);
