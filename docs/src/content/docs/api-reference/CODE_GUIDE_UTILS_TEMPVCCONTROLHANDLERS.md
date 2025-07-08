---
title: CODE_GUIDE_UTILS_TEMPVCCONTROLHANDLERS
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `TempVCControlHandlers.js`
A collection of handlers for various temporary voice channel control panel interactions. This class acts as a dispatcher to individual handler modules.

*   **`TempVCControlHandlers` (Class)**
    *   **Constructor:** `constructor(tempVCManager)`
        *   **Parameters:** `tempVCManager` (TempVCManager instance)
    *   **Methods:** (Each method below dispatches to a specific handler file in `src/utils/tempvc/`)
        *   **`handleRename(interaction, instance, channel)`**
        *   **`handleRenameModal(interaction, instance, channel)`**
        *   **`handleUserLimit(interaction, instance, channel)`**
        *   **`handleLimitSelection(interaction, instance, channel, value)`**
        *   **`handleLimitModal(interaction, instance, channel)`**
        *   **`handleBitrate(interaction, instance, channel)`**
        *   **`handleBitrateSelection(interaction, instance, channel, value)`**
        *   **`handleRegion(interaction, instance, channel)`**
        *   **`handleRegionSelection(interaction, instance, channel, value)`**
        *   **`handleLock(interaction, instance, channel)`**
        *   **`handleHide(interaction, instance, channel)`**
        *   **`handleKick(interaction, instance, channel)`**
        *   **`handleKickSelection(interaction, instance, channel, value)`**
        *   **`handleBan(interaction, instance, channel)`**
        *   **`handleBanSelection(interaction, instance, channel, value)`**
        *   **`handleBanUserSelection(interaction, instance, channel)`**
        *   **`handleUnban(interaction, instance, channel)`**
        *   **`handleUnbanSelection(interaction, instance, channel, value)`**
        *   **`handleUnbanUserSelection(interaction, instance, channel)`**
        *   **`handleUnbanConfirmation(interaction)`**
        *   **`handleUnbanCancellation(interaction)`**
        *   **`handleAllowUser(interaction, instance, channel)`**
        *   **`handleAllowUserSelection(interaction, instance, channel)`**
        *   **`handleDenyUser(interaction, instance, channel)`**
        *   **`handleDenyUserSelection(interaction, instance, channel)`**
        *   **`handleManagePermissions(interaction, instance, channel)`**
        *   **`handleTransfer(interaction, instance, channel)`**
        *   **`handleTransferSelection(interaction, instance, channel, value)`**
        *   **`handleDelete(interaction, instance, channel)`**
        *   **`handleDeleteConfirmation(interaction)`**
        *   **`handleDeleteCancellation(interaction)`**
        *   **`handleReset(interaction, instance, channel)`**
        *   **`handleResetConfirmation(interaction)`**
        *   **`handleResetCancellation(interaction)`**
        *   **`handleMenuSelection(interaction, instance, channel)`**
        *   **`handleSelectMenuInteraction(interaction)`**
        *   **`handleModalSubmission(interaction)`**
        *   **`handleUnbanListPageNavigation(interaction, instance, channel)`**
    *   **Usage:**
        ```javascript
        const TempVCControlHandlers = require('./src/utils/TempVCControlHandlers');
        const controlHandlers = new TempVCControlHandlers(tempVCManagerInstance);
        await controlHandlers.handleRename(interaction, instance, channel);
        ```
