const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationUtils = require('../../../utils/ModerationUtils');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)
                .setMaxLength(1000)
        )
        .addIntegerOption(option =>
            option
                .setName('delete-days')
                .setDescription('Days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('duration')
                .setDescription('Duration for temporary ban (e.g., 1h, 2d, 1w)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        try {
            // Check permissions
            const permissionCheck = ModerationUtils.checkDiscordPermissions(interaction, PermissionFlagsBits.BanMembers);
            if (!permissionCheck.hasPermission) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed(
                        'Permission Denied',
                        permissionCheck.reason
                    )],
                    ephemeral: true
                });
            }

            const target = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const deleteDays = interaction.options.getInteger('delete-days') || 0;
            const durationStr = interaction.options.getString('duration');

            // Parse duration if provided
            let duration = null;
            let expiresAt = null;
            if (durationStr) {
                duration = ModerationUtils.parseDuration(durationStr);
                if (!duration) {
                    return interaction.reply({
                        embeds: [Utils.createErrorEmbed(
                            'Invalid Duration',
                            'Please use a valid duration format (e.g., 1h, 2d, 1w).'
                        )],
                        ephemeral: true
                    });
                }
                expiresAt = new Date(Date.now() + duration);
            }

            // Validate target (only if they're in the server)
            const targetMember = interaction.guild.members.cache.get(target.id);
            if (targetMember) {
                const validation = ModerationUtils.validateTarget(interaction, target);
                if (!validation.valid) {
                    return interaction.reply({
                        embeds: [Utils.createErrorEmbed(
                            'Cannot Ban User',
                            validation.reason
                        )],
                        ephemeral: true
                    });
                }
            }

            await interaction.deferReply({ ephemeral: true });

            // Try to DM user before banning (if they're in the server)
            let dmSent = false;
            if (targetMember) {
                dmSent = await ModerationUtils.dmUser(
                    interaction.client,
                    target.id,
                    duration ? 'temporarily banned' : 'banned',
                    reason,
                    interaction.guild.name,
                    duration
                );
            }

            // Ban the user
            await interaction.guild.members.ban(target.id, {
                reason: reason,
                deleteMessageDays: deleteDays
            });

            // Log the ban
            const logEntry = await ModerationUtils.logAction({
                guildId: interaction.guild.id,
                userId: target.id,
                action: 'ban',
                moderatorId: interaction.user.id,
                reason: reason,
                duration: duration,
                expiresAt: expiresAt
            });

            // Send moderation log
            const additionalFields = [];
            if (deleteDays > 0) {
                additionalFields.push({
                    name: 'Messages Deleted',
                    value: `${deleteDays} day(s)`,
                    inline: true
                });
            }
            if (duration) {
                additionalFields.push({
                    name: 'Duration',
                    value: Utils.formatDuration(duration),
                    inline: true
                });
            }

            await ModerationUtils.sendModLog(interaction, logEntry, additionalFields);

            const embed = Utils.createSuccessEmbed(
                duration ? 'User Temporarily Banned' : 'User Banned',
                `Successfully banned ${target.tag} from the server.`
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

            if (deleteDays > 0) {
                embed.addFields([
                    {
                        name: 'Messages Deleted',
                        value: `${deleteDays} day(s)`,
                        inline: true
                    }
                ]);
            }

            if (duration) {
                embed.addFields([
                    {
                        name: 'Duration',
                        value: Utils.formatDuration(duration),
                        inline: true
                    },
                    {
                        name: 'Expires',
                        value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:F>`,
                        inline: true
                    }
                ]);
            }

            if (targetMember) {
                embed.addFields([
                    {
                        name: 'DM Status',
                        value: dmSent ? '✅ User notified' : '❌ Could not DM user',
                        inline: true
                    }
                ]);
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in ban command:', error);
            
            let errorMessage = 'An error occurred while banning the user.';
            if (error.code === 50013) {
                errorMessage = 'I do not have permission to ban this user.';
            } else if (error.code === 50001) {
                errorMessage = 'I do not have the necessary permissions.';
            } else if (error.code === 10026) {
                errorMessage = 'User not found.';
            }

            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Ban Failed', errorMessage)]
            });
        }
    }
};
