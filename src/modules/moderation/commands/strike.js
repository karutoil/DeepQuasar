const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const PunishmentLog = require('../../../schemas/PunishmentLog');
const ModerationUtils = require('../../../utils/ModerationUtils');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('strike')
        .setDescription('Add a strike to a user\'s record')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to give a strike')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the strike')
                .setRequired(false)
                .setMaxLength(1000)
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
            const reason = interaction.options.getString('reason') || 'No reason provided';

            await interaction.deferReply({ ephemeral: true });

            // Check if user is trying to strike themselves
            if (targetUser.id === interaction.user.id) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Invalid Target',
                        'You cannot strike yourself.'
                    )]
                });
            }

            // Check if target is a bot
            if (targetUser.bot) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Invalid Target',
                        'You cannot strike a bot.'
                    )]
                });
            }

            // Log the strike
            const logEntry = await ModerationUtils.logAction({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                action: 'strike',
                reason: reason
            });

            const embed = Utils.createSuccessEmbed(
                'Strike Added',
                `Successfully added a strike to ${targetUser.tag}.`
            )
            .addFields(
                { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                { name: 'Case ID', value: logEntry.caseId, inline: true },
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
                        'Strike Added',
                        `${targetUser.tag} has received a strike.`
                    )
                    .addFields(
                        { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                        { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                        { name: 'Case ID', value: logEntry.caseId, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('Error in strike command:', error);
            
            const errorEmbed = Utils.createErrorEmbed(
                'Command Error',
                'An error occurred while adding the strike. Please try again.'
            );

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
