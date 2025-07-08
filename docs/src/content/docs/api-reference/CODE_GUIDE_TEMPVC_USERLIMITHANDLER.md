---
title: CODE_GUIDE_TEMPVC_USERLIMITHANDLER
sidebar:
  badge: ApiReference
---

## 4. TempVC Sub-Handlers (`src/utils/tempvc/`)

These modules contain specific logic for handling individual control panel actions within the temporary voice channel system. They are typically called by `TempVCControlHandlers.js`.

### `userLimitHandler.js`
Handles changing the user limit of temporary voice channels.

*   **`handleUserLimit(interaction, instance, channel, manager, client)`**
    *   **Description:** Presents options for changing the channel's user limit.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
*   **`handleLimitSelection(interaction, instance, channel, value, manager, client)`**
    *   **Description:** Processes the selected user limit, applying it to the channel.
    *   **Parameters:** (Same as `bitrateHandler.handleBitrateSelection`)
    *   **Returns:** `Promise<void>`
*   **`handleLimitModal(interaction, instance, channel, manager, client)`**
    *   **Description:** Handles custom user limit input from a modal.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
