---
title: slowmode
description: Set slowmode for a channel
sidebar:
  badge: Moderation
---

# `slowmode`

This command allows moderators to set a slowmode in a text or announcement channel, restricting how frequently users can send messages. This is useful for managing chat flow during busy periods or to prevent spam.

## How to Use

To set slowmode, use the `/slowmode` command with a `duration` in seconds. You can specify the channel, or it will default to the current channel.

```sh
/slowmode duration:5 channel:#general reason:"Managing chat flow"
```

### Options

*   `duration`
    *   **Description:** Slowmode duration in seconds (0 to disable, max 21600).
    *   **Type:** Integer
    *   **Required:** Yes
    *   **Constraints:** Minimum 0, Maximum 21600.

*   `channel`
    *   **Description:** Channel to set slowmode (current channel if not specified).
    *   **Type:** Channel (Text, Announcement)
    *   **Required:** No

*   `reason`
    *   **Description:** Reason for setting slowmode.
    *   **Type:** String
    *   **Required:** No
    *   **Constraints:** Maximum length of 1000 characters.

## Examples

```sh
# Set slowmode to 10 seconds in the current channel
/slowmode duration:10

# Disable slowmode in a specific channel
/slowmode duration:0 channel:#announcements

# Set slowmode with a reason
/slowmode duration:30 reason:"Preventing message flooding."
```

## Important Permissions

*   You need `Manage Channels` permission to use this command.
*   The bot must have `Manage Channels` permission in the target channel.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
