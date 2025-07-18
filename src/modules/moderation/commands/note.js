const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const UserNotes = require('../../../schemas/UserNotes');
const ModerationUtils = require('../../../utils/ModerationUtils');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'Moderation',
    data: new SlashCommandBuilder()
        .setName('note')
        .setDescription('Add a note to a user\'s record')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to add note for')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('note')
                .setDescription('Note to add')
                .setRequired(true)
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
            const noteText = interaction.options.getString('note');

            await interaction.deferReply({ ephemeral: true });

            // Create and save the note
            const userNote = await UserNotes.addNote(
                interaction.guild.id,
                targetUser.id,
                {
                    content: noteText,
                    moderatorId: interaction.user.id,
                    type: 'general'
                }
            );

            const embed = Utils.createSuccessEmbed(
                'Note Added',
                `Successfully added note for ${targetUser.tag}.`
            )
            .addFields(
                { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                { name: 'Note', value: noteText, inline: false }
            )
            .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            // Log to moderation channel if configured
            const settings = await ModerationUtils.getModerationSettings(interaction.guild.id);
            if (settings.modLogChannel) {
                const logChannel = interaction.guild.channels.cache.get(settings.modLogChannel);
                if (logChannel) {
                    const logEmbed = Utils.createInfoEmbed(
                        'User Note Added',
                        `A note has been added to ${targetUser.tag}'s record.`
                    )
                    .addFields(
                        { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                        { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                        { name: 'Note', value: noteText, inline: false }
                    )
                    .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('Error in note command:', error);
            
            const errorEmbed = Utils.createErrorEmbed(
                'Command Error',
                'An error occurred while adding the note. Please try again.'
            );

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
