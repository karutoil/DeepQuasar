---
title: tickets
description: Configure the ticket system
sidebar:
    badge: Tickets
---

# `tickets`

This command allows you to configure the ticket system for your server.

## How to Use

Use the `/tickets` command followed by a subcommand to configure the ticket system.

```sh
/tickets <subcommand>
```

### Subcommands

*   `setup`
    *   **Description:** Initial setup for the ticket system.
    *   **Options:**
        *   `open_category`
            *   **Description:** Category for open tickets.
            *   **Type:** Channel (Category)
            *   **Required:** Yes
        *   `closed_category`
            *   **Description:** Category for closed tickets.
            *   **Type:** Channel (Category)
            *   **Required:** Yes
        *   `log_channel`
            *   **Description:** Channel for ticket logs.
            *   **Type:** Channel (Text)
            *   **Required:** Yes

*   `config`
    *   **Description:** View current configuration.

*   `channels`
    *   **Description:** Configure ticket channels.
    *   **Options:**
        *   `open_category`
            *   **Description:** Category for open tickets.
            *   **Type:** Channel (Category)
            *   **Required:** No
        *   `closed_category`
            *   **Description:** Category for closed tickets.
            *   **Type:** Channel (Category)
            *   **Required:** No
        *   `log_channel`
            *   **Description:** Channel for ticket logs.
            *   **Type:** Channel (Text)
            *   **Required:** No
        *   `archive_channel`
            *   **Description:** Channel for ticket archives.
            *   **Type:** Channel (Text)
            *   **Required:** No

*   `staff`
    *   **Description:** Manage staff roles.
    *   **Options:**
        *   `action`
            *   **Description:** Action to perform.
            *   **Type:** String
            *   **Required:** Yes
            *   **Choices:** `Add Role`, `Remove Role`, `List Roles`
        *   `role`
            *   **Description:** Staff role.
            *   **Type:** Role
            *   **Required:** No

*   `settings`
    *   **Description:** Configure ticket settings.
    *   **Options:**
        *   `max_open_per_user`
            *   **Description:** Maximum open tickets per user.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 1, Maximum 20.
        *   `rate_limit_tickets`
            *   **Description:** Maximum tickets per cooldown period.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 1, Maximum 10.
        *   `rate_limit_minutes`
            *   **Description:** Rate limit cooldown in minutes.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 5, Maximum 1440.
        *   `ping_staff_on_create`
            *   **Description:** Ping staff when tickets are created.
            *   **Type:** Boolean
            *   **Required:** No
        *   `dm_notifications`
            *   **Description:** Send DM notifications to users.
            *   **Type:** Boolean
            *   **Required:** No

*   `autoclose`
    *   **Description:** Configure auto-close settings.
    *   **Options:**
        *   `enabled`
            *   **Description:** Enable auto-close.
            *   **Type:** Boolean
            *   **Required:** Yes
        *   `hours`
            *   **Description:** Hours of inactivity before auto-close.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 1, Maximum 168.

*   `transcripts`
    *   **Description:** Configure transcript settings.
    *   **Options:**
        *   `enabled`
            *   **Description:** Enable transcripts.
            *   **Type:** Boolean
            *   **Required:** Yes
        *   `format`
            *   **Description:** Transcript format.
            *   **Type:** String
            *   **Required:** No
            *   **Choices:** `HTML`, `Text`, `JSON`

*   `naming`
    *   **Description:** Configure ticket naming.
    *   **Options:**
        *   `pattern`
            *   **Description:** Naming pattern.
            *   **Type:** String
            *   **Required:** Yes
            *   **Choices:** `ticket-username`, `ticket-####`, `username-ticket`, `####-ticket`

*   `tags`
    *   **Description:** Manage ticket tags.
    *   **Options:**
        *   `action`
            *   **Description:** Action to perform.
            *   **Type:** String
            *   **Required:** Yes
            *   **Choices:** `Add Tag`, `Remove Tag`, `List Tags`
        *   `name`
            *   **Description:** Tag name.
            *   **Type:** String
            *   **Required:** No
        *   `description`
            *   **Description:** Tag description.
            *   **Type:** String
            *   **Required:** No
        *   `color`
            *   **Description:** Tag color (hex code).
            *   **Type:** String
            *   **Required:** No

## Examples

```sh
/tickets setup open_category:"Open Tickets" closed_category:"Closed Tickets" log_channel:#ticket-logs
/tickets staff action:"Add Role" role:@Support
/tickets settings max_open_per_user:2
```
