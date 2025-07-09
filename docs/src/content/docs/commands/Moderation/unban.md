---
title: unban
description: Unban a user from the server
sidebar:
  badge: Moderation
---

# `unban`

This command allows moderators to unban a user who was previously banned from the server. This will allow the user to rejoin the server if they have an invite.

## How to Use

To unban a user, use the `/unban` command with the required `user-id` option and an optional `reason`:

```sh
/unban user-id:123456789012345678 reason:"Appeal successful."
```

### Options

*   `user-id`
    *   **Description:** The ID of the user to unban.
    *   **Type:** String
    *   **Required:** Yes

*   `reason`
    *   **Description:** Reason for the unban.
    *   **Type:** String
    *   **Required:** No
    *   **Constraints:** Maximum length of 1000 characters.

## Examples

```sh
# Unban a user by their ID
/unban user-id:123456789012345678

# Unban a user with a reason
/unban user-id:987654321098765432 reason:"Completed ban duration."
```

## Important Permissions

*   You need `Ban Members` permission to use this command.
*   The bot must have `Ban Members` permission.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
