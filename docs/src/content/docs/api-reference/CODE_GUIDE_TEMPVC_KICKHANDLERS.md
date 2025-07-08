---
title: CODE_GUIDE_TEMPVC_KICKHANDLERS
sidebar:
  badge: ApiReference
---

## 4. TempVC Sub-Handlers (`src/utils/tempvc/`)

These modules contain specific logic for handling individual control panel actions within the temporary voice channel system. They are typically called by `TempVCControlHandlers.js`.

### `kickHandlers.js`
Handles kicking users from temporary voice channels.

*   **`handleKick(interaction, instance, channel, manager, client)`**
    *   **Description:** Presents a list of members to kick.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
*   **`handleKickSelection(interaction, instance, channel, userId, manager, client)`**
    *   **Description:** Processes the selection of a user to kick.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBanSelection`)
    *   **Returns:** `Promise<void>`
