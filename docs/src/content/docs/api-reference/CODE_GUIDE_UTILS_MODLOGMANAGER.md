---
title: CODE_GUIDE_UTILS_MODLOGMANAGER
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `ModLogManager.js`
Provides static methods for logging moderation events to Discord channels.

*   **`ModLogManager` (Class)**
    *   **Static Properties:**
        *   **`colors`**: Object mapping event types to Discord embed colors.
        *   **`emojis`**: Object mapping event types to relevant emojis.
    *   **Static Methods:**
        *   **`logEvent(guild, eventType, embedOptions, executor)`**
            *   **Description:** Sends a formatted embed to the configured moderation log channel for a specific event type.
            *   **Parameters:**
                *   `guild` (Discord.js Guild)
                *   `eventType` (string): The type of event (e.g., 'memberJoin', 'messageDelete').
                *   `embedOptions` (Object): Options for the embed (title, description, fields, etc.).
                *   `executor` (Discord.js User, optional): The user responsible for the action (if applicable).
            *   **Returns:** `Promise<void>`
            *   **Usage:** `await ModLogManager.logEvent(guild, 'memberBan', { title: 'User Banned', description: '...' }, moderator);`
        *   **`getAuditLogEntry(guild, type, target, maxAge)`**
            *   **Description:** Fetches a relevant audit log entry for an event.
            *   **Parameters:**
                *   `guild` (Discord.js Guild)
                *   `type` (AuditLogEvent): Discord.js AuditLogEvent type.
                *   `target` (Object, optional): The target of the audit log entry (e.g., user, channel).
                *   `maxAge` (number, default: 10000): Maximum age of the log entry in milliseconds.
            *   **Returns:** `Promise<AuditLogEntry | null>`
            *   **Usage:** `const entry = await ModLogManager.getAuditLogEntry(guild, AuditLogEvent.MemberBanAdd, user);`
        *   **`formatUser(user)`**
            *   **Description:** Formats a Discord user object for display in logs.
            *   **Parameters:** `user` (Discord.js User)
            *   **Returns:** `string`
            *   **Usage:** `ModLogManager.formatUser(user);`
        *   **`formatChannel(channel)`**
            *   **Description:** Formats a Discord channel object for display in logs.
            *   **Parameters:** `channel` (Discord.js Channel)
            *   **Returns:** `string`
            *   **Usage:** `ModLogManager.formatChannel(channel);`
        *   **`formatRole(role)`**
            *   **Description:** Formats a Discord role object for display in logs.
            *   **Parameters:** `role` (Discord.js Role)
            *   **Returns:** `string`
            *   **Usage:** `ModLogManager.formatRole(role);`
        *   **`formatPermissions(permissions)`**
            *   **Description:** Formats an array of Discord permission strings into a human-readable list.
            *   **Parameters:** `permissions` (Array<string>)
            *   **Returns:** `string`
            *   **Usage:** `ModLogManager.formatPermissions(['KickMembers', 'BanMembers']);`
        *   **`getObjectDifferences(oldObj, newObj, fields)`**
            *   **Description:** Compares two objects and returns an array of differences for specified fields.
            *   **Parameters:**
                *   `oldObj` (Object)
                *   `newObj` (Object)
                *   `fields` (Array<string>): Array of field names to compare.
            *   **Returns:** `Array<Object>`: Array of field objects suitable for embed fields.
            *   **Usage:** `const diffs = ModLogManager.getObjectDifferences(oldMember, newMember, ['nickname', 'roles']);`
        *   **`truncateText(text, maxLength)`**
            *   **Description:** Truncates text to a maximum length, adding '...' if truncated.
            *   **Parameters:**
                *   `text` (string)
                *   `maxLength` (number, default: 1024)
            *   **Returns:** `string`
            *   **Usage:** `ModLogManager.truncateText('Long text here', 50);`
        *   **`formatDuration(seconds)`**
            *   **Description:** Formats a duration in seconds into a human-readable string (e.g., "1d 2h 3m 4s").
            *   **Parameters:** `seconds` (number)
            *   **Returns:** `string`
            *   **Usage:** `ModLogManager.formatDuration(3665);`
        *   **`getEventTypes()`**
            *   **Description:** Returns an array of all supported moderation log event types.
            *   **Returns:** `Array<string>`
            *   **Usage:** `const types = ModLogManager.getEventTypes();`
        *   **`getEventDisplayName(eventType)`**
            *   **Description:** Converts an event type string (camelCase) into a human-readable display name.
            *   **Parameters:** `eventType` (string)
            *   **Returns:** `string`
            *   **Usage:** `ModLogManager.getEventDisplayName('memberJoin'); // "Member Join"`
