---
title: unlock
description: Unlock a previously locked channel
sidebar:
  badge: Moderation
---

# `unlock`

This command allows moderators to unlock a channel that was previously locked using the `/lock` command. It restores the channel's permissions to allow `@everyone` to send messages.

## How to Use

To unlock a channel, use the `/unlock` command. You can specify the channel to unlock, or it will default to the current channel.

```sh
/unlock channel:#general reason:"Incident resolved"
```

### Options

*   `channel`
    *   **Description:** The channel to unlock (current channel if not specified).
    *   **Type:** Channel (Text, Forum, Announcement)
    *   **Required:** No

*   `reason`
    *   **Description:** Reason for unlocking the channel.
    *   **Type:** String
    *   **Required:** No
    *   **Constraints:** Maximum length of 1000 characters.

## Examples

```sh
# Unlock the current channel with a reason
/unlock reason:"Maintenance complete."

# Unlock a specific channel
/unlock channel:#announcements
```

## Important Permissions

*   You need `Manage Channels` permission to use this command.
*   The bot must have `Manage Channels` permission in the target channel.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
