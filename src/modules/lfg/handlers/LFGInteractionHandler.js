const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const LFGPost = require('../../../schemas/LFGPost');
const LFGUtils = require('../../../utils/LFGUtils');
const Utils = require('../../../utils/utils');

class LFGInteractionHandler {
    /**
     * Handle LFG button interactions
     */
    static async handleButtonInteraction(interaction) {
        try {
            const [action, type, postId] = interaction.customId.split('_');
            
            if (action !== 'lfg') return false;

            switch (type) {
                case 'join':
                    await this.handleJoinVoice(interaction, postId);
                    break;
                case 'edit':
                    await this.handleEditPost(interaction, postId);
                    break;
                case 'delete':
                    await this.handleDeletePost(interaction, postId);
                    break;
                default:
                    return false;
            }
            
            return true;

        } catch (error) {
            console.error('Error handling LFG button interaction:', error);
            
            const errorEmbed = Utils.createErrorEmbed(
                'Interaction Error',
                'An error occurred while processing your request.'
            );

            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
            return true;
        }
    }

    /**
     * Handle modal submissions
     */
    static async handleModalSubmission(interaction) {
        try {
            if (!interaction.customId.startsWith('lfg_edit_modal_')) return false;

            const postId = interaction.customId.replace('lfg_edit_modal_', '');
            await this.handleEditModalSubmission(interaction, postId);
            
            return true;

        } catch (error) {
            console.error('Error handling LFG modal submission:', error);
            
            const errorEmbed = Utils.createErrorEmbed(
                'Update Error',
                'An error occurred while updating your LFG post.'
            );

            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
            return true;
        }
    }

    /**
     * Handle join voice button
     */
    static async handleJoinVoice(interaction, postId) {
        await interaction.deferReply({ ephemeral: true });

        const post = await LFGPost.findById(postId);
        if (!post || !post.isActive) {
            return await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Post Not Found',
                    'This LFG post is no longer active.'
                )]
            });
        }

        if (!post.voiceChannel?.id) {
            return await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'No Voice Channel',
                    'This LFG post is not associated with a voice channel.'
                )]
            });
        }

        const guild = interaction.guild;
        const voiceChannel = guild.channels.cache.get(post.voiceChannel.id);
        
        if (!voiceChannel) {
            return await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Channel Not Found',
                    'The voice channel for this LFG post no longer exists.'
                )]
            });
        }

        // Check if user has permission to join the voice channel
        const member = interaction.member;
        if (!voiceChannel.permissionsFor(member).has([PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel])) {
            return await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'No Permission',
                    'You don\'t have permission to join this voice channel.'
                )]
            });
        }

        // Create an invite to the voice channel
        try {
            const invite = await voiceChannel.createInvite({
                maxAge: 300, // 5 minutes
                maxUses: 1,
                unique: true,
                reason: 'LFG Join Voice Channel'
            });

            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed(
                    'Voice Channel Invite',
                    `Click [here](${invite.url}) to join **${voiceChannel.name}**!`
                )]
            });

        } catch (error) {
            console.error('Failed to create voice channel invite:', error);
            
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Invite Failed',
                    `Unable to create an invite. Try joining manually: **${voiceChannel.name}**`
                )]
            });
        }
    }

    /**
     * Handle edit post button
     */
    static async handleEditPost(interaction, postId) {
        const post = await LFGPost.findById(postId);
        if (!post || !post.isActive) {
            return await interaction.reply({
                embeds: [Utils.createErrorEmbed(
                    'Post Not Found',
                    'This LFG post is no longer active.'
                )],
                ephemeral: true
            });
        }

        // Check if user owns this post
        if (post.userId !== interaction.user.id) {
            return await interaction.reply({
                embeds: [Utils.createErrorEmbed(
                    'Not Your Post',
                    'You can only edit your own LFG posts.'
                )],
                ephemeral: true
            });
        }

        // Check if editing is enabled
        const settings = await LFGUtils.getGuildSettings(interaction.guild.id);
        if (!settings.features.editPosts) {
            return await interaction.reply({
                embeds: [Utils.createErrorEmbed(
                    'Feature Disabled',
                    'Post editing is disabled in this server.'
                )],
                ephemeral: true
            });
        }

        // Create edit modal
        const modal = new ModalBuilder()
            .setCustomId(`lfg_edit_modal_${postId}`)
            .setTitle('Edit LFG Post');

        const gameInput = new TextInputBuilder()
            .setCustomId('game_name')
            .setLabel('Game Name')
            .setStyle(TextInputStyle.Short)
            .setValue(post.gameName)
            .setMaxLength(100)
            .setRequired(true);

        const messageInput = new TextInputBuilder()
            .setCustomId('lfg_message')
            .setLabel('LFG Message')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(post.message)
            .setMaxLength(500)
            .setRequired(true);

        const gameRow = new ActionRowBuilder().addComponents(gameInput);
        const messageRow = new ActionRowBuilder().addComponents(messageInput);

        modal.addComponents(gameRow, messageRow);

        await interaction.showModal(modal);
    }

    /**
     * Handle delete post button
     */
    static async handleDeletePost(interaction, postId) {
        await interaction.deferReply({ ephemeral: true });

        const post = await LFGPost.findById(postId);
        if (!post || !post.isActive) {
            return await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Post Not Found',
                    'This LFG post is no longer active.'
                )]
            });
        }

        // Check if user owns this post or has admin permissions
        const canDelete = post.userId === interaction.user.id || 
                         interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

        if (!canDelete) {
            return await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'No Permission',
                    'You can only delete your own LFG posts.'
                )]
            });
        }

        // Check if deletion is enabled
        const settings = await LFGUtils.getGuildSettings(interaction.guild.id);
        if (!settings.features.deletePosts && post.userId === interaction.user.id) {
            return await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Feature Disabled',
                    'Post deletion is disabled in this server.'
                )]
            });
        }

        try {
            // Delete the message
            const channel = interaction.guild.channels.cache.get(post.channelId);
            if (channel) {
                const message = await channel.messages.fetch(post.messageId).catch(() => null);
                if (message) {
                    await message.delete().catch(() => {});
                }
            }

            // Mark post as inactive
            post.isActive = false;
            await post.save();

            // Log the deletion
            const user = await interaction.client.users.fetch(post.userId).catch(() => null);
            if (user) {
                await LFGUtils.logLFGAction(interaction.guild, 'Post Deleted', user, {
                    gameName: post.gameName,
                    channel: channel
                });
            }

            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed(
                    'Post Deleted',
                    'The LFG post has been deleted successfully.'
                )]
            });

        } catch (error) {
            console.error('Error deleting LFG post:', error);
            
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Deletion Failed',
                    'An error occurred while deleting the post.'
                )]
            });
        }
    }

    /**
     * Handle edit modal submission
     */
    static async handleEditModalSubmission(interaction, postId) {
        await interaction.deferReply({ ephemeral: true });

        const post = await LFGPost.findById(postId);
        if (!post || !post.isActive) {
            return await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Post Not Found',
                    'This LFG post is no longer active.'
                )]
            });
        }

        // Verify ownership
        if (post.userId !== interaction.user.id) {
            return await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Not Your Post',
                    'You can only edit your own LFG posts.'
                )]
            });
        }

        const newGameName = interaction.fields.getTextInputValue('game_name');
        const newMessage = interaction.fields.getTextInputValue('lfg_message');

        try {
            // Get settings for embed creation
            const settings = await LFGUtils.getGuildSettings(interaction.guild.id);
            
            // Get voice channel info if applicable
            const voiceChannel = post.voiceChannel?.id ? 
                interaction.guild.channels.cache.get(post.voiceChannel.id) : null;

            // Create updated embed
            const embed = await LFGUtils.createLFGEmbed(
                interaction.user,
                newGameName,
                newMessage,
                voiceChannel,
                settings
            );

            // Get the original message
            const channel = interaction.guild.channels.cache.get(post.channelId);
            if (!channel) {
                return await interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Channel Not Found',
                        'The channel for this LFG post no longer exists.'
                    )]
                });
            }

            const message = await channel.messages.fetch(post.messageId).catch(() => null);
            if (!message) {
                return await interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Message Not Found',
                        'The original LFG message could not be found.'
                    )]
                });
            }

            // Create updated buttons
            const components = LFGUtils.createLFGButtons(
                postId,
                voiceChannel?.id,
                settings
            );

            // Update the message
            await message.edit({
                embeds: [embed],
                components
            });

            // Update database
            post.gameName = newGameName;
            post.message = newMessage;
            post.interactions.edits += 1;
            await post.save();

            // Log the edit
            await LFGUtils.logLFGAction(interaction.guild, 'Post Edited', interaction.user, {
                gameName: newGameName,
                channel: channel
            });

            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed(
                    'Post Updated',
                    'Your LFG post has been updated successfully!'
                )]
            });

        } catch (error) {
            console.error('Error updating LFG post:', error);
            
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Update Failed',
                    'An error occurred while updating your post.'
                )]
            });
        }
    }

    /**
     * Handle selection menu interactions
     */
    static async handleSelectMenuInteraction(interaction) {
        try {
            if (!interaction.customId.startsWith('lfg_')) return false;

            if (interaction.customId.startsWith('lfg_channel_game_')) {
                await this.handleChannelGameSelection(interaction);
                return true;
            }

            return false;

        } catch (error) {
            console.error('Error handling LFG select menu interaction:', error);
            
            const errorEmbed = Utils.createErrorEmbed(
                'Selection Error',
                'An error occurred while processing your selection.'
            );

            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
            return true;
        }
    }

    /**
     * Handle channel game selection for the new lfg-channels command
     */
    static async handleChannelGameSelection(interaction) {
        await interaction.deferUpdate();

        // Parse the custom ID: lfg_channel_game_{type}_{channelId}
        const parts = interaction.customId.split('_');
        const channelType = parts[3]; // 'whitelist' or 'monitor'
        const channelId = parts[4];
        const selectedGame = interaction.values[0];
        const guildId = interaction.guild.id;

        const LFGSettings = require('../../schemas/LFGSettings');
        const settings = await LFGSettings.findOne({ guildId }) || new LFGSettings({ guildId });

        const channel = interaction.guild.channels.cache.get(channelId);
        if (!channel) {
            return await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Channel Not Found', 'The channel could not be found.')],
                components: []
            });
        }

        const defaultGame = selectedGame === 'none' ? null : selectedGame;
        let successMessage = '';

        if (channelType === 'whitelist') {
            // Add to whitelist channels
            settings.allowedChannels.push({
                channelId: channelId,
                defaultGame: defaultGame
            });

            successMessage = defaultGame 
                ? `${channel} has been added to the whitelist with **${defaultGame}** as the default game.`
                : `${channel} has been added to the whitelist with no default game.`;

        } else if (channelType === 'monitor') {
            // Add to monitor channels
            settings.monitorChannels.push(channelId);

            // For monitor channels, we need to store the default game somewhere accessible
            // Let's add it to a new field or use the allowedChannels structure
            // For now, let's also add it to allowedChannels so the default game logic works
            const existingInWhitelist = settings.allowedChannels.find(ch => 
                (typeof ch === 'string' ? ch : ch.channelId) === channelId
            );

            if (!existingInWhitelist) {
                settings.allowedChannels.push({
                    channelId: channelId,
                    defaultGame: defaultGame
                });
            }

            successMessage = defaultGame 
                ? `${channel} will now auto-convert ALL messages to LFG posts with **${defaultGame}** as the default game.`
                : `${channel} will now auto-convert ALL messages to LFG posts with no default game.`;
        }

        await settings.save();

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed('Channel Configured', successMessage)],
            components: []
        });
    }
}

module.exports = LFGInteractionHandler;
