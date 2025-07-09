---
title: strike
description: Issue a formal strike to a user (more serious than a warning)
sidebar:
  badge: Moderation
---

# `strike`

This command allows moderators to issue a formal strike to a user. Strikes are typically used for more serious infractions than warnings and can contribute to automatic moderation actions (e.g., auto-mute, auto-kick, auto-ban) if configured.

## How to Use

To issue a strike, use the `/strike` command with the required `user` option and an optional `reason`:

```sh
/strike user:@User reason:"Repeated violation of rule 3"
```

### Options

*   `user`
    *   **Description:** The user to issue a strike to.
    *   **Type:** User
    *   **Required:** Yes

*   `reason`
    *   **Description:** Reason for the strike.
    *   **Type:** String
    *   **Required:** No
    *   **Constraints:** Maximum length of 1000 characters.

## Examples

```sh
# Issue a strike to a user for a specific reason
/strike user:@ProblematicUser reason:"Engaging in hate speech."

# Issue a strike without a detailed reason (not recommended)
/strike user:@AnotherUser
```

## Important Permissions

*   You need `Moderate Members` permission to use this command.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
