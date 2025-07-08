---
title: autorole
description: Configure automatic role assignment for new members
sidebar:
  badge: Settings
---

# `autorole`

This command allows server administrators to configure an automatic role assignment system for new members joining the Discord server. You can specify a role to be given, a delay before assignment, and options to skip bots or require verification.

## How to Use

Use the `/autorole` command followed by a subcommand to manage the automatic role assignment system.

### Subcommands

*   `setup`
    *   **Description:** Enables and configures the autorole system.
    *   **Options:**
        *   `role`
            *   **Description:** The role that will be automatically assigned to new members.
            *   **Type:** Role
            *   **Required:** Yes
        *   `delay`
            *   **Description:** The time in seconds to wait before assigning the role. Set to `0` for instant assignment.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 0, Maximum 3600 (1 hour).
        *   `skip-bots`
            *   **Description:** If set to `True` (default), the bot will not assign the role to other bots.
            *   **Type:** Boolean
            *   **Required:** No
        *   `require-verification`
            *   **Description:** If set to `True`, the role will only be assigned to members who have passed Discord's verification gate (if enabled).
            *   **Type:** Boolean
            *   **Required:** No
    *   **Usage:** 
        ```sh
        /autorole setup role:@NewMember delay:5 skip-bots:True
        ```

*   `disable`
    *   **Description:** Disables the autorole system for the server. Any pending role assignments will be cancelled.
    *   **Usage:** 
        ```sh
        /autorole disable
        ```

*   `status`
    *   **Description:** Displays the current configuration and status of the autorole system, including any potential issues (e.g., missing role, permission errors).
    *   **Usage:** 
        ```sh
        /autorole status
        ```

*   `test`
    *   **Description:** Runs a test to verify if the autorole configuration is working correctly and identifies any issues.
    *   **Usage:** 
        ```sh
        /autorole test
        ```

## Examples

```sh
# Set up autorole for new members with a 10-second delay
/autorole setup role:@VerifiedMembers delay:10

# Disable the autorole system
/autorole disable

# Check the current autorole configuration
/autorole status

# Test the autorole setup
/autorole test
```

## Related Advanced Guide Sections

*   [AutoRole System](/advanced-guide/server-management/autorole_system)