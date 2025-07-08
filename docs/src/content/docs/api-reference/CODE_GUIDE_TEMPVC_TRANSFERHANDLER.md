---
title: CODE_GUIDE_TEMPVC_TRANSFERHANDLER
sidebar:
  badge: ApiReference
---

## 4. TempVC Sub-Handlers (`src/utils/tempvc/`)

These modules contain specific logic for handling individual control panel actions within the temporary voice channel system. They are typically called by `TempVCControlHandlers.js`.

### `transferHandler.js`
Handles transferring ownership of temporary voice channels.

*   **`handleTransfer(interaction, instance, channel, manager, client)`**
    *   **Description:** Presents a list of members to transfer ownership to.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
*   **`handleTransferSelection(interaction, instance, channel, userId, manager, client)`**
    *   **Description:** Processes the selection of a new owner and transfers ownership.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBanSelection`)
    *   **Returns:** `Promise<void>`
