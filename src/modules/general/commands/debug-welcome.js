const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'General',
    data: new SlashCommandBuilder()
        .setName('debug-welcome')
        .setDescription('Debug welcome system configuration')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        // Check permissions first
        const permissionCheck = Utils.checkAutorolePermissions(interaction);
        if (!permissionCheck.hasPermission) {
            return interaction.reply({
                content: permissionCheck.reason,
                ephemeral: true
            });
        }

        try {
            const guildData = await Utils.getGuildData(interaction.guildId, interaction.guild.name);
            
            if (!guildData) {
                return interaction.reply({
                    content: '❌ No guild data found!',
                    ephemeral: true
                });
            }

            const welcomeConfig = guildData.welcomeSystem?.welcome;
            const leaveConfig = guildData.welcomeSystem?.leave;
            const dmConfig = guildData.welcomeSystem?.dmWelcome;

            const debugInfo = [
                '**🔍 Welcome System Debug Info**',
                '',
                `**Guild ID:** ${interaction.guildId}`,
                `**Guild Name:** ${interaction.guild.name}`,
                `**Database Entry:** ${guildData ? '✅ Found' : '❌ Not found'}`,
                '',
                '**Welcome System:**',
                `├ Exists: ${welcomeConfig ? '✅' : '❌'}`,
                `├ Enabled: ${welcomeConfig?.enabled ? '✅' : '❌'}`,
                `├ Channel ID: ${welcomeConfig?.channelId || 'Not set'}`,
                `└ Channel Valid: ${welcomeConfig?.channelId ? (interaction.guild.channels.cache.get(welcomeConfig.channelId) ? '✅' : '❌') : '❌'}`,
                '',
                '**Leave System:**',
                `├ Exists: ${leaveConfig ? '✅' : '❌'}`,
                `├ Enabled: ${leaveConfig?.enabled ? '✅' : '❌'}`,
                `├ Channel ID: ${leaveConfig?.channelId || 'Not set'}`,
                `└ Channel Valid: ${leaveConfig?.channelId ? (interaction.guild.channels.cache.get(leaveConfig.channelId) ? '✅' : '❌') : '❌'}`,
                '',
                '**DM Welcome:**',
                `├ Exists: ${dmConfig ? '✅' : '❌'}`,
                `└ Enabled: ${dmConfig?.enabled ? '✅' : '❌'}`,
                '',
                '**Next Steps:**',
                '1. Use `/welcome setup welcome #channel` to set up welcome messages',
                '2. Use `/welcome setup leave #channel` to set up leave messages',
                '3. Use `/welcome test` to test the system'
            ].join('\n');

            await interaction.reply({
                content: `\`\`\`${debugInfo}\`\`\``,
                ephemeral: true
            });

        } catch (error) {
            console.error('Debug welcome error:', error);
            await interaction.reply({
                content: `❌ Debug error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
