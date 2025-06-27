const renameHandler = require('./tempvc/renameHandler');
const userLimitHandler = require('./tempvc/userLimitHandler');
const bitrateHandler = require('./tempvc/bitrateHandler');
const regionHandler = require('./tempvc/regionHandler');
const lockHideHandlers = require('./tempvc/lockHideHandlers');
const kickHandlers = require('./tempvc/kickHandlers');
const banUnbanHandlers = require('./tempvc/banUnbanHandlers');
const permissionManagementHandlers = require('./tempvc/permissionManagementHandlers');
const transferHandler = require('./tempvc/transferHandler');
const deleteResetHandlers = require('./tempvc/deleteResetHandlers');
const menuHandler = require('./tempvc/menuHandler');

class TempVCControlHandlers {
    constructor(tempVCManager) {
        this.manager = tempVCManager;
        this.client = tempVCManager.client;
    }

    async handleRename(interaction, instance, channel) {
        return renameHandler.handleRename(interaction, instance, channel, this.manager, this.client);
    }
    async handleRenameModal(interaction, instance, channel) {
        return renameHandler.handleRenameModal(interaction, instance, channel, this.manager, this.client);
    }
    async handleUserLimit(interaction, instance, channel) {
        return userLimitHandler.handleUserLimit(interaction, instance, channel, this.manager, this.client);
    }
    async handleLimitSelection(interaction, instance, channel, value) {
        return userLimitHandler.handleLimitSelection(interaction, instance, channel, value, this.manager, this.client);
    }
    async handleLimitModal(interaction, instance, channel) {
        return userLimitHandler.handleLimitModal(interaction, instance, channel, this.manager, this.client);
    }
    async handleBitrate(interaction, instance, channel) {
        return bitrateHandler.handleBitrate(interaction, instance, channel, this.manager, this.client);
    }
    async handleBitrateSelection(interaction, instance, channel, value) {
        return bitrateHandler.handleBitrateSelection(interaction, instance, channel, value, this.manager, this.client);
    }
    async handleRegion(interaction, instance, channel) {
        return regionHandler.handleRegion(interaction, instance, channel, this.manager, this.client);
    }
    async handleRegionSelection(interaction, instance, channel, value) {
        return regionHandler.handleRegionSelection(interaction, instance, channel, value, this.manager, this.client);
    }
    async handleLock(interaction, instance, channel) {
        return lockHideHandlers.handleLock(interaction, instance, channel, this.manager, this.client);
    }
    async handleHide(interaction, instance, channel) {
        return lockHideHandlers.handleHide(interaction, instance, channel, this.manager, this.client);
    }
    async handleKick(interaction, instance, channel) {
        return kickHandlers.handleKick(interaction, instance, channel, this.manager, this.client);
    }
    async handleKickSelection(interaction, instance, channel, value) {
        return kickHandlers.handleKickSelection(interaction, instance, channel, value, this.manager, this.client);
    }
    async handleBan(interaction, instance, channel) {
        return banUnbanHandlers.handleBan(interaction, instance, channel, this.manager, this.client);
    }
    async handleBanSelection(interaction, instance, channel, value) {
        return banUnbanHandlers.handleBanSelection(interaction, instance, channel, value, this.manager, this.client);
    }
    async handleBanUserSelection(interaction, instance, channel) {
        return banUnbanHandlers.handleBanUserSelection(interaction, instance, channel, this.manager, this.client);
    }
    async handleUnban(interaction, instance, channel) {
        return banUnbanHandlers.handleUnban(interaction, instance, channel, this.manager, this.client);
    }
    async handleUnbanSelection(interaction, instance, channel, value) {
        return banUnbanHandlers.handleUnbanSelection(interaction, instance, channel, value, this.manager, this.client);
    }
    async handleUnbanUserSelection(interaction, instance, channel) {
        return banUnbanHandlers.handleUnbanUserSelection(interaction, instance, channel, this.manager, this.client);
    }
    async handleUnbanConfirmation(interaction) {
        return banUnbanHandlers.handleUnbanConfirmation(interaction, this.manager, this.client);
    }
    async handleUnbanCancellation(interaction) {
        return banUnbanHandlers.handleUnbanCancellation(interaction);
    }
    async handleAllowUser(interaction, instance, channel) {
        return permissionManagementHandlers.handleAllowUser(interaction, instance, channel, this.manager, this.client);
    }
    async handleAllowUserSelection(interaction, instance, channel) {
        return permissionManagementHandlers.handleAllowUserSelection(interaction, instance, channel, this.manager, this.client);
    }
    async handleDenyUser(interaction, instance, channel) {
        return permissionManagementHandlers.handleDenyUser(interaction, instance, channel, this.manager, this.client);
    }
    async handleDenyUserSelection(interaction, instance, channel) {
        return permissionManagementHandlers.handleDenyUserSelection(interaction, instance, channel, this.manager, this.client);
    }
    async handleManagePermissions(interaction, instance, channel) {
        return permissionManagementHandlers.handleManagePermissions(interaction, instance, channel, this.manager, this.client);
    }
    async handleTransfer(interaction, instance, channel) {
        return transferHandler.handleTransfer(interaction, instance, channel, this.manager, this.client);
    }
    async handleTransferSelection(interaction, instance, channel, value) {
        return transferHandler.handleTransferSelection(interaction, instance, channel, value, this.manager, this.client);
    }
    async handleDelete(interaction, instance, channel) {
        return deleteResetHandlers.handleDelete(interaction, instance, channel, this.manager, this.client);
    }
    async handleDeleteConfirmation(interaction) {
        return deleteResetHandlers.handleDeleteConfirmation(interaction, this.manager, this.client);
    }
    async handleDeleteCancellation(interaction) {
        return deleteResetHandlers.handleDeleteCancellation(interaction);
    }
    async handleReset(interaction, instance, channel) {
        return deleteResetHandlers.handleReset(interaction, instance, channel, this.manager, this.client);
    }
    async handleResetConfirmation(interaction) {
        return deleteResetHandlers.handleResetConfirmation(interaction, this.manager, this.client);
    }
    async handleResetCancellation(interaction) {
        return deleteResetHandlers.handleResetCancellation(interaction);
    }
    async handleMenuSelection(interaction, instance, channel) {
        return menuHandler.handleMenuSelection(interaction, instance, channel, this.manager, this.client);
    }
    async handleSelectMenuInteraction(interaction) {
        return menuHandler.handleSelectMenuInteraction(interaction, this.manager, this.client);
    }
    async handleModalSubmission(interaction) {
        return menuHandler.handleModalSubmission(interaction, this.manager, this.client);
    }
}

module.exports = TempVCControlHandlers;
