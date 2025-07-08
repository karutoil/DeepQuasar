---
title: CODE_GUIDE_SCHEMAS_TEMPVCINSTANCE
sidebar:
  badge: ApiReference
---

## 2. Schemas (`src/schemas/`)

Mongoose schemas define the structure and behavior of data stored in MongoDB.

### `TempVCInstance.js`
Mongoose model for tracking individual temporary voice channel instances.

*   **`TempVCInstance` (Mongoose Model)**
    *   **Instance Methods:**
        *   **`updateActivity(memberCount)`**
            *   **Description:** Updates the `lastActive` timestamp and `memberCount` for the channel.
            *   **Parameters:** `memberCount` (number, optional)
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `await instance.updateActivity(channel.members.size);`
        *   **`isOwner(userId)`**
            *   **Description:** Checks if the given user ID is the owner of this channel instance.
            *   **Parameters:** `userId` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (instance.isOwner(interaction.user.id)) { ... }`
        *   **`isModerator(userId)`**
            *   **Description:** Checks if the given user ID is an owner or moderator of this channel instance.
            *   **Parameters:** `userId` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (instance.isModerator(interaction.user.id)) { ... }`
        *   **`isAllowed(userId)`**
            *   **Description:** Checks if a user is allowed to join this channel (considering owner, allowed, and blocked lists).
            *   **Parameters:** `userId` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (instance.isAllowed(member.id)) { ... }`
        *   **`addModerator(userId)`**
            *   **Description:** Adds a user to the channel's moderator list.
            *   **Parameters:** `userId` (string)
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `await instance.addModerator('12345');`
        *   **`removeModerator(userId)`**
            *   **Description:** Removes a user from the channel's moderator list.
            *   **Parameters:** `userId` (string)
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `await instance.removeModerator('12345');`
        *   **`allowUser(userId)`**
            *   **Description:** Adds a user to the channel's allowed list and removes them from blocked if present.
            *   **Parameters:** `userId` (string)
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `await instance.allowUser('12345');`
        *   **`blockUser(userId)`**
            *   **Description:** Adds a user to the channel's blocked list and removes them from allowed if present.
            *   **Parameters:** `userId` (string)
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `await instance.blockUser('12345');`
        *   **`transferOwnership(newOwnerId)`**
            *   **Description:** Transfers ownership of the channel to a new user. The old owner becomes a moderator.
            *   **Parameters:** `newOwnerId` (string)
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `await instance.transferOwnership('newOwnerId');`
        *   **`shouldAutoDelete()`**
            *   **Description:** Checks if the channel should be auto-deleted based on inactivity and scheduled time.
            *   **Returns:** `boolean`
            *   **Usage:** `if (instance.shouldAutoDelete()) { ... }`
        *   **`scheduleAutoDelete(delayMinutes)`**
            *   **Description:** Schedules the channel for auto-deletion after a specified delay.
            *   **Parameters:** `delayMinutes` (number)
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `await instance.scheduleAutoDelete(5);`
        *   **`cancelAutoDelete()`**
            *   **Description:** Cancels any pending auto-deletion for the channel.
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `await instance.cancelAutoDelete();`
        *   **`saveCurrentSettings()`**
            *   **Description:** Saves the current channel settings (user limit, bitrate, etc.) to the user's persistent settings.
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `await instance.saveCurrentSettings();`
        *   **`resetToDefaults(guildDefaults)`**
            *   **Description:** Resets the channel's settings and permissions to the guild's default TempVC configuration.
            *   **Parameters:** `guildDefaults` (Object): Default settings from `TempVC` schema.
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `await instance.resetToDefaults(guildConfig.defaultSettings);`
        *   **`loadSavedSettings()`**
            *   **Description:** Loads previously saved settings for the channel owner and applies them.
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `await instance.loadSavedSettings();`
        *   **`autoSaveSettings()`**
            *   **Description:** Automatically saves current settings if auto-save is enabled for the user.
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `await instance.autoSaveSettings();`
    *   **Static Methods:**
        *   **`findByChannelId(channelId)`**
            *   **Description:** Finds a TempVC instance by its Discord channel ID.
            *   **Parameters:** `channelId` (string)
            *   **Returns:** `Query<Document>`
            *   **Usage:** `const instance = await TempVCInstance.findByChannelId('12345');`
        *   **`findByOwnerId(guildId, ownerId)`**
            *   **Description:** Finds all TempVC instances owned by a specific user in a guild.
            *   **Parameters:**
                *   `guildId` (string)
                *   `ownerId` (string)
            *   **Returns:** `Query<Array<Document>>`
            *   **Usage:** `const channels = await TempVCInstance.findByOwnerId('12345', 'ownerId');`
        *   **`findByGuildId(guildId)`**
            *   **Description:** Finds all TempVC instances within a specific guild.
            *   **Parameters:** `guildId` (string)
            *   **Returns:** `Query<Array<Document>>`
            *   **Usage:** `const allChannels = await TempVCInstance.findByGuildId('12345');`
        *   **`findInactiveChannels(guildId, inactiveMinutes)`**
            *   **Description:** Finds inactive TempVC channels (empty for a specified duration).
            *   **Parameters:**
                *   `guildId` (string)
                *   `inactiveMinutes` (number)
            *   **Returns:** `Query<Array<Document>>`
            *   **Usage:** `const inactive = await TempVCInstance.findInactiveChannels('12345', 5);`
        *   **`createInstance(data)`**
            *   **Description:** Creates a new TempVC instance record in the database.
            *   **Parameters:** `data` (Object): Initial data for the instance.
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `const newInstance = await TempVCInstance.createInstance({ guildId: '...', channelId: '...', ownerId: '...' });`
