---
title: CODE_GUIDE_HANDLERS_EVENT
sidebar:
  badge: ApiReference
---

## 1. Handlers (`src/handlers/`)

### `eventHandler.js`
Functions for loading and managing Discord bot events.

*   **`loadEvents(client)`**
    *   **Description:** Loads all event files from the `src/events` directory and registers them with the client.
    *   **Parameters:** `client` (Discord.js Client instance)
    *   **Returns:** `void`
    *   **Usage:**
        ```javascript
        const { loadEvents } = require('./src/handlers/eventHandler');
        loadEvents(client);
        ```

*   **`loadSingleEvent(client, filePath)`**
    *   **Description:** (Internal) Loads and registers a single event file.
    *   **Parameters:**
        *   `client` (Discord.js Client instance)
        *   `filePath` (string): Absolute path to the event file.
    *   **Returns:** `Promise<number>`: 1 if successful, 0 if failed or invalid.

*   **`reloadEvent(client, eventName)`**
    *   **Description:** Reloads a specific event by its name, removing existing listeners and re-registering.
    *   **Parameters:**
        *   `client` (Discord.js Client instance)
        *   `eventName` (string): The name of the event to reload.
    *   **Returns:** `Promise<Object>`: The reloaded event object.
    *   **Throws:** `Error` if the event or its file is not found, or if the reloaded event is invalid.
    *   **Usage:**
        ```javascript
        const { reloadEvent } = require('./src/handlers/eventHandler');
        await reloadEvent(client, 'ready');
        ```
