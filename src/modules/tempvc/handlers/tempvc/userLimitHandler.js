const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const Utils = require('../../../../utils/utils');
const TempVCInstance = require('../../../../schemas/TempVCInstance');

async function handleUserLimit(interaction, instance, channel, manager, client) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`tempvc_limit_select_${instance.channelId}`)
        .setPlaceholder('Select user limit...')
        .addOptions(
            { label: 'No Limit', value: '0' },
            { label: '1 User', value: '1' },
            { label: '2 Users', value: '2' },
            { label: '3 Users', value: '3' },
            { label: '4 Users', value: '4' },
            { label: '5 Users', value: '5' },
            { label: '10 Users', value: '10' },
            { label: '15 Users', value: '15' },
            { label: '20 Users', value: '20' },
            { label: '25 Users', value: '25' },
            { label: 'Custom...', value: 'custom' }
        );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
        content: `Current user limit: **${instance.settings.userLimit || 'No limit'}**`,
        components: [row],
        ephemeral: true
    });
}

async function handleLimitSelection(interaction, instance, channel, value, manager, client) {
    if (value === 'custom') {
        const modal = new ModalBuilder()
            .setCustomId(`tempvc_limit_modal_${instance.channelId}`)
            .setTitle('Custom User Limit');

        const limitInput = new TextInputBuilder()
            .setCustomId('user_limit')
            .setLabel('User Limit (0 for no limit)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(2)
            .setValue(instance.settings.userLimit.toString())
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(limitInput);
        modal.addComponents(row);

        return await interaction.showModal(modal);
    }

    const limit = parseInt(value);
    await channel.setUserLimit(limit);
    instance.settings.userLimit = limit;
    await instance.save();
    await instance.autoSaveSettings();

    const limitText = limit === 0 ? 'No limit' : `${limit} users`;
    await interaction.update({
        content: `✅ User limit set to: **${limitText}**`,
        components: []
    });
    await manager.updateControlPanel(instance, channel);
}

async function handleLimitModal(interaction, instance, channel, manager, client) {
    const limitStr = interaction.fields.getTextInputValue('user_limit').trim();
    const limit = parseInt(limitStr);
    if (isNaN(limit) || limit < 0 || limit > 99) {
        return interaction.reply({
            content: '❌ User limit must be a number between 0 and 99.',
            ephemeral: true
        });
    }
    await channel.setUserLimit(limit);
    instance.settings.userLimit = limit;
    await instance.save();
    await instance.autoSaveSettings();
    const limitText = limit === 0 ? 'No limit' : `${limit} users`;
    await interaction.reply({
        content: `✅ User limit set to: **${limitText}**`,
        ephemeral: true
    });
    await manager.updateControlPanel(instance, channel);
}

module.exports = {
    handleUserLimit,
    handleLimitSelection,
    handleLimitModal
};
