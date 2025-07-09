const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationUtils = require('../../utils/ModerationUtils');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to kick')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)
                .setMaxLength(1000)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        try {
            // Check permissions
            const permissionCheck = ModerationUtils.checkDiscordPermissions(interaction, PermissionFlagsBits.KickMembers);
            if (!permissionCheck.hasPermission) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed(
                        'Permission Denied',
                        permissionCheck.reason
                    )],
                    ephemeral: true
                });
            }

            const target = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Validate target
            const validation = ModerationUtils.validateTarget(interaction, target);
            if (!validation.valid) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed(
                        'Cannot Kick User',
                        validation.reason
                    )],
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            const targetMember = interaction.guild.members.cache.get(target.id);

            // Try to DM user before kicking
            const dmSent = await ModerationUtils.dmUser(
                interaction.client,
                target.id,
                'kicked',
                reason,
                interaction.guild.name
            );

            // Kick the user
            await targetMember.kick(reason);

            // Log the kick
            const logEntry = await ModerationUtils.logAction({
                guildId: interaction.guild.id,
                userId: target.id,
                action: 'kick',
                moderatorId: interaction.user.id,
                reason: reason
            });

            // Send moderation log
            await ModerationUtils.sendModLog(interaction, logEntry);

            const embed = Utils.createSuccessEmbed(
                'User Kicked',
                `Successfully kicked ${target.tag} from the server.`
            );

            embed.addFields([
                {
                    name: 'Case ID',
                    value: logEntry.caseId,
                    inline: true
                },
                {
                    name: 'Reason',
                    value: reason,
                    inline: false
                },
                {
                    name: 'DM Status',
                    value: dmSent ? '✅ User notified' : '❌ Could not DM user',
                    inline: true
                }
            ]);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in kick command:', error);
            
            let errorMessage = 'An error occurred while kicking the user.';
            if (error.code === 50013) {
                errorMessage = 'I do not have permission to kick this user.';
            } else if (error.code === 50001) {
                errorMessage = 'I do not have the necessary permissions.';
            }

            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Kick Failed', errorMessage)]
            });
        }
    }
};
