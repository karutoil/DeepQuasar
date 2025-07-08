---
title: CODE_GUIDE_UTILS_LOGGER
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `logger.js`
A Winston-based logging utility for the bot, providing categorized and file-based logging.

*   **`logger` (Winston Logger Instance)**
    *   **Description:** This module exports a pre-configured Winston logger instance. It provides standard logging levels (`error`, `warn`, `info`, `debug`) and custom methods for specific log types.
    *   **Methods:**
        *   **`error(message, ...meta)`**
            *   **Description:** Logs an error message.
            *   **Usage:** `logger.error('An error occurred:', error);`
        *   **`warn(message, ...meta)`**
            *   **Description:** Logs a warning message.
            *   **Usage:** `logger.warn('Something unexpected happened.');`
        *   **`info(message, ...meta)`**
            *   **Description:** Logs an informational message.
            *   **Usage:** `logger.info('Bot started successfully.');`
        *   **`debug(message, ...meta)`**
            *   **Description:** Logs a debug message (only visible if `LOG_LEVEL` is 'debug').
            *   **Usage:** `logger.debug('Processing user input.');`
        *   **`command(user, guild, command, args)`**
            *   **Description:** Logs details about a command execution.
            *   **Parameters:**
                *   `user` (Discord.js User)
                *   `guild` (Discord.js Guild, optional)
                *   `command` (string): Command name.
                *   `args` (Array<string>): Command arguments.
            *   **Usage:** `logger.command(interaction.user, interaction.guild, 'play', ['song name']);`
        *   **`music(action, details)`**
            *   **Description:** Logs music-related actions.
            *   **Parameters:**
                *   `action` (string): Description of the music action.
                *   `details` (Object): Additional details.
            *   **Usage:** `logger.music('track_start', { track: '...', guildId: '...' });`
        *   **`database(action, details)`**
            *   **Description:** Logs database-related actions.
            *   **Parameters:**
                *   `action` (string): Description of the database action.
                *   `details` (Object): Additional details.
            *   **Usage:** `logger.database('guild_update', { guildId: '...', changes: '...' });`
        *   **`lavalink(event, details)`**
            *   **Description:** Logs Lavalink events.
            *   **Parameters:**
                *   `event` (string): Lavalink event name.
                *   `details` (Object): Event details.
            *   **Usage:** `logger.lavalink('node_connect', { node: '...' });`
