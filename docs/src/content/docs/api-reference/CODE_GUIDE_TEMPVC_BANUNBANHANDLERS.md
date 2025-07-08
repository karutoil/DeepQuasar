---
title: CODE_GUIDE_TEMPVC_BANUNBANHANDLERS
sidebar:
  badge: ApiReference
---

## 4. TempVC Sub-Handlers (`src/utils/tempvc/`)

These modules contain specific logic for handling individual control panel actions within the temporary voice channel system. They are typically called by `TempVCControlHandlers.js`.

### `banUnbanHandlers.js`
Handles banning and unbanning users from temporary voice channels.

*   **`handleBan(interaction, instance, channel, manager, client)`**
    *   **Description:** Initiates the ban process by presenting a list of members to ban.
    *   **Parameters:**
        *   `interaction` (Discord.js Interaction)
        *   `instance` (TempVCInstance Document)
        *   `channel` (Discord.js VoiceChannel)
        *   `manager` (TempVCManager instance)
        *   `client` (Discord.js Client)
    *   **Returns:** `Promise<void>`
*   **`handleBanSelection(interaction, instance, channel, userId, manager, client)`**
    *   **Description:** Processes the selection of a user to ban, updates permissions, and kicks the user.
    *   **Parameters:**
        *   `interaction` (Discord.js Interaction)
        *   `instance` (TempVCInstance Document)
        *   `channel` (Discord.js VoiceChannel)
        *   `userId` (string)
        *   `manager` (TempVCManager instance)
        *   `client` (Discord.js Client)
    *   **Returns:** `Promise<void>`
*   **`handleUnban(interaction, instance, channel, manager, client)`**
    *   **Description:** Initiates the unban process by presenting a list of banned members.
    *   **Parameters:** (Same as `handleBan`)
    *   **Returns:** `Promise<void>`
*   **`handleUnbanSelection(interaction, instance, channel, userId, manager, client)`**
    *   **Description:** Processes the selection of a user to unban, removing their ban.
    *   **Parameters:** (Same as `handleBanSelection`)
    *   **Returns:** `Promise<void>`
*   **`handleUnbanConfirmation(interaction, manager, client)`**
    *   **Description:** Handles confirmation for unban operations.
    *   **Parameters:**
        *   `interaction` (Discord.js Interaction)
        *   `manager` (TempVCManager instance)
        *   `client` (Discord.js Client)
    *   **Returns:** `Promise<void>`
*   **`handleUnbanCancellation(interaction)`**
    *   **Description:** Handles cancellation of unban operations.
    *   **Parameters:** `interaction` (Discord.js Interaction)
    *   **Returns:** `Promise<void>`
*   **`handleUnbanUserSelection(interaction, instance, channel, manager, client)`**
    *   **Description:** Handles user selection for unban, typically from a modal.
    *   **Parameters:** (Same as `handleBanSelection`)
    *   **Returns:** `Promise<void>`
*   **`handleUnbanListPageNavigation(interaction, instance, channel, client)`**
    *   **Description:** Handles pagination for the unban list display.
    *   **Parameters:**
        *   `interaction` (Discord.js Interaction)
        *   `instance` (TempVCInstance Document)
        *   `channel` (Discord.js VoiceChannel)
        *   `client` (Discord.js Client)
    *   **Returns:** `Promise<void>`
