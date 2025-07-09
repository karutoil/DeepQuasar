const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationUtils = require('../../utils/ModerationUtils');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('softban')
        .setDescription('Softban a user (ban then immediately unban to delete messages)')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to softban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the softban')
                .setRequired(false)
                .setMaxLength(1000)
        )
        .addIntegerOption(option =>
            option
                .setName('delete-days')
                .setDescription('Number of days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)
        ),

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

            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const deleteDays = interaction.options.getInteger('delete-days') ?? 1;

            await interaction.deferReply({ ephemeral: true });

            // Check if user is trying to softban themselves
            if (targetUser.id === interaction.user.id) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Invalid Target',
                        'You cannot softban yourself.'
                    )]
                });
            }

            // Check if target is a bot
            if (targetUser.bot) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Invalid Target',
                        'You cannot softban a bot.'
                    )]
                });
            }

            const member = interaction.guild.members.cache.get(targetUser.id);
            
            // Check if user is bannable
            if (member && !member.bannable) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Cannot Softban User',
                        'I cannot softban this user. They may have higher permissions than me.'
                    )]
                });
            }

            // Check role hierarchy
            if (member && interaction.member.roles.highest.position <= member.roles.highest.position && !Utils.isServerOwner(interaction)) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Permission Denied',
                        'You cannot softban a user with equal or higher roles than you.'
                    )]
                });
            }

            try {
                // Perform the softban (ban then unban)
                await interaction.guild.members.ban(targetUser, {
                    deleteMessageDays: deleteDays,
                    reason: `Softban by ${interaction.user.tag}: ${reason}`
                });

                // Wait a moment then unban
                setTimeout(async () => {
                    try {
                        await interaction.guild.members.unban(targetUser, `Softban unban by ${interaction.user.tag}`);
                    } catch (unbanError) {
                        console.error('Error during softban unban:', unbanError);
                    }
                }, 1000);

                // Log the action
                const logEntry = await ModerationUtils.logAction({
                    guildId: interaction.guild.id,
                    userId: targetUser.id,
                    moderatorId: interaction.user.id,
                    action: 'softban',
                    reason: reason,
                    timestamp: new Date(),
                    additionalInfo: { deleteDays }
                });

                const embed = Utils.createSuccessEmbed(
                    'User Softbanned',
                    `Successfully softbanned ${targetUser.tag}.`
                )
                .addFields(
                    { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Case ID', value: logEntry.caseId, inline: true },
                    { name: 'Messages Deleted', value: `${deleteDays} day(s)`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();

                await interaction.editReply({ embeds: [embed] });

                // Log to moderation channel if configured
                const settings = await ModerationUtils.getModerationSettings(interaction.guild.id);
                if (settings.modLogChannel) {
                    const logChannel = interaction.guild.channels.cache.get(settings.modLogChannel);
                    if (logChannel) {
                        const logEmbed = Utils.createWarningEmbed(
                            'User Softbanned',
                            `${targetUser.tag} has been softbanned.`
                        )
                        .addFields(
                            { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                            { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                            { name: 'Case ID', value: logEntry.caseId, inline: true },
                            { name: 'Messages Deleted', value: `${deleteDays} day(s)`, inline: true },
                            { name: 'Reason', value: reason, inline: false }
                        )
                        .setTimestamp();

                        await logChannel.send({ embeds: [logEmbed] });
                    }
                }

            } catch (banError) {
                console.error('Error during softban:', banError);
                
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Softban Failed',
                        'An error occurred while trying to softban the user. Please check my permissions and try again.'
                    )]
                });
            }

        } catch (error) {
            console.error('Error in softban command:', error);
            
            const errorEmbed = Utils.createErrorEmbed(
                'Command Error',
                'An error occurred while processing the softban. Please try again.'
            );

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
