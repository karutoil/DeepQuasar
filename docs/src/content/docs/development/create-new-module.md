---
title: Create New Module
description: Guide to creating a new module for the DeepQuasar Modular System
sidebar:
  badge: Development
---

# Create New Module

This guide provides detailed instructions on how to create a new module for the DeepQuasar Modular Command System. Following these steps ensures your new module integrates seamlessly with the existing architecture and can be managed effectively.

## Understanding the Modular System

The DeepQuasar bot utilizes a modular system where command categories are self-contained units. Each module can be enabled or disabled independently via environment variables, offering flexibility and improved organization.

Key components:
-   **`src/modules/`**: The root directory for all modules.
-   **`index.js` (within each module)**: The entry point for a module, exporting its metadata (`info`), and `load`/`unload` functions.
-   **`commands/` (within each module)**: Directory to house the individual command files belonging to the module.
-   **`src/modules/index.js`**: The `ModuleManager` responsible for discovering, loading, and managing modules based on environment variables.
-   **`src/handlers/modularCommandHandler.js`**: Integrates with the `ModuleManager` to load commands from enabled modules into the bot's command collection.

## How to Create a New Module

Follow these steps to create a new module:

### 1. Create the Module Directory

First, create a new directory for your module under `src/modules/`. The directory name should be descriptive and lowercase (e.g., `myfeature`).

```sh
mkdir -p src/modules/myfeature
```

### 2. Create the Module's `index.js` File

Inside your new module directory (`src/modules/myfeature/`), create an `index.js` file. This file is crucial as it defines the module's metadata and its loading/unloading logic.

**Example `src/modules/myfeature/index.js`:**

```javascript
const path = require('path');
const fs = require('fs');

const moduleInfo = {
    name: 'My Feature Module',
    description: 'Provides commands and functionality for My Feature.',
    version: '1.0.0',
    commands: [], // This will be populated dynamically or manually listed
    category: 'My Feature' // Category for commands in help menus
};

/**
 * Loads commands and other components for the module.
 * @param {Client} client The Discord.js client instance.
 * @returns {object} An object containing the count of loaded commands.
 */
async function load(client) {
    const commandsPath = path.join(__dirname, 'commands');
    let commandCount = 0;

    if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            try {
                delete require.cache[require.resolve(filePath)]; // Clear cache for hot-reloading
                const command = require(filePath);

                if (command.data && command.execute) {
                    client.commands.set(command.data.name, command);
                    moduleInfo.commands.push(command.data.name); // Add command name to module info
                    commandCount++;
                    client.logger.debug(`Loaded command: ${command.data.name} from My Feature module`);
                } else {
                    client.logger.warn(`Command at ${filePath} is missing 'data' or 'execute' properties.`);
                }
            } catch (error) {
                client.logger.error(`Failed to load command ${file} in My Feature module:`, error);
            }
        }
    }

    // Example: Load managers or handlers if your module has them
    // const manager = require('./managers/MyFeatureManager');
    // client.myFeatureManager = new manager(client);

    client.logger.info(`My Feature Module loaded with ${commandCount} commands.`);
    return { commandCount };
}

/**
 * Unloads components and performs cleanup for the module.
 * @param {Client} client The Discord.js client instance.
 */
async function unload(client) {
    // Remove commands from client.commands if necessary (for full unload/reload)
    // for (const cmdName of moduleInfo.commands) {
    //     client.commands.delete(cmdName);
    // }

    // Perform any cleanup, e.g., stopping intervals, clearing caches
    client.logger.info('My Feature Module unloaded.');
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};
```

### 3. Create the `commands/` Subdirectory and Command Files

Inside your new module directory (`src/modules/myfeature/`), create a `commands/` subdirectory. Then, create your command files (e.g., `mycommand.js`, `anothercommand.js`) within this directory.

**Example `src/modules/myfeature/commands/mycommand.js`:**

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mycommand')
        .setDescription('This is my new command!'),
    async execute(interaction) {
        await interaction.reply('Hello from My Feature Module!');
    },
};
```

### 4. Implement `load` Function Logic

Ensure the `load` function in your module's `index.js` correctly reads and registers your commands with the `client.commands` collection. The provided example in Step 2 includes this logic.

### 5. Update `moduleInfo.commands`

As shown in the example `index.js` in Step 2, the `moduleInfo.commands` array should be dynamically populated with the names of the commands loaded by the module. This helps in tracking which commands belong to which module.

### 6. (Optional) Add Managers or Handlers

If your module requires specific managers (e.g., `MyFeatureManager.js`) or interaction handlers, create `managers/` or `handlers/` subdirectories within your module and implement your logic there. Remember to load these components within your module's `load` function.

### 7. Enable the New Module

For your new module to be loaded by the bot, you need to enable it.

#### Option A: Add to `defaultEnabledModules` (Recommended for core modules)

If your module is a fundamental part of the bot and should always be enabled by default, add its directory name to the `defaultEnabledModules` array in `src/modules/index.js`.

```javascript
// src/modules/index.js
// ...
        const defaultEnabledModules = [
            // ... existing modules
            'myfeature' // Add your new module here
        ];
// ...
```

#### Option B: Enable via Environment Variable

For modules that might be optional, you can enable them using an environment variable in your `.env` file or deployment configuration.

```
# In your .env file or deployment environment
ENABLE_MYFEATURE_MODULE=true
```

Alternatively, you can use the `ENABLED_MODULES` variable to explicitly list all modules you want to enable:

```
# In your .env file or deployment environment
ENABLED_MODULES=ai,information,music,myfeature # Add your new module here
```

### 8. Test Your New Module

After creating and enabling your module, restart the bot and test its commands to ensure everything is working as expected. Check the bot's console logs for any errors during module loading.

## Examples

### Module Directory Structure

```
src/modules/
├── myfeature/
│   ├── commands/
│   │   ├── mycommand.js
│   │   └── anothercommand.js
│   ├── managers/
│   │   └── MyFeatureManager.js
│   └── index.js
└── index.js # ModuleManager
```

### `src/modules/myfeature/commands/anothercommand.js`

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anothercommand')
        .setDescription('This is another command in My Feature module!'),
    async execute(interaction) {
        await interaction.reply('Another command executed successfully!');
    },
};
```

## Important Considerations

*   **Command Naming**: Ensure your command names are unique across all modules to avoid conflicts.
*   **Dependencies**: If your module has external dependencies, ensure they are listed in `package.json` and installed.
*   **Error Handling**: Implement robust error handling within your `load` and `execute` functions to prevent bot crashes.
*   **Logging**: Utilize `client.logger` for informative logging during module loading and command execution.

## Related Advanced Guide Sections

*   [DeepQuasar Modular Command System](/MODULAR_SYSTEM)
*   [Project Module Structure](/module_structure)
