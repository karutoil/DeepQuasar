---
title: CODE_GUIDE_TEMPVC_REGIONHANDLER
sidebar:
  badge: ApiReference
---

## 4. TempVC Sub-Handlers (`src/utils/tempvc/`)

These modules contain specific logic for handling individual control panel actions within the temporary voice channel system. They are typically called by `TempVCControlHandlers.js`.

### `regionHandler.js`
Handles changing the voice region of a temporary voice channel.

*   **`handleRegion(interaction, instance, channel, manager, client)`**
    *   **Description:** Presents options for changing the channel's voice region.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
*   **`handleRegionSelection(interaction, instance, channel, value, manager, client)`**
    *   **Description:** Processes the selected voice region, applying it to the channel.
    *   **Parameters:** (Same as `bitrateHandler.handleBitrateSelection`)
    *   **Returns:** `Promise<void>`
