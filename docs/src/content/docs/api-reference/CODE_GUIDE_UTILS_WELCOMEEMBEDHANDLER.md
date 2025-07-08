---
title: CODE_GUIDE_UTILS_WELCOMEEMBEDHANDLER
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `WelcomeEmbedHandler.js`
Hands interactions and logic for the custom welcome/leave/DM embed builder.

*   **`WelcomeEmbedHandler` (Class)**
    *   **Static Methods:**
        *   **`handleWelcomeEmbedInteraction(interaction)`**
            *   **Description:** Processes button interactions specific to the welcome embed builder.
            *   **Parameters:** `interaction` (Discord.js ButtonInteraction)
            *   **Returns:** `Promise<boolean>`: `true` if handled, `false` otherwise.
            *   **Usage:** (Called by `interactionCreate` event handler)
        *   **`handleWelcomeModalSubmit(interaction)`**
            *   **Description:** Processes modal submissions specific to the welcome embed builder.
            *   **Parameters:** `interaction` (Discord.js ModalSubmitInteraction)
            *   **Returns:** `Promise<boolean>`: `true` if handled, `false` otherwise.
            *   **Usage:** (Called by `interactionCreate` event handler)
        *   **`showWelcomeModal(interaction, title, placeholder, currentValue, maxLength, style)`**
            *   **Description:** Displays a generic modal for text input in the welcome embed builder.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `title` (string)
                *   `placeholder` (string)
                *   `currentValue` (string, optional)
                *   `maxLength` (number, optional)
                *   `style` (TextInputStyle, optional)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by various handlers to get text input)
        *   **`showAuthorModal(interaction, currentAuthor)`**
            *   **Description:** Displays a modal for setting the embed author's name, icon, and URL.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `currentAuthor` (Object): Current author data.
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleWelcomeEmbedInteraction`)
        *   **`showFooterModal(interaction, currentFooter)`**
            *   **Description:** Displays a modal for setting the embed footer's text and icon.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `currentFooter` (Object): Current footer data.
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleWelcomeEmbedInteraction`)
        *   **`showAddFieldModal(interaction)`**
            *   **Description:** Displays a modal for adding a new field to the embed.
            *   **Parameters:** `interaction` (Discord.js Interaction)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleWelcomeEmbedInteraction`)
        *   **`showEditFieldSelect(interaction, fields)`**
            *   **Description:** Displays a select menu for choosing which embed field to edit.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `fields` (Array<Object>): Array of current embed fields.
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleWelcomeEmbedInteraction`)
        *   **`showPlaceholders(interaction, type)`**
            *   **Description:** Displays an ephemeral message listing available placeholders for welcome/leave/DM embeds.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `type` (string): 'welcome', 'leave', or 'dm'.
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleWelcomeEmbedInteraction`)
        *   **`testWelcomeEmbed(interaction, session)`**
            *   **Description:** Generates and sends a test preview of the custom embed with placeholder replacement.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `session` (Object): The user's session object.
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleWelcomeEmbedInteraction`)
        *   **`saveWelcomeEmbed(interaction, session)`**
            *   **Description:** Saves the custom embed and message content to the guild's configuration in the database.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `session` (Object): The user's session object.
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleWelcomeEmbedInteraction`)
        *   **`disableCustomEmbed(interaction, session)`**
            *   **Description:** Disables the custom embed for welcome/leave/DM messages, reverting to default.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `session` (Object): The user's session object.
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleWelcomeEmbedInteraction`)
        *   **`cancelWelcomeBuilder(interaction)`**
            *   **Description:** Cancels the welcome embed builder session and clears user data.
            *   **Parameters:** `interaction` (Discord.js Interaction)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleWelcomeEmbedInteraction`)
        *   **`updateWelcomeDisplay(interaction, session)`**
            *   **Description:** Updates the main welcome embed builder message with the current preview and components.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `session` (Object): The user's session object.
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called after any change to the embed data)
        *   **`handleWelcomeSelectMenu(interaction)`**
            *   **Description:** Processes select menu interactions specific to the welcome embed builder.
            *   **Parameters:** `interaction` (Discord.js StringSelectMenuInteraction)
            *   **Returns:** `Promise<boolean>`: `true` if handled, `false` otherwise.
            *   **Usage:** (Called by `interactionCreate` event handler)
        *   **`showEditFieldModal(interaction, field, index)`**
            *   **Description:** Displays a modal for editing an existing embed field within the welcome builder.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `field` (Object): The field object to edit.
                *   `index` (number): The index of the field.
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleWelcomeSelectMenu`)
        *   **`parseColor(colorStr)`**
            *   **Description:** Parses a color string (hex or named) into a Discord.js color integer.
            *   **Parameters:** `colorStr` (string)
            *   **Returns:** `number | null`
            *   **Usage:** `WelcomeEmbedHandler.parseColor('#57F287');`
        *   **`isValidUrl(string)`**
            *   **Description:** Validates if a string is a valid HTTP/HTTPS URL, allowing for placeholders.
            *   **Parameters:** `string` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (WelcomeEmbedHandler.isValidUrl('https://example.com')) { ... }`
        *   **`isValidImageUrl(string)`**
            *   **Description:** Validates if a string is a valid image URL (PNG, JPG, GIF, WebP), allowing for placeholders.
            *   **Parameters:** `string` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (WelcomeEmbedHandler.isValidImageUrl('https://example.com/image.png')) { ... }`
        *   **`containsPlaceholders(string)`**
            *   **Description:** Checks if a string contains placeholder patterns (e.g., `{user.name}`).
            *   **Parameters:** `string` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (WelcomeEmbedHandler.containsPlaceholders('{user.name}')) { ... }`
