---
title: modhistory
description: View a user's punishment history
sideline:
  badge: Moderation
---

# `modhistory`

This command allows moderators to view a user's punishment history within the server. It displays details about past bans, kicks, mutes, and warns.

## How to Use

To view a user's moderation history, use the `/modhistory` command with the required `user` option:

```sh
/modhistory user:@User limit:10
```

### Options

*   `user`
    *   **Description:** The user to view history for.
    *   **Type:** User
    *   **Required:** Yes

*   `limit`
    *   **Description:** Number of entries to show (default: 10, max: 25).
    *   **Type:** Integer
    *   **Required:** No
    *   **Constraints:** Minimum 1, Maximum 25.

## Examples

```sh
# View the last 10 punishment entries for a user
/modhistory user:@ProblemUser

# View the last 25 punishment entries for a user
/modhistory user:@AnotherUser limit:25
```

## Important Permissions

*   You need `Kick Members` or `Ban Members` permission to use this command.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
