---
title: unmute
description: Unmute a user in the server
sidebar:
  badge: Moderation
---

# `unmute`

This command allows moderators to unmute a user who was previously muted. This will restore their ability to send messages and speak in voice channels.

## How to Use

To unmute a user, use the `/unmute` command with the required `user` option and an optional `reason`:

```sh
/unmute user:@User reason:"Mute duration ended."
```

### Options

*   `user`
    *   **Description:** The user to unmute.
    *   **Type:** User
    *   **Required:** Yes

*   `reason`
    *   **Description:** Reason for the unmute.
    *   **Type:** String
    *   **Required:** No
    *   **Constraints:** Maximum length of 1000 characters.

## Examples

```sh
# Unmute a user
/unmute user:@QuietUser

# Unmute a user with a reason
/unmute user:@ChattyUser reason:"Completed mute period."
```

## Important Permissions

*   You need `Moderate Members` permission to use this command.
*   The bot must have a higher role than the target user and the necessary permissions to manage roles.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
