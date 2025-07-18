const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Settings',
    permissions: [PermissionFlagsBits.ManageGuild],
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Configure bot settings for this server')
        .addSubcommandGroup(group =>
            group
                .setName('music')
                .setDescription('Music settings')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('volume')
                        .setDescription('Set default volume and limits')
                        .addIntegerOption(option =>
                            option
                                .setName('default')
                                .setDescription('Default volume (1-150)')
                                .setRequired(false)
                                .setMinValue(1)
                                .setMaxValue(150)
                        )
                        .addIntegerOption(option =>
                            option
                                .setName('max')
                                .setDescription('Maximum volume (1-200)')
                                .setRequired(false)
                                .setMinValue(1)
                                .setMaxValue(200)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('queue')
                        .setDescription('Configure queue settings')
                        .addIntegerOption(option =>
                            option
                                .setName('max-size')
                                .setDescription('Maximum queue size (1-500)')
                                .setRequired(false)
                                .setMinValue(1)
                                .setMaxValue(500)
                        )
                        .addIntegerOption(option =>
                            option
                                .setName('max-playlist')
                                .setDescription('Maximum playlist size (1-200)')
                                .setRequired(false)
                                .setMinValue(1)
                                .setMaxValue(200)
                        )
                        .addBooleanOption(option =>
                            option
                                .setName('auto-shuffle')
                                .setDescription('Automatically shuffle new playlists')
                                .setRequired(false)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('source')
                        .setDescription('Set default music source')
                        .addStringOption(option =>
                            option
                                .setName('platform')
                                .setDescription('Default music platform')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'YouTube', value: 'youtube' },
                                    { name: 'SoundCloud', value: 'soundcloud' },
                                    { name: 'Spotify', value: 'spotify' }
                                )
                        )
                )
        )
        .addSubcommandGroup(group =>
            group
                .setName('permissions')
                .setDescription('Permission settings')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('dj-role')
                        .setDescription('Set the DJ role for music commands')
                        .addRoleOption(option =>
                            option
                                .setName('role')
                                .setDescription('Role that can use music commands')
                                .setRequired(false)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('channels')
                        .setDescription('Set allowed channels for music commands')
                        .addChannelOption(option =>
                            option
                                .setName('add')
                                .setDescription('Add a channel to allowed list')
                                .setRequired(false)
                        )
                        .addChannelOption(option =>
                            option
                                .setName('remove')
                                .setDescription('Remove a channel from allowed list')
                                .setRequired(false)
                        )
                        .addBooleanOption(option =>
                            option
                                .setName('clear')
                                .setDescription('Clear all channel restrictions')
                                .setRequired(false)
                        )
                )
        )
        .addSubcommandGroup(group =>
            group
                .setName('commands')
                .setDescription('Command settings')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('cooldown')
                        .setDescription('Set command cooldown')
                        .addIntegerOption(option =>
                            option
                                .setName('seconds')
                                .setDescription('Cooldown in seconds (1-30)')
                                .setRequired(true)
                                .setMinValue(1)
                                .setMaxValue(30)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('disable')
                        .setDescription('Disable a command')
                        .addStringOption(option =>
                            option
                                .setName('command')
                                .setDescription('Command to disable')
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('enable')
                        .setDescription('Enable a command')
                        .addStringOption(option =>
                            option
                                .setName('command')
                                .setDescription('Command to enable')
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current server settings')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset all settings to default')
                .addBooleanOption(option =>
                    option
                        .setName('confirm')
                        .setDescription('Confirm reset (required)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('music-toggle')
                .setDescription('Enable or disable the music module')
                .addStringOption(option =>
                    option
                        .setName('state')
                        .setDescription('Enable or disable music module')
                        .setRequired(true)
                        .addChoices(
                            { name: 'On', value: 'on' },
                            { name: 'Off', value: 'off' }
                        )
                )
        )
        .addSubcommandGroup(group =>
            group
                .setName('message-link-embed')
                .setDescription('Configure message link embed feature')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('enable')
                        .setDescription('Enable message link embed feature')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('disable')
                        .setDescription('Disable message link embed feature')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('view')
                        .setDescription('View message link embed settings')
                )
        ),

    async execute(interaction, client) {
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        if (subcommandGroup === 'music') {
            await handleMusicSettings(interaction, client, subcommand);
        } else if (subcommandGroup === 'permissions') {
            await handlePermissionSettings(interaction, client, subcommand);
        } else if (subcommandGroup === 'commands') {
            await handleCommandSettings(interaction, client, subcommand);
        } else if (subcommandGroup === 'message-link-embed') {
            await handleMessageLinkEmbedSettings(interaction, client, subcommand);
        } else if (subcommand === 'view') {
            await handleViewSettings(interaction, client);
        } else if (subcommand === 'reset') {
            await handleResetSettings(interaction, client);
        } else if (subcommand === 'music-toggle') {
            await handleMusicToggle(interaction, client);
        }
    },

    async autocomplete(interaction, client) {
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();
        const focusedValue = interaction.options.getFocused();

        if (subcommandGroup === 'commands' && ['disable', 'enable'].includes(subcommand)) {
            const commands = client.commands.map(cmd => cmd.data.name);
            const filtered = commands.filter(cmd => 
                cmd.toLowerCase().includes(focusedValue.toLowerCase())
            );

            await interaction.respond(
                filtered.slice(0, 25).map(cmd => ({ name: cmd, value: cmd }))
            );
        }
    }
};

async function handleMusicSettings(interaction, client, subcommand) {
    const guildData = interaction.guildData;

    switch (subcommand) {
        case 'volume':
            const defaultVolume = interaction.options.getInteger('default');
            const maxVolume = interaction.options.getInteger('max');

            if (!defaultVolume && !maxVolume) {
                const embed = Utils.createInfoEmbed(
                    'Volume Settings',
                    `**Default Volume:** ${guildData.musicSettings.defaultVolume}%\n**Maximum Volume:** ${guildData.musicSettings.maxVolume}%`
                );
                return interaction.reply({ embeds: [embed] });
            }

            if (defaultVolume) {
                guildData.musicSettings.defaultVolume = defaultVolume;
            }
            if (maxVolume) {
                guildData.musicSettings.maxVolume = maxVolume;
            }

            await guildData.save();

            const embed = Utils.createSuccessEmbed(
                'Volume Settings Updated',
                `${defaultVolume ? `**Default Volume:** ${defaultVolume}%\n` : ''}${maxVolume ? `**Maximum Volume:** ${maxVolume}%` : ''}`
            );
            await interaction.reply({ embeds: [embed] });
            break;

        case 'queue':
            const maxQueueSize = interaction.options.getInteger('max-size');
            const maxPlaylistSize = interaction.options.getInteger('max-playlist');
            const autoShuffle = interaction.options.getBoolean('auto-shuffle');

            if (maxQueueSize === null && maxPlaylistSize === null && autoShuffle === null) {
                const embed = Utils.createInfoEmbed(
                    'Queue Settings',
                    `**Max Queue Size:** ${guildData.musicSettings.maxQueueSize}\n**Max Playlist Size:** ${guildData.musicSettings.maxPlaylistSize}\n**Auto Shuffle:** ${guildData.queueSettings.autoShuffle ? 'Enabled' : 'Disabled'}`
                );
                return interaction.reply({ embeds: [embed] });
            }

            if (maxQueueSize !== null) {
                guildData.musicSettings.maxQueueSize = maxQueueSize;
            }
            if (maxPlaylistSize !== null) {
                guildData.musicSettings.maxPlaylistSize = maxPlaylistSize;
            }
            if (autoShuffle !== null) {
                guildData.queueSettings.autoShuffle = autoShuffle;
            }

            await guildData.save();

            const queueEmbed = Utils.createSuccessEmbed(
                'Queue Settings Updated',
                `${maxQueueSize !== null ? `**Max Queue Size:** ${maxQueueSize}\n` : ''}${maxPlaylistSize !== null ? `**Max Playlist Size:** ${maxPlaylistSize}\n` : ''}${autoShuffle !== null ? `**Auto Shuffle:** ${autoShuffle ? 'Enabled' : 'Disabled'}` : ''}`
            );
            await interaction.reply({ embeds: [queueEmbed] });
            break;

        case 'source':
            const platform = interaction.options.getString('platform');
            guildData.musicSettings.searchEngine = platform;
            await guildData.save();

            const sourceEmbed = Utils.createSuccessEmbed(
                'Default Source Updated',
                `Default music source set to **${Utils.capitalize(platform)}**`
            );
            await interaction.reply({ embeds: [sourceEmbed] });
            break;
    }
}

async function handlePermissionSettings(interaction, client, subcommand) {
    const guildData = interaction.guildData;

    switch (subcommand) {
        case 'dj-role':
            const role = interaction.options.getRole('role');

            if (!role) {
                // Show current DJ role
                const currentRole = guildData.permissions.djRole;
                const embed = Utils.createInfoEmbed(
                    'DJ Role',
                    currentRole ? `Current DJ role: <@&${currentRole}>` : 'No DJ role set. Anyone can use music commands.'
                );
                return interaction.reply({ embeds: [embed] });
            }

            guildData.permissions.djRole = role.id;
            await guildData.save();

            const embed = Utils.createSuccessEmbed(
                'DJ Role Updated',
                `DJ role set to ${role}. Users with this role can use music commands.`
            );
            await interaction.reply({ embeds: [embed] });
            break;

        case 'channels':
            const addChannel = interaction.options.getChannel('add');
            const removeChannel = interaction.options.getChannel('remove');
            const clear = interaction.options.getBoolean('clear');

            if (clear) {
                guildData.commandSettings.commandChannels = [];
                await guildData.save();

                const clearEmbed = Utils.createSuccessEmbed(
                    'Channel Restrictions Cleared',
                    'Music commands can now be used in any channel.'
                );
                return interaction.reply({ embeds: [clearEmbed] });
            }

            if (!addChannel && !removeChannel) {
                // Show current channels
                const channels = guildData.commandSettings.commandChannels;
                const embed = Utils.createInfoEmbed(
                    'Allowed Channels',
                    channels.length > 0 ? 
                        `Music commands are restricted to:\n${channels.map(id => `<#${id}>`).join('\n')}` : 
                        'No channel restrictions. Music commands can be used anywhere.'
                );
                return interaction.reply({ embeds: [embed] });
            }

            if (addChannel) {
                if (!guildData.commandSettings.commandChannels.includes(addChannel.id)) {
                    guildData.commandSettings.commandChannels.push(addChannel.id);
                    await guildData.save();

                    const addEmbed = Utils.createSuccessEmbed(
                        'Channel Added',
                        `Added ${addChannel} to allowed channels for music commands.`
                    );
                    await interaction.reply({ embeds: [addEmbed] });
                } else {
                    const existsEmbed = Utils.createWarningEmbed(
                        'Channel Already Added',
                        `${addChannel} is already in the allowed channels list.`
                    );
                    await interaction.reply({ embeds: [existsEmbed] });
                }
            }

            if (removeChannel) {
                const index = guildData.commandSettings.commandChannels.indexOf(removeChannel.id);
                if (index > -1) {
                    guildData.commandSettings.commandChannels.splice(index, 1);
                    await guildData.save();

                    const removeEmbed = Utils.createSuccessEmbed(
                        'Channel Removed',
                        `Removed ${removeChannel} from allowed channels for music commands.`
                    );
                    await interaction.reply({ embeds: [removeEmbed] });
                } else {
                    const notFoundEmbed = Utils.createWarningEmbed(
                        'Channel Not Found',
                        `${removeChannel} is not in the allowed channels list.`
                    );
                    await interaction.reply({ embeds: [notFoundEmbed] });
                }
            }
            break;
    }
}

async function handleCommandSettings(interaction, client, subcommand) {
    const guildData = interaction.guildData;

    switch (subcommand) {
        case 'cooldown':
            const seconds = interaction.options.getInteger('seconds');
            guildData.commandSettings.cooldown = seconds * 1000;
            await guildData.save();

            const embed = Utils.createSuccessEmbed(
                'Cooldown Updated',
                `Command cooldown set to ${seconds} second${seconds !== 1 ? 's' : ''}.`
            );
            await interaction.reply({ embeds: [embed] });
            break;

        case 'disable':
            const disableCommand = interaction.options.getString('command');
            
            if (disableCommand === 'settings') {
                const embed = Utils.createErrorEmbed(
                    'Cannot Disable Command',
                    'The settings command cannot be disabled.'
                );
                return interaction.reply({ embeds: [embed] });
            }

            if (!guildData.commandSettings.disabledCommands.includes(disableCommand)) {
                guildData.commandSettings.disabledCommands.push(disableCommand);
                await guildData.save();

                const disableEmbed = Utils.createSuccessEmbed(
                    'Command Disabled',
                    `The \`${disableCommand}\` command has been disabled in this server.`
                );
                await interaction.reply({ embeds: [disableEmbed] });
            } else {
                const alreadyDisabled = Utils.createWarningEmbed(
                    'Already Disabled',
                    `The \`${disableCommand}\` command is already disabled.`
                );
                await interaction.reply({ embeds: [alreadyDisabled] });
            }
            break;

        case 'enable':
            const enableCommand = interaction.options.getString('command');
            const index = guildData.commandSettings.disabledCommands.indexOf(enableCommand);

            if (index > -1) {
                guildData.commandSettings.disabledCommands.splice(index, 1);
                await guildData.save();

                const enableEmbed = Utils.createSuccessEmbed(
                    'Command Enabled',
                    `The \`${enableCommand}\` command has been enabled in this server.`
                );
                await interaction.reply({ embeds: [enableEmbed] });
            } else {
                const notDisabled = Utils.createWarningEmbed(
                    'Not Disabled',
                    `The \`${enableCommand}\` command is not disabled.`
                );
                await interaction.reply({ embeds: [notDisabled] });
            }
            break;
    }
}

async function handleViewSettings(interaction, client) {
    const guildData = interaction.guildData;

    const embed = new EmbedBuilder()
        .setTitle(`⚙️ Server Settings - ${interaction.guild.name}`)
        .setColor(client.config.colors.info)
        .setThumbnail(interaction.guild.iconURL())
        .setTimestamp();

    // Music Settings
    embed.addFields({
        name: '🎵 Music Settings',
        value: `**Default Volume:** ${guildData.musicSettings.defaultVolume}%\n**Max Volume:** ${guildData.musicSettings.maxVolume}%\n**Max Queue Size:** ${guildData.musicSettings.maxQueueSize}\n**Max Playlist Size:** ${guildData.musicSettings.maxPlaylistSize}\n**Default Source:** ${Utils.capitalize(guildData.musicSettings.searchEngine)}\n**Auto Shuffle:** ${guildData.queueSettings.autoShuffle ? 'Enabled' : 'Disabled'}`,
        inline: true
    });

    // Permission Settings
    const djRole = guildData.permissions.djRole ? `<@&${guildData.permissions.djRole}>` : 'None';
    const allowedChannels = guildData.commandSettings.commandChannels.length > 0 ? 
        guildData.commandSettings.commandChannels.map(id => `<#${id}>`).join(', ') : 'All channels';

    embed.addFields({
        name: '🔒 Permissions',
        value: `**DJ Role:** ${djRole}\n**Allowed Channels:** ${allowedChannels}`,
        inline: true
    });

    // Command Settings
    const cooldown = guildData.commandSettings.cooldown / 1000;
    const disabledCommands = guildData.commandSettings.disabledCommands.length > 0 ? 
        guildData.commandSettings.disabledCommands.join(', ') : 'None';

    embed.addFields({
        name: '⚡ Commands',
        value: `**Cooldown:** ${cooldown}s\n**Disabled Commands:** ${disabledCommands}`,
        inline: false
    });

    // Message Link Embed Feature
    const mleStatus = guildData.messageLinkEmbed?.enabled
        ? `✅ Enabled\nTarget Channel: ${guildData.messageLinkEmbed.targetChannelId ? `<#${guildData.messageLinkEmbed.targetChannelId}>` : 'Not set'}`
        : '❌ Disabled';
    embed.addFields({
        name: '🔗 Message Link Embed',
        value: mleStatus,
        inline: false
    });

    // Premium Status
    const premiumStatus = guildData.isPremium() ? 
        `✅ Active${guildData.premium.expiresAt ? ` (expires ${guildData.premium.expiresAt.toDateString()})` : ''}` : 
        '❌ Not Active';

    embed.addFields({
        name: '⭐ Premium Status',
        value: premiumStatus,
        inline: false
    });

    embed.setFooter({
        text: `Use /settings to modify these settings • Last updated: ${guildData.updatedAt.toDateString()}`,
        iconURL: client.user.displayAvatarURL()
    });

    await interaction.reply({ embeds: [embed] });
}

/**
 * Handle music module toggle
 */
async function handleMusicToggle(interaction, client) {
    const state = interaction.options.getString('state');
    const guildData = interaction.guildData;

    if (state === 'on') {
        if (guildData.musicEnabled === true) {
            return interaction.reply({
                embeds: [Utils.createInfoEmbed(
                    'Music Module',
                    'The music module is already enabled.'
                )],
                ephemeral: true
            });
        }
        guildData.musicEnabled = true;
        await guildData.save();
        return interaction.reply({
            embeds: [Utils.createSuccessEmbed(
                'Music Module Enabled',
                'The music module is now **enabled**. All music commands are available.'
            )],
            ephemeral: true
        });
    } else if (state === 'off') {
        if (guildData.musicEnabled === false) {
            return interaction.reply({
                embeds: [Utils.createInfoEmbed(
                    'Music Module',
                    'The music module is already disabled.'
                )],
                ephemeral: true
            });
        }
        guildData.musicEnabled = false;
        await guildData.save();
        return interaction.reply({
            embeds: [Utils.createSuccessEmbed(
                'Music Module Disabled',
                'The music module is now **disabled**. All music commands are unavailable until re-enabled.'
            )],
            ephemeral: true
        });
    } else {
        return interaction.reply({
            embeds: [Utils.createErrorEmbed(
                'Invalid State',
                'Please specify either "on" or "off".'
            )],
            ephemeral: true
        });
    }
}

// Message Link Embed settings handler
async function handleMessageLinkEmbedSettings(interaction, client, subcommand) {
    const guildData = interaction.guildData;

    if (subcommand === 'enable') {
        guildData.messageLinkEmbed.enabled = true;
        guildData.messageLinkEmbed.targetChannelId = null;
        await guildData.save();

        await interaction.reply({
            embeds: [Utils.createSuccessEmbed(
                'Message Link Embed Enabled',
                `Message link embed feature is now **enabled**.\nAny posted Discord message link will be automatically replaced with an embed in the same channel.`
            )]
        });
    } else if (subcommand === 'disable') {
        guildData.messageLinkEmbed.enabled = false;
        guildData.messageLinkEmbed.targetChannelId = null;
        await guildData.save();

        await interaction.reply({
            embeds: [Utils.createSuccessEmbed(
                'Message Link Embed Disabled',
                'Message link embed feature is now **disabled**.'
            )]
        });
    } else if (subcommand === 'view') {
        const enabled = guildData.messageLinkEmbed?.enabled;
        const embed = new EmbedBuilder()
            .setTitle('🔗 Message Link Embed Settings')
            .setColor(enabled ? 0x57F287 : 0xED4245)
            .addFields([
                { name: 'Status', value: enabled ? 'Enabled' : 'Disabled', inline: true },
                { name: 'Behavior', value: enabled ? 'Message links are replaced with embeds in the same channel.' : 'Feature is disabled.', inline: true }
            ])
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}

async function handleResetSettings(interaction, client) {
    const confirm = interaction.options.getBoolean('confirm');

    if (!confirm) {
        const embed = Utils.createWarningEmbed(
            'Reset Cancelled',
            'You must confirm the reset by setting the confirm option to true.'
        );
        return interaction.reply({ embeds: [embed] });
    }

    const guildData = interaction.guildData;

    // Reset to defaults
    guildData.musicSettings = {
        defaultVolume: 50,
        maxVolume: 150,
        maxQueueSize: 100,
        maxPlaylistSize: 50,
        autoLeave: { enabled: true, delay: 300000 },
        searchEngine: 'youtube',
        allowExplicit: true,
        enableFilters: true
    };

    guildData.permissions = {
        djRole: null,
        moderatorRoles: [],
        adminRoles: [],
        allowedChannels: [],
        restrictedChannels: [],
        voiceChannelRestrictions: []
    };

    guildData.commandSettings = {
        cooldown: 3000,
        disabledCommands: [],
        commandChannels: [],
        deleteMessages: false,
        deleteDelay: 5000
    };

    guildData.queueSettings = {
        autoShuffle: false,
        repeatMode: 'off',
        skipOnError: true,
        historySize: 50
    };

    await guildData.save();

    const embed = Utils.createSuccessEmbed(
        'Settings Reset',
        'All server settings have been reset to their default values.'
    );

    await interaction.reply({ embeds: [embed] });

    client.logger.info(`Settings reset for guild ${interaction.guild.name} by ${interaction.user.tag}`);
}
