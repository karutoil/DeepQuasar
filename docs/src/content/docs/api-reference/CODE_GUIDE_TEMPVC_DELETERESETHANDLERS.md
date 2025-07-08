---
title: CODE_GUIDE_TEMPVC_DELETERESETHANDLERS
sidebar:
  badge: ApiReference
---

## 4. TempVC Sub-Handlers (`src/utils/tempvc/`)

These modules contain specific logic for handling individual control panel actions within the temporary voice channel system. They are typically called by `TempVCControlHandlers.js`.

### `deleteResetHandlers.js`
Handles deleting and resetting temporary voice channels.

*   **`handleDelete(interaction, instance, channel, manager, client)`**
    *   **Description:** Prompts for confirmation before deleting the channel.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
*   **`handleDeleteConfirmation(interaction, manager, client)`**
    *   **Description:** Confirms and executes the channel deletion.
    *   **Parameters:** (Same as `banUnbanHandlers.handleUnbanConfirmation`)
    *   **Returns:** `Promise<void>`
*   **`handleDeleteCancellation(interaction)`**
    *   **Description:** Cancels the channel deletion.
    *   **Parameters:** (Same as `banUnbanHandlers.handleUnbanCancellation`)
    *   **Returns:** `Promise<void>`
*   **`handleReset(interaction, instance, channel, manager, client)`**
    *   **Description:** Prompts for confirmation before resetting channel settings.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
*   **`handleResetConfirmation(interaction, manager, client)`**
    *   **Description:** Confirms and executes the channel reset.
    *   **Parameters:** (Same as `banUnbanHandlers.handleUnbanConfirmation`)
    *   **Returns:** `Promise<void>`
*   **`handleResetCancellation(interaction)`**
    *   **Description:** Cancels the channel reset.
    *   **Parameters:** (Same as `banUnbanHandlers.handleUnbanCancellation`)
    *   **Returns:** `Promise<void>`
