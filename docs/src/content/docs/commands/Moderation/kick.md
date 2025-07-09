---
title: kick
description: Kick a user from the server
sidebar:
  badge: Moderation
---

# `kick`

This command allows moderators to remove a user from the server. Kicking a user is a less severe action than banning, as the user can rejoin if they have an invite.

## How to Use

To kick a user, use the `/kick` command with the required `user` option and an optional `reason`:

```sh
/kick user:@User reason:Violating rules
```

### Options

*   `user`
    *   **Description:** The user to kick.
    *   **Type:** User
    *   **Required:** Yes

*   `reason`
    *   **Description:** Reason for the kick.
    *   **Type:** String
    *   **Required:** No
    *   **Constraints:** Maximum length of 1000 characters.

## Examples

```sh
# Kick a user with a reason
/kick user:@DisruptiveMember reason:"Repeatedly breaking chat rules."

# Kick a user without a reason (not recommended)
/kick user:@TemporaryVisitor
```

## Important Permissions

*   You need `Kick Members` permission to use this command.
*   The bot must have a higher role than the target user.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
