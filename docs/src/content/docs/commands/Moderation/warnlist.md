---
title: warnlist
description: List all active warnings for a user
sidebar:
  badge: Moderation
---

# `warnlist`

This command allows moderators to view all active warnings and strikes for a specific user. It provides an overview of their current disciplinary status and indicates if they are approaching auto-moderation thresholds.

## How to Use

To view a user's active warnings, use the `/warnlist` command with the required `user` option:

```sh
/warnlist user:@User
```

### Options

*   `user`
    *   **Description:** The user to view active warnings for.
    *   **Type:** User
    *   **Required:** Yes

## Examples

```sh
# View active warnings for a user
/warnlist user:@ProblematicUser
```

## Important Permissions

*   You need `Moderate Members` permission to use this command.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
