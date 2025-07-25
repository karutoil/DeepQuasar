const { Events, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const ChatBot = require('../utils/ChatBot');
const LFGMessageHandler = require('../modules/lfg/handlers/LFGMessageHandler');
const timeParser = require('../utils/timeParser');
const Reminder = require('../schemas/Reminder');
const User = require('../schemas/User');
const Guild = require('../schemas/Guild');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Skip if message is from a webhook or system
        if (message.webhookId || message.system) {
            return;
        }

        // Skip if not in a guild
        if (!message.guild) {
            return;
        }

        // Handle legacy bot mention reminder
        if (message.mentions.has(message.client.user) && /remind( me| @| #)/i.test(message.content)) {
            await handleLegacyRemind(message);
        }

        // Message Link Embed Feature
        await handleMessageLinkEmbed(message);

        // Handle LFG message detection
        await LFGMessageHandler.handleMessage(message);

        // Process the message with the chatbot
        await ChatBot.processMessage(message);

        // Update ticket activity if this is a ticket channel
        if (message.client.ticketManager) {
            await updateTicketActivity(message);
        }
    }
};

async function handleMessageLinkEmbed(message) {
    // Only in guilds
    if (!message.guild) return;

    // Find message links in the message
    const linkRegex = /https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/g;
    const matches = [...message.content.matchAll(linkRegex)];
    if (matches.length === 0) return;

    // Get guild config
    const guildConfig = await Guild.findByGuildId(message.guild.id);
    if (!guildConfig || !guildConfig.messageLinkEmbed?.enabled) return;

    for (const match of matches) {
        const [, guildId, channelId, messageId] = match;

        // Only process links for this guild
        if (guildId !== message.guild.id) continue;

        try {
            const linkedChannel = message.guild.channels.cache.get(channelId);
            if (!linkedChannel || !linkedChannel.isTextBased()) continue;

            // Fetch the linked message
            const linkedMsg = await linkedChannel.messages.fetch(messageId);
            if (!linkedMsg) continue;

            // Add "Quoted By" embed first
            const quotedByEmbed = new EmbedBuilder()
                .setColor('#5DADE2')
                .setDescription(`**Quoted By:** ${message.author}`)
                .setTimestamp();

            // If the linked message has embeds, use those instead of just .content
            let embedsToSend = [];
            if (linkedMsg.embeds && linkedMsg.embeds.length > 0) {
                // Clone the embeds to avoid Discord.js mutability issues
                embedsToSend = linkedMsg.embeds.map(e => EmbedBuilder.from(e));
            } else {
                // Build a fallback embed from message content
                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setAuthor({
                        name: linkedMsg.author?.tag || linkedMsg.author?.username || 'Unknown User',
                        iconURL: linkedMsg.author?.displayAvatarURL?.() || undefined
                    })
                    .setDescription(linkedMsg.content || '[No content]')
                    .setTimestamp(linkedMsg.createdTimestamp)
                    .setFooter({ text: `From #${linkedChannel.name}` });

                // Add attachments (first image only)
                const imageAttachment = linkedMsg.attachments.find(att => att.contentType?.startsWith('image/'));
                if (imageAttachment) {
                    embed.setImage(imageAttachment.url);
                }
                embedsToSend = [embed];
            }

            // Add button
            const button = new ButtonBuilder()
                .setLabel('Go to Message')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/channels/${guildId}/${channelId}/${messageId}`);

            const row = new ActionRowBuilder().addComponents(button);

            // Send "Quoted By" embed and then the quoted message embed(s)
            await message.channel.send({ embeds: [quotedByEmbed, ...embedsToSend], components: [row] });

            // Optionally delete the original message containing the link
            if (message.deletable) {
                await message.delete();
            }
        } catch (err) {
            // Optionally log error
            console.error('Message Link Embed error:', err);
        }
    }
}

async function handleLegacyRemind(message) {
    // Example: "@Bot remind me in 10m to do something"
    const content = message.content.replace(/<@!?(\d+)>/g, '').trim();
    const remindMatch = content.match(/remind (me|<@!?(\d+)>|<#(\d+)>)(.+)/i);
    if (!remindMatch) return;

    let targetType = 'self';
    let targetId = null;
    if (remindMatch[1] === 'me') {
        targetType = 'self';
        targetId = message.author.id;
    } else if (remindMatch[2]) {
        targetType = 'user';
        targetId = remindMatch[2];
    } else if (remindMatch[3]) {
        targetType = 'channel';
        targetId = remindMatch[3];
    }

    // Try to extract time and task
    // e.g. "in 10m to do something" or "on 2025-07-20 14:00 to do something"
    const timeTaskMatch = remindMatch[4].match(/(in|on)\s+(.+?)\s+to\s+(.+)/i);
    if (!timeTaskMatch) {
        await message.reply('❌ Could not parse reminder. Please use: `remind me in 10m to do something`');
        return;
    }
    const [, whenType, timeStr, task] = timeTaskMatch;

    // Get user timezone if set
    let userDoc = await User.findByUserId(message.author.id);
    let timezone = userDoc && userDoc.timezone ? userDoc.timezone : 'UTC';

    // Parse time
    const parsed = timeParser.parseTime(`${whenType} ${timeStr}`, timezone, new Date());
    if (!parsed || parsed.timestamp <= Date.now()) {
        await message.reply('❌ Invalid or past time/date.');
        return;
    }

    // Create reminder
    const reminder = await Reminder.create({
        reminder_id: timeParser.generateId(),
        user_id: message.author.id,
        target_id: targetType === 'self' ? null : targetId,
        target_type: targetType,
        task_description: task,
        trigger_timestamp: parsed.timestamp,
        created_timestamp: Date.now(),
        guild_id: message.guild.id,
        timezone
    });

    // Schedule immediately after creation
    if (message.client.reminderManager) {
        message.client.reminderManager.scheduleReminder(reminder);
    } else {
        // Fallback: log error
        console.error('[messageCreate.js] reminderManager not found on client');
    }

    await message.reply(`⏰ Reminder set for <t:${Math.floor(parsed.timestamp/1000)}:f>!`);
}

async function updateTicketActivity(message) {
    try {
        const Ticket = require('../schemas/Ticket');
        
        // Check if this is a ticket channel
        const ticket = await Ticket.findOne({ 
            channelId: message.channel.id,
            status: 'open'
        });
        
        if (ticket) {
            ticket.lastActivity = new Date();
            await ticket.save();
        }
    } catch (error) {
        console.error('Error updating ticket activity:', error);
    }
}
