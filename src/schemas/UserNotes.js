const mongoose = require('mongoose');

const userNotesSchema = new mongoose.Schema({
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
    
    notes: [{
        noteId: {
            type: String,
            required: true,
            unique: true
        },
        content: {
            type: String,
            required: true,
            maxlength: 2000
        },
        moderatorId: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['general', 'warning', 'positive', 'concern', 'investigation'],
            default: 'general'
        },
        tags: [{
            type: String,
            maxlength: 50
        }],
        isPrivate: {
            type: Boolean,
            default: true // Private to moderators only
        },
        attachments: [{
            type: String, // URLs to images/files
            maxlength: 500
        }],
        editHistory: [{
            editedBy: String,
            editedAt: {
                type: Date,
                default: Date.now
            },
            oldContent: String
        }],
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Quick stats
    totalNotes: {
        type: Number,
        default: 0
    },
    
    lastNoteAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Compound indexes
userNotesSchema.index({ guildId: 1, userId: 1 }, { unique: true });
userNotesSchema.index({ 'notes.moderatorId': 1 });
userNotesSchema.index({ 'notes.type': 1 });

// Pre-save middleware to update stats
userNotesSchema.pre('save', function(next) {
    this.totalNotes = this.notes.length;
    if (this.notes.length > 0) {
        this.lastNoteAt = this.notes[this.notes.length - 1].createdAt;
    }
    next();
});

// Static methods
userNotesSchema.statics.addNote = function(guildId, userId, noteData) {
    const noteId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    return this.findOneAndUpdate(
        { guildId, userId },
        {
            $push: {
                notes: {
                    noteId,
                    ...noteData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            }
        },
        { upsert: true, new: true }
    );
};

userNotesSchema.statics.editNote = function(guildId, userId, noteId, newContent, editorId) {
    return this.findOneAndUpdate(
        { 
            guildId, 
            userId,
            'notes.noteId': noteId
        },
        {
            $set: {
                'notes.$.content': newContent,
                'notes.$.updatedAt': new Date()
            },
            $push: {
                'notes.$.editHistory': {
                    editedBy: editorId,
                    editedAt: new Date(),
                    oldContent: '$notes.$.content'
                }
            }
        },
        { new: true }
    );
};

userNotesSchema.statics.deleteNote = function(guildId, userId, noteId) {
    return this.findOneAndUpdate(
        { guildId, userId },
        {
            $pull: {
                notes: { noteId }
            }
        },
        { new: true }
    );
};

userNotesSchema.statics.getUserNotes = function(guildId, userId, includePrivate = true) {
    const match = { guildId, userId };
    
    if (!includePrivate) {
        match['notes.isPrivate'] = false;
    }
    
    return this.findOne(match);
};

module.exports = mongoose.model('UserNotes', userNotesSchema);
