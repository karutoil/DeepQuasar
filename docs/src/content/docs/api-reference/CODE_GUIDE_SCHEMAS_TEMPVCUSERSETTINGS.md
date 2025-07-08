---
title: CODE_GUIDE_SCHEMAS_TEMPVCUSERSETTINGS
sidebar:
  badge: ApiReference
---

## 2. Schemas (`src/schemas/`)

Mongoose schemas define the structure and behavior of data stored in MongoDB.

### `TempVCUserSettings.js`
Mongoose model for storing individual user's default settings for temporary voice channels.

*   **`TempVCUserSettings` (Mongoose Model)**
    *   **Instance Methods:**
        *   **`updateLastUsed()`**
            *   **Description:** Updates the `lastUsed` timestamp for the user's settings.
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `await userSettings.updateLastUsed();`
        *   **`updateSettings(newSettings)`**
            *   **Description:** Updates specific default settings for the user.
            *   **Parameters:** `newSettings` (Object)
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `await userSettings.updateSettings({ customName: 'My Cool Channel' });`
    *   **Static Methods:**
        *   **`findByUser(guildId, userId)`**
            *   **Description:** Finds a user's TempVC settings for a specific guild.
            *   **Parameters:**
                *   `guildId` (string)
                *   `userId` (string)
            *   **Returns:** `Query<Document>`
            *   **Usage:** `const settings = await TempVCUserSettings.findByUser('12345', 'userId');`
        *   **`createOrUpdate(guildId, userId, settings)`**
            *   **Description:** Creates new user settings or updates existing ones.
            *   **Parameters:**
                *   `guildId` (string)
                *   `userId` (string)
                *   `settings` (Object): Settings to apply.
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `await TempVCUserSettings.createOrUpdate('12345', 'userId', { autoSave: false });`
