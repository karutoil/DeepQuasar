const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    reminder_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    target_id: { type: String, default: null }, // user_id, channel_id, or null for self
    target_type: { type: String, enum: ['self', 'user', 'channel'], default: 'self' },
    task_description: { type: String, required: true },
    role_id: { type: String, default: null }, // Only for channel reminders
    trigger_timestamp: { type: Number, required: true }, // UTC ms
    created_timestamp: { type: Number, required: true },
    guild_id: { type: String, required: true },
    timezone: { type: String, default: 'UTC' }
}, {
    collection: 'reminders'
});

reminderSchema.index({ trigger_timestamp: 1 });
reminderSchema.index({ user_id: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
