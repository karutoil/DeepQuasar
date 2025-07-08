---
title: test-welcome
description: Test the welcome system (Developer only)
sidebar:
  badge: General
---

# `test-welcome`

This is a **developer-only command** designed to simulate member join and leave events, allowing for quick testing and debugging of the welcome and leave message systems without needing actual members to join or leave the server.

## How to Use

To use this command, you must be a bot owner or have specific testing permissions. Use the `/test-welcome` command and specify the `type` of event you want to simulate.

### Options

*   `type`
    *   **Description:** The type of event to simulate.
    *   **Type:** String (Choices)
    *   **Required:** Yes
    *   **Choices:**
        *   `join`: Simulates a new member joining the server.
        *   `leave`: Simulates a member leaving the server.

## Examples

```sh
# Simulate a member join event
/test-welcome type:join

# Simulate a member leave event
/test-welcome type:leave
```

## Important Notes

*   This command is intended for **testing and debugging purposes only**.
*   It will trigger the configured welcome or leave messages as if a real event occurred.

## Related Advanced Guide Sections

*   [Welcome System](/advanced-guide/server-management/welcome_system)