---
title: warn
description: Issue a warning to a user
sidebar:
  badge: Moderation
---

# `warn`

This command allows moderators to issue a formal warning to a user for violating server rules or engaging in inappropriate behavior. Warnings are recorded and can contribute to a user's moderation history.

## How to Use

To warn a user, use the `/warn` command with the required `user` option and an optional `reason`:

```sh
/warn user:@User reason:"Breaking chat rules."
```

### Options

*   `user`
    *   **Description:** The user to warn.
    *   **Type:** User
    *   **Required:** Yes

*   `reason`
    *   **Description:** Reason for the warning.
    *   **Type:** String
    *   **Required:** No
    *   **Constraints:** Maximum length of 1000 characters.

## Examples

```sh
# Warn a user for spamming
/warn user:@Spammer reason:"Repeatedly sending unsolicited messages."

# Warn a user without a specific reason (not recommended)
/warn user:@NewUser
```

## Important Permissions

*   You need `Moderate Members` permission to use this command.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
