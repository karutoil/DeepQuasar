const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const TempVCInstance = require('../../schemas/TempVCInstance');
const TempVCUserSettings = require('../../schemas/TempVCUserSettings');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Voice',
    data: new SlashCommandBuilder()
        .setName('vc')
        .setDescription('Manage your temporary voice channel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('rename')
                .setDescription('Rename your voice channel')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('New channel name')
                        .setMinLength(1)
                        .setMaxLength(100)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('limit')
                .setDescription('Set user limit for your voice channel')
                .addIntegerOption(option =>
                    option
                        .setName('limit')
                        .setDescription('User limit (0 for no limit)')
                        .setMinValue(0)
                        .setMaxValue(99)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('bitrate')
                .setDescription('Change voice channel bitrate')
                .addIntegerOption(option =>
                    option
                        .setName('bitrate')
                        .setDescription('Bitrate in kbps')
                        .setMinValue(8)
                        .setMaxValue(384)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Lock or unlock your voice channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('hide')
                .setDescription('Hide or unhide your voice channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('transfer')
                .setDescription('Transfer ownership of your voice channel')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to transfer ownership to')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('allow')
                .setDescription('Allow a user to join your voice channel')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to allow')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('deny')
                .setDescription('Deny a user from joining your voice channel')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to deny')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick a user from your voice channel')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to kick')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('View information about your voice channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('settings')
                .setDescription('View or manage your saved settings')
                .addStringOption(option =>
                    option
                        .setName('action')
                        .setDescription('Action to perform')
                        .addChoices(
                            { name: 'View Saved Settings', value: 'view' },
                            { name: 'Save Current Settings', value: 'save' },
                            { name: 'Load Saved Settings', value: 'load' },
                            { name: 'Toggle Auto-Save', value: 'autosave' }
                        )
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete your voice channel')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Check if user is in a voice channel
        const member = interaction.member;
        if (!member.voice.channel) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Not in Voice', 'You need to be in a voice channel to use this command.')],
                ephemeral: true
            });
        }

        // Check if the voice channel is a temp VC
        const instance = await TempVCInstance.findByChannelId(member.voice.channel.id);
        if (!instance) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Not a Temp VC', 'You are not in a temporary voice channel.')],
                ephemeral: true
            });
        }

        const channel = member.voice.channel;

        try {
            switch (subcommand) {
                case 'rename':
                    await this.handleRename(interaction, instance, channel);
                    break;
                case 'limit':
                    await this.handleLimit(interaction, instance, channel);
                    break;
                case 'bitrate':
                    await this.handleBitrate(interaction, instance, channel);
                    break;
                case 'lock':
                    await this.handleLock(interaction, instance, channel);
                    break;
                case 'hide':
                    await this.handleHide(interaction, instance, channel);
                    break;
                case 'transfer':
                    await this.handleTransfer(interaction, instance, channel);
                    break;
                case 'allow':
                    await this.handleAllow(interaction, instance, channel);
                    break;
                case 'deny':
                    await this.handleDeny(interaction, instance, channel);
                    break;
                case 'kick':
                    await this.handleKick(interaction, instance, channel);
                    break;
                case 'info':
                    await this.handleInfo(interaction, instance, channel);
                    break;
                case 'settings':
                    await this.handleSettings(interaction, instance, channel);
                    break;
                case 'delete':
                    await this.handleDelete(interaction, instance, channel);
                    break;
            }
        } catch (error) {
            console.error('Error in vc command:', error);
            const embed = Utils.createErrorEmbed('Error', 'An error occurred while processing the command.');
            
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    },

    async handleRename(interaction, instance, channel) {
        if (!instance.isModerator(interaction.user.id)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Permission Denied', 'Only the channel owner or moderators can rename the channel.')],
                ephemeral: true
            });
        }

        const newName = interaction.options.getString('name');
        
        await channel.setName(newName);
        instance.currentName = newName;
        await instance.save();
        
        // Auto-save settings after change
        await instance.autoSaveSettings();

        await interaction.reply({
            embeds: [Utils.createSuccessEmbed('Channel Renamed', `Channel renamed to: **${newName}**`)]
        });

        // Update control panel if exists
        if (interaction.client.tempVCManager) {
            await interaction.client.tempVCManager.updateControlPanel(instance, channel);
        }
    },

    async handleLimit(interaction, instance, channel) {
        if (!instance.isModerator(interaction.user.id)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Permission Denied', 'Only the channel owner or moderators can change the user limit.')],
                ephemeral: true
            });
        }

        const limit = interaction.options.getInteger('limit');
        
        await channel.setUserLimit(limit);
        instance.settings.userLimit = limit;
        await instance.save();
        
        // Auto-save settings after change
        await instance.autoSaveSettings();

        const limitText = limit === 0 ? 'No limit' : `${limit} users`;
        
        await interaction.reply({
            embeds: [Utils.createSuccessEmbed('User Limit Updated', `User limit set to: **${limitText}**`)]
        });

        // Update control panel if exists
        if (interaction.client.tempVCManager) {
            await interaction.client.tempVCManager.updateControlPanel(instance, channel);
        }
    },

    async handleBitrate(interaction, instance, channel) {
        if (!instance.isModerator(interaction.user.id)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Permission Denied', 'Only the channel owner or moderators can change the bitrate.')],
                ephemeral: true
            });
        }

        const bitrate = interaction.options.getInteger('bitrate') * 1000; // Convert to bits
        const guild = interaction.guild;
        const maxBitrate = guild.premiumTier >= 2 ? 384000 : guild.premiumTier >= 1 ? 128000 : 96000;

        if (bitrate > maxBitrate) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Bitrate Too High', `Maximum bitrate for this server is ${maxBitrate / 1000} kbps.`)],
                ephemeral: true
            });
        }
        
        await channel.setBitrate(bitrate);
        instance.settings.bitrate = bitrate;
        await instance.save();
        
        // Auto-save settings after change
        await instance.autoSaveSettings();

        await interaction.reply({
            embeds: [Utils.createSuccessEmbed('Bitrate Updated', `Bitrate set to: **${bitrate / 1000} kbps**`)]
        });

        // Update control panel if exists
        if (interaction.client.tempVCManager) {
            await interaction.client.tempVCManager.updateControlPanel(instance, channel);
        }
    },

    async handleLock(interaction, instance, channel) {
        if (!instance.isModerator(interaction.user.id)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Permission Denied', 'Only the channel owner or moderators can lock/unlock the channel.')],
                ephemeral: true
            });
        }

        const isLocked = instance.settings.locked;
        
        if (isLocked) {
            // Unlock: Allow @everyone to connect
            await channel.permissionOverwrites.edit(channel.guild.id, {
                Connect: null
            });
            
            instance.settings.locked = false;
            await instance.save();
            
            // Auto-save settings after change
            await instance.autoSaveSettings();
            
            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Channel Unlocked', 'Anyone can now join this channel.')]
            });
        } else {
            // Lock: Deny @everyone from connecting
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
            
            // Auto-save settings after change
            await instance.autoSaveSettings();
            
            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Channel Locked', 'Only current members and those you allow can join.')]
            });
        }

        // Update control panel if exists
        if (interaction.client.tempVCManager) {
            await interaction.client.tempVCManager.updateControlPanel(instance, channel);
        }
    },

    async handleHide(interaction, instance, channel) {
        if (!instance.isModerator(interaction.user.id)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Permission Denied', 'Only the channel owner or moderators can hide/unhide the channel.')],
                ephemeral: true
            });
        }

        const isHidden = instance.settings.hidden;
        
        if (isHidden) {
            // Unhide: Allow @everyone to view
            await channel.permissionOverwrites.edit(channel.guild.id, {
                ViewChannel: null
            });
            
            instance.settings.hidden = false;
            await instance.save();
            
            // Auto-save settings after change
            await instance.autoSaveSettings();
            
            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Channel Unhidden', 'Channel is now visible to everyone.')]
            });
        } else {
            // Hide: Deny @everyone from viewing
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
            
            // Auto-save settings after change
            await instance.autoSaveSettings();
            
            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Channel Hidden', 'Channel is now hidden from others.')]
            });
        }

        // Update control panel if exists
        if (interaction.client.tempVCManager) {
            await interaction.client.tempVCManager.updateControlPanel(instance, channel);
        }
    },

    async handleTransfer(interaction, instance, channel) {
        if (!instance.isOwner(interaction.user.id)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Permission Denied', 'Only the channel owner can transfer ownership.')],
                ephemeral: true
            });
        }

        const newOwner = interaction.options.getMember('user');
        if (!newOwner) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('User Not Found', 'The specified user is not in this server.')],
                ephemeral: true
            });
        }

        if (newOwner.user.bot) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Invalid User', 'Cannot transfer ownership to a bot.')],
                ephemeral: true
            });
        }

        if (newOwner.id === instance.ownerId) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Invalid Transfer', 'You are already the owner of this channel.')],
                ephemeral: true
            });
        }

        if (!channel.members.has(newOwner.id)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('User Not Present', 'The user must be in the voice channel to receive ownership.')],
                ephemeral: true
            });
        }

        // Transfer ownership
        await instance.transferOwnership(newOwner.id);
        
        // Update channel permissions
        await channel.permissionOverwrites.edit(newOwner.id, {
            ViewChannel: true,
            Connect: true,
            Speak: true,
            ManageChannels: true,
            ManageRoles: true,
            MoveMembers: true,
            MuteMembers: true,
            DeafenMembers: true
        });

        await interaction.reply({
            embeds: [Utils.createSuccessEmbed('Ownership Transferred', `Ownership transferred to **${newOwner.displayName}**`)]
        });

        // Notify new owner
        try {
            const dmEmbed = Utils.createSuccessEmbed(
                'Channel Ownership Transferred',
                `You are now the owner of **${channel.name}**!\nYou can manage the channel using voice commands or the control panel.`
            );
            await newOwner.send({ embeds: [dmEmbed] });
        } catch (error) {
            // Ignore DM errors
        }

        // Update control panel if exists
        if (interaction.client.tempVCManager) {
            await interaction.client.tempVCManager.updateControlPanel(instance, channel);
        }
    },

    async handleAllow(interaction, instance, channel) {
        if (!instance.isModerator(interaction.user.id)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Permission Denied', 'Only the channel owner or moderators can allow users.')],
                ephemeral: true
            });
        }

        const user = interaction.options.getMember('user');
        if (!user) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('User Not Found', 'The specified user is not in this server.')],
                ephemeral: true
            });
        }

        if (user.user.bot) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Invalid User', 'Cannot manage bot permissions.')],
                ephemeral: true
            });
        }

        // Add user permissions
        await channel.permissionOverwrites.edit(user.id, {
            ViewChannel: true,
            Connect: true
        });

        // Update instance
        await instance.allowUser(user.id);
        
        // Auto-save settings after change
        await instance.autoSaveSettings();

        await interaction.reply({
            embeds: [Utils.createSuccessEmbed('User Allowed', `**${user.displayName}** can now join this channel.`)]
        });
    },

    async handleDeny(interaction, instance, channel) {
        if (!instance.isModerator(interaction.user.id)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Permission Denied', 'Only the channel owner or moderators can deny users.')],
                ephemeral: true
            });
        }

        const user = interaction.options.getMember('user');
        if (!user) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('User Not Found', 'The specified user is not in this server.')],
                ephemeral: true
            });
        }

        if (user.user.bot) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Invalid User', 'Cannot manage bot permissions.')],
                ephemeral: true
            });
        }

        if (user.id === instance.ownerId) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Invalid Action', 'Cannot deny the channel owner.')],
                ephemeral: true
            });
        }

        // Deny user permissions
        await channel.permissionOverwrites.edit(user.id, {
            ViewChannel: false,
            Connect: false
        });

        // Update instance
        await instance.blockUser(user.id);
        
        // Auto-save settings after change
        await instance.autoSaveSettings();

        // Kick user if they're in the channel
        if (channel.members.has(user.id)) {
            try {
                await user.voice.disconnect('Denied access to temp VC');
            } catch (error) {
                // Ignore disconnect errors
            }
        }

        await interaction.reply({
            embeds: [Utils.createSuccessEmbed('User Denied', `**${user.displayName}** can no longer join this channel.`)]
        });
    },

    async handleKick(interaction, instance, channel) {
        if (!instance.isModerator(interaction.user.id)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Permission Denied', 'Only the channel owner or moderators can kick users.')],
                ephemeral: true
            });
        }

        const user = interaction.options.getMember('user');
        if (!user) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('User Not Found', 'The specified user is not in this server.')],
                ephemeral: true
            });
        }

        if (user.user.bot) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Invalid User', 'Cannot kick bots.')],
                ephemeral: true
            });
        }

        if (user.id === instance.ownerId) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Invalid Action', 'Cannot kick the channel owner.')],
                ephemeral: true
            });
        }

        if (!channel.members.has(user.id)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('User Not Present', 'The user is not in this voice channel.')],
                ephemeral: true
            });
        }

        try {
            await user.voice.disconnect('Kicked from temp VC');
            
            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('User Kicked', `**${user.displayName}** has been kicked from the channel.`)]
            });
        } catch (error) {
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Kick Failed', 'Failed to kick the user from the channel.')],
                ephemeral: true
            });
        }
    },

    async handleInfo(interaction, instance, channel) {
        const owner = await interaction.guild.members.fetch(instance.ownerId);
        const memberCount = channel.members.size;
        const memberList = channel.members
            .filter(m => !m.user.bot)
            .map(m => `• ${m.displayName}`)
            .join('\n') || 'No members';

        const embed = new EmbedBuilder()
            .setTitle(`🎙️ ${channel.name}`)
            .setDescription(`**Owner:** ${owner.displayName}\n**Members:** ${memberCount}/${instance.settings.userLimit || '∞'}`)
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
                        `**Created:** <t:${Math.floor(instance.createdAt.getTime() / 1000)}:R>`,
                        `**Last Active:** <t:${Math.floor(instance.activity.lastActive.getTime() / 1000)}:R>`
                    ].join('\n'),
                    inline: false
                }
            )
            .setColor(instance.settings.locked ? 0xED4245 : 0x57F287)
            .setTimestamp();

        // Add permissions info if user is owner/moderator
        if (instance.isModerator(interaction.user.id)) {
            const allowedUsers = instance.permissions.allowedUsers;
            const blockedUsers = instance.permissions.blockedUsers;
            const moderators = instance.permissions.moderators;
            
            if (allowedUsers.length + blockedUsers.length + moderators.length > 0) {
                let permissionsText = '';
                
                if (moderators.length > 0) {
                    permissionsText += `**Moderators:** ${moderators.length}\n`;
                }
                if (allowedUsers.length > 0) {
                    permissionsText += `**Allowed Users:** ${allowedUsers.length}\n`;
                }
                if (blockedUsers.length > 0) {
                    permissionsText += `**Blocked Users:** ${blockedUsers.length}`;
                }
                
                embed.addFields({
                    name: '🔒 Permissions',
                    value: permissionsText,
                    inline: true
                });
            }
        }

        await interaction.reply({ embeds: [embed] });
    },

    async handleDelete(interaction, instance, channel) {
        if (!instance.isOwner(interaction.user.id) && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Permission Denied', 'Only the channel owner or users with Manage Channels permission can delete the channel.')],
                ephemeral: true
            });
        }

        await interaction.reply({
            embeds: [Utils.createSuccessEmbed('Channel Deleting', 'Your temporary voice channel will be deleted in a few seconds...')]
        });

        // Delete after a short delay
        setTimeout(async () => {
            if (interaction.client.tempVCManager) {
                await interaction.client.tempVCManager.deleteTempChannel(instance);
            }
        }, 3000);
    },

    async handleSettings(interaction, instance, channel) {
        if (!instance.isModerator(interaction.user.id)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Permission Denied', 'Only the channel owner or moderators can manage settings.')],
                ephemeral: true
            });
        }

        const action = interaction.options.getString('action');

        try {
            switch (action) {
                case 'view':
                    await this.handleViewSettings(interaction, instance, channel);
                    break;
                case 'save':
                    await instance.saveCurrentSettings();
                    await interaction.reply({
                        embeds: [Utils.createSuccessEmbed('Settings Saved', 'Current channel settings have been saved as your defaults for future channels.')],
                        ephemeral: true
                    });
                    break;
                case 'load':
                    const userSettings = await TempVCUserSettings.findByUser(instance.guildId, instance.ownerId);
                    
                    if (!userSettings || !userSettings.defaultSettings) {
                        return interaction.reply({
                            embeds: [Utils.createWarningEmbed('No Saved Settings', 'You haven\'t saved any settings yet. Use `/vc settings save` first.')],
                            ephemeral: true
                        });
                    }
                    
                    await interaction.deferReply({ ephemeral: true });
                    
                    // Apply saved custom name if available
                    if (userSettings.defaultSettings.customName) {
                        await channel.setName(userSettings.defaultSettings.customName);
                        instance.currentName = userSettings.defaultSettings.customName;
                    }
                    
                    // Apply saved settings to current channel
                    await channel.setUserLimit(userSettings.defaultSettings.userLimit);
                    await channel.setBitrate(userSettings.defaultSettings.bitrate);
                    await channel.setRTCRegion(userSettings.defaultSettings.region);
                    
                    // Update instance settings
                    instance.settings.userLimit = userSettings.defaultSettings.userLimit;
                    instance.settings.bitrate = userSettings.defaultSettings.bitrate;
                    instance.settings.locked = userSettings.defaultSettings.locked;
                    instance.settings.hidden = userSettings.defaultSettings.hidden;
                    instance.settings.region = userSettings.defaultSettings.region;
                    
                    // Apply lock/hide settings
                    const guild = channel.guild;
                    await channel.permissionOverwrites.edit(guild.id, {
                        ViewChannel: userSettings.defaultSettings.hidden ? false : null,
                        Connect: userSettings.defaultSettings.locked ? false : null
                    });
                    
                    await instance.save();
                    
                    await interaction.editReply({
                        embeds: [Utils.createSuccessEmbed('Settings Loaded', 'Your saved settings have been applied to this channel.')]
                    });
                    
                    // Update control panel
                    if (interaction.client.tempVCManager) {
                        await interaction.client.tempVCManager.updateControlPanel(instance, channel);
                    }
                    break;
                case 'autosave':
                    // Update persistent auto-save setting
                    let currentUserSettings = await TempVCUserSettings.findByUser(instance.guildId, instance.ownerId);
                    
                    if (!currentUserSettings) {
                        // Create new settings record with auto-save toggled
                        currentUserSettings = await TempVCUserSettings.createOrUpdate(instance.guildId, instance.ownerId, {
                            defaultSettings: {
                                customName: instance.currentName === instance.originalName ? null : instance.currentName,
                                userLimit: instance.settings.userLimit,
                                bitrate: instance.settings.bitrate,
                                locked: instance.settings.locked,
                                hidden: instance.settings.hidden,
                                region: instance.settings.region
                            },
                            autoSave: !instance.savedSettings.autoSave
                        });
                    } else {
                        // Toggle existing auto-save setting
                        currentUserSettings.autoSave = !currentUserSettings.autoSave;
                        await currentUserSettings.save();
                    }
                    
                    // Update local instance setting
                    instance.savedSettings.autoSave = currentUserSettings.autoSave;
                    await instance.save();
                    
                    const statusText = currentUserSettings.autoSave ? 'enabled' : 'disabled';
                    await interaction.reply({
                        embeds: [Utils.createSuccessEmbed('Auto-Save Updated', `Auto-save has been **${statusText}**. ${currentUserSettings.autoSave ? 'Settings will be automatically saved when you make changes.' : 'Settings will only be saved when you manually use the save command.'}`)],
                        ephemeral: true
                    });
                    break;
            }
        } catch (error) {
            console.error('Error in settings command:', error);
            if (interaction.deferred) {
                await interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Error', 'An error occurred while managing settings.')]
                });
            } else {
                await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Error', 'An error occurred while managing settings.')],
                    ephemeral: true
                });
            }
        }
    },

    async handleViewSettings(interaction, instance, channel) {
        const embed = new EmbedBuilder()
            .setTitle('📊 Channel Settings')
            .setColor(0x5865F2)
            .setTimestamp();

        // Current settings
        const currentSettings = [
            `**User Limit:** ${instance.settings.userLimit === 0 ? 'No limit' : `${instance.settings.userLimit} users`}`,
            `**Bitrate:** ${instance.settings.bitrate / 1000} kbps`,
            `**Region:** ${instance.settings.region || 'Automatic'}`,
            `**Status:** ${instance.settings.locked ? '🔒 Locked' : '🔓 Unlocked'}`,
            `**Visibility:** ${instance.settings.hidden ? '👁️ Hidden' : '👀 Visible'}`,
            `**Banned Users:** ${instance.permissions.blockedUsers.length} user(s)`
        ].join('\n');

        embed.addFields({
            name: '⚙️ Current Settings',
            value: currentSettings,
            inline: false
        });

        // Get persistent saved settings
        const userSettings = await TempVCUserSettings.findByUser(instance.guildId, instance.ownerId);
        
        if (userSettings && userSettings.defaultSettings) {
            const savedSettings = [
                `**Custom Name:** ${userSettings.defaultSettings.customName || 'Auto-generated'}`,
                `**User Limit:** ${userSettings.defaultSettings.userLimit === 0 ? 'No limit' : `${userSettings.defaultSettings.userLimit} users`}`,
                `**Bitrate:** ${userSettings.defaultSettings.bitrate / 1000} kbps`,
                `**Region:** ${userSettings.defaultSettings.region || 'Automatic'}`,
                `**Locked:** ${userSettings.defaultSettings.locked ? 'Yes' : 'No'}`,
                `**Hidden:** ${userSettings.defaultSettings.hidden ? 'Yes' : 'No'}`,
                `**Last Saved:** <t:${Math.floor(userSettings.lastSaved.getTime() / 1000)}:R>`
            ].join('\n');

            embed.addFields({
                name: '💾 Saved Settings',
                value: savedSettings,
                inline: false
            });
            
            // Auto-save status from persistent storage
            const autoSaveStatus = userSettings.autoSave ? '✅ Enabled' : '❌ Disabled';
            embed.addFields({
                name: '🔄 Auto-Save',
                value: autoSaveStatus,
                inline: true
            });
        } else {
            embed.addFields({
                name: '💾 Saved Settings',
                value: 'No settings saved yet. Use `/vc settings save` to save your current settings.',
                inline: false
            });
            
            // Auto-save status from local instance if no persistent settings exist
            const autoSaveStatus = instance.savedSettings.autoSave ? '✅ Enabled' : '❌ Disabled';
            embed.addFields({
                name: '🔄 Auto-Save',
                value: autoSaveStatus,
                inline: true
            });
        }

        embed.setFooter({ 
            text: 'Use /vc settings with different actions to manage your settings' 
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
