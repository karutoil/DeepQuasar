const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Ticket = require('../../schemas/Ticket');
const Utils = require('../../utils/utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mytickets')
        .setDescription('View your ticket history and manage your tickets')
        .addStringOption(option =>
            option
                .setName('status')
                .setDescription('Filter tickets by status')
                .setRequired(false)
                .addChoices(
                    { name: 'Open', value: 'open' },
                    { name: 'Closed', value: 'closed' },
                    { name: 'All', value: 'all' }
                )),

    async execute(interaction) {
        const status = interaction.options.getString('status') || 'all';

        try {
            await interaction.deferReply({ ephemeral: true });

            // Build query
            const query = { 
                guildId: interaction.guild.id,
                userId: interaction.user.id
            };
            
            if (status !== 'all') {
                query.status = status;
            }

            const tickets = await Ticket.find(query)
                .sort({ createdAt: -1 })
                .limit(10); // Limit to prevent spam

            if (tickets.length === 0) {
                const noTicketsEmbed = Utils.createEmbed({
                    title: '🎫 My Tickets',
                    description: status === 'all' ? 
                        'You haven\'t created any tickets yet.\n\nUse a ticket panel to create your first ticket!' :
                        `You don't have any ${status} tickets.\n\nUse a ticket panel to create a new ticket!`,
                    color: 0x99AAB5
                });

                return interaction.editReply({ embeds: [noTicketsEmbed] });
            }

            const statusEmojis = {
                open: '🟢',
                closed: '🔴',
                deleted: '⚫'
            };

            const priorityEmojis = {
                low: '🟢',
                normal: '🟡',
                high: '🟠',
                urgent: '🔴'
            };

            // Create ticket list
            const ticketList = tickets.map(ticket => {
                const assignedText = ticket.assignedTo.userId ? 
                    ` • Assigned to <@${ticket.assignedTo.userId}>` : '';
                const channelText = ticket.status === 'open' ? 
                    ` • <#${ticket.channelId}>` : '';
                
                return `${statusEmojis[ticket.status]} **#${ticket.ticketId}** ${priorityEmojis[ticket.priority]} - \`${ticket.type}\`\n` +
                       `Created <t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>${assignedText}${channelText}`;
            }).join('\n\n');

            const embed = Utils.createEmbed({
                title: `🎫 My Tickets (${tickets.length}${tickets.length === 10 ? '+' : ''})`,
                description: ticketList,
                color: 0x5865F2,
                fields: [
                    {
                        name: '📊 Quick Stats',
                        value: `**Open:** ${tickets.filter(t => t.status === 'open').length}\n` +
                               `**Closed:** ${tickets.filter(t => t.status === 'closed').length}\n` +
                               `**Total:** ${tickets.length}`,
                        inline: true
                    }
                ],
                footer: { 
                    text: `Filter: ${status.charAt(0).toUpperCase() + status.slice(1)} • Showing latest 10 tickets` 
                }
            });

            // Add buttons for open tickets
            const openTickets = tickets.filter(t => t.status === 'open');
            if (openTickets.length > 0) {
                const components = [];
                const buttons = [];

                openTickets.slice(0, 5).forEach(ticket => {
                    buttons.push(
                        new ButtonBuilder()
                            .setLabel(`Go to #${ticket.ticketId}`)
                            .setEmoji('🎫')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://discord.com/channels/${interaction.guild.id}/${ticket.channelId}`)
                    );
                });

                // Split buttons into rows (max 5 per row)
                for (let i = 0; i < buttons.length; i += 5) {
                    const row = new ActionRowBuilder()
                        .addComponents(buttons.slice(i, i + 5));
                    components.push(row);
                }

                await interaction.editReply({ embeds: [embed], components });
            } else {
                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error fetching user tickets:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to fetch your tickets. Please try again.')]
            });
        }
    }
};
