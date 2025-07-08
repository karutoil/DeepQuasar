---
title: CODE_GUIDE_UTILS_WELCOMESYSTEM
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `WelcomeSystem.js`
Handles the welcome, leave, and DM welcome messages for new and leaving members.

*   **`WelcomeSystem` (Class)**
    *   **Static Methods:**
        *   **`handleMemberJoin(member, client)`**
            *   **Description:** Processes a new member joining a guild, sending welcome messages and DMs as configured.
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `client` (Discord.js Client instance)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `guildMemberAdd` event handler)
        *   **`handleMemberLeave(member, client)`**
            *   **Description:** Processes a member leaving a guild, sending leave messages as configured.
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `client` (Discord.js Client instance)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `guildMemberRemove` event handler)
        *   **`createWelcomeMessage(member, guildData, inviter)`**
            *   **Description:** Constructs the welcome message/embed based on guild configuration (default or custom).
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `guildData` (Guild Mongoose Document)
                *   `inviter` (Object): Inviter information.
            *   **Returns:** `Promise<Object>`: Message payload (`{ content, embeds }`).
            *   **Usage:** (Called by `handleMemberJoin`)
        *   **`createCustomWelcomeEmbed(member, guildData, inviter, embedData)`**
            *   **Description:** Creates a custom welcome embed, replacing placeholders with actual data.
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `guildData` (Guild Mongoose Document)
                *   `inviter` (Object): Inviter information.
                *   `embedData` (Object): Raw embed data from configuration.
            *   **Returns:** `Object`: Message payload (`{ content, embeds }`).
            *   **Usage:** (Called by `createWelcomeMessage`)
        *   **`createCustomLeaveEmbed(member, guildData, embedData)`**
            *   **Description:** Creates a custom leave embed, replacing placeholders with actual data.
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `guildData` (Guild Mongoose Document)
                *   `embedData` (Object): Raw embed data from configuration.
            *   **Returns:** `Object`: Message payload (`{ content, embeds }`).
            *   **Usage:** (Called by `createLeaveMessage`)
        *   **`createCustomDMEmbed(member, guildData, embedData)`**
            *   **Description:** Creates a custom DM welcome embed, replacing placeholders with actual data.
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `guildData` (Guild Mongoose Document)
                *   `embedData` (Object): Raw embed data from configuration.
            *   **Returns:** `Object`: Message payload (`{ content, embeds }`).
            *   **Usage:** (Called by `sendDMWelcome`)
        *   **`createLeaveMessage(member, guildData)`**
            *   **Description:** Constructs the leave message/embed based on guild configuration (default or custom).
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `guildData` (Guild Mongoose Document)
            *   **Returns:** `Promise<Object>`: Message payload (`{ embeds }`).
            *   **Usage:** (Called by `handleMemberLeave`)
        *   **`sendDMWelcome(member, guildData)`**
            *   **Description:** Sends a direct message welcome to a new member.
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `guildData` (Guild Mongoose Document)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleMemberJoin`)
        *   **`getInviter(member, client)`**
            *   **Description:** Attempts to determine who invited a new member using invite tracking.
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `client` (Discord.js Client instance)
            *   **Returns:** `Promise<Object | null>`: `{ code, inviter, uses }` or `null`.
            *   **Usage:** (Called by `createWelcomeMessage`)
        *   **`replacePlaceholders(text, member, guild, inviter)`**
            *   **Description:** Replaces common placeholders in a string with actual member, guild, and inviter data.
            *   **Parameters:**
                *   `text` (string)
                *   `member` (Discord.js GuildMember)
                *   `guild` (Discord.js Guild)
                *   `inviter` (Object, optional): Inviter information.
            *   **Returns:** `string`
            *   **Usage:** `WelcomeSystem.replacePlaceholders('Welcome {user.tag}!', member, guild);`
        *   **`replacePlaceholdersExtended(text, member, guild, inviter)`**
            *   **Description:** Extends `replacePlaceholders` with additional time and account-related placeholders for custom embeds.
            *   **Parameters:**
                *   `text` (string)
                *   `member` (Discord.js GuildMember)
                *   `guild` (Discord.js Guild)
                *   `inviter` (Object, optional): Inviter information.
            *   **Returns:** `string`
            *   **Usage:** `WelcomeSystem.replacePlaceholdersExtended('Account created {account.age} ago.', member, guild);`
        *   **`getAccountAge(createdAt)`**
            *   **Description:** Calculates the age of a Discord account in a human-readable format.
            *   **Parameters:** `createdAt` (Date): User's account creation date.
            *   **Returns:** `string`
            *   **Usage:** `WelcomeSystem.getAccountAge(user.createdAt);`
        *   **`initializeInviteCache(guild, client)`**
            *   **Description:** Initializes the bot's invite cache for a specific guild.
            *   **Parameters:**
                *   `guild` (Discord.js Guild)
                *   `client` (Discord.js Client instance)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called on `guildCreate` or bot ready)
        *   **`containsPlaceholders(string)`**
            *   **Description:** Checks if a string contains placeholder patterns (e.g., `{user.name}`).
            *   **Parameters:** `string` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (WelcomeSystem.containsPlaceholders('{user.name}')) { ... }`
        *   **`getOrdinalSuffix(num)`**
            *   **Description:** Converts a number to its ordinal form (e.g., 1 -> 1st, 2 -> 2nd).
            *   **Parameters:** `num` (number)
            *   **Returns:** `string`
            *   **Usage:** `WelcomeSystem.getOrdinalSuffix(1); // "1st"`
