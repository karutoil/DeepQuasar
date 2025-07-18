const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const Utils = require('../../utils/utils');

async function handleRegion(interaction, instance, channel, manager, client) {
    const regions = [
        { label: 'Automatic', value: 'null' },
        { label: '🇺🇸 US East', value: 'us-east' },
        { label: '🇺🇸 US West', value: 'us-west' },
        { label: '🇺🇸 US Central', value: 'us-central' },
        { label: '🇺🇸 US South', value: 'us-south' },
        { label: '🇪🇺 Europe', value: 'europe' },
        { label: '🇳🇱 Amsterdam', value: 'amsterdam' },
        { label: '🇬🇧 London', value: 'london' },
        { label: '🇩🇪 Frankfurt', value: 'frankfurt' },
        { label: '🇷🇺 Russia', value: 'russia' },
        { label: '🇰🇷 South Korea', value: 'south-korea' },
        { label: '🇯🇵 Japan', value: 'japan' },
        { label: '🇸🇬 Singapore', value: 'singapore' },
        { label: '🇦🇺 Sydney', value: 'sydney' },
        { label: '🇧🇷 Brazil', value: 'brazil' },
        { label: '🇮🇳 India', value: 'india' },
        { label: '🇭🇰 Hong Kong', value: 'hongkong' },
        { label: '🇿🇦 South Africa', value: 'south-africa' }
    ];
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`tempvc_region_select_${instance.channelId}`)
        .setPlaceholder('Select voice region...')
        .addOptions(regions);
    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.reply({
        content: `Current region: **${instance.settings.region || 'Automatic'}**`,
        components: [row],
        ephemeral: true
    });
}

async function handleRegionSelection(interaction, instance, channel, value, manager, client) {
    const region = value === 'null' ? null : value;
    await channel.setRTCRegion(region);
    instance.settings.region = region;
    await instance.save();
    await instance.autoSaveSettings();
    const regionText = region || 'Automatic';
    await interaction.update({
        content: `✅ Voice region set to: **${regionText}**`,
        components: []
    });
    await manager.updateControlPanel(instance, channel);
}

module.exports = {
    handleRegion,
    handleRegionSelection
};
