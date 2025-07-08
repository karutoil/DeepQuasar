---
title: CODE_GUIDE_SCHEMAS_GUILD
sidebar:
  badge: ApiReference
---

## 2. Schemas (`src/schemas/`)

Mongoose schemas define the structure and behavior of data stored in MongoDB.

### `Guild.js`
Mongoose model for storing guild-specific configurations and settings.

*   **`Guild` (Mongoose Model)**
    *   **Instance Methods:**
        *   **`isPremium()`**
            *   **Description:** Checks if the guild has an active premium subscription.
            *   **Returns:** `boolean`
            *   **Usage:** `if (guildData.isPremium()) { ... }`
        *   **`hasPremiumFeature(feature)`**
            *   **Description:** Checks if the guild has a specific premium feature enabled.
            *   **Parameters:** `feature` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (guildData.hasPremiumFeature('unlimited_queue')) { ... }`
        *   **`canUseCommand(userId, userRoles, commandName)`**
            *   **Description:** Determines if a user can use a specific command based on guild settings (disabled commands, DJ role for music).
            *   **Parameters:**
                *   `userId` (string)
                *   `userRoles` (Array<string>): Array of role IDs the user has.
                *   `commandName` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (guildData.canUseCommand(member.id, member.roles.cache.map(r => r.id), 'play')) { ... }`
        *   **`incrementStats(type, value)`**
            *   **Description:** Increments various guild statistics (commands used, songs played, playtime).
            *   **Parameters:**
                *   `type` (string): 'commands', 'songs', or 'playtime'.
                *   `value` (number, default: 1)
            *   **Returns:** `void` (modifies document in place)
            *   **Usage:** `guildData.incrementStats('commands');`
    *   **Static Methods:**
        *   **`findByGuildId(guildId)`**
            *   **Description:** Finds a guild's configuration by its ID.
            *   **Parameters:** `guildId` (string)
            *   **Returns:** `Query<Document>`
            *   **Usage:** `const guildData = await Guild.findByGuildId('12345');`
        *   **`createDefault(guildId, guildName)`**
            *   **Description:** Creates a new guild configuration with default settings.
            *   **Parameters:**
                *   `guildId` (string)
                *   `guildName` (string)
            *   **Returns:** `Promise<Document>`: The newly created guild document.
            *   **Usage:** `const newGuild = await Guild.createDefault('12345', 'My Server');`
        *   **`getPremiumGuilds()`**
            *   **Description:** Retrieves all guilds with active premium subscriptions.
            *   **Returns:** `Query<Array<Document>>`
            *   **Usage:** `const premiumGuilds = await Guild.getPremiumGuilds();`
