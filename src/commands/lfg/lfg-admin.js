const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const LFGPost = require('../../schemas/LFGPost');
const LFGSettings = require('../../schemas/LFGSettings');
const LFGCooldown = require('../../schemas/LFGCooldown');
const LFGUtils = require('../../utils/LFGUtils');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'LFG',
    permissions: [PermissionFlagsBits.ManageGuild],
    data: new SlashCommandBuilder()
        .setName('lfg-admin')
        .setDescription('LFG administration commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View LFG statistics for this server')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('active-posts')
                .setDescription('View all active LFG posts')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('user-posts')
                .setDescription('View LFG posts for a specific user')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to check')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('cleanup')
                .setDescription('Manually run LFG cleanup')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear-cooldowns')
                .setDescription('Clear all user cooldowns')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete-post')
                .setDescription('Delete a specific LFG post')
                .addStringOption(option =>
                    option
                        .setName('post-id')
                        .setDescription('LFG post ID to delete')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'stats':
                    await this.handleStats(interaction);
                    break;
                case 'active-posts':
                    await this.handleActivePosts(interaction);
                    break;
                case 'user-posts':
                    await this.handleUserPosts(interaction);
                    break;
                case 'cleanup':
                    await this.handleCleanup(interaction);
                    break;
                case 'clear-cooldowns':
                    await this.handleClearCooldowns(interaction);
                    break;
                case 'delete-post':
                    await this.handleDeletePost(interaction);
                    break;
            }

        } catch (error) {
            console.error('Error in LFG admin command:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Admin Error',
                    'An error occurred while executing the admin command.'
                )]
            });
        }
    },

    async handleStats(interaction) {
        const guildId = interaction.guild.id;

        // Get various statistics
        const [
            totalPosts,
            activePosts,
            voicePosts,
            dmPosts,
            postsToday,
            postsThisWeek,
            topUsers,
            topGames
        ] = await Promise.all([
            LFGPost.countDocuments({ guildId }),
            LFGPost.countDocuments({ guildId, isActive: true }),
            LFGPost.countDocuments({ guildId, postType: 'voice' }),
            LFGPost.countDocuments({ guildId, postType: 'dm' }),
            LFGPost.countDocuments({
                guildId,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }),
            LFGPost.countDocuments({
                guildId,
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }),
            LFGPost.aggregate([
                { $match: { guildId } },
                { $group: { _id: '$userId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),
            LFGPost.aggregate([
                { $match: { guildId } },
                { $group: { _id: '$gameName', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ])
        ]);

        const embed = new EmbedBuilder()
            .setTitle('📊 LFG Statistics')
            .setColor('#5865F2')
            .setTimestamp()
            .addFields([
                {
                    name: '📈 Overall Stats',
                    value: [
                        `**Total Posts:** ${totalPosts}`,
                        `**Active Posts:** ${activePosts}`,
                        `**Voice Posts:** ${voicePosts}`,
                        `**DM Posts:** ${dmPosts}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⏰ Recent Activity',
                    value: [
                        `**Posts Today:** ${postsToday}`,
                        `**Posts This Week:** ${postsThisWeek}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '👥 Top Users',
                    value: topUsers.length > 0 ? 
                        topUsers.map((user, index) => `${index + 1}. <@${user._id}> (${user.count})`).join('\n') :
                        'No data available',
                    inline: false
                },
                {
                    name: '🎮 Popular Games',
                    value: topGames.length > 0 ?
                        topGames.map((game, index) => `${index + 1}. ${game._id} (${game.count})`).join('\n') :
                        'No data available',
                    inline: false
                }
            ]);

        await interaction.editReply({ embeds: [embed] });
    },

    async handleActivePosts(interaction) {
        const activePosts = await LFGPost.find({
            guildId: interaction.guild.id,
            isActive: true
        }).sort({ createdAt: -1 }).limit(10);

        if (activePosts.length === 0) {
            return await interaction.editReply({
                embeds: [Utils.createEmbed({
                    title: '📝 Active LFG Posts',
                    description: 'No active LFG posts found.',
                    color: '#FEE75C'
                })]
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('📝 Active LFG Posts')
            .setColor('#5865F2')
            .setTimestamp();

        for (const post of activePosts) {
            const user = await interaction.client.users.fetch(post.userId).catch(() => null);
            const channel = interaction.guild.channels.cache.get(post.channelId);
            
            embed.addFields({
                name: `${post.gameName}`,
                value: [
                    `**User:** ${user ? user.tag : 'Unknown User'}`,
                    `**Channel:** ${channel ? channel.toString() : 'Unknown Channel'}`,
                    `**Type:** ${post.postType}`,
                    `**Created:** <t:${Math.floor(post.createdAt.getTime() / 1000)}:R>`,
                    `**Post ID:** \`${post._id}\``
                ].join('\n'),
                inline: false
            });
        }

        if (activePosts.length === 10) {
            embed.setFooter({ text: 'Showing latest 10 active posts' });
        }

        await interaction.editReply({ embeds: [embed] });
    },

    async handleUserPosts(interaction) {
        const targetUser = interaction.options.getUser('user');
        
        const userPosts = await LFGPost.find({
            guildId: interaction.guild.id,
            userId: targetUser.id
        }).sort({ createdAt: -1 }).limit(10);

        if (userPosts.length === 0) {
            return await interaction.editReply({
                embeds: [Utils.createEmbed({
                    title: `📝 LFG Posts - ${targetUser.tag}`,
                    description: 'This user has no LFG posts.',
                    color: '#FEE75C'
                })]
            });
        }

        const activePosts = userPosts.filter(post => post.isActive).length;
        const totalPosts = userPosts.length;

        const embed = new EmbedBuilder()
            .setTitle(`📝 LFG Posts - ${targetUser.tag}`)
            .setColor('#5865F2')
            .setTimestamp()
            .setDescription(`**Active Posts:** ${activePosts} | **Total Posts:** ${totalPosts}`);

        for (const post of userPosts.slice(0, 5)) {
            const channel = interaction.guild.channels.cache.get(post.channelId);
            
            embed.addFields({
                name: `${post.gameName} ${post.isActive ? '🟢' : '🔴'}`,
                value: [
                    `**Message:** ${post.message.slice(0, 100)}${post.message.length > 100 ? '...' : ''}`,
                    `**Channel:** ${channel ? channel.toString() : 'Unknown Channel'}`,
                    `**Type:** ${post.postType}`,
                    `**Created:** <t:${Math.floor(post.createdAt.getTime() / 1000)}:R>`,
                    `**Post ID:** \`${post._id}\``
                ].join('\n'),
                inline: false
            });
        }

        if (userPosts.length > 5) {
            embed.setFooter({ text: `Showing latest 5 of ${totalPosts} posts` });
        }

        await interaction.editReply({ embeds: [embed] });
    },

    async handleCleanup(interaction) {
        const LFGCleanupTask = require('../../handlers/lfg/LFGCleanupTask');
        
        await LFGCleanupTask.runCleanup(interaction.client);

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed(
                'Cleanup Complete',
                'LFG cleanup has been run manually. Expired posts have been removed.'
            )]
        });
    },

    async handleClearCooldowns(interaction) {
        const result = await LFGCooldown.deleteMany({ guildId: interaction.guild.id });

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed(
                'Cooldowns Cleared',
                `Cleared ${result.deletedCount} user cooldown(s) for this server.`
            )]
        });
    },

    async handleDeletePost(interaction) {
        const postId = interaction.options.getString('post-id');

        try {
            const post = await LFGPost.findById(postId);

            if (!post) {
                return await interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Post Not Found',
                        'No LFG post found with that ID.'
                    )]
                });
            }

            if (post.guildId !== interaction.guild.id) {
                return await interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Invalid Post',
                        'That post does not belong to this server.'
                    )]
                });
            }

            // Delete the message
            const channel = interaction.guild.channels.cache.get(post.channelId);
            if (channel) {
                const message = await channel.messages.fetch(post.messageId).catch(() => null);
                if (message) {
                    await message.delete().catch(() => {});
                }
            }

            // Mark as inactive
            post.isActive = false;
            await post.save();

            // Log the deletion
            const user = await interaction.client.users.fetch(post.userId).catch(() => null);
            if (user) {
                await LFGUtils.logLFGAction(interaction.guild, 'Post Deleted', user, {
                    gameName: post.gameName,
                    channel: channel
                });
            }

            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed(
                    'Post Deleted',
                    `LFG post for **${post.gameName}** has been deleted.`
                )]
            });

        } catch (error) {
            console.error('Error deleting LFG post:', error);
            
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Deletion Error',
                    'An error occurred while deleting the post.'
                )]
            });
        }
    }
};
