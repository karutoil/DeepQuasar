---
title: reason
description: Edit the reason for a moderation case
sidebar:
  badge: Moderation
---

# `reason`

This command allows moderators to edit the reason associated with a previously recorded moderation case (e.g., ban, kick, mute, warn). This is useful for correcting mistakes or adding more detail to a case.

## How to Use

To edit a case reason, use the `/reason` command with the `case-id` of the case and the `new-reason`:

```sh
/reason case-id:12345 new-reason:"Updated reason for the ban."
```

### Options

*   `case-id`
    *   **Description:** The unique ID of the moderation case to edit.
    *   **Type:** String
    *   **Required:** Yes

*   `new-reason`
    *   **Description:** The new reason for the case.
    *   **Type:** String
    *   **Required:** Yes
    *   **Constraints:** Maximum length of 1000 characters.

## Examples

```sh
# Update the reason for a specific case ID
/reason case-id:WARN-003 new-reason:"User was warned for excessive use of profanity after multiple warnings."

# Correct a typo in a ban reason
/reason case-id:BAN-010 new-reason:"User banned for repeated spamming."
```

## Important Permissions

*   You need `Moderate Members` permission to use this command.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
