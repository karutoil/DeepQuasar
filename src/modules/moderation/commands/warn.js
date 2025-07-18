const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationUtils = require('../../utils/ModerationUtils');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Issue a warning to a user')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to warn')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(false)
                .setMaxLength(1000)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

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

            const target = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Validate target
            const validation = ModerationUtils.validateTarget(interaction, target);
            if (!validation.valid) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed(
                        'Cannot Warn User',
                        validation.reason
                    )],
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            // Log the warning
            const logEntry = await ModerationUtils.logAction({
                guildId: interaction.guild.id,
                userId: target.id,
                action: 'warn',
                moderatorId: interaction.user.id,
                reason: reason
            });

            // Send moderation log
            await ModerationUtils.sendModLog(interaction, logEntry);

            // Try to DM user
            const dmSent = await ModerationUtils.dmUser(
                interaction.client,
                target.id,
                'warned',
                reason,
                interaction.guild.name
            );

            // Check for auto-actions
            const autoAction = await ModerationUtils.checkAutoActions(interaction.guild.id, target.id);
            
            const embed = Utils.createSuccessEmbed(
                'Warning Issued',
                `Successfully warned ${target.tag}.`
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
                },
                {
                    name: 'DM Status',
                    value: dmSent ? '✅ User notified' : '❌ Could not DM user',
                    inline: true
                }
            ]);

            if (autoAction) {
                embed.addFields([
                    {
                        name: 'Auto-Action Triggered',
                        value: `⚠️ User has ${autoAction.count} warnings. Consider using \`/${autoAction.action}\`.`,
                        inline: false
                    }
                ]);
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in warn command:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Warning Failed',
                    'An error occurred while issuing the warning. Please try again.'
                )]
            });
        }
    }
};
