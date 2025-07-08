---
title: CODE_GUIDE_SCHEMAS_EMBEDTEMPLATE
sidebar:
  badge: ApiReference
---

## 2. Schemas (`src/schemas/`)

Mongoose schemas define the structure and behavior of data stored in MongoDB.

### `EmbedTemplate.js`
Mongoose model for storing reusable Discord embed templates.

*   **`EmbedTemplate` (Mongoose Model)**
    *   **Instance Methods:**
        *   **`incrementUsage()`**
            *   **Description:** Increments the `usage.count` and updates `usage.lastUsed` for the template.
            *   **Returns:** `Promise<Document>`: The updated document.
            *   **Usage:** `await template.incrementUsage();`
        *   **`toDisplayObject()`**
            *   **Description:** Returns a simplified object containing key template information suitable for display.
            *   **Returns:** `Object`
            *   **Usage:** `const display = template.toDisplayObject();`
    *   **Static Methods:**
        *   **`findByGuild(guildId)`**
            *   **Description:** Finds all embed templates for a given guild, sorted by last used and creation date.
            *   **Parameters:** `guildId` (string)
            *   **Returns:** `Query<Array<Document>>`
            *   **Usage:** `const templates = await EmbedTemplate.findByGuild('12345');`
        *   **`findByCategory(guildId, category)`**
            *   **Description:** Finds embed templates for a guild within a specific category.
            *   **Parameters:**
                *   `guildId` (string)
                *   `category` (string)
            *   **Returns:** `Query<Array<Document>>`
            *   **Usage:** `const templates = await EmbedTemplate.findByCategory('12345', 'Welcome');`
        *   **`searchTemplates(guildId, searchTerm)`**
            *   **Description:** Searches templates by name, description, or tags within a guild.
            *   **Parameters:**
                *   `guildId` (string)
                *   `searchTerm` (string)
            *   **Returns:** `Query<Array<Document>>`
            *   **Usage:** `const results = await EmbedTemplate.searchTemplates('12345', 'event');`
        *   **`getPopularTemplates(guildId, limit)`**
            *   **Description:** Retrieves the most popular templates based on usage count.
            *   **Parameters:**
                *   `guildId` (string)
                *   `limit` (number, default: 10)
            *   **Returns:** `Query<Array<Document>>`
            *   **Usage:** `const popular = await EmbedTemplate.getPopularTemplates('12345', 5);`
