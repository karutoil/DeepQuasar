---
title: mute
description: Mute a user in the server
sidebar:
  badge: Moderation
---

# `mute`

This command allows moderators to mute a user, preventing them from sending messages in text channels and speaking in voice channels for a specified duration.

## How to Use

To mute a user, use the `/mute` command with the required `user` option and an optional `duration` and `reason`:

```sh
/mute user:@User duration:1h reason:"Spamming chat"
```

### Options

*   `user`
    *   **Description:** The user to mute.
    *   **Type:** User
    *   **Required:** Yes

*   `duration`
    *   **Description:** Duration of the mute (e.g., `1h`, `30m`, `2d`). If omitted, a default duration from server settings will be used.
    *   **Type:** String
    *   **Required:** No

*   `reason`
    *   **Description:** Reason for the mute.
    *   **Type:** String
    *   **Required:** No
    *   **Constraints:** Maximum length of 1000 characters.

## Examples

```sh
# Mute a user for 1 hour
/mute user:@NoisyUser duration:1h reason:"Excessive noise in voice chat."

# Mute a user with a default duration
/mute user:@Spammer reason:"Repeatedly sending unwanted messages."
```

## Important Permissions

*   You need `Moderate Members` permission to use this command.
*   The bot must have a higher role than the target user and the necessary permissions to manage roles.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
