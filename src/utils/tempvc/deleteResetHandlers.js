const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const TempVCInstance = require('../../schemas/TempVCInstance');

async function handleDelete(interaction, instance, channel, manager, client) {
    const embed = new EmbedBuilder()
        .setTitle('⚠️ Delete Channel')
        .setDescription('Are you sure you want to delete this voice channel?\n\n**This action cannot be undone!**')
        .setColor(0xED4245);
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`tempvc_delete_confirm_${instance.channelId}`)
            .setLabel('Yes, Delete')
            .setStyle(ButtonBuilder.Style.Danger),
        new ButtonBuilder()
            .setCustomId(`tempvc_delete_cancel_${instance.channelId}`)
            .setLabel('Cancel')
            .setStyle(ButtonBuilder.Style.Secondary)
    );
    await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
    });
}

async function handleDeleteConfirmation(interaction, manager, client) {
    const [, , , channelId] = interaction.customId.split('_');
    const instance = await TempVCInstance.findByChannelId(channelId);
    if (!instance) {
        return interaction.update({
            content: '❌ Channel not found.',
            components: []
        });
    }
    await interaction.update({
        content: '🗑️ Deleting channel...',
        components: []
    });
    await manager.deleteTempChannel(instance);
}

async function handleDeleteCancellation(interaction) {
    await interaction.update({
        content: '✅ Channel deletion cancelled.',
        components: []
    });
}

async function handleReset(interaction, instance, channel, manager, client) {
    const embed = new EmbedBuilder()
        .setTitle('🔄 Reset to Defaults')
        .setDescription('Are you sure you want to reset all channel settings to defaults?\n\n**This will:**\n• Reset user limit, bitrate, region to server defaults\n• Unlock and unhide the channel\n• Clear all banned users\n• Remove all permission overrides\n\n**This action cannot be undone!**')
        .setColor(0xED4245);
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`tempvc_reset_confirm_${instance.channelId}`)
            .setLabel('Yes, Reset')
            .setStyle(ButtonBuilder.Style.Danger),
        new ButtonBuilder()
            .setCustomId(`tempvc_reset_cancel_${instance.channelId}`)
            .setLabel('Cancel')
            .setStyle(ButtonBuilder.Style.Secondary)
    );
    await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
    });
}

async function handleResetConfirmation(interaction, manager, client) {
    const [, , , channelId] = interaction.customId.split('_');
    const TempVC = require('../../schemas/TempVC');
    const instance = await TempVCInstance.findByChannelId(channelId);
    if (!instance) {
        return interaction.update({
            content: '❌ Channel not found.',
            components: []
        });
    }
    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
        return interaction.update({
            content: '❌ Voice channel not found.',
            components: []
        });
    }
    try {
        await interaction.update({
            content: '🔄 Resetting channel to defaults...',
            components: []
        });
        const config = await TempVC.findByGuildId(instance.guildId);
        const guildDefaults = config ? config.defaultSettings : {
            userLimit: 0,
            bitrate: 64000,
            locked: false,
            hidden: false,
            region: null
        };
        await channel.setUserLimit(guildDefaults.userLimit);
        await channel.setBitrate(guildDefaults.bitrate);
        await channel.setRTCRegion(guildDefaults.region);
        const guild = channel.guild;
        const overwrites = channel.permissionOverwrites.cache;
        for (const [id, overwrite] of overwrites) {
            if (id !== guild.id && id !== instance.ownerId) {
                await overwrite.delete();
            }
        }
        await channel.permissionOverwrites.edit(guild.id, {
            ViewChannel: guildDefaults.hidden ? false : null,
            Connect: guildDefaults.locked ? false : null
        });
        await instance.resetToDefaults(guildDefaults);
        await manager.updateControlPanel(instance, channel);
        await interaction.editReply({
            content: '✅ Channel has been reset to default settings!',
            components: []
        });
    } catch (error) {
        client.logger.error('Error resetting channel:', error);
        await interaction.editReply({
            content: '❌ Failed to reset channel settings.',
            components: []
        });
    }
}

async function handleResetCancellation(interaction) {
    await interaction.update({
        content: '✅ Reset cancelled.',
        components: []
    });
}

module.exports = {
    handleDelete,
    handleDeleteConfirmation,
    handleDeleteCancellation,
    handleReset,
    handleResetConfirmation,
    handleResetCancellation
};
