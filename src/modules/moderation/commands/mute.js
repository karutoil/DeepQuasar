const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationUtils = require('../../../utils/ModerationUtils');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user in the server')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to mute')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('duration')
                .setDescription('Duration of the mute (e.g., 1h, 30m, 2d)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the mute')
                .setRequired(false)
                .setMaxLength(1000)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            // Check permissions
            const permissionCheck = ModerationUtils.checkDiscordPermissions(interaction, PermissionFlagsBits.ModerateMembers);
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
            const durationStr = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Validate target
            const validation = ModerationUtils.validateTarget(interaction, target);
            if (!validation.valid) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed(
                        'Cannot Mute User',
                        validation.reason
                    )],
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            // Parse duration
            let duration = null;
            let expiresAt = null;
            
            if (durationStr) {
                duration = ModerationUtils.parseDuration(durationStr);
                if (!duration) {
                    return interaction.editReply({
                        embeds: [Utils.createErrorEmbed(
                            'Invalid Duration',
                            'Please use a valid duration format (e.g., 1h, 30m, 2d).'
                        )]
                    });
                }
                expiresAt = new Date(Date.now() + duration);
            } else {
                // Use default duration from settings
                const settings = await ModerationUtils.getModerationSettings(interaction.guild.id);
                duration = settings.defaultDurations.mute;
                expiresAt = new Date(Date.now() + duration);
            }

            // Get moderation settings and mute role
            const settings = await ModerationUtils.getModerationSettings(interaction.guild.id);
            const muteRole = await ModerationUtils.getMuteRole(interaction.guild, settings);

            const targetMember = interaction.guild.members.cache.get(target.id);

            // Check if user is already muted
            if (targetMember.roles.cache.has(muteRole.id)) {
                return interaction.editReply({
                    embeds: [Utils.createWarningEmbed(
                        'User Already Muted',
                        `${target.tag} is already muted.`
                    )]
                });
            }

            // Add mute role
            await targetMember.roles.add(muteRole, reason);

            // Try to DM user
            const dmSent = await ModerationUtils.dmUser(
                interaction.client,
                target.id,
                'muted',
                reason,
                interaction.guild.name,
                duration
            );

            // Log the mute
            const logEntry = await ModerationUtils.logAction({
                guildId: interaction.guild.id,
                userId: target.id,
                action: 'mute',
                moderatorId: interaction.user.id,
                reason: reason,
                duration: duration,
                expiresAt: expiresAt
            });

            // Send moderation log
            await ModerationUtils.sendModLog(interaction, logEntry, [
                {
                    name: 'Duration',
                    value: Utils.formatDuration(duration),
                    inline: true
                }
            ]);

            const embed = Utils.createSuccessEmbed(
                'User Muted',
                `Successfully muted ${target.tag}.`
            );

            embed.addFields([
                {
                    name: 'Case ID',
                    value: logEntry.caseId,
                    inline: true
                },
                {
                    name: 'Duration',
                    value: Utils.formatDuration(duration),
                    inline: true
                },
                {
                    name: 'Expires',
                    value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:F>`,
                    inline: true
                },
                {
                    name: 'Reason',
                    value: reason,
                    inline: false
                },
                {
                    name: 'DM Status',
                    value: dmSent ? '✅ User notified' : '❌ Could not DM user',
                    inline: true
                }
            ]);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in mute command:', error);
            
            let errorMessage = 'An error occurred while muting the user.';
            if (error.code === 50013) {
                errorMessage = 'I do not have permission to manage roles for this user.';
            } else if (error.code === 50001) {
                errorMessage = 'I do not have the necessary permissions.';
            }

            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Mute Failed', errorMessage)]
            });
        }
    }
};
