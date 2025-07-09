---
title: pardon
description: Reverse or remove a previous punishment
sidebar:
  badge: Moderation
---

# `pardon`

This command allows moderators to reverse or remove a previously issued punishment (e.g., mute, ban, warn) by marking the case as pardoned. If applicable, it will also attempt to undo the effect of the punishment (e.g., unmuting a user).

## How to Use

To pardon a punishment, use the `/pardon` command with the `case-id` of the punishment you wish to reverse:

```sh
/pardon case-id:12345 reason:"User appealed successfully."
```

### Options

*   `case-id`
    *   **Description:** The unique ID of the punishment case to pardon.
    *   **Type:** String
    *   **Required:** Yes

*   `reason`
    *   **Description:** Reason for pardoning the punishment.
    *   **Type:** String
    *   **Required:** No
    *   **Constraints:** Maximum length of 1000 characters.

## Examples

```sh
# Pardon a mute with a specific case ID
/pardon case-id:MUTE-001 reason:"Mute was issued in error."

# Pardon a ban case
/pardon case-id:BAN-005
```

## Important Permissions

*   You need `Moderate Members` permission to use this command.
*   The bot must have the necessary permissions to undo the original punishment (e.g., `Manage Roles` for unmuting, `Ban Members` for unbanning).

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
