const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const SelfRole = require('../../schemas/SelfRole');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Settings',
    permissions: [PermissionFlagsBits.ManageGuild],
    data: new SlashCommandBuilder()
        .setName('selfrole-advanced')
        .setDescription('Advanced self-role management options')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('role-limits')
                .setDescription('Set limits for a specific role')
                .addStringOption(option =>
                    option
                        .setName('message-id')
                        .setDescription('ID of the self-role message')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to configure')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('max-assignments')
                        .setDescription('Maximum number of users who can have this role (0 = unlimited)')
                        .setRequired(false)
                        .setMinValue(0)
                        .setMaxValue(10000)
                )
                .addRoleOption(option =>
                    option
                        .setName('required-role')
                        .setDescription('Role required to assign this role')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('role-conflicts')
                .setDescription('Set conflicting roles for a role')
                .addStringOption(option =>
                    option
                        .setName('message-id')
                        .setDescription('ID of the self-role message')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to configure')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('conflicting-role')
                        .setDescription('Role that conflicts with the main role')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add Conflict', value: 'add' },
                            { name: 'Remove Conflict', value: 'remove' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reorder-roles')
                .setDescription('Reorder role buttons')
                .addStringOption(option =>
                    option
                        .setName('message-id')
                        .setDescription('ID of the self-role message')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to move')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('new-position')
                        .setDescription('New position (0 = first)')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(24)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('bulk-assign')
                .setDescription('Bulk assign roles to users (admin only)')
                .addStringOption(option =>
                    option
                        .setName('message-id')
                        .setDescription('ID of the self-role message')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to assign')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('user-ids')
                        .setDescription('Comma-separated list of user IDs')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('export-data')
                .setDescription('Export self-role data as JSON')
                .addStringOption(option =>
                    option
                        .setName('message-id')
                        .setDescription('ID of the self-role message (optional)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset-stats')
                .setDescription('Reset statistics for a self-role message')
                .addStringOption(option =>
                    option
                        .setName('message-id')
                        .setDescription('ID of the self-role message')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        // Check permissions first
        const permissionCheck = Utils.checkSelfrolePermissions(interaction);
        if (!permissionCheck.hasPermission) {
            return interaction.reply({
                content: permissionCheck.reason,
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const selfRoleManager = interaction.client.selfRoleManager;

        if (!selfRoleManager) {
            return await interaction.reply({
                content: '❌ Self-role manager is not initialized.',
                ephemeral: true
            });
        }

        try {
            switch (subcommand) {
                case 'role-limits':
                    await this.handleRoleLimits(interaction, selfRoleManager);
                    break;
                case 'role-conflicts':
                    await this.handleRoleConflicts(interaction, selfRoleManager);
                    break;
                case 'reorder-roles':
                    await this.handleReorderRoles(interaction, selfRoleManager);
                    break;
                case 'bulk-assign':
                    await this.handleBulkAssign(interaction, selfRoleManager);
                    break;
                case 'export-data':
                    await this.handleExportData(interaction, selfRoleManager);
                    break;
                case 'reset-stats':
                    await this.handleResetStats(interaction, selfRoleManager);
                    break;
                default:
                    await interaction.reply({
                        content: '❌ Unknown subcommand.',
                        ephemeral: true
                    });
            }
        } catch (error) {
            interaction.client.logger.error('Error in selfrole-advanced command:', error);
            const errorMessage = '❌ An error occurred while processing your request.';
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.editReply({ content: errorMessage });
            }
        }
    },

    async handleRoleLimits(interaction, selfRoleManager) {
        const messageId = interaction.options.getString('message-id');
        const role = interaction.options.getRole('role');
        const maxAssignments = interaction.options.getInteger('max-assignments');
        const requiredRole = interaction.options.getRole('required-role');

        await interaction.deferReply({ ephemeral: true });

        const selfRoleData = await SelfRole.findOne({ messageId, guildId: interaction.guild.id });
        if (!selfRoleData) {
            return await interaction.editReply({
                content: '❌ Self-role message not found.'
            });
        }

        const roleData = selfRoleData.roles.find(r => r.roleId === role.id);
        if (!roleData) {
            return await interaction.editReply({
                content: '❌ Role not found in this self-role message.'
            });
        }

        let changes = [];
        if (maxAssignments !== null) {
            roleData.maxAssignments = maxAssignments || null;
            changes.push(`max assignments: ${maxAssignments || 'unlimited'}`);
        }
        if (requiredRole) {
            roleData.requiredRole = requiredRole.id;
            changes.push(`required role: ${requiredRole.name}`);
        }

        if (changes.length === 0) {
            return await interaction.editReply({
                content: '❌ No changes specified.'
            });
        }

        selfRoleData.lastModified = {
            by: {
                userId: interaction.user.id,
                username: interaction.user.username
            },
            at: new Date()
        };

        await selfRoleData.save();
        await selfRoleManager.updateSelfRoleMessage(selfRoleData);

        await interaction.editReply({
            content: `✅ Successfully updated limits for **${role.name}**:\n${changes.map(c => `• ${c}`).join('\n')}`
        });
    },

    async handleRoleConflicts(interaction, selfRoleManager) {
        const messageId = interaction.options.getString('message-id');
        const role = interaction.options.getRole('role');
        const conflictingRole = interaction.options.getRole('conflicting-role');
        const action = interaction.options.getString('action');

        await interaction.deferReply({ ephemeral: true });

        const selfRoleData = await SelfRole.findOne({ messageId, guildId: interaction.guild.id });
        if (!selfRoleData) {
            return await interaction.editReply({
                content: '❌ Self-role message not found.'
            });
        }

        const roleData = selfRoleData.roles.find(r => r.roleId === role.id);
        if (!roleData) {
            return await interaction.editReply({
                content: '❌ Role not found in this self-role message.'
            });
        }

        if (action === 'add') {
            if (roleData.conflictingRoles.includes(conflictingRole.id)) {
                return await interaction.editReply({
                    content: '❌ This role is already marked as conflicting.'
                });
            }
            roleData.conflictingRoles.push(conflictingRole.id);
        } else {
            const index = roleData.conflictingRoles.indexOf(conflictingRole.id);
            if (index === -1) {
                return await interaction.editReply({
                    content: '❌ This role is not marked as conflicting.'
                });
            }
            roleData.conflictingRoles.splice(index, 1);
        }

        selfRoleData.lastModified = {
            by: {
                userId: interaction.user.id,
                username: interaction.user.username
            },
            at: new Date()
        };

        await selfRoleData.save();

        await interaction.editReply({
            content: `✅ Successfully ${action === 'add' ? 'added' : 'removed'} **${conflictingRole.name}** ${action === 'add' ? 'as a' : 'from'} conflicting role for **${role.name}**.`
        });
    },

    async handleReorderRoles(interaction, selfRoleManager) {
        const messageId = interaction.options.getString('message-id');
        const role = interaction.options.getRole('role');
        const newPosition = interaction.options.getInteger('new-position');

        await interaction.deferReply({ ephemeral: true });

        const selfRoleData = await SelfRole.findOne({ messageId, guildId: interaction.guild.id });
        if (!selfRoleData) {
            return await interaction.editReply({
                content: '❌ Self-role message not found.'
            });
        }

        const roleData = selfRoleData.roles.find(r => r.roleId === role.id);
        if (!roleData) {
            return await interaction.editReply({
                content: '❌ Role not found in this self-role message.'
            });
        }

        if (newPosition >= selfRoleData.roles.length) {
            return await interaction.editReply({
                content: `❌ Position must be between 0 and ${selfRoleData.roles.length - 1}.`
            });
        }

        roleData.position = newPosition;
        selfRoleData.roles.sort((a, b) => a.position - b.position);

        selfRoleData.lastModified = {
            by: {
                userId: interaction.user.id,
                username: interaction.user.username
            },
            at: new Date()
        };

        await selfRoleData.save();
        await selfRoleManager.updateSelfRoleMessage(selfRoleData);

        await interaction.editReply({
            content: `✅ Successfully moved **${role.name}** to position ${newPosition}.`
        });
    },

    async handleBulkAssign(interaction, selfRoleManager) {
        // Check if user has administrator permission
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '❌ This command requires Administrator permission.',
                ephemeral: true
            });
        }

        const messageId = interaction.options.getString('message-id');
        const role = interaction.options.getRole('role');
        const userIdsString = interaction.options.getString('user-ids');

        await interaction.deferReply({ ephemeral: true });

        const selfRoleData = await SelfRole.findOne({ messageId, guildId: interaction.guild.id });
        if (!selfRoleData) {
            return await interaction.editReply({
                content: '❌ Self-role message not found.'
            });
        }

        const roleData = selfRoleData.roles.find(r => r.roleId === role.id);
        if (!roleData) {
            return await interaction.editReply({
                content: '❌ Role not found in this self-role message.'
            });
        }

        const userIds = userIdsString.split(',').map(id => id.trim());
        const results = { success: 0, failed: 0, errors: [] };

        for (const userId of userIds) {
            try {
                const member = await interaction.guild.members.fetch(userId);
                if (!member) {
                    results.failed++;
                    results.errors.push(`User ${userId} not found`);
                    continue;
                }

                if (member.roles.cache.has(role.id)) {
                    results.failed++;
                    results.errors.push(`${member.user.tag} already has the role`);
                    continue;
                }

                await member.roles.add(role, 'Bulk self-role assignment');
                results.success++;
                
                // Update statistics
                selfRoleData.incrementRoleAssignment(role.id);
                selfRoleData.updateUserStats(userId);
            } catch (error) {
                results.failed++;
                results.errors.push(`${userId}: ${error.message}`);
            }
        }

        await selfRoleData.save();

        let responseMessage = `✅ Bulk assignment completed!\n• Success: ${results.success}\n• Failed: ${results.failed}`;
        
        if (results.errors.length > 0 && results.errors.length <= 10) {
            responseMessage += `\n\n**Errors:**\n${results.errors.map(e => `• ${e}`).join('\n')}`;
        } else if (results.errors.length > 10) {
            responseMessage += `\n\n**Errors:** ${results.errors.length} errors (too many to display)`;
        }

        await interaction.editReply({
            content: responseMessage
        });
    },

    async handleExportData(interaction, selfRoleManager) {
        const messageId = interaction.options.getString('message-id');

        await interaction.deferReply({ ephemeral: true });

        let data;
        if (messageId) {
            data = await SelfRole.findOne({ messageId, guildId: interaction.guild.id });
            if (!data) {
                return await interaction.editReply({
                    content: '❌ Self-role message not found.'
                });
            }
        } else {
            data = await SelfRole.find({ guildId: interaction.guild.id });
        }

        const exportData = {
            exported: new Date().toISOString(),
            guildId: interaction.guild.id,
            guildName: interaction.guild.name,
            data: data
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const buffer = Buffer.from(jsonString, 'utf8');

        const filename = messageId 
            ? `selfrole-${messageId}.json`
            : `selfrole-${interaction.guild.id}.json`;

        await interaction.editReply({
            content: '✅ Self-role data exported successfully!',
            files: [{
                attachment: buffer,
                name: filename
            }]
        });
    },

    async handleResetStats(interaction, selfRoleManager) {
        const messageId = interaction.options.getString('message-id');

        await interaction.deferReply({ ephemeral: true });

        const selfRoleData = await SelfRole.findOne({ messageId, guildId: interaction.guild.id });
        if (!selfRoleData) {
            return await interaction.editReply({
                content: '❌ Self-role message not found.'
            });
        }

        // Reset statistics
        selfRoleData.statistics = {
            totalInteractions: 0,
            uniqueUsers: [],
            roleAssignments: []
        };

        // Reset role assignment counts
        selfRoleData.roles.forEach(role => {
            role.currentAssignments = 0;
        });

        selfRoleData.lastModified = {
            by: {
                userId: interaction.user.id,
                username: interaction.user.username
            },
            at: new Date()
        };

        await selfRoleData.save();

        await interaction.editReply({
            content: '✅ Successfully reset statistics for the self-role message.'
        });
    }
};
