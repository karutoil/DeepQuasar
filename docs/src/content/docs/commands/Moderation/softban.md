---
title: softban
description: Ban and immediately unban a user to clear their messages
sidebar:
  badge: Moderation
---

# `softban`

This command performs a "softban" on a user, which involves temporarily banning them and then immediately unbanning them. The primary purpose of a softban is to clear a user's recent messages from the server without permanently preventing them from rejoining.

## How to Use

To softban a user, use the `/softban` command with the required `user` option and an optional `reason` and `delete-days`:

```sh
/softban user:@User reason:"Clearing spam" delete-days:7
```

### Options

*   `user`
    *   **Description:** The user to softban.
    *   **Type:** User
    *   **Required:** Yes

*   `reason`
    *   **Description:** Reason for the softban.
    *   **Type:** String
    *   **Required:** No
    *   **Constraints:** Maximum length of 1000 characters.

*   `delete-days`
    *   **Description:** Number of days of messages to delete from the user (0-7). Defaults to 1 day.
    *   **Type:** Integer
    *   **Required:** No
    *   **Constraints:** Minimum 0, Maximum 7.

## Examples

```sh
# Softban a user to clear their messages from the last 7 days
/softban user:@Spammer reason:"Mass message deletion" delete-days:7

# Softban a user with default message deletion (1 day)
/softban user:@OffensiveUser
```

## Important Permissions

*   You need `Ban Members` permission to use this command.
*   The bot must have a higher role than the target user.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
