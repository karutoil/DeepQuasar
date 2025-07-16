---
title: remind
description: Set reminders for yourself, other users, or channels
sidebar:
  badge: Utility
---

# `remind`

This command allows users and moderators to set reminders for themselves, other users, or entire channels. Reminders can be scheduled for a specific time or after a certain duration.

## How to Use

Use the `/remind` command followed by a subcommand to set a reminder.

### Subcommands

*   `me`
    *   **Description:** Set a reminder for yourself.
    *   **Options:**
        *   `time`
            *   **Description:** When to remind (e.g., "in 10m", "on 2025-07-20 14:00").
            *   **Type:** String
            *   **Required:** Yes
        *   `task`
            *   **Description:** What to remind about.
            *   **Type:** String
            *   **Required:** Yes
    *   **Usage:** 
        ```sh
        /remind me time:"in 10m" task:"Check the oven"
        ```

*   `user`
    *   **Description:** Set a reminder for another user. Requires Manage Server or Manage Messages permission.
    *   **Options:**
        *   `user`
            *   **Description:** User to remind.
            *   **Type:** User
            *   **Required:** Yes
        *   `time`
            *   **Description:** When to remind (e.g., "in 10m", "on 2025-07-20 14:00").
            *   **Type:** String
            *   **Required:** Yes
        *   `task`
            *   **Description:** What to remind about.
            *   **Type:** String
            *   **Required:** Yes
    *   **Usage:** 
        ```sh
        /remind user user:@Alice time:"on 2025-07-20 14:00" task:"Team meeting"
        ```

*   `channel`
    *   **Description:** Set a reminder for a channel (optionally ping a role). Requires Manage Messages permission.
    *   **Options:**
        *   `channel`
            *   **Description:** Channel to remind.
            *   **Type:** Channel (Text Channel)
            *   **Required:** Yes
        *   `time`
            *   **Description:** When to remind (e.g., "in 10m", "on 2025-07-20 14:00").
            *   **Type:** String
            *   **Required:** Yes
        *   `task`
            *   **Description:** What to remind about.
            *   **Type:** String
            *   **Required:** Yes
        *   `role`
            *   **Description:** Role to ping (optional).
            *   **Type:** Role
            *   **Required:** No
    *   **Usage:** 
        ```sh
        /remind channel channel:#general time:"in 1h" task:"Daily standup" role:@Team
        ```

## Examples

```sh
# Set a reminder for yourself in 30 minutes
/remind me time:"in 30m" task:"Take a break"

# Set a reminder for another user
/remind user user:@Bob time:"on 2025-07-21 09:00" task:"Submit report"

# Set a reminder for a channel and ping a role
/remind channel channel:#announcements time:"on 2025-07-22 12:00" task:"Release update" role:@Developers
```

## Important Permissions

*   Setting reminders for other users requires `Manage Server` or `Manage Messages` permission.
*   Setting reminders for channels requires `Manage Messages` permission.

## Related Advanced Guide Sections

*   [Reminder System](/advanced-guide/utility/reminder_documentation)
