const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationUtils = require('../../utils/ModerationUtils');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .addStringOption(option =>
            option
                .setName('user-id')
                .setDescription('User ID to unban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the unban')
                .setRequired(false)
                .setMaxLength(1000)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        try {
            // Check permissions
            const permissionCheck = ModerationUtils.checkDiscordPermissions(interaction, PermissionFlagsBits.BanMembers);
            if (!permissionCheck.hasPermission) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed(
                        'Permission Denied',
                        permissionCheck.reason
                    )],
                    ephemeral: true
                });
            }

            const userId = interaction.options.getString('user-id');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Validate user ID format
            if (!/^\d{17,19}$/.test(userId)) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed(
                        'Invalid User ID',
                        'Please provide a valid Discord user ID.'
                    )],
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            // Check if user is actually banned
            const bans = await interaction.guild.bans.fetch();
            const bannedUser = bans.get(userId);

            if (!bannedUser) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'User Not Banned',
                        'This user is not currently banned from the server.'
                    )]
                });
            }

            // Unban the user
            await interaction.guild.members.unban(userId, reason);

            // Get user info
            let user;
            try {
                user = await interaction.client.users.fetch(userId);
            } catch {
                user = { tag: `Unknown User (${userId})`, id: userId };
            }

            // Log the unban
            const logEntry = await ModerationUtils.logAction({
                guildId: interaction.guild.id,
                userId: userId,
                action: 'unban',
                moderatorId: interaction.user.id,
                reason: reason
            });

            // Send moderation log
            await ModerationUtils.sendModLog(interaction, logEntry);

            const embed = Utils.createSuccessEmbed(
                'User Unbanned',
                `Successfully unbanned ${user.tag}.`
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
                    name: 'Original Ban Reason',
                    value: bannedUser.reason || 'No reason provided',
                    inline: false
                }
            ]);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in unban command:', error);
            
            let errorMessage = 'An error occurred while unbanning the user.';
            if (error.code === 50013) {
                errorMessage = 'I do not have permission to unban users.';
            } else if (error.code === 50001) {
                errorMessage = 'I do not have the necessary permissions.';
            } else if (error.code === 10026) {
                errorMessage = 'User not found.';
            }

            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Unban Failed', errorMessage)]
            });
        }
    }
};
