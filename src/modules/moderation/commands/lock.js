const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const ModerationUtils = require('../../../utils/ModerationUtils');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock a channel to prevent @everyone from sending messages')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to lock (current channel if not specified)')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildNews)
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for locking the channel')
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
            const reason = interaction.options.getString('reason') || 'No reason provided';

            await interaction.deferReply({ ephemeral: true });

            // Check if bot has permission to manage channel
            if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Missing Permissions',
                        'I do not have permission to manage this channel.'
                    )]
                });
            }

            // Get current @everyone permissions
            const everyoneRole = interaction.guild.roles.everyone;
            const currentPerms = channel.permissionOverwrites.cache.get(everyoneRole.id);
            
            // Check if channel is already locked
            if (currentPerms && currentPerms.deny.has(PermissionFlagsBits.SendMessages)) {
                return interaction.editReply({
                    embeds: [Utils.createWarningEmbed(
                        'Channel Already Locked',
                        `${channel} is already locked.`
                    )]
                });
            }

            // Store previous permissions for potential unlock
            const previousPerms = currentPerms ? {
                allow: currentPerms.allow.toArray(),
                deny: currentPerms.deny.toArray()
            } : null;

            // Lock the channel
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false,
                SendMessagesInThreads: false,
                CreatePublicThreads: false,
                CreatePrivateThreads: false,
                AddReactions: false
            }, { reason });

            // Log the action
            const logEntry = await ModerationUtils.logAction({
                guildId: interaction.guild.id,
                userId: interaction.user.id, // No specific target user for channel actions
                action: 'lock',
                moderatorId: interaction.user.id,
                reason: reason,
                targetChannel: channel.id,
                previousValue: previousPerms
            });

            // Send moderation log
            await ModerationUtils.sendModLog(interaction, logEntry, [
                {
                    name: 'Channel',
                    value: `${channel}`,
                    inline: true
                }
            ]);

            const embed = Utils.createSuccessEmbed(
                'Channel Locked',
                `Successfully locked ${channel}.`
            );

            embed.addFields([
                {
                    name: 'Case ID',
                    value: logEntry.caseId,
                    inline: true
                },
                {
                    name: 'Reason',
                    value: reason,
                    inline: false
                }
            ]);

            await interaction.editReply({ embeds: [embed] });

            // Send notification in the locked channel
            try {
                await channel.send({
                    embeds: [Utils.createWarningEmbed(
                        '🔒 Channel Locked',
                        `This channel has been locked by ${interaction.user.tag}.\n**Reason:** ${reason}`
                    )]
                });
            } catch (error) {
                console.error('Could not send lock notification:', error);
            }

        } catch (error) {
            console.error('Error in lock command:', error);
            
            let errorMessage = 'An error occurred while locking the channel.';
            if (error.code === 50013) {
                errorMessage = 'I do not have permission to manage this channel.';
            }

            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Lock Failed', errorMessage)]
            });
        }
    }
};
