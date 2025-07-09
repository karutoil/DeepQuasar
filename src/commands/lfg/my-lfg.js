const { SlashCommandBuilder } = require('discord.js');
const LFGPost = require('../../schemas/LFGPost');
const LFGUtils = require('../../utils/LFGUtils');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'LFG',
    data: new SlashCommandBuilder()
        .setName('my-lfg')
        .setDescription('Manage your LFG posts')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check your current LFG post status')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete your current LFG post')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('View your recent LFG posts')
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'status':
                    await this.handleStatus(interaction);
                    break;
                case 'delete':
                    await this.handleDelete(interaction);
                    break;
                case 'history':
                    await this.handleHistory(interaction);
                    break;
            }

        } catch (error) {
            console.error('Error in my-lfg command:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Command Error',
                    'An error occurred while processing your request.'
                )]
            });
        }
    },

    async handleStatus(interaction) {
        const settings = await LFGUtils.getGuildSettings(interaction.guild.id);
        const activePost = await LFGUtils.hasActiveLFGPost(interaction.user.id, interaction.guild.id);
        const cooldownCheck = await LFGUtils.checkCooldown(interaction.user.id, interaction.guild.id);

        let statusText = [];

        // Active post status
        if (activePost) {
            const channel = interaction.guild.channels.cache.get(activePost.channelId);
            statusText.push(`✅ **Active LFG Post:**`);
            statusText.push(`• Game: **${activePost.gameName}**`);
            statusText.push(`• Channel: ${channel ? channel.toString() : 'Unknown Channel'}`);
            statusText.push(`• Type: ${activePost.postType === 'voice' ? '🔊 Voice Channel' : '💬 DM Style'}`);
            statusText.push(`• Created: <t:${Math.floor(activePost.createdAt.getTime() / 1000)}:R>`);
            
            if (activePost.expiresAt) {
                statusText.push(`• Expires: <t:${Math.floor(activePost.expiresAt.getTime() / 1000)}:R>`);
            }
        } else {
            statusText.push(`❌ **No Active LFG Post**`);
        }

        statusText.push(''); // Empty line

        // Cooldown status
        if (cooldownCheck.onCooldown) {
            statusText.push(`⏰ **Cooldown:** ${cooldownCheck.remainingTimeFormatted} remaining`);
        } else {
            statusText.push(`✅ **Ready to post** (no cooldown)`);
        }

        // Server settings summary
        statusText.push(''); // Empty line
        statusText.push(`📋 **Server Settings:**`);
        statusText.push(`• Trigger Mode: ${settings.triggerMode}`);
        statusText.push(`• Cooldown: ${settings.cooldown.enabled ? `${Math.floor(settings.cooldown.duration / 60000)}m` : 'Disabled'}`);
        statusText.push(`• Post Expiration: ${settings.expiration.enabled ? `${Math.floor(settings.expiration.duration / 60000)}m` : 'Disabled'}`);

        const embed = Utils.createEmbed({
            title: '📊 Your LFG Status',
            description: statusText.join('\n'),
            color: activePost ? '#57F287' : '#FEE75C'
        });

        await interaction.editReply({ embeds: [embed] });
    },

    async handleDelete(interaction) {
        const activePost = await LFGUtils.hasActiveLFGPost(interaction.user.id, interaction.guild.id);

        if (!activePost) {
            return await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'No Active Post',
                    'You don\'t have any active LFG posts to delete.'
                )]
            });
        }

        try {
            // Delete the message
            const channel = interaction.guild.channels.cache.get(activePost.channelId);
            if (channel) {
                const message = await channel.messages.fetch(activePost.messageId).catch(() => null);
                if (message) {
                    await message.delete().catch(() => {});
                }
            }

            // Mark as inactive
            activePost.isActive = false;
            await activePost.save();

            // Log the deletion
            await LFGUtils.logLFGAction(interaction.guild, 'Post Deleted', interaction.user, {
                gameName: activePost.gameName,
                channel: channel
            });

            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed(
                    'LFG Post Deleted',
                    `Your LFG post for **${activePost.gameName}** has been deleted.`
                )]
            });

        } catch (error) {
            console.error('Error deleting user LFG post:', error);
            
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Deletion Error',
                    'An error occurred while deleting your post. Please try again or contact an administrator.'
                )]
            });
        }
    },

    async handleHistory(interaction) {
        const userPosts = await LFGPost.find({
            guildId: interaction.guild.id,
            userId: interaction.user.id
        }).sort({ createdAt: -1 }).limit(10);

        if (userPosts.length === 0) {
            return await interaction.editReply({
                embeds: [Utils.createEmbed({
                    title: '📝 Your LFG History',
                    description: 'You haven\'t created any LFG posts yet.',
                    color: '#FEE75C'
                })]
            });
        }

        const activePosts = userPosts.filter(post => post.isActive).length;

        let description = `**Active Posts:** ${activePosts} | **Total Posts:** ${userPosts.length}\n\n`;

        for (const post of userPosts.slice(0, 8)) {
            const channel = interaction.guild.channels.cache.get(post.channelId);
            const status = post.isActive ? '🟢' : '🔴';
            
            description += `${status} **${post.gameName}**\n`;
            description += `• ${post.message.slice(0, 80)}${post.message.length > 80 ? '...' : ''}\n`;
            description += `• ${channel ? channel.toString() : 'Unknown Channel'} • <t:${Math.floor(post.createdAt.getTime() / 1000)}:R>\n\n`;
        }

        const embed = Utils.createEmbed({
            title: '📝 Your LFG History',
            description: description,
            color: '#5865F2'
        });

        if (userPosts.length > 8) {
            embed.setFooter({ text: `Showing latest 8 of ${userPosts.length} posts` });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};
