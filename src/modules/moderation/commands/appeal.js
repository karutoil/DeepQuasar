const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Appeals = require('../../schemas/Appeals');
const PunishmentLog = require('../../schemas/PunishmentLog');
const ModerationUtils = require('../../utils/ModerationUtils');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('appeal')
        .setDescription('Submit an appeal for a punishment')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .addStringOption(option =>
            option
                .setName('case-id')
                .setDescription('Case ID of the punishment to appeal (leave empty to see your cases)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for your appeal')
                .setRequired(false)
                .setMaxLength(2000)
        )
        .addStringOption(option =>
            option
                .setName('additional-info')
                .setDescription('Additional information to support your appeal')
                .setRequired(false)
                .setMaxLength(1000)
        ),

    async execute(interaction) {
        try {
            const caseId = interaction.options.getString('case-id');
            const appealReason = interaction.options.getString('reason');
            const additionalInfo = interaction.options.getString('additional-info') || '';

            await interaction.deferReply({ ephemeral: true });

            // If no case ID provided, show user their appealable cases
            if (!caseId) {
                return await this.showAppealableCases(interaction);
            }

            // If no reason provided, this means they want to see case details
            if (!appealReason) {
                return await this.showCaseDetails(interaction, caseId);
            }

            // Find the punishment case
            const punishmentCase = await PunishmentLog.findOne({
                guildId: interaction.guild.id,
                caseId: caseId
            });

            if (!punishmentCase) {
                return await this.showAppealableCases(interaction, `No punishment case found with ID "${caseId}". Here are your available cases:`);
            }

            // Check if user can only appeal their own punishments (unless they're a moderator)
            const permissionCheck = ModerationUtils.checkDiscordPermissions(interaction, PermissionFlagsBits.ManageMessages);
            if (!permissionCheck.hasPermission && punishmentCase.userId !== interaction.user.id) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Permission Denied',
                        'You can only appeal your own punishments.'
                    )]
                });
            }

            // Check if user can appeal this case
            const canAppeal = await Appeals.canUserAppeal(
                interaction.guild.id,
                interaction.user.id,
                caseId
            );

            if (!canAppeal.canAppeal) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Cannot Submit Appeal',
                        canAppeal.reason
                    )]
                });
            }

            // Check if an appeal for this case already exists
            const existingAppeal = await Appeals.findOne({
                guildId: interaction.guild.id,
                caseId: caseId
            });

            if (existingAppeal) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Duplicate Appeal',
                        'An appeal for this case has already been submitted. Please wait for staff to review it.'
                    )]
                });
            }

            // Create the appeal
            const appeal = new Appeals({
                guildId: interaction.guild.id,
                userId: interaction.user.id,
                caseId: caseId,
                appealReason: appealReason,
                additionalInfo: additionalInfo,
                originalPunishment: {
                    action: punishmentCase.action,
                    reason: punishmentCase.reason,
                    moderatorId: punishmentCase.moderatorId,
                    createdAt: punishmentCase.createdAt
                },
                status: 'pending'
            });

            await appeal.save();

            // Update punishment case to show appeal submitted
            punishmentCase.appeal.submitted = true;
            punishmentCase.appeal.reason = appealReason;
            punishmentCase.appeal.submittedAt = new Date();
            await punishmentCase.save();

            const embed = Utils.createSuccessEmbed(
                'Appeal Submitted',
                'Your appeal has been submitted successfully.'
            );

            embed.addFields([
                {
                    name: 'Case Information',
                    value: [
                        `**Case ID:** ${caseId}`,
                        `**Original Action:** ${ModerationUtils.capitalizeAction(punishmentCase.action)}`,
                        `**Original Reason:** ${punishmentCase.reason.substring(0, 200)}${punishmentCase.reason.length > 200 ? '...' : ''}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: 'Appeal Details',
                    value: [
                        `**Status:** Pending Review`,
                        `**Submitted:** <t:${Math.floor(Date.now() / 1000)}:f>`,
                        `**Expected Response:** Within 24-48 hours`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: 'What\'s Next?',
                    value: [
                        '• Staff will review your appeal',
                        '• You will be notified of the decision',
                        '• Appeals are typically processed within 48 hours',
                        '• Please be patient and do not submit duplicate appeals'
                    ].join('\n'),
                    inline: false
                }
            ]);

            await interaction.editReply({ embeds: [embed] });

            // Notify staff about the new appeal
            const settings = await ModerationUtils.getModerationSettings(interaction.guild.id);
            let notificationChannel = null;

            if (settings.appealSystem.appealChannel) {
                notificationChannel = interaction.guild.channels.cache.get(settings.appealSystem.appealChannel);
            } else if (settings.modLogChannel) {
                notificationChannel = interaction.guild.channels.cache.get(settings.modLogChannel);
            }

            if (notificationChannel) {
                const staffEmbed = Utils.createInfoEmbed(
                    '📋 New Appeal Submitted',
                    'A user has submitted an appeal for review.'
                );

                staffEmbed.addFields([
                    {
                        name: 'User',
                        value: `${interaction.user.tag} (${interaction.user.id})`,
                        inline: true
                    },
                    {
                        name: 'Case ID',
                        value: caseId,
                        inline: true
                    },
                    {
                        name: 'Original Action',
                        value: ModerationUtils.capitalizeAction(punishmentCase.action),
                        inline: true
                    },
                    {
                        name: 'Appeal Reason',
                        value: appealReason.length > 500 ? appealReason.substring(0, 500) + '...' : appealReason,
                        inline: false
                    }
                ]);

                if (additionalInfo) {
                    staffEmbed.addFields([
                        {
                            name: 'Additional Information',
                            value: additionalInfo.length > 500 ? additionalInfo.substring(0, 500) + '...' : additionalInfo,
                            inline: false
                        }
                    ]);
                }

                const actionRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`appeal_pardon_${caseId}`)
                        .setLabel('Pardon')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`appeal_reject_${caseId}`)
                        .setLabel('Reject')
                        .setStyle(ButtonStyle.Danger)
                );

                await notificationChannel.send({ embeds: [staffEmbed], components: [actionRow] });
            }

        } catch (error) {
            console.error('Error in appeal command:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Appeal Submission Failed',
                    'An error occurred while submitting your appeal. Please try again.'
                )]
            });
        }
    },

    async showAppealableCases(interaction, errorMessage = null) {
        try {
            // Find all punishment cases for this user that can be appealed
            const appealableActions = ['warn', 'mute', 'kick', 'ban', 'strike'];
            
            const userCases = await PunishmentLog.find({
                guildId: interaction.guild.id,
                userId: interaction.user.id,
                action: { $in: appealableActions },
                status: { $ne: 'pardoned' },
                'appeal.submitted': { $ne: true }
            }).sort({ createdAt: -1 }).limit(10);

            if (userCases.length === 0) {
                const embed = Utils.createInfoEmbed(
                    'No Cases Available for Appeal',
                    errorMessage || 'You have no punishment cases that can be appealed.'
                )
                .addFields({
                    name: 'ℹ️ Appeal Information',
                    value: [
                        '• Only warnings, mutes, kicks, bans, and strikes can be appealed',
                        '• Cases that have already been pardoned cannot be appealed',
                        '• You can only appeal each case once',
                        '• Use `/appeal <case-id> <reason>` to submit an appeal'
                    ].join('\n'),
                    inline: false
                });

                return interaction.editReply({ embeds: [embed] });
            }

            const embed = Utils.createInfoEmbed(
                '📋 Your Cases Available for Appeal',
                errorMessage || 'Select a case ID to appeal. Use `/appeal <case-id> <reason>` to submit your appeal.'
            );

            // Add case fields
            for (let i = 0; i < Math.min(userCases.length, 8); i++) {
                const punishmentCase = userCases[i];
                const moderator = await interaction.client.users.fetch(punishmentCase.moderatorId).catch(() => null);
                
                const fieldValue = [
                    `**Action:** ${ModerationUtils.capitalizeAction(punishmentCase.action)}`,
                    `**Reason:** ${punishmentCase.reason ? (punishmentCase.reason.length > 100 ? punishmentCase.reason.substring(0, 100) + '...' : punishmentCase.reason) : 'No reason provided'}`,
                    `**Moderator:** ${moderator ? moderator.tag : 'Unknown'}`,
                    punishmentCase.createdAt ? `**Date:** <t:${Math.floor(punishmentCase.createdAt.getTime() / 1000)}:R>` : '**Date:** Unknown'
                ].join('\n');

                embed.addFields({
                    name: `Case ${punishmentCase.caseId}`,
                    value: fieldValue,
                    inline: true
                });
            }

            if (userCases.length > 8) {
                embed.setFooter({ text: `Showing 8 of ${userCases.length} appealable cases` });
            }

            embed.addFields({
                name: '📝 How to Appeal',
                value: [
                    '1. Choose a case ID from above',
                    '2. Use `/appeal <case-id> <reason>`',
                    '3. Provide a detailed reason for your appeal',
                    '4. Wait for staff review (24-48 hours)'
                ].join('\n'),
                inline: false
            });

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error showing appealable cases:', error);
            return interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Error',
                    'An error occurred while fetching your cases. Please try again.'
                )]
            });
        }
    },

    async showCaseDetails(interaction, caseId) {
        try {
            // Find the specific case
            const punishmentCase = await PunishmentLog.findOne({
                guildId: interaction.guild.id,
                caseId: caseId
            });

            if (!punishmentCase) {
                return await this.showAppealableCases(interaction, `Case "${caseId}" not found. Here are your available cases:`);
            }

            // Check if user can view this case
            const permissionCheck = ModerationUtils.checkDiscordPermissions(interaction, PermissionFlagsBits.ManageMessages);
            if (!permissionCheck.hasPermission && punishmentCase.userId !== interaction.user.id) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Permission Denied',
                        'You can only view your own punishment cases.'
                    )]
                });
            }

            // Check if case can be appealed
            const appealableActions = ['warn', 'mute', 'kick', 'ban', 'strike'];
            const canAppeal = appealableActions.includes(punishmentCase.action) && 
                            punishmentCase.status !== 'pardoned' && 
                            !punishmentCase.appeal?.submitted;

            const targetUser = await interaction.client.users.fetch(punishmentCase.userId).catch(() => null);
            const moderator = await interaction.client.users.fetch(punishmentCase.moderatorId).catch(() => null);

            const embed = Utils.createInfoEmbed(
                `📋 Case Details: ${caseId}`,
                canAppeal ? 'Use `/appeal <case-id> <reason>` to submit an appeal for this case.' : 'This case cannot be appealed.'
            );

            embed.addFields([
                {
                    name: 'Case Information',
                    value: [
                        `**Case ID:** ${punishmentCase.caseId}`,
                        `**Action:** ${ModerationUtils.capitalizeAction(punishmentCase.action)}`,
                        `**Status:** ${punishmentCase.status || 'Active'}`,
                        `**Date:** <t:${Math.floor(punishmentCase.createdAt.getTime() / 1000)}:f>`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: 'Parties Involved',
                    value: [
                        `**User:** ${targetUser ? targetUser.tag : 'Unknown'} (${punishmentCase.userId})`,
                        `**Moderator:** ${moderator ? moderator.tag : 'Unknown'} (${punishmentCase.moderatorId})`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: 'Reason',
                    value: punishmentCase.reason || 'No reason provided',
                    inline: false
                }
            ]);

            if (punishmentCase.appeal?.submitted) {
                embed.addFields({
                    name: '📝 Appeal Status',
                    value: [
                        `**Status:** ${punishmentCase.appeal.status || 'Pending'}`,
                        `**Submitted:** <t:${Math.floor(new Date(punishmentCase.appeal.submittedAt).getTime() / 1000)}:R>`,
                        `**Reason:** ${punishmentCase.appeal.reason || 'No reason provided'}`
                    ].join('\n'),
                    inline: false
                });
            } else if (canAppeal) {
                embed.addFields({
                    name: '✅ Appeal Available',
                    value: [
                        'This case can be appealed.',
                        'Use `/appeal ' + caseId + ' <your reason>` to submit an appeal.',
                        'Provide a detailed explanation for why this punishment should be reviewed.'
                    ].join('\n'),
                    inline: false
                });
            } else {
                let reason = 'This case cannot be appealed.';
                if (punishmentCase.status === 'pardoned') {
                    reason = 'This case has already been pardoned.';
                } else if (!appealableActions.includes(punishmentCase.action)) {
                    reason = 'This type of punishment cannot be appealed.';
                }

                embed.addFields({
                    name: '❌ Appeal Not Available',
                    value: reason,
                    inline: false
                });
            }

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error showing case details:', error);
            return interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Error',
                    'An error occurred while fetching case details. Please try again.'
                )]
            });
        }
    }
};
