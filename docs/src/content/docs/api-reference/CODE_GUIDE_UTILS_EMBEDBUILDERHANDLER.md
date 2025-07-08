---
title: CODE_GUIDE_UTILS_EMBEDBUILDERHANDLER
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `EmbedBuilderHandler.js`
Provides functionality for an interactive Discord embed builder, including modals, previews, and template management.

*   **`EmbedBuilderHandler` (Singleton Instance)**
    *   **Description:** This module exports a singleton instance of the `EmbedBuilderHandler` class.
    *   **Methods:**
        *   **`getSession(userId)`**
            *   **Description:** Retrieves or initializes an embed building session for a user.
            *   **Parameters:** `userId` (string)
            *   **Returns:** `Object`: The user's session object.
            *   **Usage:** `const session = EmbedBuilderHandler.getSession(interaction.user.id);`
        *   **`updateSession(userId, updates)`**
            *   **Description:** Updates the session data for a user.
            *   **Parameters:**
                *   `userId` (string)
                *   `updates` (Object): Object containing properties to update.
            *   **Returns:** `void`
            *   **Usage:** `EmbedBuilderHandler.updateSession(interaction.user.id, { messageContent: 'New content' });`
        *   **`cleanupExpiredSessions()`**
            *   **Description:** Cleans up sessions that have been inactive for too long.
            *   **Returns:** `void`
            *   **Usage:** (Called internally by a `setInterval`)
        *   **`createEmptyEmbedData()`**
            *   **Description:** Returns a new, empty embed data structure.
            *   **Returns:** `Object`
            *   **Usage:** `const emptyData = EmbedBuilderHandler.createEmptyEmbedData();`
        *   **`handleModalSubmit(interaction)`**
            *   **Description:** Processes modal submissions related to the embed builder (e.g., setting title, description, fields).
            *   **Parameters:** `interaction` (Discord.js ModalSubmitInteraction)
            *   **Returns:** `Promise<boolean>`: `true` if handled, `false` otherwise.
            *   **Usage:** (Called by `interactionCreate` event handler)
        *   **`handleSelectMenu(interaction)`**
            *   **Description:** Processes select menu interactions related to the embed builder (e.g., editing/removing fields, loading templates).
            *   **Parameters:** `interaction` (Discord.js StringSelectMenuInteraction)
            *   **Returns:** `Promise<boolean>`: `true` if handled, `false` otherwise.
            *   **Usage:** (Called by `interactionCreate` event handler)
        *   **`updateEmbedBuilder(interaction, session)`**
            *   **Description:** Updates the main embed builder message with the current preview and components.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `session` (Object): The user's session object.
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called after any change to the embed data)
        *   **`createPreviewEmbed(embedData)`**
            *   **Description:** Creates a Discord.js `EmbedBuilder` object from the raw embed data for preview.
            *   **Parameters:** `embedData` (Object)
            *   **Returns:** `EmbedBuilder`
            *   **Usage:** `const embed = EmbedBuilderHandler.createPreviewEmbed(session.embedData);`
        *   **`hasEmbedContent(embedData)`**
            *   **Description:** Checks if the embed data contains any visible content.
            *   **Parameters:** `embedData` (Object)
            *   **Returns:** `boolean`
            *   **Usage:** `if (EmbedBuilderHandler.hasEmbedContent(session.embedData)) { ... }`
        *   **`createBuilderContent(messageContent)`**
            *   **Description:** Generates the text content displayed above the embed preview.
            *   **Parameters:** `messageContent` (string)
            *   **Returns:** `string`
            *   **Usage:** `const content = EmbedBuilderHandler.createBuilderContent(session.messageContent);`
        *   **`createBuilderComponents(guildId)`**
            *   **Description:** Generates the action rows and buttons for the embed builder interface.
            *   **Parameters:** `guildId` (string)
            *   **Returns:** `Promise<Array<ActionRowBuilder>>`
            *   **Usage:** `const components = await EmbedBuilderHandler.createBuilderComponents(interaction.guild.id);`
        *   **`saveTemplate(interaction, name, description, category, embedData, messageContent)`**
            *   **Description:** Saves the current embed and message content as a reusable template to the database.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `name` (string)
                *   `description` (string)
                *   `category` (string)
                *   `embedData` (Object)
                *   `messageContent` (string)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called on 'save_template' modal submit)
        *   **`loadTemplate(interaction, templateId)`**
            *   **Description:** Loads a saved embed template into the current session.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `templateId` (string)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called on 'load_template' select menu selection)
        *   **`sendEmbedToChannel(interaction, channel, embedData, messageContent)`**
            *   **Description:** Sends the constructed embed and message content to a specified channel.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `channel` (Discord.js TextChannel)
                *   `embedData` (Object)
                *   `messageContent` (string)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called on 'send' button click)
        *   **`showEditFieldModal(interaction, field, index)`**
            *   **Description:** Displays a modal for editing an existing embed field.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `field` (Object): The field object to edit.
                *   `index` (number): The index of the field in the `fields` array.
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called when editing a field)
        *   **`clearSession(userId)`**
            *   **Description:** Clears all session data for a user, effectively ending their embed building session.
            *   **Parameters:** `userId` (string)
            *   **Returns:** `void`
            *   **Usage:** `EmbedBuilderHandler.clearSession(interaction.user.id);`
        *   **`resetSession(userId)`**
            *   **Description:** Resets the embed data and message content within a user's session, but keeps the session active.
            *   **Parameters:** `userId` (string)
            *   **Returns:** `void`
            *   **Usage:** `EmbedBuilderHandler.resetSession(interaction.user.id);`
        *   **`cleanEmbedData(embedData)`**
            *   **Description:** Removes null, undefined, or empty string values from embed data to ensure clean JSON.
            *   **Parameters:** `embedData` (Object)
            *   **Returns:** `Object`: The cleaned embed data.
            *   **Usage:** `const cleaned = EmbedBuilderHandler.cleanEmbedData(session.embedData);`
        *   **`parseColor(colorStr)`**
            *   **Description:** Parses a color string (hex or named) into a Discord.js color integer.
            *   **Parameters:** `colorStr` (string)
            *   **Returns:** `number | null`
            *   **Usage:** `const color = EmbedBuilderHandler.parseColor('#FF0000');`
        *   **`isValidUrl(string)`**
            *   **Description:** Validates if a string is a valid HTTP/HTTPS URL, allowing for placeholders.
            *   **Parameters:** `string` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (EmbedBuilderHandler.isValidUrl('https://example.com')) { ... }`
        *   **`isValidImageUrl(string)`**
            *   **Description:** Validates if a string is a valid image URL (PNG, JPG, GIF, WebP), allowing for placeholders.
            *   **Parameters:** `string` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (EmbedBuilderHandler.isValidImageUrl('https://example.com/image.png')) { ... }`
        *   **`containsPlaceholders(string)`**
            *   **Description:** Checks if a string contains placeholder patterns (e.g., `{user.name}`).
            *   **Parameters:** `string` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (EmbedBuilderHandler.containsPlaceholders('{user.name}')) { ... }`
