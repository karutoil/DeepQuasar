const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

            // Change deferred reply to be ephemeral
            await interaction.deferReply({ ephemeral: true });

            // Get user's punishment history
            const history = await PunishmentLog.find({ guildId: interaction.guild.id, userId: target.id }).sort({ createdAt: -1 });

            const totalPages = Math.ceil(history.length / limit);
            let currentPage = 0;

            const generateEmbed = (page) => {
                const start = page * limit;
                const end = start + limit;
                const pageHistory = history.slice(start, end);

                const embed = Utils.createInfoEmbed(
                    'Moderation History',
                    `History for ${target.tag} (${target.id}) - Page ${page + 1} of ${totalPages}`
                );

                const historyText = pageHistory.map((entry, index) => {
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

                if (pageHistory.length >= limit) {
                    embed.setFooter({
                        text: `Showing ${limit} entries per page. Use buttons to navigate.`
                    });
                }

                return embed;
            };

            const generateActionRow = (page, totalPages) => {
                return new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('modhistory_back')
                        .setLabel('Back')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page <= 0),
                    new ButtonBuilder()
                        .setCustomId('modhistory_next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page >= totalPages - 1)
                );
            };

            // Replace the initial reply with editReply
            await interaction.editReply({ embeds: [generateEmbed(currentPage)], components: [generateActionRow(currentPage, totalPages)] });

            const filter = i => {
                i.deferUpdate();
                return i.customId === 'modhistory_back' || i.customId === 'modhistory_next';
            };

            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (i) => {
                if (i.customId === 'modhistory_back') {
                    currentPage = Math.max(currentPage - 1, 0);
                } else if (i.customId === 'modhistory_next') {
                    currentPage = Math.min(currentPage + 1, totalPages - 1);
                }

                await interaction.editReply({ embeds: [generateEmbed(currentPage)], components: [generateActionRow(currentPage, totalPages)] });
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] });
            });

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
