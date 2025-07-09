---
title: ban
description: Ban a user from the server
sidebar:
  badge: Moderation
---

# `ban`

This command allows moderators to permanently or temporarily ban a user from the server. You can specify a reason for the ban, delete recent messages from the user, and set a duration for temporary bans.

## How to Use

To ban a user, use the `/ban` command with the required `user` option and any additional options:

```sh
/ban user:@User reason:Violating rules delete-days:7 duration:1w
```

### Options

*   `user`
    *   **Description:** The user to ban.
    *   **Type:** User
    *   **Required:** Yes

*   `reason`
    *   **Description:** Reason for the ban.
    *   **Type:** String
    *   **Required:** No
    *   **Constraints:** Maximum length of 1000 characters.

*   `delete-days`
    *   **Description:** Number of days of messages to delete from the user (0-7).
    *   **Type:** Integer
    *   **Required:** No
    *   **Constraints:** Minimum 0, Maximum 7.

*   `duration`
    *   **Description:** Duration for a temporary ban (e.g., `1h`, `2d`, `1w`). If omitted, the ban is permanent.
    *   **Type:** String
    *   **Required:** No

## Examples

```sh
# Permanently ban a user with a reason
/ban user:@Spammer reason:"Repeated spamming and advertising."

# Temporarily ban a user for 3 days and delete 7 days of their messages
/ban user:@Troublemaker reason:"Disruptive behavior." delete-days:7 duration:3d

# Ban a user without a reason (not recommended)
/ban user:@UnwantedGuest
```

## Important Permissions

*   You need `Ban Members` permission to use this command.
*   The bot must have a higher role than the target user.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
