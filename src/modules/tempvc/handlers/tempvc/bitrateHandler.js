const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const Utils = require('../../../../../utils/utils');

async function handleBitrate(interaction, instance, channel, manager, client) {
    const guild = interaction.guild;
    const maxBitrate = guild.premiumTier >= 2 ? 384 : guild.premiumTier >= 1 ? 128 : 96;
    const options = [
        { label: '8 kbps (Phone Quality)', value: '8000' },
        { label: '32 kbps (Low Quality)', value: '32000' },
        { label: '64 kbps (Standard)', value: '64000' },
        { label: '96 kbps (Good)', value: '96000' }
    ];
    if (maxBitrate >= 128) {
        options.push({ label: '128 kbps (High)', value: '128000' });
    }
    if (maxBitrate >= 384) {
        options.push(
            { label: '256 kbps (Very High)', value: '256000' },
            { label: '384 kbps (Maximum)', value: '384000' }
        );
    }
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`tempvc_bitrate_select_${instance.channelId}`)
        .setPlaceholder('Select bitrate...')
        .addOptions(options);
    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.reply({
        content: `Current bitrate: **${instance.settings.bitrate / 1000} kbps**\nMax bitrate for this server: **${maxBitrate} kbps**`,
        components: [row],
        ephemeral: true
    });
}

async function handleBitrateSelection(interaction, instance, channel, value, manager, client) {
    const bitrate = parseInt(value);
    await channel.setBitrate(bitrate);
    instance.settings.bitrate = bitrate;
    await instance.save();
    await instance.autoSaveSettings();
    await interaction.update({
        content: `✅ Bitrate set to: **${bitrate / 1000} kbps**`,
        components: []
    });
    await manager.updateControlPanel(instance, channel);
}

module.exports = {
    handleBitrate,
    handleBitrateSelection
};
