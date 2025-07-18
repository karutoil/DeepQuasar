const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const TicketConfig = require('../../../schemas/TicketConfig');
const Ticket = require('../../../schemas/Ticket');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'Tickets',
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('View comprehensive ticket system dashboard and analytics')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('No Configuration', 
                        'Ticket system is not configured for this server.\n\n' +
                        'Use `/tickets setup-automatic` for easy setup or `/tickets setup` for manual setup.')]
                });
            }

            // Get ticket statistics
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            const [totalTickets, openTickets, closedTickets, weeklyTickets, monthlyTickets] = await Promise.all([
                Ticket.countDocuments({ guildId: interaction.guild.id }),
                Ticket.countDocuments({ guildId: interaction.guild.id, status: 'open' }),
                Ticket.countDocuments({ guildId: interaction.guild.id, status: 'closed' }),
                Ticket.countDocuments({ guildId: interaction.guild.id, createdAt: { $gte: oneWeekAgo } }),
                Ticket.countDocuments({ guildId: interaction.guild.id, createdAt: { $gte: oneMonthAgo } })
            ]);

            // Get recent tickets for activity overview
            const recentTickets = await Ticket.find({ guildId: interaction.guild.id })
                .sort({ createdAt: -1 })
                .limit(5);

            // Build configuration overview
            const channelInfo = await this.getChannelInfo(interaction.guild, config);
            const staffInfo = this.getStaffInfo(interaction.guild, config);

            // Main dashboard embed
            const dashboardEmbed = Utils.createEmbed({
                title: '📊 Ticket System Dashboard',
                description: 'Comprehensive overview of your ticket system configuration and statistics.',
                color: 0x5865F2,
                fields: [
                    {
                        name: '📈 Statistics',
                        value: `**Total Tickets:** ${totalTickets}\n` +
                               `**Open:** ${openTickets}\n` +
                               `**Closed:** ${closedTickets}\n` +
                               `**This Week:** ${weeklyTickets}\n` +
                               `**This Month:** ${monthlyTickets}`,
                        inline: true
                    },
                    {
                        name: '🔧 Configuration Status',
                        value: `**Setup Complete:** ${this.getSetupStatus(config)}\n` +
                               `**Panels Created:** ${config.panels.length}\n` +
                               `**Staff Roles:** ${config.staffRoles.length}\n` +
                               `**Auto-close:** ${config.autoClose.enabled ? '✅' : '❌'}\n` +
                               `**Logging:** ${config.logging.enabled ? '✅' : '❌'}`,
                        inline: true
                    },
                    {
                        name: '🏛️ Channels & Categories',
                        value: channelInfo,
                        inline: false
                    },
                    {
                        name: '👥 Staff Configuration',
                        value: staffInfo,
                        inline: false
                    }
                ],
                footer: { text: 'Use the buttons below for quick actions' }
            });

            // Recent activity embed
            const activityEmbed = Utils.createEmbed({
                title: '🕒 Recent Activity',
                description: recentTickets.length > 0 ? 
                    recentTickets.map(ticket => {
                        const statusEmoji = ticket.status === 'open' ? '🟢' : '🔴';
                        return `${statusEmoji} **#${ticket.ticketId}** - <@${ticket.userId}> • <t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>`;
                    }).join('\n') : 
                    'No recent ticket activity.',
                color: 0x99AAB5
            });

            // Settings overview embed
            const settingsEmbed = Utils.createEmbed({
                title: '⚙️ System Settings',
                color: 0x9B59B6,
                fields: [
                    {
                        name: 'Rate Limiting',
                        value: `**Max per user:** ${config.rateLimiting.maxTicketsPerUser}\n` +
                               `**Cooldown:** ${config.rateLimiting.cooldownMinutes} minutes`,
                        inline: true
                    },
                    {
                        name: 'General Settings',
                        value: `**Max open per user:** ${config.settings.maxOpenTicketsPerUser}\n` +
                               `**Ping staff on create:** ${config.settings.pingStaffOnCreate ? 'Yes' : 'No'}`,
                        inline: true
                    },
                    {
                        name: 'Auto-close Settings',
                        value: config.autoClose.enabled ? 
                            `**Enabled:** Yes\n**Inactivity time:** ${config.autoClose.inactivityHours} hours` :
                            '**Enabled:** No',
                        inline: true
                    },
                    {
                        name: 'DM Notifications',
                        value: `**On open:** ${config.dmNotifications.onOpen ? 'Yes' : 'No'}\n` +
                               `**On close:** ${config.dmNotifications.onClose ? 'Yes' : 'No'}`,
                        inline: true
                    },
                    {
                        name: 'Transcript Settings',
                        value: `**Format:** ${config.transcripts?.format || 'N/A'}\n` +
                               `**Include attachments:** ${config.transcripts?.includeAttachments ? 'Yes' : 'No'}`,
                        inline: true
                    },
                    {
                        name: 'Channel Naming',
                        value: `**Pattern:** \`${(config.channelNaming && config.channelNaming.pattern) || (config.naming && config.naming.pattern) || 'ticket-username'}\`\n` +
                               `**Max length:** ${(config.channelNaming && config.channelNaming.maxLength) || 32}`,
                        inline: true
                    }
                ]
            });

            // --- Ticket Analytics Embed ---
            // (Removed from main dashboard, now only shown via Analytics button)

            // Create action buttons
            const actionRow1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('dashboard_panels')
                        .setLabel('Manage Panels')
                        .setEmoji('🎛️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(false),
                    new ButtonBuilder()
                        .setCustomId('dashboard_staff')
                        .setLabel('Staff Settings')
                        .setEmoji('👥')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(false),
                    new ButtonBuilder()
                        .setCustomId('dashboard_settings')
                        .setLabel('System Settings')
                        .setEmoji('⚙️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(false)
                );

            const actionRow2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('dashboard_logs')
                        .setLabel('View Logs')
                        .setEmoji('📋')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(false),
                    new ButtonBuilder()
                        .setCustomId('dashboard_analytics')
                        .setLabel('Analytics')
                        .setEmoji('📊')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(false),
                    new ButtonBuilder()
                        .setCustomId('dashboard_refresh')
                        .setLabel('Refresh')
                        .setEmoji('🔄')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(false)
                );

            // Patch: Mark this as a message with buttons for interaction handlers
            // This is required for Discord.js to recognize the buttons as interactive
            // If you use a custom interaction handler, ensure it listens for these customIds

            await interaction.editReply({
                embeds: [dashboardEmbed, activityEmbed, settingsEmbed],
                components: [actionRow1, actionRow2]
            });

        } catch (error) {
            console.error('Error generating dashboard:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to generate dashboard. Please try again.')]
            });
        }
    },

    async getChannelInfo(guild, config) {
        const openCategory = guild.channels.cache.get(config.channels.openCategory);
        const closedCategory = guild.channels.cache.get(config.channels.closedCategory);
        const logChannel = guild.channels.cache.get(config.channels.modLogChannel);
        const archiveChannel = guild.channels.cache.get(config.channels.archiveChannel);

        return `**Open Category:** ${openCategory ? openCategory.toString() : '❌ Not set'}\n` +
               `**Closed Category:** ${closedCategory ? closedCategory.toString() : '❌ Not set'}\n` +
               `**Log Channel:** ${logChannel ? logChannel.toString() : '❌ Not set'}\n` +
               `**Archive Channel:** ${archiveChannel ? archiveChannel.toString() : '❌ Not set'}`;
    },

    getStaffInfo(guild, config) {
        if (config.staffRoles.length === 0) {
            return '❌ No staff roles configured';
        }

        return config.staffRoles.map(staffRole => {
            const role = guild.roles.cache.get(staffRole.roleId);
            const permissions = Object.entries(staffRole.permissions)
                .filter(([key, value]) => value)
                .map(([key]) => key.replace('can', ''))
                .join(', ');
            
            return `**${role ? role.name : 'Unknown Role'}:** ${permissions || 'No permissions'}`;
        }).join('\n');
    },

    getSetupStatus(config) {
        const required = [
            config.channels.openCategory,
            config.channels.closedCategory,
            config.channels.modLogChannel
        ];

        const configured = required.filter(Boolean).length;
        return configured === required.length ? '✅ Complete' : `⚠️ ${configured}/${required.length}`;
    },

    // --- Ticket Analytics Aggregation ---
    async getTicketAnalytics(guildId) {
        const Ticket = require('../../../schemas/Ticket');
        // Use last 100 tickets for analytics
        const recentTickets = await Ticket.find({ guildId }).sort({ createdAt: -1 }).limit(100);

        // Type breakdown
        const typeCounts = {};
        const priorityCounts = {};
        const tagCounts = {};
        let closeTimes = [];

        // Status breakdown
        const statusCounts = {
            open: 0,
            closed: 0,
            deleted: 0,
            archived: 0
        };

        // Agent breakdown
        const agentCounts = {};

        // Soft deleted count (isDeleted: true)
        const totalSoftDeleted = await Ticket.countDocuments({ guildId, isDeleted: true });

        for (const ticket of recentTickets) {
            // Type
            typeCounts[ticket.type] = (typeCounts[ticket.type] || 0) + 1;
            // Priority
            priorityCounts[ticket.priority] = (priorityCounts[ticket.priority] || 0) + 1;
            // Tags
            if (Array.isArray(ticket.tags)) {
                for (const tag of ticket.tags) {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                }
            }
            // Status
            if (ticket.status === 'open') statusCounts.open++;
            else if (ticket.status === 'closed') statusCounts.closed++;
            else if (ticket.status === 'deleted') statusCounts.deleted++;
            else if (ticket.status === 'archived') statusCounts.archived++;
            // Average close time
            if (ticket.status === 'closed' && ticket.closedBy && ticket.closedBy.closedAt && ticket.createdAt) {
                const hours = (ticket.closedBy.closedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
                closeTimes.push(hours);
            }
            // Agent assignment (top agents)
            if (
                ticket.assignedTo &&
                ticket.assignedTo.userId &&
                ticket.assignedTo.userId !== ticket.userId // Only count staff, not ticket creator
            ) {
                agentCounts[ticket.assignedTo.userId] = (agentCounts[ticket.assignedTo.userId] || 0) + 1;
            }
        }

        // Format for embed fields
        const types = Object.entries(typeCounts).map(([type, count]) => ({ _id: type, count }));
        const priorities = Object.entries(priorityCounts).map(([priority, count]) => ({ _id: priority, count }));
        const tags = Object.entries(tagCounts).map(([tag, count]) => ({ _id: tag, count }));
        const avgCloseTime = closeTimes.length > 0
            ? (closeTimes.reduce((a, b) => a + b, 0) / closeTimes.length).toFixed(2)
            : null;

        // Top 4 agents
        const topAgents = Object.entries(agentCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([userId, count]) => ({ userId, count }));

        return {
            types,
            priorities,
            tags,
            avgCloseTime,
            statusCounts,
            topAgents,
            totalSoftDeleted
        };
    }
};
