---
title: lock
description: Lock a channel to prevent @everyone from sending messages
sidebar:
  badge: Moderation
---

# `lock`

This command allows moderators to lock a text channel, preventing `@everyone` from sending messages. This is useful during incidents, announcements, or when a channel needs to be temporarily restricted.

## How to Use

To lock a channel, use the `/lock` command. You can specify the channel to lock, or it will default to the current channel.

```sh
/lock channel:#general reason:"Incident management"
```

### Options

*   `channel`
    *   **Description:** The channel to lock (current channel if not specified).
    *   **Type:** Channel (Text, Forum, Announcement)
    *   **Required:** No

*   `reason`
    *   **Description:** Reason for locking the channel.
    *   **Type:** String
    *   **Required:** No
    *   **Constraints:** Maximum length of 1000 characters.

## Examples

```sh
# Lock the current channel with a reason
/lock reason:"Server maintenance in progress."

# Lock a specific channel
/lock channel:#announcements
```

## Important Permissions

*   You need `Manage Channels` permission to use this command.
*   The bot must have `Manage Channels` permission in the target channel.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
