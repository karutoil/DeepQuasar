---
title: CODE_GUIDE_SCHEMAS_TEMPVC
sidebar:
  badge: ApiReference
---

## 2. Schemas (`src/schemas/`)

Mongoose schemas define the structure and behavior of data stored in MongoDB.

### `TempVC.js`
Mongoose model for guild-specific temporary voice channel system configurations.

*   **`TempVC` (Mongoose Model)**
    *   **Instance Methods:**
        *   **`isEnabled()`**
            *   **Description:** Checks if the temporary voice channel system is enabled and properly configured.
            *   **Returns:** `boolean`
            *   **Usage:** `if (config.isEnabled()) { ... }`
        *   **`canUserCreate(userId, userRoles)`**
            *   **Description:** Determines if a user has permission to create a temporary channel based on whitelist/blacklist settings.
            *   **Parameters:**
                *   `userId` (string)
                *   `userRoles` (Array<string>): Array of role IDs the user has.
            *   **Returns:** `Object`: `{ canCreate: boolean, reason?: string }`
            *   **Usage:** `const check = config.canUserCreate(member.id, member.roles.cache.map(r => r.id));`
        *   **`getChannelName(user, activity, templateName)`**
            *   **Description:** Generates a channel name based on configured templates and user data.
            *   **Parameters:**
                *   `user` (Discord.js User object)
                *   `activity` (string, optional): User's current activity/game.
                *   `templateName` (string, optional): Specific naming template to use.
            *   **Returns:** `string`
            *   **Usage:** `const name = config.getChannelName(member.user, 'Playing Valorant');`
    *   **Static Methods:**
        *   **`getOrCreate(guildId)`**
            *   **Description:** Finds a guild's TempVC settings or creates a new one with defaults.
            *   **Parameters:** `guildId` (string)
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `const config = await TempVC.getOrCreate('12345');`
        *   **`findByGuildId(guildId)`**
            *   **Description:** Finds a guild's TempVC configuration by its ID.
            *   **Parameters:** `guildId` (string)
            *   **Returns:** `Query<Document>`
            *   **Usage:** `const config = await TempVC.findByGuildId('12345');`
        *   **`createDefault(guildId)`**
            *   **Description:** Creates a new TempVC configuration with default settings and naming templates.
            *   **Parameters:** `guildId` (string)
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `const newConfig = await TempVC.createDefault('12345');`
