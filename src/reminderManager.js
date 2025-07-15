const Reminder = require('./schemas/Reminder');
const User = require('./schemas/User');
const { DateTime } = require('luxon');

class ReminderManager {
    constructor(client) {
        this.client = client;
        this.timers = new Map();
    }

    async loadReminders() {
        const now = Date.now();
        const reminders = await Reminder.find({ trigger_timestamp: { $gt: now } });
        for (const reminder of reminders) {
            this.scheduleReminder(reminder);
        }
    }

    scheduleReminder(reminder) {
        const delay = reminder.trigger_timestamp - Date.now();
        if (delay <= 0) {
            this.deliverReminder(reminder);
            return;
        }
        if (this.timers.has(reminder.reminder_id)) {
            clearTimeout(this.timers.get(reminder.reminder_id));
        }
        const timeout = setTimeout(() => this.deliverReminder(reminder), delay);
        this.timers.set(reminder.reminder_id, timeout);
    }

    rescheduleReminder(reminder) {
        this.cancelReminder(reminder.reminder_id);
        this.scheduleReminder(reminder);
    }

    cancelReminder(reminderId) {
        if (this.timers.has(reminderId)) {
            clearTimeout(this.timers.get(reminderId));
            this.timers.delete(reminderId);
        }
    }

    async deliverReminder(reminder) {
        try {
            // Remove from DB
            await Reminder.deleteOne({ reminder_id: reminder.reminder_id });
            this.cancelReminder(reminder.reminder_id);

            // Fetch user for timezone
            const userDoc = await User.findByUserId(reminder.user_id);
            const timezone = userDoc && userDoc.timezone ? userDoc.timezone : 'UTC';

            // Build message
            const timeStr = DateTime.fromMillis(reminder.trigger_timestamp, { zone: timezone }).toFormat('yyyy-MM-dd HH:mm');
            const content = `⏰ **Reminder:** ${reminder.task_description}\nSet by <@${reminder.user_id}>\nTime: ${timeStr}`;

            // Deliver
            if (reminder.target_type === 'self') {
                // DM the user who set it
                const user = await this.client.users.fetch(reminder.user_id).catch(() => null);
                if (user) await user.send(content);
            } else if (reminder.target_type === 'user') {
                const user = await this.client.users.fetch(reminder.target_id).catch(() => null);
                if (user) await user.send(content + `\n(From <@${reminder.user_id}>)`);
            } else if (reminder.target_type === 'channel') {
                const channel = await this.client.channels.fetch(reminder.target_id).catch(() => null);
                if (channel && channel.isTextBased()) {
                    await channel.send(content + `\n(From <@${reminder.user_id}>)`);
                }
            }
        } catch (err) {
            console.error('Error delivering reminder:', err);
        }
    }
}

module.exports = ReminderManager;
