const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const Utils = require('../../utils/utils');
const ProfanityFilter = require('../../utils/ProfanityFilter');
const TempVCInstance = require('../../schemas/TempVCInstance');

async function handleRename(interaction, instance, channel, manager, client) {
    const modal = new ModalBuilder()
        .setCustomId(`tempvc_rename_modal_${instance.channelId}`)
        .setTitle('Rename Channel');

    const nameInput = new TextInputBuilder()
        .setCustomId('channel_name')
        .setLabel('New Channel Name')
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(100)
        .setValue(channel.name)
        .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

async function handleRenameModal(interaction, instance, channel, manager, client) {
    const newName = interaction.fields.getTextInputValue('channel_name').trim();

    if (ProfanityFilter.contains(newName)) {
        return interaction.reply({
            embeds: [Utils.createErrorEmbed('Invalid Name', 'The channel name contains inappropriate language. Please choose another name.')],
            ephemeral: true
        });
    }

    if (newName.length < 1 || newName.length > 100) {
        return interaction.reply({
            content: '❌ Channel name must be between 1 and 100 characters.',
            ephemeral: true
        });
    }

    await channel.setName(newName);
    instance.currentName = newName;
    await instance.save();
    await instance.autoSaveSettings();

    await interaction.reply({
        embeds: [Utils.createSuccessEmbed('Channel Renamed', `Channel renamed to: **${newName}**`)],
        ephemeral: true,
    });

    await manager.updateControlPanel(instance, channel);
}

module.exports = {
    handleRename,
    handleRenameModal
};
