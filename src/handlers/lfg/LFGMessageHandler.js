const LFGUtils = require('../../utils/LFGUtils');
const LFGPost = require('../../schemas/LFGPost');
const Utils = require('../../utils/utils');

class LFGMessageHandler {
    /**
     * Handle incoming messages for LFG detection
     */
    static async handleMessage(message) {
        // Ignore bots and system messages
        if (message.author.bot || message.system) return;

        // Ignore DMs
        if (!message.guild) return;

        try {
            // Check if message should be converted to LFG
            const shouldConvert = await LFGUtils.checkMessageTriggers(message, message.guild.id);
            if (!shouldConvert) return;

            const member = message.member;
            const user = message.author;

            // Get guild settings
            const settings = await LFGUtils.getGuildSettings(message.guild.id);

            // Check if channel is allowed
            const channelAllowed = await LFGUtils.isChannelAllowed(message.channel.id, message.guild.id);
            if (!channelAllowed) return;

            // Check required role
            const hasRole = await LFGUtils.hasRequiredRole(member, message.guild.id);
            if (!hasRole) {
                await message.react('❌');
                return;
            }

            // Check cooldown
            const cooldownCheck = await LFGUtils.checkCooldown(user.id, message.guild.id);
            if (cooldownCheck.onCooldown) {
                const reply = await message.reply({
                    embeds: [Utils.createErrorEmbed(
                        'Cooldown Active',
                        `You can post another LFG in ${cooldownCheck.remainingTimeFormatted}.`
                    )]
                });

                // Delete the reply after 10 seconds
                setTimeout(() => {
                    reply.delete().catch(() => {});
                }, 10000);
                return;
            }

            // Check for existing active post
            const existingPost = await LFGUtils.hasActiveLFGPost(user.id, message.guild.id);
            if (existingPost) {
                const reply = await message.reply({
                    embeds: [Utils.createErrorEmbed(
                        'Active Post Exists',
                        'You already have an active LFG post. Please delete it before creating a new one.'
                    )]
                });

                // Delete the reply after 10 seconds
                setTimeout(() => {
                    reply.delete().catch(() => {});
                }, 10000);
                return;
            }

            // Extract game info from message
            const { gameName, message: lfgMessage } = await LFGUtils.extractLFGInfo(
                message.content, 
                message.channel.id, 
                message.guild.id
            );

            // Get voice channel info
            const voiceChannel = member.voice.channel;
            let postType = 'dm';
            let embed, components;

            if (voiceChannel && settings.features.voiceChannelEmbeds) {
                // User is in voice channel - create voice-based LFG
                postType = 'voice';
                embed = await LFGUtils.createLFGEmbed(
                    user, 
                    gameName, 
                    lfgMessage, 
                    voiceChannel, 
                    settings
                );
            } else if (settings.features.dmEmbeds) {
                // User not in voice or DM mode - create DM-style LFG
                embed = await LFGUtils.createLFGEmbed(
                    user, 
                    gameName, 
                    lfgMessage, 
                    null, 
                    settings
                );
            } else {
                return; // Neither feature is enabled
            }

            // Create the LFG post in database first to get the ID
            const lfgPost = await LFGPost.create({
                messageId: 'temp', // Will be updated after message is sent
                guildId: message.guild.id,
                channelId: message.channel.id,
                userId: user.id,
                gameName,
                message: lfgMessage,
                voiceChannel: voiceChannel ? {
                    id: voiceChannel.id,
                    name: voiceChannel.name
                } : null,
                postType,
                expiresAt: settings.expiration.enabled ? 
                    new Date(Date.now() + settings.expiration.duration) : null
            });

            // Create action buttons
            components = LFGUtils.createLFGButtons(
                lfgPost._id.toString(), 
                voiceChannel?.id, 
                settings
            );

            // Delete the original message
            await message.delete().catch(() => {});

            // Send the LFG message
            const lfgMessage_sent = await message.channel.send({
                embeds: [embed],
                components
            });

            // Update the post with the actual message ID
            lfgPost.messageId = lfgMessage_sent.id;
            await lfgPost.save();

            // Set cooldown
            await LFGUtils.setCooldown(user.id, message.guild.id);

            // Assign LFG role if configured
            await LFGUtils.assignLFGRole(member, message.guild.id);

            // Log the action
            await LFGUtils.logLFGAction(message.guild, 'Post Created', user, {
                gameName,
                channel: message.channel
            });

        } catch (error) {
            console.error('Error handling LFG message:', error);
            
            // React with error emoji
            await message.react('❌').catch(() => {});
        }
    }

    /**
     * Handle message updates (for potential LFG re-processing)
     */
    static async handleMessageUpdate(oldMessage, newMessage) {
        // Only process if content actually changed
        if (oldMessage.content === newMessage.content) return;

        // For now, we don't re-process edited messages for LFG
        // This could be added as a feature in the future
    }

    /**
     * Handle message deletions (cleanup LFG posts)
     */
    static async handleMessageDelete(message) {
        if (!message.guild) return;

        try {
            // Find and deactivate any LFG post associated with this message
            const lfgPost = await LFGPost.findOne({
                messageId: message.id,
                guildId: message.guild.id,
                isActive: true
            });

            if (lfgPost) {
                lfgPost.isActive = false;
                await lfgPost.save();

                // Log the deletion
                const user = await message.client.users.fetch(lfgPost.userId).catch(() => null);
                if (user) {
                    await LFGUtils.logLFGAction(message.guild, 'Post Deleted', user, {
                        gameName: lfgPost.gameName,
                        channel: message.channel
                    });
                }
            }
        } catch (error) {
            console.error('Error handling LFG message deletion:', error);
        }
    }
}

module.exports = LFGMessageHandler;
