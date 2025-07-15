const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const Reminder = require('../../schemas/Reminder');
const User = require('../../schemas/User');
const timeParser = require('../../utils/timeParser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder')
        .addSubcommand(sub =>
            sub.setName('me')
                .setDescription('Set a reminder for yourself')
                .addStringOption(opt => opt.setName('time').setDescription('When to remind (e.g., "in 10m", "on 2025-07-20 14:00")').setRequired(true))
                .addStringOption(opt => opt.setName('task').setDescription('What to remind about').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('user')
                .setDescription('Set a reminder for another user')
                .addUserOption(opt => opt.setName('user').setDescription('User to remind').setRequired(true))
                .addStringOption(opt => opt.setName('time').setDescription('When to remind (e.g., "in 10m", "on 2025-07-20 14:00")').setRequired(true))
                .addStringOption(opt => opt.setName('task').setDescription('What to remind about').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('channel')
                .setDescription('Set a reminder for a channel (optionally ping a role)')
                .addChannelOption(opt => opt.setName('channel').setDescription('Channel to remind').addChannelTypes(ChannelType.GuildText).setRequired(true))
                .addStringOption(opt => opt.setName('time').setDescription('When to remind (e.g., "in 10m", "on 2025-07-20 14:00")').setRequired(true))
                .addStringOption(opt => opt.setName('task').setDescription('What to remind about').setRequired(true))
                .addRoleOption(opt => opt.setName('role').setDescription('Role to ping (optional)'))
        ),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const user = interaction.user;
        const guildId = interaction.guildId;

        // Get user timezone if set
        let userDoc = await User.findByUserId(user.id);
        let timezone = userDoc && userDoc.timezone ? userDoc.timezone : 'UTC';

        if (sub === 'me') {
            const timeStr = interaction.options.getString('time');
            const task = interaction.options.getString('task');
            const parsed = timeParser.parseTime(timeStr, timezone, new Date());
            if (!parsed || parsed.timestamp <= Date.now()) {
                return interaction.reply({ content: '❌ Invalid or past time/date.', ephemeral: true });
            }
            const reminder = await Reminder.create({
                reminder_id: timeParser.generateId(),
                user_id: user.id,
                target_id: null,
                target_type: 'self',
                task_description: task,
                trigger_timestamp: parsed.timestamp,
                created_timestamp: Date.now(),
                guild_id: guildId,
                timezone
            });
            if (interaction.client.reminderManager) {
                interaction.client.reminderManager.scheduleReminder(reminder);
            }
            await interaction.reply({
                content: `⏰ Reminder set for <t:${Math.floor(parsed.timestamp/1000)}:f>!`,
                ephemeral: true
            });
        } else if (sub === 'user') {
            // Permission check: ManageGuild or ManageMessages
            const member = interaction.member;
            if (
                !member.permissions.has(PermissionFlagsBits.ManageGuild) &&
                !member.permissions.has(PermissionFlagsBits.ManageMessages)
            ) {
                return interaction.reply({
                    content: '❌ You need the Manage Server or Manage Messages permission to set reminders for other users.',
                    ephemeral: true
                });
            }
            const targetUser = interaction.options.getUser('user');
            const timeStr = interaction.options.getString('time');
            const task = interaction.options.getString('task');
            const parsed = timeParser.parseTime(timeStr, timezone, new Date());
            if (!parsed || parsed.timestamp <= Date.now()) {
                return interaction.reply({ content: '❌ Invalid or past time/date.', ephemeral: true });
            }
            const reminder = await Reminder.create({
                reminder_id: timeParser.generateId(),
                user_id: user.id,
                target_id: targetUser.id,
                target_type: 'user',
                task_description: task,
                trigger_timestamp: parsed.timestamp,
                created_timestamp: Date.now(),
                guild_id: guildId,
                timezone
            });
            if (interaction.client.reminderManager) {
                interaction.client.reminderManager.scheduleReminder(reminder);
            }
            await interaction.reply({
                content: `⏰ Reminder for <@${targetUser.id}> set for <t:${Math.floor(parsed.timestamp/1000)}:f>!`,
                ephemeral: true
            });
        } else if (sub === 'channel') {
            // Permission check: ManageMessages
            const member = interaction.member;
            if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({
                    content: '❌ You need the Manage Messages permission to set reminders for channels.',
                    ephemeral: true
                });
            }
            const targetChannel = interaction.options.getChannel('channel');
            const role = interaction.options.getRole('role');
            const timeStr = interaction.options.getString('time');
            const task = interaction.options.getString('task');
            const parsed = timeParser.parseTime(timeStr, timezone, new Date());
            if (!parsed || parsed.timestamp <= Date.now()) {
                return interaction.reply({ content: '❌ Invalid or past time/date.', ephemeral: true });
            }
            const reminder = await Reminder.create({
                reminder_id: timeParser.generateId(),
                user_id: user.id,
                target_id: targetChannel.id,
                target_type: 'channel',
                task_description: task,
                role_id: role ? role.id : null,
                trigger_timestamp: parsed.timestamp,
                created_timestamp: Date.now(),
                guild_id: guildId,
                timezone
            });
            if (interaction.client.reminderManager) {
                interaction.client.reminderManager.scheduleReminder(reminder);
            }
            await interaction.reply({
                content: `⏰ Reminder for <#${targetChannel.id}> set for <t:${Math.floor(parsed.timestamp/1000)}:f>!`,
                ephemeral: true
            });
        }
    }
};
