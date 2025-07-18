# DeepQuasar Modular Command System

DeepQuasar bot has been refactored to use a modular command system that allows individual command categories to be enabled or disabled as needed.

## Directory Structure

All commands are now organized in modules under `src/modules/`:

```
src/modules/
├── ai/                     # AI Commands
│   ├── commands/
│   │   ├── ask.js
│   │   └── chatbot.js
│   └── index.js
├── information/            # Information Commands
│   ├── commands/
│   │   ├── help.js
│   │   ├── stats.js
│   │   └── ...
│   └── index.js
├── music/                  # Music Commands
│   ├── commands/
│   │   ├── play.js
│   │   └── ...
│   ├── managers/
│   │   └── MusicPlayerManager.js
│   └── index.js
├── autorole/               # Autorole Command
│   ├── commands/
│   │   └── autorole.js
│   ├── managers/
│   │   └── AutoRoleManager.js
│   └── index.js
├── selfrole/               # Selfrole Commands
│   ├── commands/
│   │   ├── selfrole.js
│   │   ├── selfrole-advanced.js
│   │   └── selfrole-setup.js
│   ├── managers/
│   │   └── SelfRoleManager.js
│   └── index.js
├── tempvc/                 # TempVC Commands
│   ├── commands/
│   │   └── ...
│   ├── managers/
│   │   └── TempVCManager.js
│   ├── handlers/
│   │   └── tempvc/
│   └── index.js
├── tickets/                # Ticket Commands
│   ├── commands/
│   │   └── ...
│   ├── managers/
│   │   └── TicketManager.js
│   └── index.js
├── moderation/             # Moderation Commands
│   ├── commands/
│   │   └── ...
│   └── index.js
├── lfg/                    # LFG Commands
│   ├── commands/
│   │   └── ...
│   ├── handlers/
│   │   └── ...
│   └── index.js
├── reminders/              # Reminder Commands
│   ├── commands/
│   │   ├── remind.js
│   │   └── reminders.js
│   ├── managers/
│   │   └── reminderManager.js
│   └── index.js
├── templates/              # Template Commands
│   ├── commands/
│   │   └── templates.js
│   └── index.js
├── general/                # General Commands
│   ├── commands/
│   │   └── ...
│   └── index.js
├── utils/                  # Utils Commands
│   └── index.js
└── index.js                # Module Manager
```

## Module Configuration

### Environment Variables

You can enable/disable individual modules using environment variables:

```bash
# Enable/disable specific modules (set to false to disable)
ENABLE_AI_MODULE=true
ENABLE_INFORMATION_MODULE=true
ENABLE_MUSIC_MODULE=true
ENABLE_UTILS_MODULE=true
ENABLE_TEMPLATES_MODULE=true
ENABLE_SELFROLE_MODULE=true
ENABLE_AUTOROLE_MODULE=true
ENABLE_TEMPVC_MODULE=true
ENABLE_TICKETS_MODULE=true
ENABLE_GENERAL_MODULE=true
ENABLE_MODERATION_MODULE=true
ENABLE_LFG_MODULE=true
ENABLE_REMINDERS_MODULE=true

# Alternative: Use comma-separated list to override all enabled modules
ENABLED_MODULES=ai,information,music,reminders
```

### Example Configurations

**Disable AI and Music modules:**
```bash
ENABLE_AI_MODULE=false
ENABLE_MUSIC_MODULE=false
```

**Only enable essential modules:**
```bash
ENABLED_MODULES=information,general,moderation
```

**Full bot (default):**
All modules are enabled by default if no configuration is provided.

## Module Structure

Each module follows a consistent structure:

### Module Index File (`index.js`)

Each module has an `index.js` file that exports:
- `info`: Module metadata (name, description, version, commands, category)
- `load(client)`: Function to load the module's commands and managers
- `unload(client)`: Function to unload the module

### Example Module Structure

```javascript
// src/modules/example/index.js
const moduleInfo = {
    name: 'Example Module',
    description: 'Example commands and functionality',
    version: '1.0.0',
    commands: ['example1', 'example2'],
    category: 'Example Commands'
};

async function load(client) {
    // Load commands and managers
    // Return { commandCount: number }
}

async function unload(client) {
    // Clean up
}

module.exports = {
    info: moduleInfo,
    load,
    unload
};
```

## Benefits

1. **Modularity**: Each command category is self-contained
2. **Flexibility**: Enable/disable modules as needed
3. **Organization**: Clear separation of concerns
4. **Maintainability**: Easier to maintain and update individual modules
5. **Performance**: Only load what you need

## Command Loading

The modular system:
1. Reads module configuration from environment variables
2. Loads only enabled modules
3. Initializes managers and handlers for each module
4. Registers commands with the Discord client
5. Provides detailed logging of what's loaded

## Backward Compatibility

The system maintains backward compatibility with existing:
- Event handlers
- Interaction handlers
- Database schemas
- Utility functions

## Development

When adding new commands:
1. Create commands in the appropriate module's `commands/` directory
2. Update the module's `index.js` to include the new command
3. Add any required managers to the module's `managers/` directory
4. Update the module's command list in the `moduleInfo`

The modular system will automatically load new commands when the module is enabled.