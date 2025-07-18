const Reminder = require('../../../schemas/Reminder');
const User = require('../../../schemas/User');
const { DateTime } = require('luxon');

class ReminderManager {
    constructor(client) {
        this.client = client;
        this.timers = new Map();
    }

    async loadReminders() {
        const now = Date.now();

        // Find all reminders, both overdue and future
        const reminders = await Reminder.find({});

        for (const reminder of reminders) {
            if (reminder.trigger_timestamp <= now) {
                // Overdue: deliver immediately
                this.deliverReminder(reminder);
            } else {
                // Future: schedule as normal
                this.scheduleReminder(reminder);
            }
        }
    }

    scheduleReminder(reminder) {
        const delay = reminder.trigger_timestamp - Date.now();

        // If delay is more than 24 days, use setTimeout only for the first chunk, then reschedule
        // This avoids setTimeout limit (max ~24.8 days)
        const MAX_TIMEOUT = 2147483647; // ~24.8 days in ms

        const schedule = (remainingDelay) => {
            if (remainingDelay > MAX_TIMEOUT) {
                const timeout = setTimeout(() => {
                    schedule(remainingDelay - MAX_TIMEOUT);
                }, MAX_TIMEOUT);
                this.timers.set(reminder.reminder_id, timeout);
            } else if (remainingDelay > 0) {
                const timeout = setTimeout(() => this.deliverReminder(reminder), remainingDelay);
                this.timers.set(reminder.reminder_id, timeout);
            } else {
                // Immediate delivery for overdue reminder
                this.deliverReminder(reminder);
            }
        };

        if (this.timers.has(reminder.reminder_id)) {
            clearTimeout(this.timers.get(reminder.reminder_id));
        }
        schedule(delay);
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
            // Remove from DB before delivery to ensure purge even if delivery fails
            await Reminder.deleteOne({ reminder_id: reminder.reminder_id });
            this.cancelReminder(reminder.reminder_id);

            // Fetch user for timezone
            const userDoc = await User.findByUserId(reminder.user_id);
            const timezone = userDoc && userDoc.timezone ? userDoc.timezone : 'UTC';

            // Build embed
            const { EmbedBuilder } = require('discord.js');
            const timeStr = DateTime.fromMillis(reminder.trigger_timestamp, { zone: timezone }).toFormat('yyyy-MM-dd HH:mm');
            const unixTime = Math.floor(reminder.trigger_timestamp / 1000);

            const embed = new EmbedBuilder()
                .setTitle('⏰ Reminder')
                .setDescription(reminder.task_description)
                .setColor(0x57F287)
                .addFields(
                    { name: 'Time', value: `<t:${unixTime}:F>`, inline: true },
                    { name: 'Set By', value: `<@${reminder.user_id}>`, inline: true },
                    { name: 'Target', value: reminder.target_type === 'self'
                        ? 'You (DM)'
                        : reminder.target_type === 'user'
                            ? `<@${reminder.target_id}>`
                            : `<#${reminder.target_id}>`, inline: true }
                )
                .setFooter({ text: `DeepQuasar • Reminder`, iconURL: this.client.user.displayAvatarURL() })
                .setTimestamp(reminder.trigger_timestamp);

            // Deliver
            if (reminder.target_type === 'self') {
                // DM the user who set it
                const user = await this.client.users.fetch(reminder.user_id).catch(() => null);
                if (user) {
                    try {
                        await user.send({ embeds: [embed] });
                    } catch (e) {
                        // fallback: send in a mutual guild channel if possible
                        const guild = this.client.guilds.cache.get(reminder.guild_id);
                        if (guild) {
                            const member = await guild.members.fetch(reminder.user_id).catch(() => null);
                            if (member && guild.systemChannel) {
                                await guild.systemChannel.send({ content: `<@${reminder.user_id}>`, embeds: [embed] });
                            }
                        }
                    }
                }
            } else if (reminder.target_type === 'user') {
                const user = await this.client.users.fetch(reminder.target_id).catch(() => null);
                if (user) {
                    try {
                        await user.send({ embeds: [embed] });
                    } catch (e) {
                        // fallback: send in a mutual guild channel if possible
                        const guild = this.client.guilds.cache.get(reminder.guild_id);
                        if (guild) {
                            const member = await guild.members.fetch(reminder.target_id).catch(() => null);
                            if (member && guild.systemChannel) {
                                await guild.systemChannel.send({ content: `<@${reminder.target_id}>`, embeds: [embed] });
                            }
                        }
                    }
                }
            } else if (reminder.target_type === 'channel') {
                const channel = await this.client.channels.fetch(reminder.target_id).catch(() => null);
                if (channel && channel.isTextBased()) {
                    // If a role_id is present, send as content, not in embed
                    if (reminder.role_id) {
                        await channel.send({
                            content: `<@&${reminder.role_id}>`,
                            embeds: [embed.setDescription(reminder.task_description)]
                        });
                    } else {
                        // If description starts with @everyone or @here, move it to content
                        const everyoneMatch = reminder.task_description.match(/^(@everyone|@here)\s*/i);
                        if (everyoneMatch) {
                            const mention = everyoneMatch[1];
                            const rest = reminder.task_description.slice(everyoneMatch[0].length).trim();
                            await channel.send({ content: mention, embeds: [embed.setDescription(rest)] });
                        } else {
                            await channel.send({ embeds: [embed] });
                        }
                    }
                }
            }
        } catch (err) {
            // Silent fail for delivery errors
        }
    }
}

module.exports = ReminderManager;
