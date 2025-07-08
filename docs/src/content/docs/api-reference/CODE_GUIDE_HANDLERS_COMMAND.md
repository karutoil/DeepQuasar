---
title: CODE_GUIDE_HANDLERS_COMMAND
sidebar:
  badge: ApiReference
---

## 1. Handlers (`src/handlers/`)

### `commandHandler.js`
Functions for loading and managing Discord bot commands.

*   **`loadCommands(client)`**
    *   **Description:** Loads all command files from the `src/commands` directory into the client's command collection.
    *   **Parameters:** `client` (Discord.js Client instance)
    *   **Returns:** `void`
    *   **Usage:**
        ```javascript
        const { loadCommands } = require('./src/handlers/commandHandler');
        loadCommands(client);
        ```

*   **`reloadCommand(client, commandName)`**
    *   **Description:** Reloads a specific command by its name. Useful for hot-reloading during development.
    *   **Parameters:**
        *   `client` (Discord.js Client instance)
        *   `commandName` (string): The name of the command to reload.
    *   **Returns:** `Promise<Object>`: The reloaded command object.
    *   **Throws:** `Error` if the command or its file is not found, or if the reloaded command is invalid.
    *   **Usage:**
        ```javascript
        const { reloadCommand } = require('./src/handlers/commandHandler');
        await reloadCommand(client, 'ping');
        ```

*   **`getCommandCategories(client)`**
    *   **Description:** Organizes loaded commands into categories based on their `command.category` property.
    *   **Parameters:** `client` (Discord.js Client instance)
    *   **Returns:** `Promise<Collection>`: A Discord.js Collection where keys are category names and values are arrays of command objects.
    *   **Usage:**
        ```javascript
        const { getCommandCategories } = require('./src/handlers/commandHandler');
        const categories = await getCommandCategories(client);
        ```
