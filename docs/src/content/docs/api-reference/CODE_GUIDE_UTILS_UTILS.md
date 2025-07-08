---
title: CODE_GUIDE_UTILS_UTILS
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `utils.js`
A general utility module providing common helper functions for Discord embeds, formatting, permissions, and data retrieval.

*   **`Utils` (Class)**
    *   **Static Methods:**
        *   **`createEmbed(options)`**
            *   **Description:** Creates a standardized Discord.js `EmbedBuilder` with common options.
            *   **Parameters:** `options` (Object): Embed properties (title, description, color, etc.).
            *   **Returns:** `EmbedBuilder`
            *   **Usage:** `const embed = Utils.createEmbed({ title: 'Hello', description: 'World' });`
        *   **`createSuccessEmbed(title, description)`**
            *   **Description:** Creates a green-colored success embed.
            *   **Parameters:**
                *   `title` (string)
                *   `description` (string)
            *   **Returns:** `EmbedBuilder`
            *   **Usage:** `Utils.createSuccessEmbed('Success', 'Operation completed.');`
        *   **`createErrorEmbed(title, description)`**
            *   **Description:** Creates a red-colored error embed.
            *   **Parameters:**
                *   `title` (string)
                *   `description` (string)
            *   **Returns:** `EmbedBuilder`
            *   **Usage:** `Utils.createErrorEmbed('Error', 'Something went wrong.');`
        *   **`createWarningEmbed(title, description)`**
            *   **Description:** Creates a yellow-colored warning embed.
            *   **Parameters:**
                *   `title` (string)
                *   `description` (string)
            *   **Returns:** `EmbedBuilder`
            *   **Usage:** `Utils.createWarningEmbed('Warning', 'Proceed with caution.');`
        *   **`createInfoEmbed(title, description)`**
            *   **Description:** Creates a blue-colored informational embed.
            *   **Parameters:**
                *   `title` (string)
                *   `description` (string)
            *   **Returns:** `EmbedBuilder`
            *   **Usage:** `Utils.createInfoEmbed('Info', 'Here is some information.');`
        *   **`createMusicEmbed(title, description, thumbnail)`**
            *   **Description:** Creates a purple-colored music-themed embed.
            *   **Parameters:**
                *   `title` (string)
                *   `description` (string)
                *   `thumbnail` (string, optional)
            *   **Returns:** `EmbedBuilder`
            *   **Usage:** `Utils.createMusicEmbed('Now Playing', 'Song Title');`
        *   **`formatDuration(ms)`**
            *   **Description:** Formats duration from milliseconds to a readable `HH:MM:SS` or `MM:SS` format.
            *   **Parameters:** `ms` (number)
            *   **Returns:** `string`
            *   **Usage:** `Utils.formatDuration(120000); // "02:00"`
        *   **`formatBytes(bytes, decimals)`**
            *   **Description:** Formats a number of bytes into a human-readable size (KB, MB, GB, etc.).
            *   **Parameters:**
                *   `bytes` (number)
                *   `decimals` (number, default: 2)
            *   **Returns:** `string`
            *   **Usage:** `Utils.formatBytes(1024); // "1 KB"`
        *   **`truncate(text, length)`**
            *   **Description:** Truncates text to a specified length, adding '...' if truncated.
            *   **Parameters:**
                *   `text` (string)
                *   `length` (number, default: 100)
            *   **Returns:** `string`
            *   **Usage:** `Utils.truncate('This is a very long string.', 10); // "This is..."`
        *   **`capitalize(text)`**
            *   **Description:** Capitalizes the first letter of each word in a string.
            *   **Parameters:** `text` (string)
            *   **Returns:** `string`
            *   **Usage:** `Utils.capitalize('hello world'); // "Hello World"`
        *   **`getSourceEmoji(source)`**
            *   **Description:** Returns an emoji representing a music source (YouTube, Spotify, etc.).
            *   **Parameters:** `source` (string)
            *   **Returns:** `string`
            *   **Usage:** `Utils.getSourceEmoji('youtube'); // "🎥"`
        *   **`createPaginationButtons(currentPage, totalPages)`**
            *   **Description:** Creates a set of Discord.js buttons for pagination.
            *   **Parameters:**
                *   `currentPage` (number, 0-indexed)
                *   `totalPages` (number)
            *   **Returns:** `ActionRowBuilder`
            *   **Usage:** `const buttons = Utils.createPaginationButtons(0, 5);`
        *   **`checkPermissions(interaction, requiredPermissions)`**
            *   **Description:** Checks if a user has the required Discord permissions or bot-specific roles (e.g., DJ role).
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `requiredPermissions` (Array<string>, optional): Array of Discord permission flags.
            *   **Returns:** `Promise<Object>`: `{ hasPermission: boolean, reason?: string }`
            *   **Usage:** `if (!(await Utils.checkPermissions(interaction, ['ManageGuild'])).hasPermission) { ... }`
        *   **`checkCooldown(client, userId, commandName, cooldownTime)`**
            *   **Description:** Manages command cooldowns for users.
            *   **Parameters:**
                *   `client` (Discord.js Client instance)
                *   `userId` (string)
                *   `commandName` (string)
                *   `cooldownTime` (number): Cooldown duration in milliseconds.
            *   **Returns:** `Object`: `{ onCooldown: boolean, timeLeft?: string }`
            *   **Usage:** `const cooldown = Utils.checkCooldown(client, user.id, 'ping', 5000);`
        *   **`getGuildData(guildId, guildName)`**
            *   **Description:** Retrieves a guild's configuration from the database or creates a default one if not found.
            *   **Parameters:**
                *   `guildId` (string)
                *   `guildName` (string, optional): Required if creating a new entry.
            *   **Returns:** `Promise<GuildDocument>`
            *   **Usage:** `const guildData = await Utils.getGuildData(interaction.guild.id, interaction.guild.name);`
        *   **`getUserData(userId, username, discriminator)`**
            *   **Description:** Retrieves a user's data from the database or creates a default one if not found.
            *   **Parameters:**
                *   `userId` (string)
                *   `username` (string, optional): Required if creating a new entry.
                *   `discriminator` (string, default: '0', optional): Required if creating a new entry.
            *   **Returns:** `Promise<UserDocument>`
            *   **Usage:** `const userData = await Utils.getUserData(interaction.user.id, interaction.user.username);`
        *   **`checkVoiceChannel(member)`**
            *   **Description:** Checks if a guild member is currently in a voice channel.
            *   **Parameters:** `member` (Discord.js GuildMember)
            *   **Returns:** `Object`: `{ inVoice: boolean, channel?: VoiceChannel, reason?: string }`
            *   **Usage:** `if (!Utils.checkVoiceChannel(member).inVoice) { ... }`
        *   **`checkBotVoicePermissions(voiceChannel)`**
            *   **Description:** Checks if the bot has necessary permissions (Connect, Speak) in a voice channel.
            *   **Parameters:** `voiceChannel` (Discord.js VoiceChannel)
            *   **Returns:** `Object`: `{ canJoin: boolean, reason?: string }`
            *   **Usage:** `if (!Utils.checkBotVoicePermissions(channel).canJoin) { ... }`
        *   **`parseSearchQuery(query)`**
            *   **Description:** Parses a search query to extract source prefixes (e.g., "yt:", "sc:") and determine if it's a URL.
            *   **Parameters:** `query` (string)
            *   **Returns:** `Object`: `{ query, source, isUrl, filters }`
            *   **Usage:** `const parsed = Utils.parseSearchQuery('yt:never gonna give you up');`
        *   **`generateRandomString(length)`**
            *   **Description:** Generates a random alphanumeric string of a specified length.
            *   **Parameters:** `length` (number, default: 10)
            *   **Returns:** `string`
            *   **Usage:** `const random = Utils.generateRandomString(16);`
        *   **`isValidUrl(string)`**
            *   **Description:** Checks if a string is a valid URL.
            *   **Parameters:** `string` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (Utils.isValidUrl('https://example.com')) { ... }`
        *   **`timeAgo(date)`**
            *   **Description:** Formats a Date object into a human-readable "time ago" string.
            *   **Parameters:** `date` (Date)
            *   **Returns:** `string`
            *   **Usage:** `Utils.timeAgo(new Date(Date.now() - 3600000)); // "1 hour ago"`
        *   **`parseTimeString(timeString)`**
            *   **Description:** Parses a time string (e.g., "1:30", "90s", "2m30s") into milliseconds.
            *   **Parameters:** `timeString` (string)
            *   **Returns:** `number | null`
            *   **Usage:** `Utils.parseTimeString('1m30s'); // 90000`
        *   **`isBotOwner(interaction)`**
            *   **Description:** Checks if the interacting user is the bot's owner.
            *   **Parameters:** `interaction` (Discord.js Interaction)
            *   **Returns:** `boolean`
            *   **Usage:** `if (Utils.isBotOwner(interaction)) { ... }`
        *   **`isServerOwner(interaction)`**
            *   **Description:** Checks if the interacting user is the guild's owner.
            *   **Parameters:** `interaction` (Discord.js Interaction)
            *   **Returns:** `boolean`
            *   **Usage:** `if (Utils.isServerOwner(interaction)) { ... }`
        *   **`checkChatbotPermissions(interaction)`**
            *   **Description:** Checks permissions for chatbot configuration commands (Bot Owner or Server Owner only).
            *   **Parameters:** `interaction` (Discord.js Interaction)
            *   **Returns:** `Object`: `{ hasPermission: boolean, reason?: string }`
            *   **Usage:** `if (!Utils.checkChatbotPermissions(interaction).hasPermission) { ... }`
        *   **`checkAutorolePermissions(interaction)`**
            *   **Description:** Checks permissions for autorole configuration commands (Administrator or Server Owner).
            *   **Parameters:** `interaction` (Discord.js Interaction)
            *   **Returns:** `Object`: `{ hasPermission: boolean, reason?: string }`
            *   **Usage:** `if (!Utils.checkAutorolePermissions(interaction).hasPermission) { ... }`
        *   **`checkSelfrolePermissions(interaction)`**
            *   **Description:** Checks permissions for self-role configuration commands (Administrator or Server Owner).
            *   **Parameters:** `interaction` (Discord.js Interaction)
            *   **Returns:** `Object`: `{ hasPermission: boolean, reason?: string }`
            *   **Usage:** `if (!Utils.checkSelfrolePermissions(interaction).hasPermission) { ... }`
        *   **`checkEmbedPermissions(interaction)`**
            *   **Description:** Checks permissions for embed-related commands (Manage Messages, Administrator, or Server Owner).
            *   **Parameters:** `interaction` (Discord.js Interaction)
            *   **Returns:** `Object`: `{ hasPermission: boolean, reason?: string }`
            *   **Usage:** `if (!Utils.checkEmbedPermissions(interaction).hasPermission) { ... }`
        *   **`checkTestingPermissions(interaction)`**
            *   **Description:** Checks permissions for testing commands (Bot Owner only).
            *   **Parameters:** `interaction` (Discord.js Interaction)
            *   **Returns:** `Object`: `{ hasPermission: boolean, reason?: string }`
            *   **Usage:** `if (!Utils.checkTestingPermissions(interaction).hasPermission) { ... }`
