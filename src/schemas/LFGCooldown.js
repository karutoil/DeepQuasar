const mongoose = require('mongoose');

const lfgCooldownSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    
    guildId: {
        type: String,
        required: true
    },
    
    lastPostAt: {
        type: Date,
        required: true
    },
    
    // Cooldown duration specific to this user/guild combo
    cooldownDuration: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Compound index for efficient lookups
lfgCooldownSchema.index({ userId: 1, guildId: 1 }, { unique: true });

// TTL index to automatically clean up old cooldown records
lfgCooldownSchema.index({ lastPostAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours

module.exports = mongoose.model('LFGCooldown', lfgCooldownSchema);
