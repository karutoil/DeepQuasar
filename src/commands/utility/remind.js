const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const Reminder = require('../../schemas/Reminder');
const User = require('../../schemas/User');
const timeParser = require('../../utils/timeParser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder for yourself, a user, or a channel.')
        .addUserOption(opt => opt.setName('user').setDescription('User to remind (optional)'))
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to remind (optional)').addChannelTypes(ChannelType.GuildText))
        .addStringOption(opt => opt.setName('time').setDescription('When to remind (e.g., "in 10m", "on 2025-07-20 14:00")').setRequired(true))
        .addStringOption(opt => opt.setName('task').setDescription('What to remind about').setRequired(true)),
    async execute(interaction) {
        const user = interaction.user;
        const guildId = interaction.guildId;
        const targetUser = interaction.options.getUser('user');
        const targetChannel = interaction.options.getChannel('channel');
        const timeStr = interaction.options.getString('time');
        const task = interaction.options.getString('task');

        // Only one of user/channel allowed
        if (targetUser && targetChannel) {
            return interaction.reply({ content: '❌ Please specify only a user or a channel, not both.', ephemeral: true });
        }

        // Get user timezone if set
        let userDoc = await User.findByUserId(user.id);
        let timezone = userDoc && userDoc.timezone ? userDoc.timezone : 'UTC';

        // Parse time
        const parsed = timeParser.parseTime(timeStr, timezone, new Date());
        if (!parsed || parsed.timestamp <= Date.now()) {
            return interaction.reply({ content: '❌ Invalid or past time/date.', ephemeral: true });
        }

        let targetType = 'self';
        let targetId = null;
        if (targetUser) {
            targetType = 'user';
            targetId = targetUser.id;
        } else if (targetChannel) {
            targetType = 'channel';
            targetId = targetChannel.id;
        }

        // Create reminder
        const reminder = await Reminder.create({
            reminder_id: timeParser.generateId(),
            user_id: user.id,
            target_id: targetId,
            target_type: targetType,
            task_description: task,
            trigger_timestamp: parsed.timestamp,
            created_timestamp: Date.now(),
            guild_id: guildId,
            timezone
        });

        await interaction.reply({
            content: `⏰ Reminder set for <t:${Math.floor(parsed.timestamp/1000)}:f>!`,
            ephemeral: true
        });
    }
};
