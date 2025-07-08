---
title: CODE_GUIDE_UTILS_TICKETMANAGER
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `TicketManager.js`
Manages the support ticket system, including panel creation, ticket lifecycle, and transcript generation.

*   **`TicketManager` (Class)**
    *   **Constructor:** `constructor(client)`
        *   **Parameters:** `client` (Discord.js Client instance)
    *   **Methods:**
        *   **`getConfig(guildId)`**
            *   **Description:** Retrieves or creates the ticket configuration for a guild.
            *   **Parameters:** `guildId` (string)
            *   **Returns:** `Promise<TicketConfigDocument>`
            *   **Usage:** `const config = await ticketManager.getConfig('123');`
        *   **`createPanel(guild, channel, options)`**
            *   **Description:** Creates a new ticket creation panel message in a Discord channel.
            *   **Parameters:**
                *   `guild` (Discord.js Guild)
                *   `channel` (Discord.js TextChannel)
                *   `options` (Object, optional): Panel title, description, color, and buttons.
            *   **Returns:** `Promise<Object>`: `{ panelId, message, config }`
            *   **Usage:** `const panel = await ticketManager.createPanel(guild, channel, { title: 'Support' });`
        *   **`handleTicketButton(interaction)`**
            *   **Description:** Processes button interactions on ticket creation panels.
            *   **Parameters:** `interaction` (Discord.js ButtonInteraction)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `interactionCreate` event handler)
        *   **`showTicketModal(interaction, ticketType, config)`**
            *   **Description:** Displays a modal for collecting ticket details based on the ticket type.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `ticketType` (string)
                *   `config` (TicketConfigDocument)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleTicketButton`)
        *   **`createAndShowModal(interaction, ticketType, modalConfig)`**
            *   **Description:** Constructs and shows a Discord modal for ticket creation.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `ticketType` (string)
                *   `modalConfig` (Object): Configuration for the modal (title, questions).
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `showTicketModal`)
        *   **`handleModalSubmit(interaction)`**
            *   **Description:** Processes modal submissions for ticket creation.
            *   **Parameters:** `interaction` (Discord.js ModalSubmitInteraction)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `interactionCreate` event handler)
        *   **`createTicket(interaction, ticketType, responses, config)`**
            *   **Description:** Creates a new ticket channel in Discord and a corresponding database entry.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `ticketType` (string)
                *   `responses` (Object): User's responses from the modal.
                *   `config` (TicketConfigDocument)
            *   **Returns:** `Promise<TicketDocument | null>`
            *   **Usage:** (Called by `handleModalSubmit`)
        *   **`sendTicketWelcomeMessage(channel, ticket, config)`**
            *   **Description:** Sends the initial welcome message and control buttons to a new ticket channel.
            *   **Parameters:**
                *   `channel` (Discord.js TextChannel)
                *   `ticket` (TicketDocument)
                *   `config` (TicketConfigDocument)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `createTicket`)
        *   **`handleTicketAction(interaction)`**
            *   **Description:** Dispatches ticket control button interactions (close, assign, transcript, delete, reopen) to the appropriate handler.
            *   **Parameters:** `interaction` (Discord.js ButtonInteraction)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `interactionCreate` event handler)
        *   **`handleCloseTicket(interaction, ticket, config)`**
            *   **Description:** Initiates the ticket closing process, typically by showing a reason modal.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `ticket` (TicketDocument)
                *   `config` (TicketConfigDocument)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleTicketAction`)
        *   **`processCloseTicket(interaction, ticket, reason, config)`**
            *   **Description:** Completes the ticket closing process after a reason is provided, updating status, moving channel, and logging.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `ticket` (TicketDocument)
                *   `reason` (string)
                *   `config` (TicketConfigDocument)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by modal submit handler for close reason)
        *   **`handleAssignTicket(interaction, ticket, config)`**
            *   **Description:** Assigns a ticket to the interacting staff member.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `ticket` (TicketDocument)
                *   `config` (TicketConfigDocument)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleTicketAction`)
        *   **`handleGenerateTranscript(interaction, ticket, config)`**
            *   **Description:** Generates and sends a transcript of the ticket channel.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `ticket` (TicketDocument)
                *   `config` (TicketConfigDocument)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleTicketAction`)
        *   **`handleDeleteTicket(interaction, ticket, config)`**
            *   **Description:** Initiates the ticket deletion process, typically by showing a confirmation.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `ticket` (TicketDocument)
                *   `config` (TicketConfigDocument)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleTicketAction`)
        *   **`handleReopenTicket(interaction, ticket, config)`**
            *   **Description:** Reopens a closed ticket, moving it back to the open category and restoring permissions.
            *   **Parameters:**
                *   `interaction` (Discord.js Interaction)
                *   `ticket` (TicketDocument)
                *   `config` (TicketConfigDocument)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by `handleTicketAction`)
        *   **`generateTicketId(config)`**
            *   **Description:** Generates a unique ticket ID based on the guild's counter.
            *   **Parameters:** `config` (TicketConfigDocument)
            *   **Returns:** `string`
            *   **Usage:** (Called by `createTicket`)
        *   **`generateChannelName(user, ticketId, config)`**
            *   **Description:** Generates a Discord channel name for the ticket based on configured patterns.
            *   **Parameters:**
                *   `user` (Discord.js User)
                *   `ticketId` (string)
                *   `config` (TicketConfigDocument)
            *   **Returns:** `string`
            *   **Usage:** (Called by `createTicket`)
        *   **`combineResponses(responses)`**
            *   **Description:** Combines an object of modal responses into a single formatted string.
            *   **Parameters:** `responses` (Object)
            *   **Returns:** `string`
            *   **Usage:** `ticketManager.combineResponses({ reason: '...', steps: '...' });`
        *   **`createButtonRows(buttons)`**
            *   **Description:** Organizes an array of button data into Discord.js `ActionRowBuilder` instances (max 5 buttons per row).
            *   **Parameters:** `buttons` (Array<Object>)
            *   **Returns:** `Array<ActionRowBuilder>`
            *   **Usage:** `const rows = ticketManager.createButtonRows([...]);`
        *   **`isRateLimited(userId, config)`**
            *   **Description:** Checks if a user is currently rate-limited from creating new tickets.
            *   **Parameters:**
                *   `userId` (string)
                *   `config` (TicketConfigDocument)
            *   **Returns:** `Promise<boolean>`
            *   **Usage:** `if (await ticketManager.isRateLimited('123', config)) { ... }`
        *   **`updateRateLimit(userId)`**
            *   **Description:** Updates the rate limit timestamp for a user.
            *   **Parameters:** `userId` (string)
            *   **Returns:** `void`
            *   **Usage:** `ticketManager.updateRateLimit('123');`
        *   **`hasPermission(member, permission, config)`**
            *   **Description:** Checks if a guild member has a specific ticket system permission (e.g., `canClose`, `canAssign`).
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `permission` (string): Permission key (e.g., 'canView', 'canAssign').
                *   `config` (TicketConfigDocument)
            *   **Returns:** `boolean`
            *   **Usage:** `if (ticketManager.hasPermission(member, 'canClose', config)) { ... }`
        *   **`scheduleAutoClose(ticket, config)`**
            *   **Description:** Schedules a ticket for automatic closure after inactivity.
            *   **Parameters:**
                *   `ticket` (TicketDocument)
                *   `config` (TicketConfigDocument)
            *   **Returns:** `void`
            *   **Usage:** (Called by `createTicket`)
        *   **`autoCloseTicket(ticket, config, guild)`**
            *   **Description:** Performs the actual auto-closure of a ticket.
            *   **Parameters:**
                *   `ticket` (TicketDocument)
                *   `config` (TicketConfigDocument)
                *   `guild` (Discord.js Guild)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called by scheduled task)
        *   **`startAutoCloseScheduler()`**
            *   **Description:** Initiates a periodic task to check for and auto-close inactive tickets.
            *   **Returns:** `void`
            *   **Usage:** (Called in constructor)
        *   **`logTicketEvent(eventType, ticket, user, config)`**
            *   **Description:** Logs ticket-related events to the configured moderation log channel.
            *   **Parameters:**
                *   `eventType` (string): 'create', 'close', 'delete', 'assign', 'reopen', 'autoclose'.
                *   `ticket` (TicketDocument)
                *   `user` (Discord.js User): The user performing the action.
                *   `config` (TicketConfigDocument)
            *   **Returns:** `Promise<void>`
            *   **Usage:** `await ticketManager.logTicketEvent('create', ticket, interaction.user, config);`
        *   **`sendDMNotification(user, action, ticket)`**
            *   **Description:** Sends a direct message notification to a user about a ticket action.
            *   **Parameters:**
                *   `user` (Discord.js User)
                *   `action` (string): 'opened', 'closed', 'reopened'.
                *   `ticket` (TicketDocument)
            *   **Returns:** `Promise<void>`
            *   **Usage:** `await ticketManager.sendDMNotification(user, 'closed', ticket);`
