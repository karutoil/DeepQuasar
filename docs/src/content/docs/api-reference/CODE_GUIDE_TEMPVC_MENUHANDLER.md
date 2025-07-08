---
title: CODE_GUIDE_TEMPVC_MENUHANDLER
sidebar:
  badge: ApiReference
---

## 4. TempVC Sub-Handlers (`src/utils/tempvc/`)

These modules contain specific logic for handling individual control panel actions within the temporary voice channel system. They are typically called by `TempVCControlHandlers.js`.

### `menuHandler.js`
Handles the main select menu and modal submissions for TempVC control panels.

*   **`handleMenuSelection(interaction, instance, channel, manager, client)`**
    *   **Description:** Dispatches the selected action from the main control panel select menu to the appropriate handler.
    *   **Parameters:** (Same as `banUnbanHandlers.handleBan`)
    *   **Returns:** `Promise<void>`
*   **`handleSelectMenuInteraction(interaction, manager, client)`**
    *   **Description:** Processes select menu interactions from various TempVC control sub-menus.
    *   **Parameters:**
        *   `interaction` (Discord.js Interaction)
        *   `manager` (TempVCManager instance)
        *   `client` (Discord.js Client)
    *   **Returns:** `Promise<void>`
*   **`handleModalSubmission(interaction, manager, client)`**
    *   **Description:** Processes modal submissions from various TempVC control sub-modals.
    *   **Parameters:** (Same as `handleSelectMenuInteraction`)
    *   **Returns:** `Promise<void>`
