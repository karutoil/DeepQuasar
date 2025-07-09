const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const PunishmentLog = require('../../schemas/PunishmentLog');
const Utils = require('../../utils/utils');
const ModerationUtils = require('../../utils/ModerationUtils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('modhistory')
        .setDescription('View moderation history for a user')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to view history for')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('limit')
                .setDescription('Number of entries to show (1-20)')
                .setMinValue(1)
                .setMaxValue(20)
                .setRequired(false)
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
            const limit = interaction.options.getInteger('limit') || 10;

            await interaction.deferReply();

            // Get user's punishment history
            const history = await PunishmentLog.getUserHistory(interaction.guild.id, target.id, limit);

            if (history.length === 0) {
                return interaction.editReply({
                    embeds: [Utils.createInfoEmbed(
                        'No History Found',
                        `${target.tag} has no moderation history.`
                    )]
                });
            }

            const embed = Utils.createInfoEmbed(
                'Moderation History',
                `History for ${target.tag} (${target.id})`
            );

            const historyText = history.map((entry, index) => {
                const date = `<t:${Math.floor(entry.createdAt.getTime() / 1000)}:d>`;
                const moderator = `<@${entry.moderatorId}>`;
                const status = entry.status === 'active' ? '🟢' : '🔴';
                
                return `**${index + 1}.** ${status} ${ModerationUtils.getActionEmoji(entry.action)} ${ModerationUtils.capitalizeAction(entry.action)}
                **Case:** ${entry.caseId}
                **Date:** ${date}
                **Moderator:** ${moderator}
                **Reason:** ${Utils.truncate(entry.reason, 100)}`;
            }).join('\n\n');

            embed.setDescription(historyText);

            if (history.length >= limit) {
                embed.setFooter({
                    text: `Showing ${limit} most recent entries. Use a higher limit to see more.`
                });
            }

            const legendEmbed = Utils.createInfoEmbed(
                'Legend',
                '🟢 Active: The case is currently active and unresolved.\n🔴 Inactive: The case has been resolved or pardoned.'
            );

            await interaction.editReply({ embeds: [legendEmbed, embed] });

        } catch (error) {
            console.error('Error in modhistory command:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'History Error',
                    'An error occurred while fetching moderation history.'
                )]
            });
        }
    }
};
