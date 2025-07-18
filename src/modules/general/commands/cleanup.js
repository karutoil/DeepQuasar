const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'Settings',
    permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels],
    data: new SlashCommandBuilder()
        .setName('cleanup')
        .setDescription('Clean up messages in channels')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Delete messages from a specific user')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User whose messages to delete')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('amount')
                        .setDescription('Number of messages to delete (1-100)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(100)
                )
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to clean (defaults to current channel)')
                        .setRequired(false)
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('amount')
                .setDescription('Delete a specific number of messages')
                .addIntegerOption(option =>
                    option
                        .setName('count')
                        .setDescription('Number of messages to delete (1-100)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100)
                )
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to clean (defaults to current channel)')
                        .setRequired(false)
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('all')
                .setDescription('Recreate channel to remove ALL messages (requires Manage Channels)')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to completely clean by recreation')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                )
                .addBooleanOption(option =>
                    option
                        .setName('confirm')
                        .setDescription('Confirm you want to recreate the channel (ALL MESSAGES WILL BE LOST)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('bots')
                .setDescription('Delete messages from bots only')
                .addIntegerOption(option =>
                    option
                        .setName('amount')
                        .setDescription('Number of bot messages to delete (1-100)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(100)
                )
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to clean (defaults to current channel)')
                        .setRequired(false)
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'user':
                    await this.handleUserCleanup(interaction);
                    break;
                case 'amount':
                    await this.handleAmountCleanup(interaction);
                    break;
                case 'all':
                    await this.handleAllCleanup(interaction);
                    break;
                case 'bots':
                    await this.handleBotsCleanup(interaction);
                    break;
                default:
                    await interaction.reply({
                        content: '❌ Unknown subcommand.',
                        ephemeral: true
                    });
            }
        } catch (error) {
            console.error('Error in cleanup command:', error);
            const embed = Utils.createErrorEmbed('Error', 'An error occurred while processing the cleanup command.');
            
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    },

    async handleUserCleanup(interaction) {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount') || 50;
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

        // Check bot permissions
        const botPermissions = targetChannel.permissionsFor(interaction.guild.members.me);
        if (!botPermissions.has(['ViewChannel', 'ReadMessageHistory', 'ManageMessages'])) {
            const embed = Utils.createErrorEmbed(
                'Missing Permissions',
                'I need `View Channel`, `Read Message History`, and `Manage Messages` permissions in that channel.'
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Fetch messages from the target user (Discord API limit is 100)
            const messages = await targetChannel.messages.fetch({ limit: 100 });
            const userMessages = messages.filter(msg => 
                msg.author.id === targetUser.id && 
                Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000 // Only messages newer than 14 days
            ).first(amount);

            if (userMessages.length === 0) {
                const embed = Utils.createWarningEmbed(
                    'No Messages Found',
                    `No recent messages from ${targetUser.tag} found in ${targetChannel}.`
                );
                return await interaction.editReply({ embeds: [embed] });
            }

            // Delete messages
            if (userMessages.length === 1) {
                await userMessages[0].delete();
            } else {
                await targetChannel.bulkDelete(userMessages);
            }

            const embed = Utils.createSuccessEmbed(
                'Messages Cleaned',
                `Successfully deleted ${userMessages.length} message(s) from ${targetUser.tag} in ${targetChannel}.`
            );

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error cleaning user messages:', error);
            const embed = Utils.createErrorEmbed(
                'Cleanup Failed',
                'Failed to delete messages. Messages older than 14 days cannot be bulk deleted.'
            );
            await interaction.editReply({ embeds: [embed] });
        }
    },

    async handleAmountCleanup(interaction) {
        const count = interaction.options.getInteger('count');
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

        // Check bot permissions
        const botPermissions = targetChannel.permissionsFor(interaction.guild.members.me);
        if (!botPermissions.has(['ViewChannel', 'ReadMessageHistory', 'ManageMessages'])) {
            const embed = Utils.createErrorEmbed(
                'Missing Permissions',
                'I need `View Channel`, `Read Message History`, and `Manage Messages` permissions in that channel.'
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Fetch messages
            const messages = await targetChannel.messages.fetch({ limit: count });
            const recentMessages = messages.filter(msg => 
                Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000 // Only messages newer than 14 days
            );

            if (recentMessages.size === 0) {
                const embed = Utils.createWarningEmbed(
                    'No Messages Found',
                    `No recent messages found in ${targetChannel}. Messages older than 14 days cannot be bulk deleted.`
                );
                return await interaction.editReply({ embeds: [embed] });
            }

            // Delete messages
            if (recentMessages.size === 1) {
                await recentMessages.first().delete();
            } else {
                await targetChannel.bulkDelete(recentMessages);
            }

            const embed = Utils.createSuccessEmbed(
                'Messages Cleaned',
                `Successfully deleted ${recentMessages.size} message(s) in ${targetChannel}.`
            );

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error cleaning messages by amount:', error);
            const embed = Utils.createErrorEmbed(
                'Cleanup Failed',
                'Failed to delete messages. Messages older than 14 days cannot be bulk deleted.'
            );
            await interaction.editReply({ embeds: [embed] });
        }
    },

    async handleAllCleanup(interaction) {
        const targetChannel = interaction.options.getChannel('channel');
        const confirm = interaction.options.getBoolean('confirm');

        if (!confirm) {
            const embed = Utils.createErrorEmbed(
                'Confirmation Required',
                'You must confirm that you want to delete ALL messages by setting the `confirm` option to `True`.'
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check bot permissions - need ManageChannels for cloning
        const botPermissions = targetChannel.permissionsFor(interaction.guild.members.me);
        if (!botPermissions.has(['ViewChannel', 'ManageChannels'])) {
            const embed = Utils.createErrorEmbed(
                'Missing Permissions',
                'I need `View Channel` and `Manage Channels` permissions to recreate the channel.'
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const embed = Utils.createInfoEmbed(
                'Cleanup In Progress',
                `Recreating ${targetChannel.name} to remove all messages. This will preserve all settings but clear all message history.`
            );
            await interaction.editReply({ embeds: [embed] });

            // Store channel information
            const channelData = {
                name: targetChannel.name,
                type: targetChannel.type,
                topic: targetChannel.topic,
                nsfw: targetChannel.nsfw,
                rateLimitPerUser: targetChannel.rateLimitPerUser,
                position: targetChannel.position,
                parent: targetChannel.parent,
                permissionOverwrites: targetChannel.permissionOverwrites.cache.map(overwrite => ({
                    id: overwrite.id,
                    type: overwrite.type,
                    allow: overwrite.allow.bitfield,
                    deny: overwrite.deny.bitfield
                }))
            };

            // Create new channel with same settings
            const newChannel = await targetChannel.guild.channels.create({
                name: channelData.name,
                type: channelData.type,
                topic: channelData.topic,
                nsfw: channelData.nsfw,
                rateLimitPerUser: channelData.rateLimitPerUser,
                position: channelData.position,
                parent: channelData.parent,
                permissionOverwrites: channelData.permissionOverwrites
            });

            // Send confirmation to interaction first
            const initialEmbed = Utils.createSuccessEmbed(
                'Channel Recreation Started',
                `Channel recreation process initiated for **${channelData.name}**. Deleting original channel now...`
            );
            await interaction.editReply({ embeds: [initialEmbed] });

            // Delete the old channel
            await targetChannel.delete('Channel cleanup - all messages removed');

            // Create final success embed
            const finalEmbed = Utils.createSuccessEmbed(
                'Channel Cleaned Successfully',
                `Successfully recreated <#${newChannel.id}> with all messages removed.\n\n` +
                `**Original channel:** ${channelData.name}\n` +
                `**New channel:** <#${newChannel.id}>\n` +
                `**Executed by:** ${interaction.user.tag}\n\n` +
                `All channel settings, permissions, and position have been preserved.`
            );

            // Try to send success message to modlog channel first, then system channel
            await this.sendCleanupNotification(interaction.guild, finalEmbed);

        } catch (error) {
            console.error('Error recreating channel for cleanup:', error);
            let errorMessage = 'An error occurred while recreating the channel.';
            
            // Provide specific error messages for common issues
            if (error.code === 50013) {
                errorMessage = 'Missing permissions to manage channels. Make sure I have the `Manage Channels` permission.';
            } else if (error.code === 50035) {
                errorMessage = 'Invalid channel configuration. The channel may have special settings that prevent recreation.';
            }
            
            const embed = Utils.createErrorEmbed(
                'Cleanup Failed',
                errorMessage + '\n\nThe original channel remains unchanged.'
            );
            
            try {
                await interaction.editReply({ embeds: [embed] });
            } catch (editError) {
                console.error('Failed to edit reply after cleanup error:', editError);
            }
        }
    },

    async sendCleanupNotification(guild, embed) {
        // First, try to get modlog channel from schema/database
        try {
            const ModLogSchema = require('../../../schemas/ModLog');
            const modlogData = await ModLogSchema.findOne({ guildId: guild.id });
            
            if (modlogData && modlogData.enabled) {
                // Check for specific channel events (channelDelete since we're deleting/recreating)
                let targetChannel = null;
                
                if (modlogData.events.channelDelete && modlogData.events.channelDelete.enabled && modlogData.events.channelDelete.channel) {
                    targetChannel = guild.channels.cache.get(modlogData.events.channelDelete.channel);
                } else if (modlogData.defaultChannel) {
                    targetChannel = guild.channels.cache.get(modlogData.defaultChannel);
                }
                
                if (targetChannel && targetChannel.permissionsFor(guild.members.me)?.has(['ViewChannel', 'SendMessages'])) {
                    await targetChannel.send({ embeds: [embed] });
                    return;
                }
            }
        } catch (error) {
            // Modlog schema might not exist or be configured, continue to system channel
            console.log('No modlog channel configured or accessible, trying system channel');
        }

        // Fallback to system channel
        try {
            const systemChannel = guild.systemChannel;
            if (systemChannel && systemChannel.permissionsFor(guild.members.me)?.has(['ViewChannel', 'SendMessages'])) {
                await systemChannel.send({ embeds: [embed] });
                return;
            }
        } catch (error) {
            console.log('System channel not accessible, cleanup notification not sent');
        }

        // If neither works, just log that the cleanup was successful
        console.log(`Channel cleanup completed successfully in guild ${guild.name} (${guild.id})`);
    },

    async handleBotsCleanup(interaction) {
        const amount = interaction.options.getInteger('amount') || 50;
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

        // Check bot permissions
        const botPermissions = targetChannel.permissionsFor(interaction.guild.members.me);
        if (!botPermissions.has(['ViewChannel', 'ReadMessageHistory', 'ManageMessages'])) {
            const embed = Utils.createErrorEmbed(
                'Missing Permissions',
                'I need `View Channel`, `Read Message History`, and `Manage Messages` permissions in that channel.'
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Fetch messages from bots (Discord API limit is 100)
            const messages = await targetChannel.messages.fetch({ limit: 100 });
            const botMessages = messages.filter(msg => 
                msg.author.bot && 
                Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000 // Only messages newer than 14 days
            ).first(amount);

            if (botMessages.length === 0) {
                const embed = Utils.createWarningEmbed(
                    'No Messages Found',
                    `No recent bot messages found in ${targetChannel}.`
                );
                return await interaction.editReply({ embeds: [embed] });
            }

            // Delete messages
            if (botMessages.length === 1) {
                await botMessages[0].delete();
            } else {
                await targetChannel.bulkDelete(botMessages);
            }

            const embed = Utils.createSuccessEmbed(
                'Bot Messages Cleaned',
                `Successfully deleted ${botMessages.length} bot message(s) in ${targetChannel}.`
            );

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error cleaning bot messages:', error);
            const embed = Utils.createErrorEmbed(
                'Cleanup Failed',
                'Failed to delete bot messages. Messages older than 14 days cannot be bulk deleted.'
            );
            await interaction.editReply({ embeds: [embed] });
        }
    }
};
