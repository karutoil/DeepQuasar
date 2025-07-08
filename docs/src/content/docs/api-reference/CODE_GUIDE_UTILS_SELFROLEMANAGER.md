---
title: CODE_GUIDE_UTILS_SELFROLEMANAGER
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `SelfRoleManager.js`
Manages the creation, updating, and interaction handling for self-role messages.

*   **`SelfRoleManager` (Class)**
    *   **Constructor:** `constructor(client)`
        *   **Parameters:** `client` (Discord.js Client instance)
    *   **Methods:**
        *   **`setupInteractionHandlers()`**
            *   **Description:** Sets up Discord.js interaction listeners for self-role buttons.
            *   **Returns:** `void`
            *   **Usage:** (Called in constructor)
        *   **`handleSelfRoleInteraction(interaction)`**
            *   **Description:** Processes button interactions on self-role messages (assigning/removing roles).
            *   **Parameters:** `interaction` (Discord.js ButtonInteraction)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by internal interaction handler)
        *   **`createSelfRoleMessage(guildId, channelId, data)`**
            *   **Description:** Creates a new self-role message in a Discord channel and saves its configuration to the database.
            *   **Parameters:**
                *   `guildId` (string)
                *   `channelId` (string)
                *   `data` (Object): Self-role configuration data.
            *   **Returns:** `Promise<Object>`: `{ success: boolean, message?: Message, data?: SelfRoleDocument, error?: string }`
            *   **Usage:** `const result = await selfRoleManager.createSelfRoleMessage('...', '...', { title: '...', roles: [...] });`
        *   **`updateSelfRoleMessage(selfRoleData)`**
            *   **Description:** Updates an existing self-role message in Discord based on its database configuration.
            *   **Parameters:** `selfRoleData` (SelfRole Mongoose Document)
            *   **Returns:** `Promise<void>`
            *   **Usage:** `await selfRoleManager.updateSelfRoleMessage(selfRoleDoc);`
        *   **`buildSelfRoleEmbed(data)`**
            *   **Description:** Constructs a Discord embed for a self-role message.
            *   **Parameters:** `data` (Object): Self-role configuration data.
            *   **Returns:** `EmbedBuilder`
            *   **Usage:** `const embed = selfRoleManager.buildSelfRoleEmbed(selfRoleDoc);`
        *   **`buildSelfRoleComponents(data, messageId)`**
            *   **Description:** Constructs Discord.js `ActionRowBuilder` components (buttons) for a self-role message.
            *   **Parameters:**
                *   `data` (Object): Self-role configuration data.
                *   `messageId` (string): The ID of the message this panel belongs to.
            *   **Returns:** `Array<ActionRowBuilder>`
            *   **Usage:** `const components = selfRoleManager.buildSelfRoleComponents(selfRoleDoc, 'messageId');`
        *   **`getButtonStyle(style)`**
            *   **Description:** Converts a string style name ('Primary', 'Success', etc.) to a Discord.js `ButtonStyle` enum.
            *   **Parameters:** `style` (string)
            *   **Returns:** `ButtonStyle`
            *   **Usage:** `const style = selfRoleManager.getButtonStyle('Success');`
        *   **`deleteSelfRoleMessage(messageId)`**
            *   **Description:** Deletes a self-role message from Discord and its corresponding database entry.
            *   **Parameters:** `messageId` (string)
            *   **Returns:** `Promise<Object>`: `{ success: boolean, error?: string }`
            *   **Usage:** `await selfRoleManager.deleteSelfRoleMessage('messageId');`
        *   **`getSelfRoleMessages(guildId)`**
            *   **Description:** Retrieves all self-role messages configured for a guild.
            *   **Parameters:** `guildId` (string)
            *   **Returns:** `Promise<Array<SelfRoleDocument>>`
            *   **Usage:** `const messages = await selfRoleManager.getSelfRoleMessages('123');`
        *   **`getSelfRoleStats(guildId, messageId)`**
            *   **Description:** Gathers statistics about self-role interactions for a guild or a specific message.
            *   **Parameters:**
                *   `guildId` (string)
                *   `messageId` (string, optional)
            *   **Returns:** `Promise<Object | null>`
            *   **Usage:** `const stats = await selfRoleManager.getSelfRoleStats('123');`
        *   **`logRoleAction(guild, member, role, action, selfRoleData)`**
            *   **Description:** Logs self-role assignment/removal actions to a configured log channel.
            *   **Parameters:**
                *   `guild` (Discord.js Guild)
                *   `member` (Discord.js GuildMember)
                *   `role` (Discord.js Role)
                *   `action` (string): 'assigned' or 'removed'.
                *   `selfRoleData` (SelfRole Mongoose Document)
            *   **Returns:** `Promise<void>`
            *   **Usage:** `await selfRoleManager.logRoleAction(guild, member, role, 'assigned', selfRoleDoc);`
        *   **`cleanupInvalidRoles(guildId)`**
            *   **Description:** Removes self-role configurations for roles that no longer exist in the guild.
            *   **Parameters:** `guildId` (string)
            *   **Returns:** `Promise<number>`: Count of roles cleaned up.
            *   **Usage:** `const cleaned = await selfRoleManager.cleanupInvalidRoles('123');`
