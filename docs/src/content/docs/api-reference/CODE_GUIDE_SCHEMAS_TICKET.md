---
title: CODE_GUIDE_SCHEMAS_TICKET
sidebar:
  badge: ApiReference
---

## 2. Schemas (`src/schemas/`)

Mongoose schemas define the structure and behavior of data stored in MongoDB.

### `Ticket.js`
Mongoose model for storing individual support ticket information.

*   **`Ticket` (Mongoose Model)**
    *   **Description:** Represents a single support ticket created by a user. Contains details like ID, guild, channel, user, type, reason, status, and assignment.
    *   **Usage:**
        ```javascript
        const Ticket = require('./src/schemas/Ticket');
        const newTicket = new Ticket({
            ticketId: '0001',
            guildId: '...',
            channelId: '...',
            userId: '...',
            username: '...',
            type: 'support',
            reason: '...',
            status: 'open'
        });
        await newTicket.save();
        ```
