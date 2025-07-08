---
title: CODE_GUIDE_SCHEMAS_TICKETCONFIG
sidebar:
  badge: ApiReference
---

## 2. Schemas (`src/schemas/`)

Mongoose schemas define the structure and behavior of data stored in MongoDB.

### `TicketConfig.js`
Mongoose model for guild-specific support ticket system configurations.

*   **`TicketConfig` (Mongoose Model)**
    *   **Description:** Stores settings for the ticket system within a guild, including channel categories, naming conventions, staff roles, panel configurations, modal questions, rate limiting, auto-close, and logging.
    *   **Usage:**
        ```javascript
        const TicketConfig = require('./src/schemas/TicketConfig');
        const config = await TicketConfig.findOne({ guildId: '...' });
        // Access config.channels, config.naming, etc.
        ```
