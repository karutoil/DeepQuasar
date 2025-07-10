---
title: panel
description: Manage ticket panels
sidebar:
    badge: Tickets
---

# `panel`

This command allows you to manage ticket panels, which are the messages with buttons that users click to create tickets.

## How to Use

Use the `/panel` command followed by a subcommand to manage ticket panels.

```sh
/panel <subcommand>
```

### Subcommands

*   `create`
    *   **Description:** Create a new ticket panel.
    *   **Options:**
        *   `channel`
            *   **Description:** Channel to send the panel to.
            *   **Type:** Channel (Text)
            *   **Required:** Yes
        *   `title`
            *   **Description:** Panel title.
            *   **Type:** String
            *   **Required:** No
        *   `description`
            *   **Description:** Panel description.
            *   **Type:** String
            *   **Required:** No
        *   `color`
            *   **Description:** Panel embed color (hex code).
            *   **Type:** String
            *   **Required:** No

*   `edit`
    *   **Description:** Edit an existing ticket panel.
    *   **Options:**
        *   `panel_id`
            *   **Description:** Panel ID to edit.
            *   **Type:** String
            *   **Required:** Yes
        *   `title`
            *   **Description:** New panel title.
            *   **Type:** String
            *   **Required:** No
        *   `description`
            *   **Description:** New panel description.
            *   **Type:** String
            *   **Required:** No
        *   `color`
            *   **Description:** New panel embed color (hex code).
            *   **Type:** String
            *   **Required:** No

*   `delete`
    *   **Description:** Delete a ticket panel.
    *   **Options:**
        *   `panel_id`
            *   **Description:** Panel ID to delete.
            *   **Type:** String
            *   **Required:** Yes

*   `list`
    *   **Description:** List all ticket panels in this server.

*   `add-button`
    *   **Description:** Add a button to a ticket panel.
    *   **Options:**
        *   `panel_id`
            *   **Description:** Panel ID to add button to.
            *   **Type:** String
            *   **Required:** Yes
        *   `type`
            *   **Description:** Ticket type for this button.
            *   **Type:** String
            *   **Required:** Yes
            *   **Choices:** `Support`, `Bug Report`, `Partnership`, `Billing`, `Other`
        *   `label`
            *   **Description:** Button label.
            *   **Type:** String
            *   **Required:** Yes
        *   `emoji`
            *   **Description:** Button emoji.
            *   **Type:** String
            *   **Required:** No
        *   `style`
            *   **Description:** Button style.
            *   **Type:** String
            *   **Required:** No
            *   **Choices:** `Primary (Blue)`, `Secondary (Gray)`, `Success (Green)`, `Danger (Red)`
        *   `description`
            *   **Description:** Button description.
            *   **Type:** String
            *   **Required:** No

*   `remove-button`
    *   **Description:** Remove a button from a ticket panel.
    *   **Options:**
        *   `panel_id`
            *   **Description:** Panel ID to remove button from.
            *   **Type:** String
            *   **Required:** Yes
        *   `type`
            *   **Description:** Ticket type of button to remove.
            *   **Type:** String
            *   **Required:** Yes

## Examples

```sh
/panel create channel:#tickets title:"Support Tickets" description:"Click a button to open a ticket."
/panel add-button panel_id:12345 type:Support label:"Open Support Ticket"
```
