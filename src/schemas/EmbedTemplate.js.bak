const mongoose = require('mongoose');

const EmbedTemplateSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        maxlength: 50
    },
    description: {
        type: String,
        maxlength: 200,
        default: ''
    },
    createdBy: {
        type: String,
        required: true
    },
    embedData: {
        title: { type: String, maxlength: 256 },
        description: { type: String, maxlength: 4096 },
        url: { type: String, maxlength: 500 },
        color: { type: Number },
        timestamp: { type: Boolean, default: false },
        author: {
            name: { type: String, maxlength: 256 },
            iconURL: { type: String, maxlength: 500 },
            url: { type: String, maxlength: 500 }
        },
        thumbnail: {
            url: { type: String, maxlength: 500 }
        },
        image: {
            url: { type: String, maxlength: 500 }
        },
        footer: {
            text: { type: String, maxlength: 2048 },
            iconURL: { type: String, maxlength: 500 }
        },
        fields: [{
            name: { type: String, maxlength: 256 },
            value: { type: String, maxlength: 1024 },
            inline: { type: Boolean, default: false }
        }]
    },
    messageContent: {
        type: String,
        maxlength: 2000,
        default: ''
    }
}, {
    timestamps: true
});

// Ensure unique template names per guild
EmbedTemplateSchema.index({ guildId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('EmbedTemplate', EmbedTemplateSchema);
