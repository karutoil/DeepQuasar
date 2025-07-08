---
title: CODE_GUIDE_TEMPVC_LOCKHIDEHANDLERS
sidebar:
  badge: ApiReference
---

## 4. TempVC Sub-Handlers (`src/utils/tempvc/`)

These modules contain specific logic for handling individual control panel actions within the temporary voice channel system. They are typically called by `TempVCControlHandlers.js`.

### `lockHideHandlers.js`
Handles locking/unlocking and hiding/unhiding temporary voice channels.

*   **`handleLock(interaction, instance, channel, manager, client)`**
    *   **Description:** Toggles the locked status of the channel.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
*   **`handleHide(interaction, instance, channel, manager, client)`**
    *   **Description:** Toggles the hidden status of the channel.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
