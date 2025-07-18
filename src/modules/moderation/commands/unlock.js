const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const ModerationUtils = require('../../../utils/ModerationUtils');
const PunishmentLog = require('../../../schemas/PunishmentLog');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock a previously locked channel')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to unlock (current channel if not specified)')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildNews)
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for unlocking the channel')
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
            
            // Check if channel is actually locked
            if (!currentPerms || !currentPerms.deny.has(PermissionFlagsBits.SendMessages)) {
                return interaction.editReply({
                    embeds: [Utils.createWarningEmbed(
                        'Channel Not Locked',
                        `${channel} is not currently locked.`
                    )]
                });
            }

            // Find the original lock action to restore previous permissions
            const lockAction = await PunishmentLog.findOne({
                guildId: interaction.guild.id,
                action: 'lock',
                targetChannel: channel.id,
                status: 'active'
            }).sort({ createdAt: -1 });

            // Unlock the channel
            if (lockAction && lockAction.previousValue) {
                // Restore previous permissions
                const previousPerms = lockAction.previousValue;
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: previousPerms.allow.includes('SendMessages') ? true : 
                                 previousPerms.deny.includes('SendMessages') ? false : null,
                    SendMessagesInThreads: previousPerms.allow.includes('SendMessagesInThreads') ? true : 
                                          previousPerms.deny.includes('SendMessagesInThreads') ? false : null,
                    CreatePublicThreads: previousPerms.allow.includes('CreatePublicThreads') ? true : 
                                        previousPerms.deny.includes('CreatePublicThreads') ? false : null,
                    CreatePrivateThreads: previousPerms.allow.includes('CreatePrivateThreads') ? true : 
                                         previousPerms.deny.includes('CreatePrivateThreads') ? false : null,
                    AddReactions: previousPerms.allow.includes('AddReactions') ? true : 
                                 previousPerms.deny.includes('AddReactions') ? false : null
                }, { reason });
            } else {
                // Simply remove the deny permissions (default unlock)
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: null,
                    SendMessagesInThreads: null,
                    CreatePublicThreads: null,
                    CreatePrivateThreads: null,
                    AddReactions: null
                }, { reason });
            }

            // Update the lock action status
            if (lockAction) {
                lockAction.status = 'expired';
                await lockAction.save();
            }

            // Log the unlock action
            const logEntry = await ModerationUtils.logAction({
                guildId: interaction.guild.id,
                userId: interaction.user.id, // No specific target user for channel actions
                action: 'unlock',
                moderatorId: interaction.user.id,
                reason: reason,
                targetChannel: channel.id
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
                'Channel Unlocked',
                `Successfully unlocked ${channel}.`
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

            // Send notification in the unlocked channel
            try {
                await channel.send({
                    embeds: [Utils.createSuccessEmbed(
                        '🔓 Channel Unlocked',
                        `This channel has been unlocked by ${interaction.user.tag}.\n**Reason:** ${reason}`
                    )]
                });
            } catch (error) {
                console.error('Could not send unlock notification:', error);
            }

        } catch (error) {
            console.error('Error in unlock command:', error);
            
            let errorMessage = 'An error occurred while unlocking the channel.';
            if (error.code === 50013) {
                errorMessage = 'I do not have permission to manage this channel.';
            }

            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Unlock Failed', errorMessage)]
            });
        }
    }
};
