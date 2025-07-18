const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const PunishmentLog = require('../../../schemas/PunishmentLog');
const ModerationUtils = require('../../../utils/ModerationUtils');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('pardon')
        .setDescription('Pardon/remove a punishment from a user\'s record')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option =>
            option
                .setName('case-id')
                .setDescription('Case ID of the punishment to pardon')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for pardoning the punishment')
                .setRequired(false)
                .setMaxLength(1000)
        ),

    async execute(interaction) {
        try {
            // Check permissions
            const permissionCheck = ModerationUtils.checkDiscordPermissions(interaction, PermissionFlagsBits.ManageMessages);
            if (!permissionCheck.hasPermission) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed(
                        'Permission Denied',
                        permissionCheck.reason
                    )],
                    ephemeral: true
                });
            }

            const caseId = interaction.options.getString('case-id');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            await interaction.deferReply({ ephemeral: true });

            // Find the punishment case
            const punishmentCase = await PunishmentLog.findOne({
                guildId: interaction.guild.id,
                caseId: caseId
            });

            if (!punishmentCase) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Case Not Found',
                        `No punishment case found with ID "${caseId}".`
                    )]
                });
            }

            // Check if case is already pardoned
            if (punishmentCase.status === 'pardoned') {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Already Pardoned',
                        `Case ${caseId} has already been pardoned.`
                    )]
                });
            }

            // Update the punishment case
            punishmentCase.status = 'pardoned';
            punishmentCase.pardonedBy = interaction.user.id;
            punishmentCase.pardonedAt = new Date();
            punishmentCase.pardonReason = reason;
            await punishmentCase.save();

            // Get the user info
            const targetUser = await interaction.client.users.fetch(punishmentCase.userId).catch(() => null);
            const moderator = await interaction.client.users.fetch(punishmentCase.moderatorId).catch(() => null);

            const embed = Utils.createSuccessEmbed(
                'Punishment Pardoned',
                `Successfully pardoned case ${caseId}.`
            )
            .addFields(
                { name: 'Case ID', value: caseId, inline: true },
                { name: 'Original Action', value: punishmentCase.action.toUpperCase(), inline: true },
                { name: 'User', value: targetUser ? `${targetUser.tag} (${targetUser.id})` : punishmentCase.userId, inline: true },
                { name: 'Original Moderator', value: moderator ? `${moderator.tag}` : punishmentCase.moderatorId, inline: true },
                { name: 'Pardoned By', value: `${interaction.user.tag}`, inline: true },
                { name: 'Original Reason', value: punishmentCase.reason || 'No reason provided', inline: false },
                { name: 'Pardon Reason', value: reason, inline: false }
            )
            .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            // Log to moderation channel if configured
            const settings = await ModerationUtils.getModerationSettings(interaction.guild.id);
            if (settings.modLogChannel) {
                const logChannel = interaction.guild.channels.cache.get(settings.modLogChannel);
                if (logChannel) {
                    const logEmbed = Utils.createInfoEmbed(
                        'Punishment Pardoned',
                        `Case ${caseId} has been pardoned.`
                    )
                    .addFields(
                        { name: 'Case ID', value: caseId, inline: true },
                        { name: 'Original Action', value: punishmentCase.action.toUpperCase(), inline: true },
                        { name: 'User', value: targetUser ? `${targetUser.tag} (${targetUser.id})` : punishmentCase.userId, inline: true },
                        { name: 'Original Moderator', value: moderator ? `${moderator.tag}` : punishmentCase.moderatorId, inline: true },
                        { name: 'Pardoned By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                        { name: 'Original Reason', value: punishmentCase.reason || 'No reason provided', inline: false },
                        { name: 'Pardon Reason', value: reason, inline: false }
                    )
                    .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('Error in pardon command:', error);
            
            const errorEmbed = Utils.createErrorEmbed(
                'Command Error',
                'An error occurred while pardoning the punishment. Please try again.'
            );

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
