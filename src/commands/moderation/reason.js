const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationUtils = require('../../utils/ModerationUtils');
const PunishmentLog = require('../../schemas/PunishmentLog');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('reason')
        .setDescription('Edit the reason for a moderation case')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option =>
            option
                .setName('case-id')
                .setDescription('Case ID to edit')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('new-reason')
                .setDescription('New reason for the case')
                .setRequired(true)
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
            const newReason = interaction.options.getString('new-reason');

            await interaction.deferReply({ ephemeral: true });

            // Find the case
            const punishmentCase = await PunishmentLog.findOne({
                guildId: interaction.guild.id,
                caseId: caseId
            });

            if (!punishmentCase) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Case Not Found',
                        `No moderation case found with ID "${caseId}".`
                    )]
                });
            }

            // Store old reason for edit history
            const oldReason = punishmentCase.reason;

            // Update the reason
            punishmentCase.editHistory.push({
                editedBy: interaction.user.id,
                editedAt: new Date(),
                oldReason: oldReason,
                newReason: newReason
            });

            punishmentCase.reason = newReason;
            await punishmentCase.save();

            // Get user and moderator info
            const targetUser = await interaction.client.users.fetch(punishmentCase.userId).catch(() => null);
            const originalModerator = await interaction.client.users.fetch(punishmentCase.moderatorId).catch(() => null);

            const embed = Utils.createSuccessEmbed(
                'Case Reason Updated',
                `Successfully updated reason for case ${caseId}.`
            );

            embed.addFields([
                {
                    name: 'Case Information',
                    value: [
                        `**Case ID:** ${caseId}`,
                        `**Action:** ${ModerationUtils.capitalizeAction(punishmentCase.action)}`,
                        `**Target:** ${targetUser ? targetUser.tag : 'Unknown User'}`,
                        `**Original Moderator:** ${originalModerator ? originalModerator.tag : 'Unknown User'}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: 'Previous Reason',
                    value: oldReason.length > 500 ? oldReason.substring(0, 500) + '...' : oldReason,
                    inline: false
                },
                {
                    name: 'New Reason',
                    value: newReason.length > 500 ? newReason.substring(0, 500) + '...' : newReason,
                    inline: false
                },
                {
                    name: 'Edit Details',
                    value: [
                        `**Edited by:** ${interaction.user.tag}`,
                        `**Edit time:** <t:${Math.floor(Date.now() / 1000)}:f>`
                    ].join('\n'),
                    inline: false
                }
            ]);

            await interaction.editReply({ embeds: [embed] });

            // Log the reason update in modlog
            const settings = await ModerationUtils.getModerationSettings(interaction.guild.id);
            if (settings.modLogChannel) {
                const logChannel = interaction.guild.channels.cache.get(settings.modLogChannel);
                if (logChannel) {
                    const logEmbed = Utils.createEmbed({
                        title: '📝 Case Reason Updated',
                        color: 0x87CEEB,
                        fields: [
                            {
                                name: 'Case ID',
                                value: caseId,
                                inline: true
                            },
                            {
                                name: 'Edited by',
                                value: `${interaction.user.tag} (${interaction.user.id})`,
                                inline: true
                            },
                            {
                                name: 'Previous Reason',
                                value: oldReason.length > 200 ? oldReason.substring(0, 200) + '...' : oldReason,
                                inline: false
                            },
                            {
                                name: 'New Reason',
                                value: newReason.length > 200 ? newReason.substring(0, 200) + '...' : newReason,
                                inline: false
                            }
                        ]
                    });

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('Error in reason command:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Reason Update Failed',
                    'An error occurred while updating the case reason. Please try again.'
                )]
            });
        }
    }
};
