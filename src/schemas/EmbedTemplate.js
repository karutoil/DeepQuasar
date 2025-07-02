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
        maxlength: 50,
        trim: true
    },
    description: {
        type: String,
        maxlength: 200,
        default: '',
        trim: true
    },
    createdBy: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'General',
        maxlength: 30,
        trim: true
    },
    tags: [{
        type: String,
        maxlength: 20,
        trim: true
    }],
    usage: {
        count: { type: Number, default: 0 },
        lastUsed: { type: Date }
    },
    embedData: {
        title: { 
            type: String, 
            maxlength: 256,
            trim: true
        },
        description: { 
            type: String, 
            maxlength: 4000,
            trim: true
        },
        url: { 
            type: String, 
            maxlength: 500,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^https?:\/\/.+/.test(v);
                },
                message: 'URL must be a valid HTTP/HTTPS URL'
            }
        },
        color: { 
            type: Number,
            min: 0,
            max: 16777215
        },
        timestamp: { 
            type: Boolean, 
            default: false 
        },
        author: {
            name: { 
                type: String, 
                maxlength: 256,
                trim: true
            },
            iconURL: { 
                type: String, 
                maxlength: 500,
                trim: true,
                validate: {
                    validator: function(v) {
                        if (!v) return true;
                        return /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)$/i.test(v);
                    },
                    message: 'Icon URL must be a valid image URL'
                }
            },
            url: { 
                type: String, 
                maxlength: 500,
                trim: true,
                validate: {
                    validator: function(v) {
                        if (!v) return true;
                        return /^https?:\/\/.+/.test(v);
                    },
                    message: 'URL must be a valid HTTP/HTTPS URL'
                }
            }
        },
        thumbnail: {
            url: { 
                type: String, 
                maxlength: 500,
                trim: true,
                validate: {
                    validator: function(v) {
                        if (!v) return true;
                        return /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)$/i.test(v);
                    },
                    message: 'Thumbnail URL must be a valid image URL'
                }
            }
        },
        image: {
            url: { 
                type: String, 
                maxlength: 500,
                trim: true,
                validate: {
                    validator: function(v) {
                        if (!v) return true;
                        return /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)$/i.test(v);
                    },
                    message: 'Image URL must be a valid image URL'
                }
            }
        },
        footer: {
            text: { 
                type: String, 
                maxlength: 2048,
                trim: true
            },
            iconURL: { 
                type: String, 
                maxlength: 500,
                trim: true,
                validate: {
                    validator: function(v) {
                        if (!v) return true;
                        return /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)$/i.test(v);
                    },
                    message: 'Footer icon URL must be a valid image URL'
                }
            }
        },
        fields: [{
            name: { 
                type: String, 
                maxlength: 256,
                required: true,
                trim: true
            },
            value: { 
                type: String, 
                maxlength: 1024,
                required: true,
                trim: true
            },
            inline: { 
                type: Boolean, 
                default: false 
            }
        }]
    },
    messageContent: {
        type: String,
        maxlength: 2000,
        default: '',
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for better performance
EmbedTemplateSchema.index({ guildId: 1, name: 1 }, { unique: true });
EmbedTemplateSchema.index({ guildId: 1, category: 1 });
EmbedTemplateSchema.index({ guildId: 1, tags: 1 });
EmbedTemplateSchema.index({ guildId: 1, createdBy: 1 });
EmbedTemplateSchema.index({ 'usage.lastUsed': -1 });

// Instance methods
EmbedTemplateSchema.methods.incrementUsage = function() {
    this.usage.count += 1;
    this.usage.lastUsed = new Date();
    return this.save();
};

EmbedTemplateSchema.methods.toDisplayObject = function() {
    return {
        id: this._id,
        name: this.name,
        description: this.description,
        category: this.category,
        tags: this.tags,
        usage: this.usage,
        createdBy: this.createdBy,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

// Static methods
EmbedTemplateSchema.statics.findByGuild = function(guildId) {
    return this.find({ guildId }).sort({ 'usage.lastUsed': -1, createdAt: -1 });
};

EmbedTemplateSchema.statics.findByCategory = function(guildId, category) {
    return this.find({ guildId, category }).sort({ 'usage.lastUsed': -1, createdAt: -1 });
};

EmbedTemplateSchema.statics.searchTemplates = function(guildId, searchTerm) {
    const regex = new RegExp(searchTerm, 'i');
    return this.find({
        guildId,
        $or: [
            { name: regex },
            { description: regex },
            { tags: { $in: [regex] } }
        ]
    }).sort({ 'usage.lastUsed': -1, createdAt: -1 });
};

EmbedTemplateSchema.statics.getPopularTemplates = function(guildId, limit = 10) {
    return this.find({ guildId })
        .sort({ 'usage.count': -1, 'usage.lastUsed': -1 })
        .limit(limit);
};

module.exports = mongoose.model('EmbedTemplate', EmbedTemplateSchema);
