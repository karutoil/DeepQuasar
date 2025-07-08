---
title: CODE_GUIDE_SCHEMAS_MODLOG
sidebar:
  badge: ApiReference
---

## 2. Schemas (`src/schemas/`)

Mongoose schemas define the structure and behavior of data stored in MongoDB.

### `ModLog.js`
Mongoose model for storing moderation logging configurations for a guild.

*   **`ModLog` (Mongoose Model)**
    *   **Instance Methods:**
        *   **`getEventChannel(eventType)`**
            *   **Description:** Returns the channel ID where a specific event type should be logged, or `null` if disabled/not configured.
            *   **Parameters:** `eventType` (string)
            *   **Returns:** `string | null`
            *   **Usage:** `const channelId = modLog.getEventChannel('memberJoin');`
        *   **`isEventEnabled(eventType)`**
            *   **Description:** Checks if a specific moderation log event is enabled.
            *   **Parameters:** `eventType` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (modLog.isEventEnabled('messageDelete')) { ... }`
    *   **Static Methods:**
        *   **`getOrCreate(guildId)`**
            *   **Description:** Finds a guild's modlog settings or creates a new one with defaults if it doesn't exist.
            *   **Parameters:** `guildId` (string)
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `const modLog = await ModLog.getOrCreate('12345');`
