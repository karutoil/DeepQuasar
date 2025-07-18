const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const TempVCInstance = require('../../../schemas/TempVCInstance');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'Voice',
    data: new SlashCommandBuilder()
        .setName('tempvc-list')
        .setDescription('View and manage active temporary voice channels')
        .addSubcommand(subcommand =>
            subcommand
                .setName('all')
                .setDescription('List all active temp VCs in the server'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('mine')
                .setDescription('List your own temp VCs'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('List temp VCs owned by a specific user')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to check')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cleanup')
                .setDescription('Clean up inactive temp VCs (Admin only)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View temp VC statistics for the server')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'all':
                    await this.handleListAll(interaction);
                    break;
                case 'mine':
                    await this.handleListMine(interaction);
                    break;
                case 'user':
                    await this.handleListUser(interaction);
                    break;
                case 'cleanup':
                    await this.handleCleanup(interaction);
                    break;
                case 'stats':
                    await this.handleStats(interaction);
                    break;
                default:
                    await interaction.reply({
                        embeds: [Utils.createErrorEmbed('Error', 'Unknown subcommand')],
                        ephemeral: true
                    });
            }
        } catch (error) {
            console.error('Error in tempvc-list command:', error);
            const embed = Utils.createErrorEmbed('Error', 'An error occurred while processing the command.');
            
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    },

    async handleListAll(interaction) {
        const instances = await TempVCInstance.findByGuildId(interaction.guild.id);
        
        if (instances.length === 0) {
            return interaction.reply({
                embeds: [Utils.createInfoEmbed('No Active Channels', 'There are no active temporary voice channels in this server.')],
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎙️ Active Temporary Voice Channels')
            .setColor(0x5865F2)
            .setTimestamp();

        let description = '';
        let activeChannels = 0;

        for (const instance of instances) {
            const channel = interaction.guild.channels.cache.get(instance.channelId);
            if (!channel) {
                // Channel doesn't exist anymore, clean it up
                await TempVCInstance.deleteOne({ _id: instance._id });
                continue;
            }

            const owner = await interaction.guild.members.fetch(instance.ownerId).catch(() => null);
            const memberCount = channel.members.size;
            const uptime = this.formatUptime(Date.now() - instance.createdAt.getTime());

            description += `**${channel.name}**\n`;
            description += `└ Owner: ${owner ? owner.displayName : 'Unknown'}\n`;
            description += `└ Members: ${memberCount}/${instance.settings.userLimit || '∞'}\n`;
            description += `└ Uptime: ${uptime}\n`;
            description += `└ Status: ${instance.settings.locked ? '🔒' : '🔓'} ${instance.settings.hidden ? '👁️' : '👀'}\n\n`;

            activeChannels++;

            // Discord embed description limit
            if (description.length > 3500) {
                description += '...and more';
                break;
            }
        }

        embed.setDescription(description);
        embed.setFooter({ text: `${activeChannels} active channels` });

        await interaction.reply({ embeds: [embed] });
    },

    async handleListMine(interaction) {
        const instances = await TempVCInstance.findByOwnerId(interaction.guild.id, interaction.user.id);
        
        if (instances.length === 0) {
            return interaction.reply({
                embeds: [Utils.createInfoEmbed('No Channels', 'You don\'t own any temporary voice channels.')],
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎙️ Your Temporary Voice Channels')
            .setColor(0x57F287)
            .setTimestamp();

        let description = '';

        for (const instance of instances) {
            const channel = interaction.guild.channels.cache.get(instance.channelId);
            if (!channel) {
                // Channel doesn't exist anymore, clean it up
                await TempVCInstance.deleteOne({ _id: instance._id });
                continue;
            }

            const memberCount = channel.members.size;
            const uptime = this.formatUptime(Date.now() - instance.createdAt.getTime());

            description += `**${channel.name}** (<#${channel.id}>)\n`;
            description += `└ Members: ${memberCount}/${instance.settings.userLimit || '∞'}\n`;
            description += `└ Peak Members: ${instance.activity.peakMemberCount}\n`;
            description += `└ Uptime: ${uptime}\n`;
            description += `└ Status: ${instance.settings.locked ? '🔒 Locked' : '🔓 Unlocked'} ${instance.settings.hidden ? '👁️ Hidden' : '👀 Visible'}\n\n`;
        }

        embed.setDescription(description);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleListUser(interaction) {
        const user = interaction.options.getUser('user');
        const instances = await TempVCInstance.findByOwnerId(interaction.guild.id, user.id);
        
        if (instances.length === 0) {
            return interaction.reply({
                embeds: [Utils.createInfoEmbed('No Channels', `${user.tag} doesn't own any temporary voice channels.`)],
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🎙️ ${user.displayName}'s Temporary Voice Channels`)
            .setColor(0x5865F2)
            .setTimestamp();

        let description = '';

        for (const instance of instances) {
            const channel = interaction.guild.channels.cache.get(instance.channelId);
            if (!channel) {
                // Channel doesn't exist anymore, clean it up
                await TempVCInstance.deleteOne({ _id: instance._id });
                continue;
            }

            const memberCount = channel.members.size;
            const uptime = this.formatUptime(Date.now() - instance.createdAt.getTime());

            description += `**${channel.name}**\n`;
            description += `└ Members: ${memberCount}/${instance.settings.userLimit || '∞'}\n`;
            description += `└ Uptime: ${uptime}\n`;
            description += `└ Status: ${instance.settings.locked ? '🔒' : '🔓'} ${instance.settings.hidden ? '👁️' : '👀'}\n\n`;
        }

        embed.setDescription(description);

        await interaction.reply({ embeds: [embed] });
    },

    async handleCleanup(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Permission Denied', 'You need Manage Channels permission to use this command.')],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const instances = await TempVCInstance.findByGuildId(interaction.guild.id);
        let deletedCount = 0;
        let errors = 0;

        for (const instance of instances) {
            const channel = interaction.guild.channels.cache.get(instance.channelId);
            
            // Delete if channel doesn't exist or is empty
            if (!channel || channel.members.size === 0) {
                try {
                    if (channel) {
                        await channel.delete('Temp VC cleanup');
                    }
                    await TempVCInstance.deleteOne({ _id: instance._id });
                    deletedCount++;
                } catch (error) {
                    errors++;
                    console.error('Error during cleanup:', error);
                }
            }
        }

        const embed = Utils.createSuccessEmbed(
            'Cleanup Complete',
            `Cleaned up ${deletedCount} inactive channels.${errors > 0 ? `\n${errors} errors occurred.` : ''}`
        );

        await interaction.editReply({ embeds: [embed] });
    },

    async handleStats(interaction) {
        const instances = await TempVCInstance.findByGuildId(interaction.guild.id);
        
        let totalChannels = 0;
        let activeChannels = 0;
        let totalMembers = 0;
        let longestUptime = 0;
        let mostMembers = 0;
        let totalUptime = 0;

        for (const instance of instances) {
            const channel = interaction.guild.channels.cache.get(instance.channelId);
            
            if (channel) {
                activeChannels++;
                totalMembers += channel.members.size;
                
                const uptime = Date.now() - instance.createdAt.getTime();
                totalUptime += uptime;
                
                if (uptime > longestUptime) {
                    longestUptime = uptime;
                }
                
                if (instance.activity.peakMemberCount > mostMembers) {
                    mostMembers = instance.activity.peakMemberCount;
                }
            }
            totalChannels++;
        }

        const embed = new EmbedBuilder()
            .setTitle('📊 Temp VC Statistics')
            .setColor(0x5865F2)
            .addFields(
                {
                    name: '📈 Channel Stats',
                    value: [
                        `**Total Channels:** ${totalChannels}`,
                        `**Active Channels:** ${activeChannels}`,
                        `**Total Members:** ${totalMembers}`,
                        `**Average Members:** ${activeChannels > 0 ? Math.round(totalMembers / activeChannels * 100) / 100 : 0}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⏱️ Time Stats',
                    value: [
                        `**Longest Uptime:** ${this.formatUptime(longestUptime)}`,
                        `**Average Uptime:** ${activeChannels > 0 ? this.formatUptime(totalUptime / activeChannels) : '0s'}`,
                        `**Peak Members:** ${mostMembers}`
                    ].join('\n'),
                    inline: true
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    }
};
