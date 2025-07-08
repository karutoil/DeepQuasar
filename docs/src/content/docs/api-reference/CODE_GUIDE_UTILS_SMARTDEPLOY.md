---
title: CODE_GUIDE_UTILS_SMARTDEPLOY
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `smartDeploy.js`
Handles intelligent deployment of Discord application commands, comparing current and new commands to minimize API calls.

*   **`SmartDeploymentService` (Class)**
    *   **Constructor:** `constructor()`
    *   **Methods:**
        *   **`makeRequest(endpoint, method, body)`**
            *   **Description:** Makes an HTTP request to the Discord API.
            *   **Parameters:**
                *   `endpoint` (string)
                *   `method` (string, default: 'GET')
                *   `body` (Object, optional)
            *   **Returns:** `Promise<Object>`: JSON response from Discord API.
            *   **Throws:** `Error` on API errors or rate limits.
            *   **Usage:** `await smartDeployer.makeRequest('/users/@me');`
        *   **`loadCommands()`**
            *   **Description:** Loads command data from local JavaScript files.
            *   **Returns:** `Promise<Array<Object>>`: Array of command JSON objects.
            *   **Usage:** `const commands = await smartDeployer.loadCommands();`
        *   **`commandsEqual(cmd1, cmd2)`**
            *   **Description:** Compares two command objects to check if they are functionally identical.
            *   **Parameters:**
                *   `cmd1` (Object)
                *   `cmd2` (Object)
            *   **Returns:** `boolean`
            *   **Usage:** `if (smartDeployer.commandsEqual(cmdA, cmdB)) { ... }`
        *   **`compareCommandSets(current, new_)`**
            *   **Description:** Compares a set of currently deployed commands with a new set to determine if deployment is needed.
            *   **Parameters:**
                *   `current` (Array<Object>): Currently deployed commands.
                *   `new_` (Array<Object>): New commands to deploy.
            *   **Returns:** `boolean`: `true` if changes are detected, `false` otherwise.
            *   **Usage:** `if (smartDeployer.compareCommandSets(currentCommands, newCommands)) { ... }`
        *   **`smartDeploy(client, isGuild, guildId)`**
            *   **Description:** The main deployment method. Loads commands, compares them with currently deployed ones, and deploys only if changes are detected.
            *   **Parameters:**
                *   `client` (Discord.js Client instance)
                *   `isGuild` (boolean): `true` for guild-specific deployment, `false` for global.
                *   `guildId` (string, optional): Required if `isGuild` is `true`.
            *   **Returns:** `Promise<boolean>`: `true` if deployment was successful or skipped, `false` if failed.
            *   **Usage:** `await smartDeployer.smartDeploy(client, true, '12345');`
