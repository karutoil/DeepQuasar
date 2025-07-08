---
title: CODE_GUIDE_UTILS_TEMPVCMANAGER
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `TempVCManager.js`
The core manager for the temporary voice channel system, handling voice state updates, channel creation/deletion, and control panel interactions.

*   **`TempVCManager` (Class)**
    *   **Constructor:** `constructor(client)`
        *   **Parameters:** `client` (Discord.js Client instance)
    *   **Methods:**
        *   **`handleVoiceStateUpdate(oldState, newState)`**
            *   **Description:** The primary entry point for the TempVC system, triggered by Discord voice state changes.
            *   **Parameters:**
                *   `oldState` (Discord.js VoiceState)
                *   `newState` (Discord.js VoiceState)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `voiceStateUpdate` event handler)
        *   **`handleUserJoinedChannel(member, channel, config)`**
            *   **Description:** Handles logic when a user joins a voice channel, including creating new temp channels.
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `channel` (Discord.js VoiceChannel)
                *   `config` (TempVC Mongoose Document)
            *   **Returns:** `Promise<void>`
        *   **`handleUserLeftChannel(member, channel, config)`**
            *   **Description:** Handles logic when a user leaves a voice channel, including auto-deletion and ownership transfer.
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `channel` (Discord.js VoiceChannel)
                *   `config` (TempVC Mongoose Document)
            *   **Returns:** `Promise<void>`
        *   **`createTempChannel(member, config)`**
            *   **Description:** Creates a new temporary voice channel for a user.
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `config` (TempVC Mongoose Document)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called internally by `handleUserJoinedChannel`)
        *   **`deleteTempChannel(instance)`**
            *   **Description:** Deletes a temporary voice channel and its database record.
            *   **Parameters:** `instance` (TempVCInstance Mongoose Document)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called internally for auto-deletion or by control panel)
        *   **`createControlPanel(instance, channel)`**
            *   **Description:** Creates and sends the interactive control panel message for a temporary channel.
            *   **Parameters:**
                *   `instance` (TempVCInstance Mongoose Document)
                *   `channel` (Discord.js VoiceChannel)
            *   **Returns:** `Promise<Object>`: `{ controlChannel, message }`
            *   **Usage:** (Called after channel creation)
        *   **`updateControlPanel(instance, channel)`**
            *   **Description:** Updates the existing control panel message with current channel information and settings.
            *   **Parameters:**
                *   `instance` (TempVCInstance Mongoose Document)
                *   `channel` (Discord.js VoiceChannel)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called after any setting change)
        *   **`createControlPanelEmbed(instance, channel, owner)`**
            *   **Description:** Generates the Discord embed for the temporary channel's control panel.
            *   **Parameters:**
                *   `instance` (TempVCInstance Mongoose Document)
                *   `channel` (Discord.js VoiceChannel)
                *   `owner` (Discord.js GuildMember)
            *   **Returns:** `EmbedBuilder`
            *   **Usage:** (Called by `createControlPanel` and `updateControlPanel`)
        *   **`createControlPanelComponents(instance, panelStyle)`**
            *   **Description:** Generates the interactive components (buttons/select menus) for the control panel.
            *   **Parameters:**
                *   `instance` (TempVCInstance Mongoose Document)
                *   `panelStyle` (string): 'buttons', 'select', or 'both'.
            *   **Returns:** `Array<ActionRowBuilder>`
            *   **Usage:** (Called by `createControlPanel` and `updateControlPanel`)
        *   **`handleControlPanelInteraction(interaction)`**
            *   **Description:** Dispatches control panel button interactions to the appropriate handler.
            *   **Parameters:** `interaction` (Discord.js ButtonInteraction)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `interactionCreate` event handler)
        *   **`startCleanupTask()`**
            *   **Description:** Initiates a periodic task to clean up inactive temporary channels and empty overflow categories.
            *   **Returns:** `void`
            *   **Usage:** (Called in constructor)
        *   **`isOnCooldown(userId, cooldownMinutes)`**
            *   **Description:** Checks if a user is on cooldown for creating temporary channels.
            *   **Parameters:**
                *   `userId` (string)
                *   `cooldownMinutes` (number)
            *   **Returns:** `boolean`
            *   **Usage:** `if (tempVCManager.isOnCooldown('123', 5)) { ... }`
        *   **`setCooldown(userId, cooldownMinutes)`**
            *   **Description:** Sets a cooldown for a user for creating temporary channels.
            *   **Parameters:**
                *   `userId` (string)
                *   `cooldownMinutes` (number, default: 5)
            *   **Returns:** `void`
            *   **Usage:** `tempVCManager.setCooldown('123');`
        *   **`getCooldownRemaining(userId, cooldownMinutes)`**
            *   **Description:** Returns the remaining cooldown time in minutes for a user.
            *   **Parameters:**
                *   `userId` (string)
                *   `cooldownMinutes` (number)
            *   **Returns:** `number`
            *   **Usage:** `const remaining = tempVCManager.getCooldownRemaining('123', 5);`
        *   **`formatUptime(ms)`**
            *   **Description:** Formats a duration in milliseconds into a human-readable uptime string.
            *   **Parameters:** `ms` (number)
            *   **Returns:** `string`
            *   **Usage:** `tempVCManager.formatUptime(3600000); // "1h"`
        *   **`logChannelCreation(guild, logChannelId, member, channel)`**
            *   **Description:** Logs the creation of a temporary channel to a specified log channel.
            *   **Parameters:**
                *   `guild` (Discord.js Guild)
                *   `logChannelId` (string)
                *   `member` (Discord.js GuildMember)
                *   `channel` (Discord.js VoiceChannel)
            *   **Returns:** `Promise<void>`
            *   **Usage:** `await tempVCManager.logChannelCreation(guild, 'logChannelId', member, channel);`
        *   **`checkCategoryCapacity(guild, categoryId)`**
            *   **Description:** Checks if a category is at or near its channel limit.
            *   **Parameters:**
                *   `guild` (Discord.js Guild)
                *   `categoryId` (string)
            *   **Returns:** `Promise<Object>`: `{ hasSpace: boolean, needsNewCategory: boolean, currentCount: number, maxCount: number }`
            *   **Usage:** `const capacity = await tempVCManager.checkCategoryCapacity(guild, 'categoryId');`
        *   **`createOverflowCategory(guild, originalCategory, config)`**
            *   **Description:** Creates a new overflow category when the primary one is full.
            *   **Parameters:**
                *   `guild` (Discord.js Guild)
                *   `originalCategory` (Discord.js CategoryChannel)
                *   `config` (TempVC Mongoose Document)
            *   **Returns:** `Promise<CategoryChannel>`: The newly created category.
            *   **Usage:** `const newCat = await tempVCManager.createOverflowCategory(guild, oldCategory, config);`
        *   **`getNextOverflowNumber(guild, baseName)`**
            *   **Description:** Determines the next sequential number for naming overflow categories.
            *   **Parameters:**
                *   `guild` (Discord.js Guild)
                *   `baseName` (string): The base name of the category.
            *   **Returns:** `Promise<number>`
            *   **Usage:** `const nextNum = await tempVCManager.getNextOverflowNumber(guild, 'Temp Channels');`
        *   **`cleanupOverflowCategories(guild, config)`**
            *   **Description:** Deletes empty overflow categories.
            *   **Parameters:**
                *   `guild` (Discord.js Guild)
                *   `config` (TempVC Mongoose Document)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by cleanup task)
