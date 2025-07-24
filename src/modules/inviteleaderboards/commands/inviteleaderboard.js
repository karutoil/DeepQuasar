const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inviteleaderboard')
        .setDescription('Show a leaderboard of server invites (paginated).'),
    async execute(interaction) {
        // Early error: check before deferReply
        if (process.env.ENABLE_INVITELEADERBOARDS_MODULE !== 'true') {
            // Use flags: 64 for ephemeral (future-proof)
            return interaction.reply({ content: 'Invite Leaderboards module is disabled.', flags: 64 });
        }
        const PAGE_SIZE = 10;
        try {
            await interaction.deferReply();
            const invites = await interaction.guild.invites.fetch();
            const inviteCounts = {};
            invites.forEach(invite => {
                if (!invite.inviter) return;
                const id = invite.inviter.id;
                if (!inviteCounts[id]) {
                    inviteCounts[id] = { user: invite.inviter, count: 0 };
                }
                inviteCounts[id].count += invite.uses || 0;
            });
            const leaderboard = Object.values(inviteCounts).sort((a, b) => b.count - a.count);
            if (leaderboard.length === 0) {
                return interaction.editReply('No invite data found for this server.');
            }
            let page = 0;
            const maxPage = Math.ceil(leaderboard.length / PAGE_SIZE) - 1;
            const getPageEmbed = (pageNum) => {
                const start = pageNum * PAGE_SIZE;
                const end = start + PAGE_SIZE;
                const pageData = leaderboard.slice(start, end);
                const embed = new EmbedBuilder()
                    .setTitle('Invite Leaderboard')
                    .setDescription(pageData.map((entry, i) => {
                        const rank = start + i + 1;
                        const isTop = rank === 1 && pageNum === 0;
                        return `${isTop ? '👑' : `#${rank}`} ${entry.user.tag} — **${entry.count}** invites`;
                    }).join('\n'))
                    .setFooter({ text: `Page ${pageNum + 1} of ${maxPage + 1}` });
                return embed;
            };
            const getRow = (pageNum) => new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(pageNum === 0),
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(pageNum === maxPage)
            );
            const reply = await interaction.editReply({
                embeds: [getPageEmbed(page)],
                components: [getRow(page)]
            });
            const collector = reply.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 60000
            });
            collector.on('collect', async i => {
                if (i.customId === 'prev_page' && page > 0) page--;
                if (i.customId === 'next_page' && page < maxPage) page++;
                await i.update({
                    embeds: [getPageEmbed(page)],
                    components: [getRow(page)]
                });
            });
            collector.on('end', async () => {
                try {
                    await reply.edit({ components: [] });
                } catch (e) {}
            });
        } catch (err) {
            // Only use editReply if already deferred/replied
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply('Failed to fetch invite leaderboard.');
            } else {
                await interaction.reply('Failed to fetch invite leaderboard.');
            }
        }
    },
};
