const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const TempVC = require('../schemas/TempVC');
const TempVCInstance = require('../schemas/TempVCInstance');
const TempVCUserSettings = require('../schemas/TempVCUserSettings');
const Utils = require('./utils');

class TempVCManager {
    constructor(client) {
        this.client = client;
        this.cooldowns = new Map();
        this.activeCreations = new Set();
        
        // Initialize control handlers
        const TempVCControlHandlers = require('./TempVCControlHandlers');
        this.controlHandlers = new TempVCControlHandlers(this);
        
        // Start cleanup task
        this.startCleanupTask();
    }

    /**
     * Handle voice state update for temp VC system
     */
    async handleVoiceStateUpdate(oldState, newState) {
        const member = newState.member || oldState.member;
        if (!member || member.user.bot) return;

        const guild = member.guild;
        const config = await TempVC.findByGuildId(guild.id);
        
        if (!config || !config.isEnabled()) return;

        try {
            // User joined a channel
            if (!oldState.channel && newState.channel) {
                await this.handleUserJoinedChannel(member, newState.channel, config);
            }
            
            // User left a channel
            if (oldState.channel && !newState.channel) {
                await this.handleUserLeftChannel(member, oldState.channel, config);
            }
            
            // User moved between channels
            if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
                await this.handleUserLeftChannel(member, oldState.channel, config);
                await this.handleUserJoinedChannel(member, newState.channel, config);
            }
        } catch (error) {
            this.client.logger.error('Error handling voice state update in TempVC:', error);
        }
    }

    /**
     * Handle user joining a channel
     */
    async handleUserJoinedChannel(member, channel, config) {
        // Check if user joined the join-to-create channel
        if (channel.id === config.joinToCreateChannelId) {
            await this.createTempChannel(member, config);
            return;
        }

        // Update activity for temp VC
        const instance = await TempVCInstance.findByChannelId(channel.id);
        if (instance) {
            const memberCount = channel.members.size;
            await instance.updateActivity(memberCount);
            
            // Cancel auto-delete if scheduled
            if (instance.temp.deleteAfter) {
                await instance.cancelAutoDelete();
            }
            
            // Update control panel
            await this.updateControlPanel(instance, channel);
            
            // Note: We don't auto-save here since member activity isn't a setting change
        }
    }

    /**
     * Handle user leaving a channel
     */
    async handleUserLeftChannel(member, channel, config) {
        const instance = await TempVCInstance.findByChannelId(channel.id);
        if (!instance) return;

        // Check if channel still exists (prevent race conditions)
        const channelExists = channel.guild.channels.cache.has(channel.id);
        if (!channelExists) {
            // Channel was already deleted, clean up instance record
            await TempVCInstance.deleteOne({ _id: instance._id });
            return;
        }

        const memberCount = channel.members.size;
        await instance.updateActivity(memberCount);

        // If channel is empty, handle auto-delete
        if (memberCount === 0) {
            if (config.autoDelete.enabled) {
                await instance.scheduleAutoDelete(config.autoDelete.delayMinutes);
                
                // If no delay, delete immediately
                if (config.autoDelete.delayMinutes === 0) {
                    await this.deleteTempChannel(instance);
                    return; // Don't update control panel after deletion
                }
            }
        } else {
            // Transfer ownership if owner left
            if (instance.ownerId === member.id) {
                const newOwner = channel.members.first();
                if (newOwner && !newOwner.user.bot) {
                    await instance.transferOwnership(newOwner.id);
                    
                    // Notify new owner
                    const embed = Utils.createInfoEmbed(
                        'Channel Ownership Transferred',
                        `You are now the owner of **${channel.name}**!\nUse the control panel to manage your channel.`
                    );
                    
                    try {
                        await newOwner.send({ embeds: [embed] });
                    } catch (error) {
                        // Ignore DM errors
                    }
                }
            }
        }

        // Update control panel only if channel still exists
        if (channelExists) {
            await this.updateControlPanel(instance, channel);
        }
    }

    /**
     * Create a temporary voice channel
     */
    async createTempChannel(member, config) {
        const guild = member.guild;
        const userId = member.id;

        // Check cooldown
        if (this.isOnCooldown(userId, config.advanced.cooldownMinutes)) {
            const remaining = this.getCooldownRemaining(userId, config.advanced.cooldownMinutes);
            const embed = Utils.createWarningEmbed(
                'Cooldown Active',
                `You can create another temp channel in ${remaining} minutes.`
            );
            
            try {
                await member.send({ embeds: [embed] });
            } catch (error) {
                // Ignore DM errors
            }
            return;
        }

        // Check if user can create
        const roleIds = member.roles.cache.map(role => role.id);
        const permissionCheck = config.canUserCreate(userId, roleIds);
        
        if (!permissionCheck.canCreate) {
            const embed = Utils.createErrorEmbed('Permission Denied', permissionCheck.reason);
            try {
                await member.send({ embeds: [embed] });
            } catch (error) {
                // Ignore DM errors
            }
            return;
        }

        // Check max channels per user
        const existingChannels = await TempVCInstance.findByOwnerId(guild.id, userId);
        if (existingChannels.length >= config.advanced.maxChannelsPerUser) {
            const embed = Utils.createWarningEmbed(
                'Channel Limit Reached',
                `You can only have ${config.advanced.maxChannelsPerUser} temp channel(s) at a time.`
            );
            
            try {
                await member.send({ embeds: [embed] });
            } catch (error) {
                // Ignore DM errors
            }
            return;
        }

        // Prevent multiple simultaneous creations
        if (this.activeCreations.has(userId)) return;
        this.activeCreations.add(userId);

        try {
            const category = guild.channels.cache.get(config.tempVCCategoryId);
            if (!category) {
                this.client.logger.error(`Temp VC category not found: ${config.tempVCCategoryId}`);
                return;
            }

            // Get user activity
            const activity = member.presence?.activities?.find(a => a.type === 0)?.name || null;
            
            // Check for user's saved settings from persistent storage
            const userSettingsRecord = await TempVCUserSettings.findByUser(guild.id, userId);
            const userSavedSettings = userSettingsRecord ? userSettingsRecord.defaultSettings : null;
            
            // Generate channel name - use saved custom name if available, otherwise auto-generate
            const channelName = (userSavedSettings && userSavedSettings.customName) 
                ? userSavedSettings.customName 
                : config.getChannelName(member.user, activity);
            
            // Use saved settings if available, otherwise use guild defaults
            const channelSettings = userSavedSettings || {
                userLimit: config.defaultSettings.userLimit,
                bitrate: config.defaultSettings.bitrate,
                locked: config.defaultSettings.locked,
                hidden: config.defaultSettings.hidden,
                region: config.defaultSettings.region
            };

            // Create the channel
            const tempChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildVoice,
                parent: category.id,
                userLimit: channelSettings.userLimit,
                bitrate: channelSettings.bitrate,
                rtcRegion: channelSettings.region,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        allow: channelSettings.hidden ? [] : [PermissionFlagsBits.ViewChannel],
                        deny: channelSettings.hidden ? [PermissionFlagsBits.ViewChannel] : []
                    },
                    {
                        id: userId,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.Connect,
                            PermissionFlagsBits.Speak,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ManageRoles,
                            PermissionFlagsBits.MoveMembers,
                            PermissionFlagsBits.MuteMembers,
                            PermissionFlagsBits.DeafenMembers
                        ]
                    }
                ]
            });

            // Apply lock permission if needed
            if (channelSettings.locked) {
                await tempChannel.permissionOverwrites.edit(guild.id, {
                    Connect: false
                });
            }

            // Restore blocked users from persistent settings if available
            let blockedUsers = [];
            if (userSavedSettings && Array.isArray(userSavedSettings.blockedUsers)) {
                blockedUsers = userSavedSettings.blockedUsers;
            }

            // Create instance record
            const instance = await TempVCInstance.createInstance({
                guildId: guild.id,
                channelId: tempChannel.id,
                ownerId: userId,
                originalName: channelName,
                currentName: channelName,
                settings: {
                    userLimit: channelSettings.userLimit,
                    bitrate: channelSettings.bitrate,
                    locked: channelSettings.locked,
                    hidden: channelSettings.hidden,
                    region: channelSettings.region
                },
                permissions: {
                    allowedUsers: [],
                    blockedUsers: blockedUsers,
                    moderators: []
                },
                activity: {
                    memberCount: 1,
                    peakMemberCount: 1
                },
                // Keep local auto-save setting for current session
                savedSettings: {
                    autoSave: userSettingsRecord ? userSettingsRecord.autoSave : true
                }
            });

            // Apply deny permissions for blocked users
            for (const blockedId of blockedUsers) {
                try {
                    await tempChannel.permissionOverwrites.edit(blockedId, { Connect: false });
                } catch (err) {
                    this.client.logger.debug('Failed to set Connect deny for blocked user:', blockedId, err);
                }
            }

            // Update last used timestamp for persistent settings
            if (userSettingsRecord) {
                await userSettingsRecord.updateLastUsed();
            }

            // Move user to the new channel
            await member.voice.setChannel(tempChannel);

            // Set cooldown
            this.setCooldown(userId);

            // Notify user if saved settings were loaded (before control panel)
            if (userSavedSettings) {
                try {
                    const embed = Utils.createInfoEmbed(
                        'Saved Settings Loaded',
                        `Your saved settings have been applied to **${tempChannel.name}**!\n\n*Your preferences from previous channels are automatically restored.*`
                    );
                    // Send to voice channel's integrated text chat instead of DM
                    await tempChannel.send({ embeds: [embed] });
                } catch (error) {
                    // Ignore channel send errors
                    this.client.logger.debug('Could not send saved settings notification to channel:', error);
                }
            }

            // Create control panel
            if (config.advanced.sendControlPanel) {
                await this.createControlPanel(instance, tempChannel);
            }

            // Log creation
            if (config.advanced.logChannelId) {
                await this.logChannelCreation(guild, config.advanced.logChannelId, member, tempChannel);
            }

            //this.client.logger.info(`Created temp VC: ${tempChannel.name} (${tempChannel.id}) for ${member.user.tag}${userSavedSettings ? ' (with saved settings)' : ''}`);

        } catch (error) {
            this.client.logger.error('Error creating temp channel:', error);
        } finally {
            this.activeCreations.delete(userId);
        }
    }

    /**
     * Delete a temporary voice channel
     */
    async deleteTempChannel(instance) {
        try {
            const guild = this.client.guilds.cache.get(instance.guildId);
            if (!guild) {
                // Guild not found, just clean up database record
                await TempVCInstance.deleteOne({ _id: instance._id });
                return;
            }

            const channel = guild.channels.cache.get(instance.channelId);
            if (channel) {
                // Delete control panel message first (if it exists)
                if (instance.controlPanel.messageId) {
                    try {
                        const message = await channel.messages.fetch(instance.controlPanel.messageId);
                        if (message) {
                            await message.delete();
                        }
                    } catch (error) {
                        // Ignore errors when deleting control panel message
                        this.client.logger.debug('Could not delete control panel message:', error.message);
                    }
                }
                
                // Delete the voice channel
                try {
                    await channel.delete('Temp VC auto-delete');
                    //this.client.logger.info(`Deleted temp VC: ${instance.currentName} (${instance.channelId})`);
                } catch (error) {
                    if (error.code === 10003) {
                        // Channel already deleted (Unknown Channel error)
                        this.client.logger.debug(`Temp VC already deleted: ${instance.channelId}`);
                    } else {
                        // Re-throw other errors
                        throw error;
                    }
                }
            } else {
                // Channel not found in cache, likely already deleted
                this.client.logger.debug(`Temp VC not in cache (likely already deleted): ${instance.channelId}`);
            }

            // --- Save blocked users to persistent settings before deleting instance ---
            try {
                if (instance && instance.ownerId && instance.permissions && Array.isArray(instance.permissions.blockedUsers)) {
                    const userSettings = await TempVCUserSettings.findByUser(instance.guildId, instance.ownerId);
                    if (userSettings) {
                        userSettings.defaultSettings.blockedUsers = instance.permissions.blockedUsers;
                        await userSettings.save();
                    } else {
                        // Create new settings if not exist
                        await TempVCUserSettings.createOrUpdate(
                            instance.guildId,
                            instance.ownerId,
                            { defaultSettings: { blockedUsers: instance.permissions.blockedUsers } }
                        );
                    }
                }
            } catch (err) {
                this.client.logger.error('Failed to persist blocked users for temp VC:', err);
            }
            // --- End persist blocked users ---

            // Delete instance record
            await TempVCInstance.deleteOne({ _id: instance._id });

        } catch (error) {
            this.client.logger.error('Error deleting temp channel:', error);
            // Still try to clean up database record even if deletion failed
            try {
                await TempVCInstance.deleteOne({ _id: instance._id });
            } catch (dbError) {
                this.client.logger.error('Error cleaning up temp VC database record:', dbError);
            }
        }
    }

    /**
     * Create control panel for temp VC
     */
    async createControlPanel(instance, channel) {
        try {
            const config = await TempVC.findByGuildId(instance.guildId);
            if (!config || !config.advanced.sendControlPanel) return;

            const guild = channel.guild;
            const owner = await guild.members.fetch(instance.ownerId);
            
            // Use the voice channel's integrated text chat
            // Voice channels now have built-in text chat that we can send messages to
            const embed = this.createControlPanelEmbed(instance, channel, owner);
            const components = this.createControlPanelComponents(instance, config.advanced.panelStyle);

            // Send welcome message and control panel to the voice channel's text chat
            const welcomeMessage = await channel.send({
                content: `🎙️ **Welcome to your temporary voice channel!**\n👑 **Owner:** ${owner.displayName}\n\nUse the controls below to manage your channel:`,
                embeds: [embed],
                components
            });

            // Update instance with control panel info
            instance.controlPanel.messageId = welcomeMessage.id;
            instance.controlPanel.channelId = channel.id; // Use the voice channel ID since it has integrated text
            await instance.save();

            return { controlChannel: channel, message: welcomeMessage };

        } catch (error) {
            this.client.logger.error('Error creating control panel:', error);
        }
    }

    /**
     * Update control panel
     */
    async updateControlPanel(instance, channel) {
        if (!instance.controlPanel.messageId || !instance.controlPanel.enabled) return;

        try {
            // Check if channel still exists before trying to update
            const channelExists = channel.guild.channels.cache.has(channel.id);
            if (!channelExists) {
                this.client.logger.debug(`Skipping control panel update for deleted channel: ${channel.id}`);
                return;
            }

            // Since we're using the voice channel's integrated text chat,
            // the control channel is the same as the voice channel
            const message = await channel.messages.fetch(instance.controlPanel.messageId);
            if (!message) return;

            const owner = await channel.guild.members.fetch(instance.ownerId);
            const embed = this.createControlPanelEmbed(instance, channel, owner);
            
            const config = await TempVC.findByGuildId(instance.guildId);
            const components = this.createControlPanelComponents(instance, config?.advanced?.panelStyle || 'buttons');

            await message.edit({
                embeds: [embed],
                components
            });

            instance.temp.lastControlPanelUpdate = new Date();
            await instance.save();

        } catch (error) {
            if (error.code === 10003 || error.code === 10008) {
                // Channel or message not found (likely deleted)
                this.client.logger.debug(`Control panel update failed - channel/message deleted: ${error.message}`);
            } else if (error.message?.includes('Could not find the channel')) {
                // Channel not cached (likely deleted)
                this.client.logger.debug(`Control panel update failed - channel not cached: ${error.message}`);
            } else {
                // Other errors should still be logged
                this.client.logger.error('Error updating control panel:', error);
            }
        }
    }

    /**
     * Create control panel embed
     */
    createControlPanelEmbed(instance, channel, owner) {
        const memberCount = channel.members.size;
        const memberList = channel.members
            .filter(m => !m.user.bot)
            .map(m => `• ${m.displayName}`)
            .join('\n') || 'No members';

        const embed = new EmbedBuilder()
            .setTitle(`🎙️ ${channel.name} - Control Panel`)
            .setDescription(`**Owner:** ${owner.displayName}\n**Members:** ${memberCount}/${instance.settings.userLimit || '∞'}\n\n*Use the buttons below to manage this voice channel*`)
            .addFields(
                {
                    name: '📊 Channel Settings',
                    value: [
                        `**Bitrate:** ${instance.settings.bitrate / 1000}kbps`,
                        `**Region:** ${instance.settings.region || 'Automatic'}`,
                        `**Status:** ${instance.settings.locked ? '🔒 Locked' : '🔓 Unlocked'}`,
                        `**Visibility:** ${instance.settings.hidden ? '👁️ Hidden' : '👀 Visible'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '👥 Current Members',
                    value: memberList.length > 1000 ? 'Too many to display' : memberList,
                    inline: true
                },
                {
                    name: '📈 Statistics',
                    value: [
                        `**Peak Members:** ${instance.activity.peakMemberCount}`,
                        `**Uptime:** ${this.formatUptime(Date.now() - instance.createdAt.getTime())}`,
                        `**Last Updated:** <t:${Math.floor(instance.activity.lastActive.getTime() / 1000)}:R>`
                    ].join('\n'),
                    inline: false
                }
            )
            .setColor(instance.settings.locked ? 0xED4245 : 0x57F287)
            .setFooter({ text: 'This message will update automatically when the channel changes' })
            .setTimestamp();

        // Always show permissions field, even if not locked/hidden
        const permissionsInfo = [];
        if (instance.permissions.allowedUsers.length > 0) {
            permissionsInfo.push(`**Allowed:** ${instance.permissions.allowedUsers.length} user(s)`);
        }
        if (instance.permissions.blockedUsers.length > 0) {
            permissionsInfo.push(`**Banned:** ${instance.permissions.blockedUsers.length} user(s)`);
        }
        if (instance.permissions.moderators.length > 0) {
            permissionsInfo.push(`**Moderators:** ${instance.permissions.moderators.length} user(s)`);
        }
        if (permissionsInfo.length === 0) {
            permissionsInfo.push('No special permissions set');
        }
        embed.addFields({
            name: '🔒 Permissions',
            value: permissionsInfo.join('\n'),
            inline: true
        });

        return embed;
    }

    /**
     * Create control panel components
     */
    createControlPanelComponents(instance, panelStyle = 'buttons') {
        const components = [];

        if (panelStyle === 'buttons' || panelStyle === 'both') {
            const buttonRow1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`tempvc_rename_${instance.channelId}`)
                    .setLabel('Rename')
                    .setEmoji('✏️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`tempvc_limit_${instance.channelId}`)
                    .setLabel('User Limit')
                    .setEmoji('👥')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`tempvc_bitrate_${instance.channelId}`)
                    .setLabel('Bitrate')
                    .setEmoji('🎵')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`tempvc_region_${instance.channelId}`)
                    .setLabel('Region')
                    .setEmoji('🌍')
                    .setStyle(ButtonStyle.Secondary)
            );

            const buttonRow2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`tempvc_lock_${instance.channelId}`)
                    .setLabel(instance.settings.locked ? 'Unlock' : 'Lock')
                    .setEmoji(instance.settings.locked ? '🔓' : '🔒')
                    .setStyle(instance.settings.locked ? ButtonStyle.Success : ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`tempvc_hide_${instance.channelId}`)
                    .setLabel(instance.settings.hidden ? 'Unhide' : 'Hide')
                    .setEmoji(instance.settings.hidden ? '👀' : '👁️')
                    .setStyle(instance.settings.hidden ? ButtonStyle.Success : ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`tempvc_transfer_${instance.channelId}`)
                    .setLabel('Transfer')
                    .setEmoji('👑')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`tempvc_kick_${instance.channelId}`)
                    .setLabel('Kick')
                    .setEmoji('👢')
                    .setStyle(ButtonStyle.Secondary)
            );

            const buttonRow3 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`tempvc_ban_${instance.channelId}`)
                    .setLabel('Ban')
                    .setEmoji('🔨')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`tempvc_unban_${instance.channelId}`)
                    .setLabel('Unban')
                    .setEmoji('🔓')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`tempvc_reset_${instance.channelId}`)
                    .setLabel('Reset')
                    .setEmoji('🔄')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`tempvc_delete_${instance.channelId}`)
                    .setLabel('Delete')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Danger)
            );

            components.push(buttonRow1, buttonRow2, buttonRow3);

            // Add user management row if channel is locked or hidden
            if (instance.settings.locked || instance.settings.hidden) {
                const userManagementRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tempvc_allow_user_${instance.channelId}`)
                        .setLabel('Allow User')
                        .setEmoji('✅')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`tempvc_deny_user_${instance.channelId}`)
                        .setLabel('Deny User')
                        .setEmoji('❌')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`tempvc_manage_permissions_${instance.channelId}`)
                        .setLabel('Manage Permissions')
                        .setEmoji('⚙️')
                        .setStyle(ButtonStyle.Primary)
                );
                
                components.push(userManagementRow);
            }
        }

        if (panelStyle === 'select' || panelStyle === 'both') {
            const selectOptions = [
                {
                    label: 'Rename Channel',
                    description: 'Change the channel name',
                    value: 'rename',
                    emoji: '✏️'
                },
                {
                    label: 'Set User Limit',
                    description: 'Change the user limit',
                    value: 'limit',
                    emoji: '👥'
                },
                {
                    label: 'Change Bitrate',
                    description: 'Adjust audio quality',
                    value: 'bitrate',
                    emoji: '🎵'
                },
                {
                    label: 'Change Region',
                    description: 'Set voice region',
                    value: 'region',
                    emoji: '🌍'
                },
                {
                    label: instance.settings.locked ? 'Unlock Channel' : 'Lock Channel',
                    description: instance.settings.locked ? 'Allow others to join' : 'Prevent others from joining',
                    value: 'lock',
                    emoji: instance.settings.locked ? '🔓' : '🔒'
                },
                {
                    label: instance.settings.hidden ? 'Unhide Channel' : 'Hide Channel',
                    description: instance.settings.hidden ? 'Make channel visible' : 'Hide channel from others',
                    value: 'hide',
                    emoji: instance.settings.hidden ? '👀' : '👁️'
                },
                {
                    label: 'Kick Member',
                    description: 'Remove someone from the channel',
                    value: 'kick',
                    emoji: '👢'
                },
                {
                    label: 'Ban Member',
                    description: 'Ban someone from joining the channel',
                    value: 'ban',
                    emoji: '🔨'
                },
                {
                    label: 'Unban Member',
                    description: 'Unban someone from the channel',
                    value: 'unban',
                    emoji: '🔓'
                },
                {
                    label: 'Transfer Ownership',
                    description: 'Transfer channel ownership',
                    value: 'transfer',
                    emoji: '👑'
                },
                {
                    label: 'Reset to Defaults',
                    description: 'Reset all settings and clear bans',
                    value: 'reset',
                    emoji: '🔄'
                },
                {
                    label: 'Delete Channel',
                    description: 'Permanently delete this channel',
                    value: 'delete',
                    emoji: '🗑️'
                }
            ];

            // Add user management options if channel is locked or hidden
            if (instance.settings.locked || instance.settings.hidden) {
                selectOptions.splice(-3, 0, // Insert before transfer, reset, delete
                    {
                        label: 'Allow User',
                        description: 'Allow specific user to join',
                        value: 'allow_user',
                        emoji: '✅'
                    },
                    {
                        label: 'Deny User',
                        description: 'Deny specific user from joining',
                        value: 'deny_user',
                        emoji: '❌'
                    },
                    {
                        label: 'Manage Permissions',
                        description: 'View and manage user permissions',
                        value: 'manage_permissions',
                        emoji: '⚙️'
                    }
                );
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`tempvc_menu_${instance.channelId}`)
                .setPlaceholder('Select an action...')
                .addOptions(selectOptions);

            const selectRow = new ActionRowBuilder().addComponents(selectMenu);
            components.push(selectRow);
        }

        return components;
    }

    /**
     * Handle control panel interactions
     */
    async handleControlPanelInteraction(interaction) {
        const parts = interaction.customId.split('_');
        
        // Handle multi-word actions (e.g., allow_user, deny_user, manage_permissions)
        let action, channelId;
        if (parts.length === 4 && (parts[1] === 'allow' || parts[1] === 'deny' || parts[1] === 'manage')) {
            action = `${parts[1]}_${parts[2]}`; // allow_user, deny_user, manage_permissions
            channelId = parts[3];
        } else {
            action = parts[1];
            channelId = parts[2];
        }
        
        const instance = await TempVCInstance.findByChannelId(channelId);
        if (!instance) {
            return interaction.reply({
                content: '❌ Channel not found or no longer exists.',
                ephemeral: true
            });
        }

        const channel = interaction.guild.channels.cache.get(channelId);
        if (!channel) {
            return interaction.reply({
                content: '❌ Voice channel not found.',
                ephemeral: true
            });
        }

        // Check if user has permission to control this channel
        if (!instance.isModerator(interaction.user.id) && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                content: '❌ You don\'t have permission to control this channel.',
                ephemeral: true
            });
        }

        try {
            switch (action) {
                case 'rename':
                    await this.handleRename(interaction, instance, channel);
                    break;
                case 'limit':
                    await this.handleUserLimit(interaction, instance, channel);
                    break;
                case 'bitrate':
                    await this.handleBitrate(interaction, instance, channel);
                    break;
                case 'region':
                    await this.handleRegion(interaction, instance, channel);
                    break;
                case 'lock':
                    await this.handleLock(interaction, instance, channel);
                    break;
                case 'hide':
                    await this.handleHide(interaction, instance, channel);
                    break;
                case 'kick':
                    await this.handleKick(interaction, instance, channel);
                    break;
                case 'ban':
                    await this.handleBan(interaction, instance, channel);
                    break;
                case 'unban':
                    await this.handleUnban(interaction, instance, channel);
                    break;
                case 'allow_user':
                    await this.handleAllowUser(interaction, instance, channel);
                    break;
                case 'deny_user':
                    await this.handleDenyUser(interaction, instance, channel);
                    break;
                case 'manage_permissions':
                    await this.handleManagePermissions(interaction, instance, channel);
                    break;
                case 'transfer':
                    await this.handleTransfer(interaction, instance, channel);
                    break;
                case 'reset':
                    await this.handleReset(interaction, instance, channel);
                    break;
                case 'delete':
                    await this.handleDelete(interaction, instance, channel);
                    break;
                case 'menu':
                    await this.handleMenuSelection(interaction, instance, channel);
                    break;
            }
        } catch (error) {
            this.client.logger.error('Error handling control panel interaction:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred while processing your request.',
                    ephemeral: true
                });
            }
        }
    }

    // Control panel action handlers will be implemented in the next part...
    
    /**
     * Handle control panel action methods
     */
    async handleRename(interaction, instance, channel) {
        return this.controlHandlers.handleRename(interaction, instance, channel);
    }

    async handleUserLimit(interaction, instance, channel) {
        return this.controlHandlers.handleUserLimit(interaction, instance, channel);
    }

    async handleBitrate(interaction, instance, channel) {
        return this.controlHandlers.handleBitrate(interaction, instance, channel);
    }

    async handleRegion(interaction, instance, channel) {
        return this.controlHandlers.handleRegion(interaction, instance, channel);
    }

    async handleLock(interaction, instance, channel) {
        return this.controlHandlers.handleLock(interaction, instance, channel);
    }

    async handleHide(interaction, instance, channel) {
        return this.controlHandlers.handleHide(interaction, instance, channel);
    }

    async handleKick(interaction, instance, channel) {
        return this.controlHandlers.handleKick(interaction, instance, channel);
    }

    async handleBan(interaction, instance, channel) {
        return this.controlHandlers.handleBan(interaction, instance, channel);
    }

    async handleUnban(interaction, instance, channel) {
        return this.controlHandlers.handleUnban(interaction, instance, channel);
    }

    async handleTransfer(interaction, instance, channel) {
        return this.controlHandlers.handleTransfer(interaction, instance, channel);
    }

    async handleReset(interaction, instance, channel) {
        return this.controlHandlers.handleReset(interaction, instance, channel);
    }

    async handleDelete(interaction, instance, channel) {
        return this.controlHandlers.handleDelete(interaction, instance, channel);
    }
    
    async handleAllowUser(interaction, instance, channel) {
        return this.controlHandlers.handleAllowUser(interaction, instance, channel);
    }
    
    async handleDenyUser(interaction, instance, channel) {
        return this.controlHandlers.handleDenyUser(interaction, instance, channel);
    }
    
    async handleManagePermissions(interaction, instance, channel) {
        return this.controlHandlers.handleManagePermissions(interaction, instance, channel);
    }

    async handleMenuSelection(interaction, instance, channel) {
        return this.controlHandlers.handleMenuSelection(interaction, instance, channel);
    }
    
    /**
     * Start cleanup task for inactive channels
     */
    startCleanupTask() {
        setInterval(async () => {
            try {
                const guilds = await TempVC.find({ enabled: true });
                
                for (const config of guilds) {
                    const inactiveChannels = await TempVCInstance.findInactiveChannels(config.guildId, 1);
                    
                    for (const instance of inactiveChannels) {
                        if (instance.shouldAutoDelete()) {
                            await this.deleteTempChannel(instance);
                        }
                    }
                }
            } catch (error) {
                this.client.logger.error('Error in cleanup task:', error);
            }
        }, 60000); // Run every minute
    }

    /**
     * Cooldown management
     */
    isOnCooldown(userId, cooldownMinutes) {
        if (cooldownMinutes === 0) return false;
        
        const cooldownEnd = this.cooldowns.get(userId);
        if (!cooldownEnd) return false;
        
        return Date.now() < cooldownEnd;
    }

    setCooldown(userId, cooldownMinutes = 5) {
        if (cooldownMinutes === 0) return;
        
        this.cooldowns.set(userId, Date.now() + (cooldownMinutes * 60000));
    }

    getCooldownRemaining(userId, cooldownMinutes) {
        const cooldownEnd = this.cooldowns.get(userId);
        if (!cooldownEnd) return 0;
        
        const remaining = Math.ceil((cooldownEnd - Date.now()) / 60000);
        return Math.max(0, remaining);
    }

    /**
     * Format uptime
     */
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    }

    /**
     * Log channel creation
     */
    async logChannelCreation(guild, logChannelId, member, channel) {
        try {
            const logChannel = guild.channels.cache.get(logChannelId);
            if (!logChannel) return;

            const embed = Utils.createInfoEmbed(
                'Temp VC Created',
                `**Channel:** ${channel.name}\n**Owner:** ${member.displayName} (${member.user.tag})\n**Channel ID:** ${channel.id}`
            );

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            this.client.logger.error('Error logging channel creation:', error);
        }
    }
}

module.exports = TempVCManager;
