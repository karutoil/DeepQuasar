---
title: ticket
description: Manage tickets
sidebar:
    badge: Tickets
---

# `ticket`

This command allows you to manage individual tickets.

## How to Use

Use the `/ticket` command followed by a subcommand to manage a ticket.

```sh
/ticket <subcommand>
```

### Subcommands

*   `close`
    *   **Description:** Close a ticket.
    *   **Options:**
        *   `ticket_id`
            *   **Description:** Ticket ID to close (leave empty for current channel).
            *   **Type:** String
            *   **Required:** No
        *   `reason`
            *   **Description:** Reason for closing.
            *   **Type:** String
            *   **Required:** No

*   `assign`
    *   **Description:** Assign a ticket to yourself or another staff member.
    *   **Options:**
        *   `ticket_id`
            *   **Description:** Ticket ID to assign (leave empty for current channel).
            *   **Type:** String
            *   **Required:** No
        *   `staff_member`
            *   **Description:** Staff member to assign to (leave empty to assign to yourself).
            *   **Type:** User
            *   **Required:** No
        *   `note`
            *   **Description:** Assignment note.
            *   **Type:** String
            *   **Required:** No

*   `reopen`
    *   **Description:** Reopen a closed ticket.
    *   **Options:**
        *   `ticket_id`
            *   **Description:** Ticket ID to reopen (leave empty for current channel).
            *   **Type:** String
            *   **Required:** No
        *   `reason`
            *   **Description:** Reason for reopening.
            *   **Type:** String
            *   **Required:** No

*   `delete`
    *   **Description:** Delete a ticket permanently.
    *   **Options:**
        *   `ticket_id`
            *   **Description:** Ticket ID to delete (leave empty for current channel).
            *   **Type:** String
            *   **Required:** No

*   `transcript`
    *   **Description:** Generate a transcript for a ticket.
    *   **Options:**
        *   `ticket_id`
            *   **Description:** Ticket ID (leave empty for current channel).
            *   **Type:** String
            *   **Required:** No
        *   `format`
            *   **Description:** Transcript format.
            *   **Type:** String
            *   **Required:** No
            *   **Choices:** `HTML`, `Text`, `JSON`

*   `tag`
    *   **Description:** Add or remove tags from a ticket.
    *   **Options:**
        *   `action`
            *   **Description:** Action to perform.
            *   **Type:** String
            *   **Required:** Yes
            *   **Choices:** `Add Tag`, `Remove Tag`, `List Tags`
        *   `tag`
            *   **Description:** Tag name.
            *   **Type:** String
            *   **Required:** No
        *   `ticket_id`
            *   **Description:** Ticket ID (leave empty for current channel).
            *   **Type:** String
            *   **Required:** No

*   `priority`
    *   **Description:** Set ticket priority.
    *   **Options:**
        *   `level`
            *   **Description:** Priority level.
            *   **Type:** String
            *   **Required:** Yes
            *   **Choices:** `Low`, `Normal`, `High`, `Urgent`
        *   `ticket_id`
            *   **Description:** Ticket ID (leave empty for current channel).
            *   **Type:** String
            *   **Required:** No

*   `list`
    *   **Description:** List tickets.
    *   **Options:**
        *   `status`
            *   **Description:** Filter by status.
            *   **Type:** String
            *   **Required:** No
            *   **Choices:** `Open`, `Closed`, `All`
        *   `user`
            *   **Description:** Filter by user.
            *   **Type:** User
            *   **Required:** No
        *   `assigned_to`
            *   **Description:** Filter by assigned staff member.
            *   **Type:** User
            *   **Required:** No
        *   `priority`
            *   **Description:** Filter by priority.
            *   **Type:** String
            *   **Required:** No
            *   **Choices:** `Low`, `Normal`, `High`, `Urgent`

*   `info`
    *   **Description:** Get detailed information about a ticket.
    *   **Options:**
        *   `ticket_id`
            *   **Description:** Ticket ID (leave empty for current channel).
            *   **Type:** String
            *   **Required:** No

## Examples

```sh
/ticket close reason:"Issue resolved."
/ticket assign staff_member:@StaffMember
/ticket list status:Open
```
