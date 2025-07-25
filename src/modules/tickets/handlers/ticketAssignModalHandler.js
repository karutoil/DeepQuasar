const Ticket = require('../schemas/Ticket');
const Utils = require('../utils/utils');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        try {
            if (!interaction.isStringSelectMenu()) {
                return;
            }
            if (!interaction.customId.startsWith('assign_staff_select_')) {
                return;
            }

            const ticketId = interaction.customId.replace('assign_staff_select_', '');
            const staffId = interaction.values[0];

            const ticket = await Ticket.findOne({ ticketId, guildId: interaction.guild.id });
            if (!ticket) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Ticket Not Found', 'No ticket found for assignment.')],
                    ephemeral: true
                });
            }

            let staffMember;
            try {
                staffMember = await interaction.guild.members.fetch(staffId);
            } catch (err) {
                return interaction.update({
                    content: `❌ The selected staff member is no longer available. Please try again and select a different staff member.`,
                    components: [],
                    embeds: [],
                    ephemeral: true
                });
            }

            const channel = interaction.guild.channels.cache.get(ticket.channelId);
            if (!channel) {
                return interaction.update({
                    content: `❌ Ticket channel not found. Please contact an admin.`,
                    components: [],
                    embeds: []
                });
            }

            try {
                ticket.assignedTo = {
                    userId: staffMember.id,
                    username: staffMember.displayName || staffMember.user.username,
                    assignedAt: new Date(),
                    note: null
                };
                await ticket.save();

                // Update channel topic and welcome message after assignment
                let topicError = false;
                try {
                    if (channel.permissionsFor(interaction.client.user).has('ManageChannels')) {
                        await channel.setTopic(`Ticket #${ticket.ticketId} - Assigned to ${staffMember.displayName || staffMember.user.username}`);
                    } else {
                        topicError = true;
                    }
                } catch (err) {
                    topicError = true;
                }

                let welcomeError = false;
                try {
                    const TicketManager = require('../utils/TicketManager');
                    const ticketManager = interaction.client.ticketManager;
                    if (ticketManager && typeof ticketManager.updateWelcomeMessage === 'function') {
                        await ticketManager.updateWelcomeMessage(channel, ticket, {});
                    }
                } catch (err) {
                    welcomeError = true;
                }

                let msg = `Ticket #${ticket.ticketId} has been assigned to <@${staffMember.id}>.`;
                if (topicError) msg += `\n⚠️ Could not update channel topic. Please check my permissions.`;
                if (welcomeError) msg += `\n⚠️ Could not update the welcome message.`;

                await interaction.update({
                    content: msg,
                    components: [],
                    embeds: []
                });
            } catch (err) {
                try {
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: `❌ Failed to assign ticket: ${err.message || err}`,
                            components: [],
                            embeds: [],
                            ephemeral: true
                        });
                    } else {
                        await interaction.editReply({
                            content: `❌ Failed to assign ticket: ${err.message || err}`,
                            components: [],
                            embeds: []
                        });
                    }
                } catch (err2) {
                    // Silent fail
                }
            }
        } catch (err) {
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: `❌ An error occurred during assignment: ${err.message || err}`,
                        components: [],
                        embeds: []
                    });
                } else {
                    await interaction.reply({
                        content: `❌ An error occurred during assignment: ${err.message || err}`,
                        ephemeral: true
                    });
                }
            } catch (err2) {
                // Silent fail
            }
        }
    }
};
