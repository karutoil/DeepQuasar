const TempVCInstance = require('../../schemas/TempVCInstance');
const renameHandler = require('./renameHandler');
const userLimitHandler = require('./userLimitHandler');
const bitrateHandler = require('./bitrateHandler');
const regionHandler = require('./regionHandler');
const lockHideHandlers = require('./lockHideHandlers');
const kickHandlers = require('./kickHandlers');
const banUnbanHandlers = require('./banUnbanHandlers');
const permissionManagementHandlers = require('./permissionManagementHandlers');
const transferHandler = require('./transferHandler');
const deleteResetHandlers = require('./deleteResetHandlers');

async function handleMenuSelection(interaction, instance, channel, manager, client) {
    const action = interaction.values[0];
    switch (action) {
        case 'rename':
            await renameHandler.handleRename(interaction, instance, channel, manager, client); break;
        case 'limit':
            await userLimitHandler.handleUserLimit(interaction, instance, channel, manager, client); break;
        case 'bitrate':
            await bitrateHandler.handleBitrate(interaction, instance, channel, manager, client); break;
        case 'region':
            await regionHandler.handleRegion(interaction, instance, channel, manager, client); break;
        case 'lock':
            await lockHideHandlers.handleLock(interaction, instance, channel, manager, client); break;
        case 'hide':
            await lockHideHandlers.handleHide(interaction, instance, channel, manager, client); break;
        case 'kick':
            await kickHandlers.handleKick(interaction, instance, channel, manager, client); break;
        case 'ban':
            await banUnbanHandlers.handleBan(interaction, instance, channel, manager, client); break;
        case 'unban':
            await banUnbanHandlers.handleUnban(interaction, instance, channel, manager, client); break;
        case 'allow_user':
            await permissionManagementHandlers.handleAllowUser(interaction, instance, channel, manager, client); break;
        case 'deny_user':
            await permissionManagementHandlers.handleDenyUser(interaction, instance, channel, manager, client); break;
        case 'manage_permissions':
            await permissionManagementHandlers.handleManagePermissions(interaction, instance, channel, manager, client); break;
        case 'transfer':
            await transferHandler.handleTransfer(interaction, instance, channel, manager, client); break;
        case 'reset':
            await deleteResetHandlers.handleReset(interaction, instance, channel, manager, client); break;
        case 'delete':
            await deleteResetHandlers.handleDelete(interaction, instance, channel, manager, client); break;
    }
}

async function handleSelectMenuInteraction(interaction, manager, client) {
    const customId = interaction.customId;
    const parts = customId.split('_');
    const type = parts[1];
    let channelId;
    if (parts[2] === 'user') {
        channelId = parts[4];
    } else {
        channelId = parts[3];
    }
    const instance = await TempVCInstance.findByChannelId(channelId);
    if (!instance) {
        return interaction.reply({ content: '❌ Channel not found.', ephemeral: true });
    }
    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
        return interaction.reply({ content: '❌ Voice channel not found.', ephemeral: true });
    }
    const value = interaction.values[0];
    try {
        if (parts[2] === 'user') {
            switch (type) {
                case 'ban':
                    await banUnbanHandlers.handleBanUserSelection(interaction, instance, channel, manager, client); break;
                case 'unban':
                    await banUnbanHandlers.handleUnbanUserSelection(interaction, instance, channel, manager, client); break;
                case 'allow':
                    await permissionManagementHandlers.handleAllowUserSelection(interaction, instance, channel, manager, client); break;
                case 'deny':
                    await permissionManagementHandlers.handleDenyUserSelection(interaction, instance, channel, manager, client); break;
            }
            return;
        }
        switch (type) {
            case 'limit':
                await userLimitHandler.handleLimitSelection(interaction, instance, channel, value, manager, client); break;
            case 'bitrate':
                await bitrateHandler.handleBitrateSelection(interaction, instance, channel, value, manager, client); break;
            case 'region':
                await regionHandler.handleRegionSelection(interaction, instance, channel, value, manager, client); break;
            case 'kick':
                await kickHandlers.handleKickSelection(interaction, instance, channel, value, manager, client); break;
            case 'ban':
                await banUnbanHandlers.handleBanSelection(interaction, instance, channel, value, manager, client); break;
            case 'unban':
                await banUnbanHandlers.handleUnbanSelection(interaction, instance, channel, value, manager, client); break;
            case 'transfer':
                await transferHandler.handleTransferSelection(interaction, instance, channel, value, manager, client); break;
        }
    } catch (error) {
        client.logger.error('Error handling select menu:', error);
        await interaction.reply({ content: '❌ An error occurred.', ephemeral: true });
    }
}

async function handleModalSubmission(interaction, manager, client) {
    const customId = interaction.customId;
    const parts = customId.split('_');
    const type = parts[1];
    const channelId = parts[3];
    const TempVCInstance = require('../../schemas/TempVCInstance');
    const instance = await TempVCInstance.findByChannelId(channelId);
    if (!instance) {
        return interaction.reply({ content: '❌ Channel not found.', ephemeral: true });
    }
    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
        return interaction.reply({ content: '❌ Voice channel not found.', ephemeral: true });
    }
    try {
        switch (type) {
            case 'rename':
                await renameHandler.handleRenameModal(interaction, instance, channel, manager, client); break;
            case 'limit':
                await userLimitHandler.handleLimitModal(interaction, instance, channel, manager, client); break;
        }
    } catch (error) {
        client.logger.error('Error handling modal submission:', error);
        await interaction.reply({ content: '❌ An error occurred.', ephemeral: true });
    }
}

module.exports = {
    handleMenuSelection,
    handleSelectMenuInteraction,
    handleModalSubmission
};
