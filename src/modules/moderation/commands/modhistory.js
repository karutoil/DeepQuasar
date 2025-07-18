const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const PunishmentLog = require('../../schemas/PunishmentLog');
const UserNotes = require('../../schemas/UserNotes');
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
        .addStringOption(option =>
            option
                .setName('filter')
                .setDescription('Filter the history type')
                .setRequired(false)
                .addChoices(
                    { name: 'All', value: 'all' },
                    { name: 'Moderation Actions', value: 'mod_actions' },
                    { name: 'Notes', value: 'notes' }
                )
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
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const target = interaction.options.getUser('user');
            const limit = interaction.options.getInteger('limit') || 10;
            const filterType = interaction.options.getString('filter') || 'all';

            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            let history = [];

            if (filterType === 'all' || filterType === 'mod_actions') {
                const punishments = await PunishmentLog.find({ guildId: interaction.guild.id, userId: target.id });
                history.push(...punishments.map(p => ({ ...p.toObject(), type: 'punishment' })));
            }

            if (filterType === 'all' || filterType === 'notes') {
                const userNotesDoc = await UserNotes.findOne({ guildId: interaction.guild.id, userId: target.id });
                if (userNotesDoc && userNotesDoc.notes) {
                    history.push(...userNotesDoc.notes.map(n => ({ ...n.toObject(), type: 'note' })));
                }
            }

            history.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });

            if (history.length === 0) {
                return interaction.editReply({
                    embeds: [Utils.createInfoEmbed('Moderation History', `No history found for ${target.tag} with the selected filter.`)]
                });
            }

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
                    const date = entry.createdAt ? `<t:${Math.floor(new Date(entry.createdAt).getTime() / 1000)}:d>` : 'Unknown Date';
                    const moderator = entry.moderatorId ? `<@${entry.moderatorId}>` : 'Unknown';

                    if (entry.type === 'punishment') {
                        const status = entry.status === 'active' ? '🟢' : '🔴';
                        const reason = entry.reason ? Utils.truncate(entry.reason, 100) : 'No reason provided.';
                        return `**${start + index + 1}.** ${status} ${ModerationUtils.getActionEmoji(entry.action)} ${ModerationUtils.capitalizeAction(entry.action)}
                        **Case:** ${entry.caseId}
                        **Date:** ${date}
                        **Moderator:** ${moderator}
                        **Reason:** ${reason}`;
                    } else { // Note
                        const noteText = entry.content ? Utils.truncate(entry.content, 100) : 'No note content.';
                        return `**${start + index + 1}.** 📝 Note
                        **Date:** ${date}
                        **Moderator:** ${moderator}
                        **Note:** ${noteText}`;
                    }
                }).join('\n\n');

                embed.setDescription(historyText);

                if (totalPages > 1) {
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

            await interaction.editReply({ embeds: [generateEmbed(currentPage)], components: totalPages > 1 ? [generateActionRow(currentPage, totalPages)] : [] });

            if (totalPages <= 1) return;

            const collectorFilter = i => {
                i.deferUpdate();
                return i.customId === 'modhistory_back' || i.customId === 'modhistory_next';
            };

            const collector = interaction.channel.createMessageComponentCollector({ filter: collectorFilter, time: 60000 });

            collector.on('collect', async (i) => {
                if (i.customId === 'modhistory_back') {
                    currentPage = Math.max(currentPage - 1, 0);
                } else if (i.customId === 'modhistory_next') {
                    currentPage = Math.min(currentPage + 1, totalPages - 1);
                }

                await interaction.editReply({ embeds: [generateEmbed(currentPage)], components: [generateActionRow(currentPage, totalPages)] });
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] }).catch(console.error);
            });

        } catch (error) {
            console.error('Error in modhistory command:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'History Error',
                    'An error occurred while fetching moderation history.'
                )]
            }).catch(console.error);
        }
    }
};
