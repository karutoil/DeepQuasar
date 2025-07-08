---
title: CODE_GUIDE_TEMPVC_BITRATEHANDLER
sidebar:
  badge: ApiReference
---

## 4. TempVC Sub-Handlers (`src/utils/tempvc/`)

These modules contain specific logic for handling individual control panel actions within the temporary voice channel system. They are typically called by `TempVCControlHandlers.js`.

### `bitrateHandler.js`
Handles changing the bitrate of a temporary voice channel.

*   **`handleBitrate(interaction, instance, channel, manager, client)`**
    *   **Description:** Presents options for changing the channel's bitrate.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
*   **`handleBitrateSelection(interaction, instance, channel, value, manager, client)`**
    *   **Description:** Processes the selected bitrate, applying it to the channel.
    *   **Parameters:**
        *   `interaction` (Discord.js Interaction)
        *   `instance` (TempVCInstance Document)
        *   `channel` (Discord.js VoiceChannel)
        *   `value` (string): The selected bitrate value.
        *   `manager` (TempVCManager instance)
        *   `client` (Discord.js Client)
    *   **Returns:** `Promise<void>`
*   **`handleBitrateModal(interaction, instance, channel, manager, client)`**
    *   **Description:** Handles custom bitrate input from a modal.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
