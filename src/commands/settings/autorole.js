const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Settings',
    permissions: [PermissionFlagsBits.ManageGuild],
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Configure automatic role assignment for new members')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Enable and configure autorole')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to automatically assign to new members')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('delay')
                        .setDescription('Delay in seconds before assigning role (0 for instant)')
                        .setRequired(false)
                        .setMinValue(0)
                        .setMaxValue(3600)
                )
                .addBooleanOption(option =>
                    option
                        .setName('skip-bots')
                        .setDescription('Skip role assignment for bots (default: true)')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option
                        .setName('require-verification')
                        .setDescription('Only assign role to verified members (default: false)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable autorole system')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('View current autorole configuration')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Test autorole configuration')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'setup':
                    await this.handleSetup(interaction);
                    break;
                case 'disable':
                    await this.handleDisable(interaction);
                    break;
                case 'status':
                    await this.handleStatus(interaction);
                    break;
                case 'test':
                    await this.handleTest(interaction);
                    break;
            }
        } catch (error) {
            interaction.client.logger.error('AutoRole command error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while executing the autorole command.')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleSetup(interaction) {
        const role = interaction.options.getRole('role');
        const delay = interaction.options.getInteger('delay') ?? 0;
        const skipBots = interaction.options.getBoolean('skip-bots') ?? true;
        const requireVerification = interaction.options.getBoolean('require-verification') ?? false;

        // Validation checks
        if (role.managed) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Invalid Role')
                .setDescription('Cannot assign managed roles (roles created by integrations/bots).')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Role Hierarchy Error')
                .setDescription(`The role ${role} is higher than my highest role. Please move my role above it or choose a lower role.`)
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Missing Permissions')
                .setDescription('I need the "Manage Roles" permission to use the autorole system.')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Update guild settings
        const guildData = await Utils.getGuildData(interaction.guild.id);
        guildData.autoRole = {
            enabled: true,
            roleId: role.id,
            delay: delay,
            botBypass: skipBots,
            requireVerification: requireVerification
        };

        await guildData.save();

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✅ AutoRole Configured')
            .setDescription(`AutoRole has been successfully configured!`)
            .addFields(
                { name: '🎭 Role', value: `${role}`, inline: true },
                { name: '⏱️ Delay', value: delay > 0 ? `${delay} seconds` : 'Instant', inline: true },
                { name: '🤖 Skip Bots', value: skipBots ? 'Yes' : 'No', inline: true },
                { name: '✅ Require Verification', value: requireVerification ? 'Yes' : 'No', inline: true }
            )
            .setFooter({ text: 'AutoRole is now active for new members!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleDisable(interaction) {
        const guildData = await Utils.getGuildData(interaction.guild.id);
        
        if (!guildData.autoRole.enabled) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Already Disabled')
                .setDescription('AutoRole is already disabled for this server.')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        guildData.autoRole.enabled = false;
        await guildData.save();

        // Cancel any pending role assignments
        if (interaction.client.autoRoleManager) {
            const stats = interaction.client.autoRoleManager.getStatistics(interaction.guild.id);
            if (stats.pendingAssignments > 0) {
                // Cancel pending assignments for this guild
                interaction.guild.members.cache.forEach(member => {
                    interaction.client.autoRoleManager.cancelPendingAssignment(interaction.guild.id, member.id);
                });
            }
        }

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✅ AutoRole Disabled')
            .setDescription('AutoRole has been disabled for this server.')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleStatus(interaction) {
        const guildData = await Utils.getGuildData(interaction.guild.id);
        
        if (!guildData.autoRole.enabled) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ AutoRole Disabled')
                .setDescription('AutoRole is currently disabled for this server.')
                .addFields({
                    name: '💡 Enable AutoRole',
                    value: 'Use `/autorole setup` to configure and enable the autorole system.',
                    inline: false
                })
                .setTimestamp();

            return await interaction.reply({ embeds: [embed] });
        }

        const role = interaction.guild.roles.cache.get(guildData.autoRole.roleId);
        const roleName = role ? role.toString() : `<@&${guildData.autoRole.roleId}> (Role not found)`;

        let statusColor = '#57F287';
        let statusText = '✅ Active';
        const issues = [];

        // Check for potential issues
        if (!role) {
            issues.push('⚠️ Configured role no longer exists');
            statusColor = '#FF0000';
            statusText = '❌ Error - Role Missing';
        } else if (role.position >= interaction.guild.members.me.roles.highest.position) {
            issues.push('⚠️ Role is higher than bot\'s highest role');
            statusColor = '#FFA500';
            statusText = '⚠️ Warning - Role Hierarchy';
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            issues.push('⚠️ Bot lacks "Manage Roles" permission');
            statusColor = '#FF0000';
            statusText = '❌ Error - Missing Permissions';
        }

        const embed = new EmbedBuilder()
            .setColor(statusColor)
            .setTitle('🎭 AutoRole Status')
            .setDescription(`**Status:** ${statusText}`)
            .addFields(
                { name: '🎭 Role', value: roleName, inline: true },
                { name: '⏱️ Delay', value: guildData.autoRole.delay > 0 ? `${guildData.autoRole.delay} seconds` : 'Instant', inline: true },
                { name: '🤖 Skip Bots', value: guildData.autoRole.botBypass ? 'Yes' : 'No', inline: true },
                { name: '✅ Require Verification', value: guildData.autoRole.requireVerification ? 'Yes' : 'No', inline: true }
            );

        // Add statistics if autoRoleManager is available
        if (interaction.client.autoRoleManager) {
            const stats = interaction.client.autoRoleManager.getStatistics(interaction.guild.id);
            embed.addFields({
                name: '📊 Statistics',
                value: `**Pending Assignments:** ${stats.pendingAssignments}`,
                inline: false
            });
        }

        if (issues.length > 0) {
            embed.addFields({
                name: '⚠️ Issues',
                value: issues.join('\n'),
                inline: false
            });
        }

        embed.setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleTest(interaction) {
        await interaction.deferReply();

        const testResult = await interaction.client.autoRoleManager.testConfiguration(interaction.guild);
        
        let color = '#57F287';
        let title = '✅ AutoRole Test Passed';
        let description = 'All autorole configurations are working correctly!';

        if (testResult.issues.length > 0) {
            color = '#FF0000';
            title = '❌ AutoRole Test Failed';
            description = 'Issues found with autorole configuration:';
        }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(description);

        if (testResult.issues.length > 0) {
            embed.addFields({
                name: '🚨 Issues Found',
                value: testResult.issues.map(issue => `• ${issue}`).join('\n'),
                inline: false
            });
        }

        embed.addFields(
            { name: '🔧 Enabled', value: testResult.enabled ? '✅' : '❌', inline: true },
            { name: '🎭 Role Exists', value: testResult.roleExists ? '✅' : '❌', inline: true },
            { name: '🔐 Bot Permissions', value: testResult.botPermissions ? '✅' : '❌', inline: true },
            { name: '📊 Role Position', value: testResult.rolePosition ? '✅' : '❌', inline: true }
        );

        embed.setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
