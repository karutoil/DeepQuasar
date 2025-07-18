const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const PunishmentLog = require('../../../schemas/PunishmentLog');
const ModerationUtils = require('../../../utils/ModerationUtils');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('warnlist')
        .setDescription('View all active warnings for a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to view warnings for')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option
                .setName('include-pardoned')
                .setDescription('Include pardoned warnings in the list')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            // Check permissions
            const permissionCheck = ModerationUtils.checkDiscordPermissions(interaction, PermissionFlagsBits.ManageMessages);
            if (!permissionCheck.hasPermission) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed(
                        'Permission Denied',
                        permissionCheck.reason
                    )],
                    ephemeral: true
                });
            }

            const targetUser = interaction.options.getUser('user');
            const includePardoned = interaction.options.getBoolean('include-pardoned') ?? false;

            await interaction.deferReply({ ephemeral: true });

            // Build query
            const query = {
                guildId: interaction.guild.id,
                userId: targetUser.id,
                action: 'warn'
            };

            if (!includePardoned) {
                query.status = { $ne: 'pardoned' };
            }

            // Find warnings
            const warnings = await PunishmentLog.find(query)
                .sort({ createdAt: -1 })
                .limit(20);

            if (warnings.length === 0) {
                const noWarningsEmbed = Utils.createInfoEmbed(
                    'No Warnings Found',
                    `${targetUser.tag} has no ${includePardoned ? '' : 'active '}warnings.`
                )
                .addFields(
                    { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true }
                )
                .setTimestamp();

                return interaction.editReply({ embeds: [noWarningsEmbed] });
            }

            // Create embed with warnings list
            const embed = new EmbedBuilder()
                .setTitle(`${includePardoned ? 'All' : 'Active'} Warnings for ${targetUser.tag}`)
                .setColor(0xFFFF00)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Total Warnings', value: warnings.length.toString(), inline: true }
                )
                .setTimestamp();

            // Add warning fields (limit to 10 to avoid embed limits)
            const displayWarnings = warnings.slice(0, 10);
            
            for (let i = 0; i < displayWarnings.length; i++) {
                const warning = displayWarnings[i];
                const moderator = await interaction.client.users.fetch(warning.moderatorId).catch(() => null);
                
                const status = warning.status === 'pardoned' ? ' (PARDONED)' : '';
                const fieldName = `Warning ${i + 1} - Case ${warning.caseId}${status}`;
                
                let fieldValue = `**Reason:** ${warning.reason || 'No reason provided'}\n`;
                fieldValue += `**Moderator:** ${moderator ? moderator.tag : 'Unknown'}\n`;
                
                if (warning.createdAt) {
                    fieldValue += `**Date:** <t:${Math.floor(warning.createdAt.getTime() / 1000)}:f>`;
                } else {
                    fieldValue += `**Date:** Unknown`;
                }
                
                if (warning.status === 'pardoned' && warning.pardonReason) {
                    fieldValue += `\n**Pardon Reason:** ${warning.pardonReason}`;
                }

                embed.addFields({ name: fieldName, value: fieldValue, inline: false });
            }

            if (warnings.length > 10) {
                embed.setFooter({ text: `Showing first 10 of ${warnings.length} warnings. Use modhistory for complete list.` });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in warnlist command:', error);
            
            const errorEmbed = Utils.createErrorEmbed(
                'Command Error',
                'An error occurred while fetching the warning list. Please try again.'
            );

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
