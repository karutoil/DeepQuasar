const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'General',
    data: new SlashCommandBuilder()
        .setName('create-guild-data')
        .setDescription('Force create/update guild data with welcome system (Debug)')
        .setDefaultMemberPermissions(null), // Hidden from all users

    async execute(interaction) {
        // Check permissions first - This is a debug command
        const permissionCheck = Utils.checkTestingPermissions(interaction);
        if (!permissionCheck.hasPermission) {
            return interaction.reply({
                content: permissionCheck.reason,
                ephemeral: true
            });
        }

        try {
            const Guild = require('../../../schemas/Guild');
            
            // Try to find existing guild data
            let guildData = await Guild.findByGuildId(interaction.guildId);
            
            if (!guildData) {
                // Create new guild data
                guildData = await Guild.createDefault(interaction.guildId, interaction.guild.name);
                await interaction.reply({
                    content: '✅ Created new guild data with welcome system!',
                    ephemeral: true
                });
            } else {
                // Update existing guild data to ensure it has welcome system
                if (!guildData.welcomeSystem) {
                    guildData.welcomeSystem = {
                        welcome: {
                            enabled: false,
                            channelId: null,
                            message: 'Welcome {user.mention} to **{guild.name}**! 🎉\n\nYou are our **{guild.memberCount}** member!',
                            embedEnabled: true,
                            embedColor: '#57F287',
                            showAccountAge: true,
                            showJoinPosition: true,
                            showInviter: true,
                            deleteAfter: 0,
                            mentionUser: true
                        },
                        leave: {
                            enabled: false,
                            channelId: null,
                            message: '👋 **{user.tag}** has left the server.\n\nWe now have **{guild.memberCount}** members.',
                            embedEnabled: true,
                            embedColor: '#ED4245',
                            showAccountAge: true,
                            showJoinDate: true,
                            showTimeInServer: true,
                            deleteAfter: 0
                        },
                        dmWelcome: {
                            enabled: false,
                            message: 'Welcome to **{guild.name}**! 🎉\n\nThanks for joining our community!',
                            embedEnabled: true,
                            embedColor: '#5865F2'
                        }
                    };
                    
                    await guildData.save();
                    
                    await interaction.reply({
                        content: '✅ Updated existing guild data with welcome system!',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '✅ Guild data already has welcome system configured!',
                        ephemeral: true
                    });
                }
            }
            
        } catch (error) {
            console.error('Error creating guild data:', error);
            await interaction.reply({
                content: `❌ Error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
