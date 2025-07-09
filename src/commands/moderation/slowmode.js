const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const ModerationUtils = require('../../utils/ModerationUtils');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set slowmode for a channel')
        .addIntegerOption(option =>
            option
                .setName('duration')
                .setDescription('Slowmode duration in seconds (0 to disable, max 21600)')
                .setMinValue(0)
                .setMaxValue(21600)
                .setRequired(true)
        )
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to set slowmode (current channel if not specified)')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildNews)
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for setting slowmode')
                .setRequired(false)
                .setMaxLength(1000)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            // Check permissions
            const permissionCheck = ModerationUtils.checkDiscordPermissions(interaction, PermissionFlagsBits.ManageChannels);
            if (!permissionCheck.hasPermission) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed(
                        'Permission Denied',
                        permissionCheck.reason
                    )],
                    ephemeral: true
                });
            }

            const channel = interaction.options.getChannel('channel') || interaction.channel;
            const duration = interaction.options.getInteger('duration');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            await interaction.deferReply();

            // Check if bot has permission to manage channel
            if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Missing Permissions',
                        'I do not have permission to manage this channel.'
                    )]
                });
            }

            // Store previous slowmode value
            const previousSlowmode = channel.rateLimitPerUser;

            // Set slowmode
            await channel.setRateLimitPerUser(duration, reason);

            // Log the action
            const logEntry = await ModerationUtils.logAction({
                guildId: interaction.guild.id,
                userId: interaction.user.id, // No specific target user for channel actions
                action: 'slowmode',
                moderatorId: interaction.user.id,
                reason: reason,
                targetChannel: channel.id,
                previousValue: previousSlowmode,
                duration: duration * 1000 // Convert to milliseconds for consistency
            });

            // Send moderation log
            await ModerationUtils.sendModLog(interaction, logEntry, [
                {
                    name: 'Channel',
                    value: `${channel}`,
                    inline: true
                },
                {
                    name: 'Duration',
                    value: duration === 0 ? 'Disabled' : `${duration} seconds`,
                    inline: true
                },
                {
                    name: 'Previous',
                    value: previousSlowmode === 0 ? 'Disabled' : `${previousSlowmode} seconds`,
                    inline: true
                }
            ]);

            const embed = Utils.createSuccessEmbed(
                'Slowmode Updated',
                duration === 0 ? 
                    `Disabled slowmode in ${channel}.` :
                    `Set slowmode to ${duration} seconds in ${channel}.`
            );

            embed.addFields([
                {
                    name: 'Case ID',
                    value: logEntry.caseId,
                    inline: true
                },
                {
                    name: 'Duration',
                    value: duration === 0 ? 'Disabled' : `${duration} seconds`,
                    inline: true
                },
                {
                    name: 'Previous',
                    value: previousSlowmode === 0 ? 'Disabled' : `${previousSlowmode} seconds`,
                    inline: true
                },
                {
                    name: 'Reason',
                    value: reason,
                    inline: false
                }
            ]);

            await interaction.editReply({ embeds: [embed] });

            // Send notification in the channel (if not the same as interaction channel)
            if (channel.id !== interaction.channel.id) {
                try {
                    const notificationEmbed = duration === 0 ?
                        Utils.createSuccessEmbed(
                            '🚀 Slowmode Disabled',
                            `Slowmode has been disabled by ${interaction.user.tag}.\n**Reason:** ${reason}`
                        ) :
                        Utils.createWarningEmbed(
                            '🐌 Slowmode Enabled',
                            `Slowmode set to ${duration} seconds by ${interaction.user.tag}.\n**Reason:** ${reason}`
                        );

                    await channel.send({ embeds: [notificationEmbed] });
                } catch (error) {
                    console.error('Could not send slowmode notification:', error);
                }
            }

        } catch (error) {
            console.error('Error in slowmode command:', error);
            
            let errorMessage = 'An error occurred while setting slowmode.';
            if (error.code === 50013) {
                errorMessage = 'I do not have permission to manage this channel.';
            }

            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Slowmode Failed', errorMessage)]
            });
        }
    }
};
