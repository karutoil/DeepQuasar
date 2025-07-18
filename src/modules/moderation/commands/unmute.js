const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationUtils = require('../../../utils/ModerationUtils');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a user in the server')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to unmute')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the unmute')
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
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Validate target
            const validation = ModerationUtils.validateTarget(interaction, target);
            if (!validation.valid) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed(
                        'Cannot Unmute User',
                        validation.reason
                    )],
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            // Get moderation settings and mute role
            const settings = await ModerationUtils.getModerationSettings(interaction.guild.id);
            
            if (!settings.muteRoleId) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'No Mute Role',
                        'No mute role is configured. Use `/setup-moderation muterole` first.'
                    )]
                });
            }

            const muteRole = interaction.guild.roles.cache.get(settings.muteRoleId);
            if (!muteRole) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Mute Role Not Found',
                        'The configured mute role no longer exists.'
                    )]
                });
            }

            const targetMember = interaction.guild.members.cache.get(target.id);

            // Check if user is actually muted
            if (!targetMember.roles.cache.has(muteRole.id)) {
                return interaction.editReply({
                    embeds: [Utils.createWarningEmbed(
                        'User Not Muted',
                        `${target.tag} is not currently muted.`
                    )]
                });
            }

            // Remove mute role
            await targetMember.roles.remove(muteRole, reason);

            // Log the unmute
            const logEntry = await ModerationUtils.logAction({
                guildId: interaction.guild.id,
                userId: target.id,
                action: 'unmute',
                moderatorId: interaction.user.id,
                reason: reason
            });

            // Send moderation log
            await ModerationUtils.sendModLog(interaction, logEntry);

            const embed = Utils.createSuccessEmbed(
                'User Unmuted',
                `Successfully unmuted ${target.tag}.`
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

        } catch (error) {
            console.error('Error in unmute command:', error);
            
            let errorMessage = 'An error occurred while unmuting the user.';
            if (error.code === 50013) {
                errorMessage = 'I do not have permission to manage roles for this user.';
            } else if (error.code === 50001) {
                errorMessage = 'I do not have the necessary permissions.';
            }

            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Unmute Failed', errorMessage)]
            });
        }
    }
};
