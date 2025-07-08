---
title: CODE_GUIDE_TEMPVC_RENAMEHANDLER
sidebar:
  badge: ApiReference
---

## 4. TempVC Sub-Handlers (`src/utils/tempvc/`)

These modules contain specific logic for handling individual control panel actions within the temporary voice channel system. They are typically called by `TempVCControlHandlers.js`.

### `renameHandler.js`
Handles renaming temporary voice channels.

*   **`handleRename(interaction, instance, channel, manager, client)`**
    *   **Description:** Displays a modal for entering a new channel name.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
*   **`handleRenameModal(interaction, instance, channel, manager, client)`**
    *   **Description:** Processes the new channel name from the modal and applies it.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
