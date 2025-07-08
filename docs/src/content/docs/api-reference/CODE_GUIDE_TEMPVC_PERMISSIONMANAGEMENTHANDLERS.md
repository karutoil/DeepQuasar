---
title: CODE_GUIDE_TEMPVC_PERMISSIONMANAGEMENTHANDLERS
sidebar:
  badge: ApiReference
---

## 4. TempVC Sub-Handlers (`src/utils/tempvc/`)

These modules contain specific logic for handling individual control panel actions within the temporary voice channel system. They are typically called by `TempVCControlHandlers.js`.

### `permissionManagementHandlers.js`
Handles allowing, denying, and managing permissions for users in temporary voice channels.

*   **`handleAllowUser(interaction, instance, channel, manager, client)`**
    *   **Description:** Presents a list of guild members to allow into the channel.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
*   **`handleAllowUserSelection(interaction, instance, channel, userId, manager, client)`**
    *   **Description:** Processes the selection of a user to allow.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBanSelection`)
    *   **Returns:** `Promise<void>`
*   **`handleDenyUser(interaction, instance, channel, manager, client)`**
    *   **Description:** Presents a list of guild members to deny from the channel.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
*   **`handleDenyUserSelection(interaction, instance, channel, userId, manager, client)`**
    *   **Description:** Processes the selection of a user to deny.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBanSelection`)
    *   **Returns:** `Promise<void>`
*   **`handleManagePermissions(interaction, instance, channel, manager, client)`**
    *   **Description:** Displays an overview of allowed, blocked, and moderator users and provides options to manage them.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
