const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle } = require('discord.js');
const Utils = require('./utils');
const TempVCInstance = require('../schemas/TempVCInstance');
const ProfanityFilter = require('./ProfanityFilter');

class TempVCControlHandlers {
    constructor(tempVCManager) {
        this.manager = tempVCManager;
        this.client = tempVCManager.client;
    }

    /**
     * Handle rename action
     */
    async handleRename(interaction, instance, channel) {
        const modal = new ModalBuilder()
            .setCustomId(`tempvc_rename_modal_${instance.channelId}`)
            .setTitle('Rename Channel');

        const nameInput = new TextInputBuilder()
            .setCustomId('channel_name')
            .setLabel('New Channel Name')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(100)
            .setValue(channel.name)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    }

    /**
     * Handle user limit action
     */
    async handleUserLimit(interaction, instance, channel) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`tempvc_limit_select_${instance.channelId}`)
            .setPlaceholder('Select user limit...')
            .addOptions(
                { label: 'No Limit', value: '0' },
                { label: '1 User', value: '1' },
                { label: '2 Users', value: '2' },
                { label: '3 Users', value: '3' },
                { label: '4 Users', value: '4' },
                { label: '5 Users', value: '5' },
                { label: '10 Users', value: '10' },
                { label: '15 Users', value: '15' },
                { label: '20 Users', value: '20' },
                { label: '25 Users', value: '25' },
                { label: 'Custom...', value: 'custom' }
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: `Current user limit: **${instance.settings.userLimit || 'No limit'}**`,
            components: [row],
            ephemeral: true
        });
    }

    /**
     * Handle bitrate action
     */
    async handleBitrate(interaction, instance, channel) {
        const guild = interaction.guild;
        const maxBitrate = guild.premiumTier >= 2 ? 384 : guild.premiumTier >= 1 ? 128 : 96;

        const options = [
            { label: '8 kbps (Phone Quality)', value: '8000' },
            { label: '32 kbps (Low Quality)', value: '32000' },
            { label: '64 kbps (Standard)', value: '64000' },
            { label: '96 kbps (Good)', value: '96000' }
        ];

        if (maxBitrate >= 128) {
            options.push({ label: '128 kbps (High)', value: '128000' });
        }
        if (maxBitrate >= 384) {
            options.push(
                { label: '256 kbps (Very High)', value: '256000' },
                { label: '384 kbps (Maximum)', value: '384000' }
            );
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`tempvc_bitrate_select_${instance.channelId}`)
            .setPlaceholder('Select bitrate...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: `Current bitrate: **${instance.settings.bitrate / 1000} kbps**\nMax bitrate for this server: **${maxBitrate} kbps**`,
            components: [row],
            ephemeral: true
        });
    }

    /**
     * Handle region action
     */
    async handleRegion(interaction, instance, channel) {
        const regions = [
            { label: 'Automatic', value: 'null' },
            { label: '🇺🇸 US East', value: 'us-east' },
            { label: '🇺🇸 US West', value: 'us-west' },
            { label: '🇺🇸 US Central', value: 'us-central' },
            { label: '🇺🇸 US South', value: 'us-south' },
            { label: '🇪🇺 Europe', value: 'europe' },
            { label: '🇳🇱 Amsterdam', value: 'amsterdam' },
            { label: '🇬🇧 London', value: 'london' },
            { label: '🇩🇪 Frankfurt', value: 'frankfurt' },
            { label: '🇷🇺 Russia', value: 'russia' },
            { label: '🇰🇷 South Korea', value: 'south-korea' },
            { label: '🇯🇵 Japan', value: 'japan' },
            { label: '🇸🇬 Singapore', value: 'singapore' },
            { label: '🇦🇺 Sydney', value: 'sydney' },
            { label: '🇧🇷 Brazil', value: 'brazil' },
            { label: '🇮🇳 India', value: 'india' },
            { label: '🇭🇰 Hong Kong', value: 'hongkong' },
            { label: '🇿🇦 South Africa', value: 'south-africa' }
        ];

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`tempvc_region_select_${instance.channelId}`)
            .setPlaceholder('Select voice region...')
            .addOptions(regions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: `Current region: **${instance.settings.region || 'Automatic'}**`,
            components: [row],
            ephemeral: true
        });
    }

    /**
     * Handle lock/unlock action
     */
    async handleLock(interaction, instance, channel) {
        try {
            const isLocked = instance.settings.locked;
            
            if (isLocked) {
                // Unlock: Allow @everyone to connect
                await channel.permissionOverwrites.edit(channel.guild.id, {
                    Connect: null // Remove explicit deny
                });
                
                instance.settings.locked = false;
                await instance.save();
                
                // Auto-save settings
                await instance.autoSaveSettings();
                
                await interaction.reply({
                    embeds: [Utils.createSuccessEmbed('Channel Unlocked', 'Anyone can now join this channel.')],
                    ephemeral: true
                });
            } else {
                // Lock: Deny @everyone from connecting, but allow current members
                await channel.permissionOverwrites.edit(channel.guild.id, {
                    Connect: false
                });
                
                // Allow current members to stay
                for (const member of channel.members.values()) {
                    if (!member.user.bot) {
                        await channel.permissionOverwrites.edit(member.id, {
                            Connect: true
                        });
                    }
                }
                
                instance.settings.locked = true;
                await instance.save();
                
                // Auto-save settings
                await instance.autoSaveSettings();
                
                await interaction.reply({
                    embeds: [Utils.createSuccessEmbed('Channel Locked', 'Only current members and those you allow can join.')],
                    ephemeral: true
                });
            }
            
            // Update control panel
            await this.manager.updateControlPanel(instance, channel);
            
        } catch (error) {
            this.client.logger.error('Error locking/unlocking channel:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to change channel lock status.')],
                ephemeral: true
            });
        }
    }

    /**
     * Handle hide/unhide action
     */
    async handleHide(interaction, instance, channel) {
        try {
            const isHidden = instance.settings.hidden;
            
            if (isHidden) {
                // Unhide: Allow @everyone to view
                await channel.permissionOverwrites.edit(channel.guild.id, {
                    ViewChannel: null // Remove explicit deny
                });
                
                instance.settings.hidden = false;
                await instance.save();
                
                // Auto-save settings
                await instance.autoSaveSettings();
                
                await interaction.reply({
                    embeds: [Utils.createSuccessEmbed('Channel Unhidden', 'Channel is now visible to everyone.')],
                    ephemeral: true
                });
            } else {
                // Hide: Deny @everyone from viewing, but allow current members
                await channel.permissionOverwrites.edit(channel.guild.id, {
                    ViewChannel: false
                });
                
                // Allow current members to see
                for (const member of channel.members.values()) {
                    if (!member.user.bot) {
                        await channel.permissionOverwrites.edit(member.id, {
                            ViewChannel: true
                        });
                    }
                }
                
                instance.settings.hidden = true;
                await instance.save();
                
                // Auto-save settings
                await instance.autoSaveSettings();
                
                await interaction.reply({
                    embeds: [Utils.createSuccessEmbed('Channel Hidden', 'Channel is now hidden from others.')],
                    ephemeral: true
                });
            }
            
            // Update control panel
            await this.manager.updateControlPanel(instance, channel);
            
        } catch (error) {
            this.client.logger.error('Error hiding/unhiding channel:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to change channel visibility.')],
                ephemeral: true
            });
        }
    }

    /**
     * Handle transfer ownership
     */
    async handleTransfer(interaction, instance, channel) {
        const members = channel.members.filter(m => !m.user.bot && m.id !== instance.ownerId);
        
        if (members.size === 0) {
            return interaction.reply({
                embeds: [Utils.createWarningEmbed('No Members', 'There are no other members in the channel to transfer ownership to.')],
                ephemeral: true
            });
        }

        const options = members.map(member => ({
            label: member.displayName,
            description: member.user.tag,
            value: member.id
        }));

        if (options.length > 25) {
            return interaction.reply({
                embeds: [Utils.createWarningEmbed('Too Many Members', 'There are too many members to display. Please ask someone to leave and try again.')],
                ephemeral: true
            });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`tempvc_transfer_select_${instance.channelId}`)
            .setPlaceholder('Select new owner...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: '👑 **Transfer Ownership**\nSelect who you want to transfer ownership to:',
            components: [row],
            ephemeral: true
        });
    }

    /**
     * Handle delete channel
     */
    async handleDelete(interaction, instance, channel) {
        const embed = new EmbedBuilder()
            .setTitle('⚠️ Delete Channel')
            .setDescription('Are you sure you want to delete this voice channel?\n\n**This action cannot be undone!**')
            .setColor(0xED4245);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`tempvc_delete_confirm_${instance.channelId}`)
                .setLabel('Yes, Delete')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`tempvc_delete_cancel_${instance.channelId}`)
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    }

    /**
     * Handle reset to defaults
     */
    async handleReset(interaction, instance, channel) {
        const embed = new EmbedBuilder()
            .setTitle('🔄 Reset to Defaults')
            .setDescription('Are you sure you want to reset all channel settings to defaults?\n\n**This will:**\n• Reset user limit, bitrate, region to server defaults\n• Unlock and unhide the channel\n• Clear all banned users\n• Remove all permission overrides\n\n**This action cannot be undone!**')
            .setColor(0xED4245);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`tempvc_reset_confirm_${instance.channelId}`)
                .setLabel('Yes, Reset')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`tempvc_reset_cancel_${instance.channelId}`)
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    }

    /**
     * Handle menu selection
     */
    async handleMenuSelection(interaction, instance, channel) {
        const action = interaction.values[0];
        
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
        }
    }

    /**
     * Handle select menu interactions
     */
    async handleSelectMenuInteraction(interaction) {
        const customId = interaction.customId;
        const parts = customId.split('_');
        const type = parts[1]; // limit, bitrate, region, etc.
        
        // Handle user select menus (different customId format)
        // User select menus: tempvc_[action]_user_select_[channelId]
        // Regular select menus: tempvc_[action]_select_[channelId]
        let channelId;
        if (parts[2] === 'user') {
            channelId = parts[4]; // For user select menus
        } else {
            channelId = parts[3]; // For regular select menus
        }
        
        const instance = await TempVCInstance.findByChannelId(channelId);
        if (!instance) {
            return interaction.reply({
                content: '❌ Channel not found.',
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

        const value = interaction.values[0];

        try {
            // Handle user select menus (different customId format)
            if (parts[2] === 'user') {
                switch (type) {
                    case 'ban':
                        await this.handleBanUserSelection(interaction, instance, channel);
                        break;
                    case 'unban':
                        await this.handleUnbanUserSelection(interaction, instance, channel);
                        break;
                    case 'allow':
                        await this.handleAllowUserSelection(interaction, instance, channel);
                        break;
                    case 'deny':
                        await this.handleDenyUserSelection(interaction, instance, channel);
                        break;
                }
                return;
            }

            // Handle regular select menus
            switch (type) {
                case 'limit':
                    await this.handleLimitSelection(interaction, instance, channel, value);
                    break;
                case 'bitrate':
                    await this.handleBitrateSelection(interaction, instance, channel, value);
                    break;
                case 'region':
                    await this.handleRegionSelection(interaction, instance, channel, value);
                    break;
                case 'kick':
                    await this.handleKickSelection(interaction, instance, channel, value);
                    break;
                case 'ban': // Fallback for old string-based ban select
                    await this.handleBanSelection(interaction, instance, channel, value);
                    break;
                case 'unban': // Fallback for old string-based unban select
                    await this.handleUnbanSelection(interaction, instance, channel, value);
                    break;
                case 'transfer':
                    await this.handleTransferSelection(interaction, instance, channel, value);
                    break;
            }
        } catch (error) {
            this.client.logger.error('Error handling select menu:', error);
            await interaction.reply({
                content: '❌ An error occurred.',
                ephemeral: true
            });
        }
    }

    /**
     * Handle user limit selection
     */
    async handleLimitSelection(interaction, instance, channel, value) {
        if (value === 'custom') {
            const modal = new ModalBuilder()
                .setCustomId(`tempvc_limit_modal_${instance.channelId}`)
                .setTitle('Custom User Limit');

            const limitInput = new TextInputBuilder()
                .setCustomId('user_limit')
                .setLabel('User Limit (0 for no limit)')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(2)
                .setValue(instance.settings.userLimit.toString())
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(limitInput);
            modal.addComponents(row);

            return await interaction.showModal(modal);
        }

        const limit = parseInt(value);
        
        await channel.setUserLimit(limit);
        instance.settings.userLimit = limit;
        await instance.save();

        // Auto-save settings
        await instance.autoSaveSettings();

        const limitText = limit === 0 ? 'No limit' : `${limit} users`;
        
        await interaction.update({
            content: `✅ User limit set to: **${limitText}**`,
            components: []
        });

        await this.manager.updateControlPanel(instance, channel);
    }

    /**
     * Handle bitrate selection
     */
    async handleBitrateSelection(interaction, instance, channel, value) {
        const bitrate = parseInt(value);
        
        await channel.setBitrate(bitrate);
        instance.settings.bitrate = bitrate;
        await instance.save();

        // Auto-save settings
        await instance.autoSaveSettings();

        await interaction.update({
            content: `✅ Bitrate set to: **${bitrate / 1000} kbps**`,
            components: []
        });

        await this.manager.updateControlPanel(instance, channel);
    }

    /**
     * Handle region selection
     */
    async handleRegionSelection(interaction, instance, channel, value) {
        const region = value === 'null' ? null : value;
        
        await channel.setRTCRegion(region);
        instance.settings.region = region;
        await instance.save();

        // Auto-save settings
        await instance.autoSaveSettings();

        const regionText = region || 'Automatic';
        
        await interaction.update({
            content: `✅ Voice region set to: **${regionText}**`,
            components: []
        });

        await this.manager.updateControlPanel(instance, channel);
    }

    /**
     * Handle transfer selection
     */
    async handleTransferSelection(interaction, instance, channel, userId) {
        const newOwner = await interaction.guild.members.fetch(userId);
        if (!newOwner) {
            return interaction.update({
                content: '❌ User not found.',
                components: []
            });
        }

        // Transfer ownership
        await instance.transferOwnership(userId);
        
        // Update channel permissions
        await channel.permissionOverwrites.edit(userId, {
            ViewChannel: true,
            Connect: true,
            Speak: true,
            ManageChannels: true,
            ManageRoles: true,
            MoveMembers: true,
            MuteMembers: true,
            DeafenMembers: true
        });

        await interaction.update({
            content: `✅ Ownership transferred to **${newOwner.displayName}**`,
            components: []
        });

        // Notify new owner
        try {
            const embed = Utils.createSuccessEmbed(
                'Channel Ownership Transferred',
                `You are now the owner of **${channel.name}**!\nYou can manage the channel using the control panel.`
            );
            await newOwner.send({ embeds: [embed] });
        } catch (error) {
            // Ignore DM errors
        }

        await this.manager.updateControlPanel(instance, channel);
    }

    /**
     * Handle modal submissions
     */
    async handleModalSubmission(interaction) {
        const customId = interaction.customId;
        const parts = customId.split('_');
        const type = parts[1]; // rename, limit, etc.
        const channelId = parts[3]; // skip "modal" part
        
        const instance = await TempVCInstance.findByChannelId(channelId);
        if (!instance) {
            return interaction.reply({
                content: '❌ Channel not found.',
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

        try {
            switch (type) {
                case 'rename':
                    await this.handleRenameModal(interaction, instance, channel);
                    break;
                case 'limit':
                    await this.handleLimitModal(interaction, instance, channel);
                    break;
            }
        } catch (error) {
            this.client.logger.error('Error handling modal submission:', error);
            await interaction.reply({
                content: '❌ An error occurred.',
                ephemeral: true
            });
        }
    }

    /**
     * Handle rename modal
     */
    async handleRenameModal(interaction, instance, channel) {
        const newName = interaction.fields.getTextInputValue('channel_name').trim();
        
        if (ProfanityFilter.contains(newName)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Invalid Name', 'The channel name contains inappropriate language. Please choose another name.')],
                ephemeral: true
            });
        }
        
        if (newName.length < 1 || newName.length > 100) {
            return interaction.reply({
                content: '❌ Channel name must be between 1 and 100 characters.',
                ephemeral: true
            });
        }

        await channel.setName(newName);
        instance.currentName = newName;
        await instance.save();

        // Auto-save settings
        await instance.autoSaveSettings();

        await interaction.reply({
            embeds: [Utils.createSuccessEmbed('Channel Renamed', `Channel renamed to: **${newName}**`)],
            ephemeral: true,
        });

        await this.manager.updateControlPanel(instance, channel);
    }

    /**
     * Handle limit modal
     */
    async handleLimitModal(interaction, instance, channel) {
        const limitStr = interaction.fields.getTextInputValue('user_limit').trim();
        const limit = parseInt(limitStr);
        
        if (isNaN(limit) || limit < 0 || limit > 99) {
            return interaction.reply({
                content: '❌ User limit must be a number between 0 and 99.',
                ephemeral: true
            });
        }

        await channel.setUserLimit(limit);
        instance.settings.userLimit = limit;
        await instance.save();

        // Auto-save settings
        await instance.autoSaveSettings();

        const limitText = limit === 0 ? 'No limit' : `${limit} users`;
        
        await interaction.reply({
            content: `✅ User limit set to: **${limitText}**`,
            ephemeral: true
        });

        await this.manager.updateControlPanel(instance, channel);
    }

    /**
     * Handle kick action
     */
    async handleKick(interaction, instance, channel) {
        const membersInVC = channel.members.filter(m => !m.user.bot && m.id !== instance.ownerId);
        
        if (membersInVC.size === 0) {
            return interaction.reply({
                content: '❌ No members to kick from this channel.',
                ephemeral: true
            });
        }

        const options = membersInVC.map(member => ({
            label: member.displayName,
            description: `${member.user.tag}`,
            value: member.id
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`tempvc_kick_select_${instance.channelId}`)
            .setPlaceholder('Select member to kick...')
            .addOptions(options.slice(0, 25)); // Discord limit

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: 'Select a member to kick from the channel:',
            components: [row],
            ephemeral: true
        });
    }

    /**
     * Handle ban action
     */
    async handleBan(interaction, instance, channel) {
        // Get already banned user IDs to exclude them from default users
        const bannedUserIds = new Set();
        for (const [id, overwrite] of channel.permissionOverwrites.cache) {
            if (overwrite.type === 1 && overwrite.deny.has(PermissionFlagsBits.Connect)) {
                bannedUserIds.add(id);
            }
        }

        // Get some default users to show (current VC members and some recent server members)
        const defaultUsers = [];
        
        // Add current voice channel members (excluding bots, owner, and already banned)
        const vcMembers = channel.members.filter(m => 
            !m.user.bot && 
            m.id !== instance.ownerId && 
            !bannedUserIds.has(m.id)
        );
        defaultUsers.push(...vcMembers.map(m => m.id));

        // Fill remaining slots with other server members if needed
        if (defaultUsers.length < 25) {
            try {
                const guild = interaction.guild;
                const allMembers = await guild.members.fetch({ limit: 50 });
                const additionalMembers = allMembers
                    .filter(m => 
                        !m.user.bot && 
                        m.id !== instance.ownerId && 
                        !bannedUserIds.has(m.id) &&
                        !defaultUsers.includes(m.id)
                    )
                    .first(25 - defaultUsers.length);
                
                defaultUsers.push(...additionalMembers.map(m => m.id));
            } catch (error) {
                this.client.logger.debug('Could not fetch additional members for ban menu:', error);
            }
        }

        const userSelectMenu = new UserSelectMenuBuilder()
            .setCustomId(`tempvc_ban_user_select_${instance.channelId}`)
            .setPlaceholder('Search and select a user to ban...')
            .setMaxValues(10)
            .setMinValues(1);

/*         // Add default users if any are available (max 1 since maxValues is 1)
        if (defaultUsers.length > 0) {
            userSelectMenu.addDefaultUsers(defaultUsers[0]);
        } */

        const row = new ActionRowBuilder().addComponents(userSelectMenu);

        await interaction.reply({
            content: '🔍 **Ban Member**\nSearch for and select a user to ban from this channel:\n\n*You can type to search for any user in the server*',
            components: [row],
            ephemeral: true
        });
    }

    /**
     * Handle unban action
     */
    async handleUnban(interaction, instance, channel) {
        // Get all banned user IDs
        const bannedUserIds = [];
        for (const [id, overwrite] of channel.permissionOverwrites.cache) {
            if (overwrite.type === 1 && overwrite.deny.has(PermissionFlagsBits.Connect)) {
                bannedUserIds.push(id);
            }
        }

        if (bannedUserIds.length === 0) {
            return interaction.reply({
                content: '❌ No banned members in this channel.',
                ephemeral: true
            });
        }

        // If there's only one banned user, offer direct unban with confirmation
        if (bannedUserIds.length === 1) {
            const userId = bannedUserIds[0];
            let userName = 'Unknown User';
            
            try {
                const user = await this.client.users.fetch(userId);
                userName = user.tag;
            } catch (error) {
                userName = `User ID: ${userId}`;
            }

            const embed = new EmbedBuilder()
                .setTitle('🔓 Unban Member')
                .setDescription(`Do you want to unban **${userName}**?\n\nThis is the only banned user in this channel.`)
                .setColor(0x57F287);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`tempvc_unban_confirm_${instance.channelId}_${userId}`)
                    .setLabel(`Unban ${userName}`)
                    .setEmoji('✅')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`tempvc_unban_cancel_${instance.channelId}`)
                    .setLabel('Cancel')
                    .setEmoji('❌')
                    .setStyle(ButtonStyle.Secondary)
            );

            return interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });
        }

        // Multiple banned users - use the select menu approach
        const userSelectMenu = new UserSelectMenuBuilder()
            .setCustomId(`tempvc_unban_user_select_${instance.channelId}`)
            .setPlaceholder('Search and select a user to unban...')
            .setMaxValues(10)
            .setMinValues(1);

        // Don't add default users to avoid confusion
        const row = new ActionRowBuilder().addComponents(userSelectMenu);

        await interaction.reply({
            content: `🔍 **Unban Member**\nSearch for and select a user to unban from this channel:\n\n*Found ${bannedUserIds.length} banned user(s). You can search for any user to unban.*`,
            components: [row],
            ephemeral: true
        });
    }

    /**
     * Handle kick selection
     */
    async handleKickSelection(interaction, instance, channel, userId) {
        try {
            const member = await interaction.guild.members.fetch(userId);
            if (!member) {
                return interaction.update({
                    content: '❌ Member not found.',
                    components: []
                });
            }

            if (!member.voice.channel || member.voice.channel.id !== channel.id) {
                return interaction.update({
                    content: '❌ Member is not in this voice channel.',
                    components: []
                });
            }

            await member.voice.disconnect('Kicked from temp VC');

            await interaction.update({
                content: `✅ **${member.displayName}** has been kicked from the channel.`,
                components: []
            });

            // Try to notify the kicked member
            try {
                const embed = Utils.createWarningEmbed(
                    'Kicked from Voice Channel',
                    `You were kicked from **${channel.name}** by the channel owner.`
                );
                await member.send({ embeds: [embed] });
            } catch (error) {
                // Ignore DM errors
            }

            await this.manager.updateControlPanel(instance, channel);

        } catch (error) {
            this.client.logger.error('Error kicking member:', error);
            await interaction.update({
                content: '❌ Failed to kick member.',
                components: []
            });
        }
    }

    /**
     * Handle ban selection
     */
    async handleBanSelection(interaction, instance, channel, userId) {
        try {
            const targetUser = await interaction.guild.members.fetch(userId);
            if (!targetUser) {
                return interaction.update({
                    content: '❌ Member not found.',
                    components: []
                });
            }

            if (targetUser.id === instance.ownerId) {
                return interaction.update({
                    content: '❌ You cannot ban the channel owner.',
                    components: []
                });
            }

/*             if (targetUser.user.bot) {
                return interaction.update({
                    content: '❌ You cannot ban bots.',
                    components: []
                });
            } */

            // Ban the user by denying Connect permission
            await channel.permissionOverwrites.edit(targetUser.id, {
                Connect: false,
                ViewChannel: false
            });

            // Add to blocked users list and auto-save
            await instance.blockUser(targetUser.id);
            await instance.autoSaveSettings();

            // Disconnect if they're currently in the channel
            if (targetUser.voice.channel && targetUser.voice.channel.id === channel.id) {
                await targetUser.voice.disconnect('Banned from temp VC');
            }

            await interaction.update({
                content: `✅ **${targetUser.displayName}** has been banned from the channel.`,
                components: []
            });

            // Try to notify the banned member
            try {
                const embed = Utils.createErrorEmbed(
                    'Banned from Voice Channel',
                    `You have been banned from **${channel.name}** and cannot rejoin unless unbanned.`
                );
                await targetUser.send({ embeds: [embed] });
            } catch (error) {
                // Ignore DM errors
            }

            await this.manager.updateControlPanel(instance, channel);

        } catch (error) {
            this.client.logger.error('Error banning member:', error);
            await interaction.update({
                content: '❌ Failed to ban member.',
                components: []
            });
        }
    }

    /**
     * Handle ban user selection (from UserSelectMenuBuilder)
     */
    async handleBanUserSelection(interaction, instance, channel) {
        try {
            const userIds = interaction.values; // UserSelectMenuBuilder returns array of user IDs
            const results = [];
            let successCount = 0;
            let errorCount = 0;

            for (const userId of userIds) {
                try {
                    const targetUser = await interaction.guild.members.fetch(userId).catch(() => null);
                    
                    if (!targetUser) {
                        results.push(`❌ User ID ${userId} not found in this server`);
                        errorCount++;
                        continue;
                    }

                    if (targetUser.id === instance.ownerId) {
                        results.push(`❌ Cannot ban ${targetUser.displayName} (channel owner)`);
                        errorCount++;
                        continue;
                    }

                    // Check if already banned
                    const existingOverwrite = channel.permissionOverwrites.cache.get(userId);
                    if (existingOverwrite && existingOverwrite.deny.has(PermissionFlagsBits.Connect)) {
                        results.push(`⚠️ ${targetUser.displayName} is already banned`);
                        continue;
                    }

                    // Ban the user by denying Connect permission
                    await channel.permissionOverwrites.edit(targetUser.id, {
                        Connect: false,
                        ViewChannel: false
                    });

                    // Add to blocked users list
                    await instance.blockUser(targetUser.id);

                    // Disconnect if they're currently in the channel
                    if (targetUser.voice.channel && targetUser.voice.channel.id === channel.id) {
                        await targetUser.voice.disconnect('Banned from temp VC');
                    }

                    results.push(`✅ ${targetUser.displayName} banned`);
                    successCount++;

                    // Try to notify the banned member
                    try {
                        const embed = Utils.createErrorEmbed(
                            'Banned from Voice Channel',
                            `You have been banned from **${channel.name}** and cannot rejoin unless unbanned.`
                        );
                        await targetUser.send({ embeds: [embed] });
                    } catch (error) {
                        // Ignore DM errors
                    }

                } catch (error) {
                    this.client.logger.error(`Error banning user ${userId}:`, error);
                    results.push(`❌ Failed to ban user ID ${userId}`);
                    errorCount++;
                }
            }

            // Auto-save settings after all bans
            await instance.autoSaveSettings();

            // Create summary message
            let content = `**Ban Results:**\n${results.join('\n')}`;
            if (successCount > 0 || errorCount > 0) {
                content += `\n\n**Summary:** ${successCount} banned, ${errorCount} failed`;
            }

            await interaction.update({
                content,
                components: []
            });

            await this.manager.updateControlPanel(instance, channel);

        } catch (error) {
            this.client.logger.error('Error banning users:', error);
            await interaction.update({
                content: '❌ Failed to ban users.',
                components: []
            });
        }
    }

    /**
     * Handle unban selection
     */
    async handleUnbanSelection(interaction, instance, channel, userId) {
        try {
            // Remove the ban (permission overwrite)
            const overwrite = channel.permissionOverwrites.cache.get(userId);
            if (overwrite) {
                await overwrite.delete();
            }

            // Remove from blocked users list and auto-save
            instance.permissions.blockedUsers = instance.permissions.blockedUsers.filter(id => id !== userId);
            await instance.save();
            await instance.autoSaveSettings();

            // Try to get user info for response
            let userName = 'Unknown User';
            try {
                const user = await this.client.users.fetch(userId);
                userName = user.tag;
            } catch (error) {
                // User might not exist anymore
            }

            await interaction.update({
                content: `✅ **${userName}** has been unbanned from the channel.`,
                components: []
            });

            await this.manager.updateControlPanel(instance, channel);

        } catch (error) {
            this.client.logger.error('Error unbanning member:', error);
            await interaction.update({
                content: '❌ Failed to unban member.',
                components: []
            });
        }
    }

    /**
     * Handle unban user selection (from UserSelectMenuBuilder)
     */
    async handleUnbanUserSelection(interaction, instance, channel) {
        try {
            const userIds = interaction.values; // UserSelectMenuBuilder returns array of user IDs
            const results = [];
            let successCount = 0;
            let errorCount = 0;

            for (const userId of userIds) {
                try {
                    // Check if user is actually banned
                    const overwrite = channel.permissionOverwrites.cache.get(userId);
                    if (!overwrite || !overwrite.deny.has(PermissionFlagsBits.Connect)) {
                        results.push(`⚠️ User ID ${userId} is not banned`);
                        continue;
                    }

                    // Remove the ban (permission overwrite)
                    await overwrite.delete();

                    // Remove from blocked users list
                    instance.permissions.blockedUsers = instance.permissions.blockedUsers.filter(id => id !== userId);

                    // Try to get user info for response
                    let userName = 'Unknown User';
                    try {
                        const user = await this.client.users.fetch(userId);
                        userName = user.tag;
                    } catch (error) {
                        // User might not exist anymore, use ID
                        userName = `User ID: ${userId}`;
                    }

                    results.push(`✅ ${userName} unbanned`);
                    successCount++;

                } catch (error) {
                    this.client.logger.error(`Error unbanning user ${userId}:`, error);
                    results.push(`❌ Failed to unban user ID ${userId}`);
                    errorCount++;
                }
            }

            // Save instance and auto-save settings after all unbans
            await instance.save();
            await instance.autoSaveSettings();

            // Create summary message
            let content = `**Unban Results:**\n${results.join('\n')}`;
            if (successCount > 0 || errorCount > 0) {
                content += `\n\n**Summary:** ${successCount} unbanned, ${errorCount} failed`;
            }

            await interaction.update({
                content,
                components: []
            });

            await this.manager.updateControlPanel(instance, channel);

        } catch (error) {
            this.client.logger.error('Error unbanning users:', error);
            await interaction.update({
                content: '❌ Failed to unban users.',
                components: []
            });
        }
    }

    /**
     * Handle delete confirmation
     */
    async handleDeleteConfirmation(interaction) {
        const [, , , channelId] = interaction.customId.split('_');
        
        const instance = await TempVCInstance.findByChannelId(channelId);
        if (!instance) {
            return interaction.update({
                content: '❌ Channel not found.',
                components: []
            });
        }

        await interaction.update({
            content: '🗑️ Deleting channel...',
            components: []
        });

        await this.manager.deleteTempChannel(instance);
    }

    /**
     * Handle delete cancellation
     */
    async handleDeleteCancellation(interaction) {
        await interaction.update({
            content: '✅ Channel deletion cancelled.',
            components: []
        });
    }

    /**
     * Handle reset confirmation
     */
    async handleResetConfirmation(interaction) {
        const [, , , channelId] = interaction.customId.split('_');
        
        const instance = await TempVCInstance.findByChannelId(channelId);
        if (!instance) {
            return interaction.update({
                content: '❌ Channel not found.',
                components: []
            });
        }

        const channel = interaction.guild.channels.cache.get(channelId);
        if (!channel) {
            return interaction.update({
                content: '❌ Voice channel not found.',
                components: []
            });
        }

        try {
            await interaction.update({
                content: '🔄 Resetting channel to defaults...',
                components: []
            });

            // Get guild defaults
            const TempVC = require('../schemas/TempVC');
            const config = await TempVC.findByGuildId(instance.guildId);
            const guildDefaults = config ? config.defaultSettings : {
                userLimit: 0,
                bitrate: 64000,
                locked: false,
                hidden: false,
                region: null
            };

            // Reset channel settings
            await channel.setUserLimit(guildDefaults.userLimit);
            await channel.setBitrate(guildDefaults.bitrate);
            await channel.setRTCRegion(guildDefaults.region);
            
            // Reset permissions - remove all permission overwrites except owner
            const guild = channel.guild;
            const overwrites = channel.permissionOverwrites.cache;
            
            for (const [id, overwrite] of overwrites) {
                if (id !== guild.id && id !== instance.ownerId) {
                    await overwrite.delete();
                }
            }
            
            // Reset @everyone permissions to defaults
            await channel.permissionOverwrites.edit(guild.id, {
                ViewChannel: guildDefaults.hidden ? false : null,
                Connect: guildDefaults.locked ? false : null
            });

            // Reset instance data
            await instance.resetToDefaults(guildDefaults);

            // Update control panel
            await this.manager.updateControlPanel(instance, channel);

            await interaction.editReply({
                content: '✅ Channel has been reset to default settings!',
                components: []
            });

        } catch (error) {
            this.client.logger.error('Error resetting channel:', error);
            await interaction.editReply({
                content: '❌ Failed to reset channel settings.',
                components: []
            });
        }
    }

    /**
     * Handle reset cancellation
     */
    async handleResetCancellation(interaction) {
        await interaction.update({
            content: '✅ Reset cancelled.',
            components: []
        });
    }

    /**
     * Handle allow user button
     */
    async handleAllowUser(interaction, instance, channel) {
        if (!instance.isModerator(interaction.user.id)) {
            return interaction.reply({
                content: '❌ Only the channel owner or moderators can allow users.',
                ephemeral: true
            });
        }

        const userSelectMenu = new UserSelectMenuBuilder()
            .setCustomId(`tempvc_allow_user_select_${instance.channelId}`)
            .setPlaceholder('Select user to allow...')
            .setMinValues(1)
            .setMaxValues(1);

        const row = new ActionRowBuilder().addComponents(userSelectMenu);

        await interaction.reply({
            content: '👤 **Allow User**\nSelect a user to allow access to this channel:',
            components: [row],
            ephemeral: true
        });
    }

    /**
     * Handle deny user button
     */
    async handleDenyUser(interaction, instance, channel) {
        if (!instance.isModerator(interaction.user.id)) {
            return interaction.reply({
                content: '❌ Only the channel owner or moderators can deny users.',
                ephemeral: true
            });
        }

        const userSelectMenu = new UserSelectMenuBuilder()
            .setCustomId(`tempvc_deny_user_select_${instance.channelId}`)
            .setPlaceholder('Select user to deny...')
            .setMinValues(1)
            .setMaxValues(1);

        const row = new ActionRowBuilder().addComponents(userSelectMenu);

        await interaction.reply({
            content: '🚫 **Deny User**\nSelect a user to deny access to this channel:',
            components: [row],
            ephemeral: true
        });
    }

    /**
     * Handle manage permissions button
     */
    async handleManagePermissions(interaction, instance, channel) {
        if (!instance.isModerator(interaction.user.id)) {
            return interaction.reply({
                content: '❌ Only the channel owner or moderators can manage permissions.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('⚙️ Manage Permissions')
            .setDescription(`Manage user permissions for **${channel.name}**`)
            .setColor(0x5865F2);

        // Show allowed users
        if (instance.permissions.allowedUsers.length > 0) {
            const allowedList = await this.buildUserList(interaction.guild, instance.permissions.allowedUsers);
            embed.addFields({
                name: '✅ Allowed Users',
                value: allowedList || 'None',
                inline: true
            });
        }

        // Show blocked/denied users
        if (instance.permissions.blockedUsers.length > 0) {
            const blockedList = await this.buildUserList(interaction.guild, instance.permissions.blockedUsers);
            embed.addFields({
                name: '❌ Denied Users',
                value: blockedList || 'None',
                inline: true
            });
        }

        // Show moderators
        if (instance.permissions.moderators.length > 0) {
            const modList = await this.buildUserList(interaction.guild, instance.permissions.moderators);
            embed.addFields({
                name: '👑 Moderators',
                value: modList || 'None',
                inline: true
            });
        }

        if (instance.permissions.allowedUsers.length === 0 && 
            instance.permissions.blockedUsers.length === 0 && 
            instance.permissions.moderators.length === 0) {
            embed.addFields({
                name: 'ℹ️ No Special Permissions',
                value: 'No users have been specifically allowed, denied, or made moderators.',
                inline: false
            });
        }

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`tempvc_allow_user_${instance.channelId}`)
                .setLabel('Allow User')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`tempvc_deny_user_${instance.channelId}`)
                .setLabel('Deny User')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({
            embeds: [embed],
            components: [actionRow],
            ephemeral: true
        });
    }

    /**
     * Helper method to build user list from user IDs
     */
    async buildUserList(guild, userIds) {
        if (!userIds || userIds.length === 0) return 'None';
        
        const usernames = [];
        for (const userId of userIds.slice(0, 10)) { // Limit to 10 to avoid field length issues
            try {
                const member = await guild.members.fetch(userId);
                usernames.push(`• ${member.displayName}`);
            } catch (error) {
                usernames.push(`• <@${userId}> (left server)`);
            }
        }
        
        if (userIds.length > 10) {
            usernames.push(`• ... and ${userIds.length - 10} more`);
        }
        
        return usernames.join('\n') || 'None';
    }

    /**
     * Handle allow user selection from UserSelectMenu
     */
    async handleAllowUserSelection(interaction, instance, channel) {
        if (!instance.isModerator(interaction.user.id)) {
            return interaction.reply({
                content: '❌ Only the channel owner or moderators can allow users.',
                ephemeral: true
            });
        }

        const selectedUser = interaction.users.first();
        if (!selectedUser) {
            return interaction.reply({
                content: '❌ No user selected.',
                ephemeral: true
            });
        }

        if (selectedUser.bot) {
            return interaction.reply({
                content: '❌ Cannot manage bot permissions.',
                ephemeral: true
            });
        }

        try {
            // Add user permissions
            await channel.permissionOverwrites.edit(selectedUser.id, {
                ViewChannel: true,
                Connect: true
            });

            // Update instance
            await instance.allowUser(selectedUser.id);
            
            // Auto-save settings after change
            await instance.autoSaveSettings();

            await interaction.reply({
                content: `✅ **${selectedUser.displayName}** can now join this channel.`,
                ephemeral: true
            });

            // Update control panel
            await this.manager.updateControlPanel(instance, channel);

        } catch (error) {
            this.client.logger.error('Error allowing user:', error);
            await interaction.reply({
                content: '❌ Failed to allow user.',
                ephemeral: true
            });
        }
    }

    /**
     * Handle deny user selection from UserSelectMenu
     */
    async handleDenyUserSelection(interaction, instance, channel) {
        if (!instance.isModerator(interaction.user.id)) {
            return interaction.reply({
                content: '❌ Only the channel owner or moderators can deny users.',
                ephemeral: true
            });
        }

        const selectedUser = interaction.users.first();
        if (!selectedUser) {
            return interaction.reply({
                content: '❌ No user selected.',
                ephemeral: true
            });
        }

        if (selectedUser.bot) {
            return interaction.reply({
                content: '❌ Cannot manage bot permissions.',
                ephemeral: true
            });
        }

        if (selectedUser.id === instance.ownerId) {
            return interaction.reply({
                content: '❌ Cannot deny the channel owner.',
                ephemeral: true
            });
        }

        try {
            // Deny user permissions
            await channel.permissionOverwrites.edit(selectedUser.id, {
                ViewChannel: false,
                Connect: false
            });

            // Update instance
            await instance.blockUser(selectedUser.id);
            
            // Auto-save settings after change
            await instance.autoSaveSettings();

            // Kick user if they're in the channel
            const guild = interaction.guild;
            const member = guild.members.cache.get(selectedUser.id);
            if (member && channel.members.has(selectedUser.id)) {
                try {
                    await member.voice.disconnect('Denied access to temp VC');
                } catch (error) {
                    // Ignore disconnect errors
                }
            }

            await interaction.reply({
                content: `❌ **${selectedUser.displayName}** can no longer join this channel.`,
                ephemeral: true
            });

            // Update control panel
            await this.manager.updateControlPanel(instance, channel);

        } catch (error) {
            this.client.logger.error('Error denying user:', error);
            await interaction.reply({
                content: '❌ Failed to deny user.',
                ephemeral: true
            });
        }
    }

    /**
     * Handle unban confirmation
     */
    async handleUnbanConfirmation(interaction) {
        const parts = interaction.customId.split('_');
        const channelId = parts[3];
        const userId = parts[4];
        
        const instance = await TempVCInstance.findByChannelId(channelId);
        if (!instance) {
            return interaction.update({
                content: '❌ Channel not found.',
                components: []
            });
        }

        const channel = interaction.guild.channels.cache.get(channelId);
        if (!channel) {
            return interaction.update({
                content: '❌ Voice channel not found.',
                components: []
            });
        }

        try {
            // Check if user is actually banned
            const overwrite = channel.permissionOverwrites.cache.get(userId);
            if (!overwrite || !overwrite.deny.has(PermissionFlagsBits.Connect)) {
                return interaction.update({
                    content: '❌ This user is not banned from the channel.',
                    components: []
                });
            }

            // Remove the ban (permission overwrite)
            await overwrite.delete();

            // Remove from blocked users list and auto-save
            instance.permissions.blockedUsers = instance.permissions.blockedUsers.filter(id => id !== userId);
            await instance.save();
            await instance.autoSaveSettings();

            // Try to get user info for response
            let userName = 'Unknown User';
            try {
                const user = await this.client.users.fetch(userId);
                userName = user.tag;
            } catch (error) {
                userName = `User ID: ${userId}`;
            }

            await interaction.update({
                content: `✅ **${userName}** has been unbanned from the channel.`,
                components: []
            });

            // Update control panel
            await this.manager.updateControlPanel(instance, channel);

        } catch (error) {
            this.client.logger.error('Error unbanning user:', error);
            await interaction.update({
                content: '❌ Failed to unban user.',
                components: []
            });
        }
    }

    /**
     * Handle unban cancellation
     */
    async handleUnbanCancellation(interaction) {
        await interaction.update({
            content: '✅ Unban cancelled.',
            components: []
        });
    }
}

module.exports = TempVCControlHandlers;
