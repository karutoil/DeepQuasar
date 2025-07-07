---
title: selfrole-advanced
description: Advanced self-role management options
sidebar:
  badge: SelfRole
---

# `selfrole-advanced`

This command provides advanced management options for your self-role messages, allowing for fine-grained control over role limits, conflicts, reordering, bulk assignments, and data management.

## How to Use

Use the `/selfrole-advanced` command followed by a subcommand to access specific advanced functionalities.

**Important Permissions:** You need `Administrator` permissions to use this command.

### Subcommands

*   `role-limits`
    *   **Description:** Sets limits for a specific role within a self-role message, such as the maximum number of users who can have it or a required role for assignment.
    *   **Options:**
        *   `message-id`
            *   **Description:** The ID of the self-role message you want to configure.
            *   **Type:** String
            *   **Required:** Yes
        *   `role`
            *   **Description:** The role to which you want to apply limits.
            *   **Type:** Role
            *   **Required:** Yes
        *   `max-assignments`
            *   **Description:** The maximum number of users who can have this role. Set to `0` for unlimited.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 0, Maximum 10000.
        *   `required-role`
            *   **Description:** A role that users must have to be able to assign themselves this role.
            *   **Type:** Role
            *   **Required:** No
    *   **Usage:** `/selfrole-advanced role-limits message-id:123456789012345678 role:@Gamer max-assignments:10 required-role:@Verified`

*   `role-conflicts`
    *   **Description:** Defines roles that conflict with each other, meaning a user cannot have both at the same time. If a user tries to get a conflicting role, the existing one will be removed.
    *   **Options:**
        *   `message-id`
            *   **Description:** The ID of the self-role message.
            *   **Type:** String
            *   **Required:** Yes
        *   `role`
            *   **Description:** The main role for which you are defining conflicts.
            *   **Type:** Role
            *   **Required:** Yes
        *   `conflicting-role`
            *   **Description:** The role that conflicts with the main role.
            *   **Type:** Role
            *   **Required:** Yes
        *   `action`
            *   **Description:** Whether to add or remove the conflict.
            *   **Type:** String (Choices)
            *   **Required:** Yes
            *   **Choices:** `Add Conflict`, `Remove Conflict`
    *   **Usage:** `/selfrole-advanced role-conflicts message-id:123456789012345678 role:@TeamA conflicting-role:@TeamB action:add`

*   `reorder-roles`
    *   **Description:** Changes the display order of role buttons within a self-role message.
    *   **Options:**
        *   `message-id`
            *   **Description:** The ID of the self-role message.
            *   **Type:** String
            *   **Required:** Yes
        *   `role`
            *   **Description:** The role button you want to move.
            *   **Type:** Role
            *   **Required:** Yes
        *   `new-position`
            *   **Description:** The new 0-based position for the role button (e.g., `0` for the first position).
            *   **Type:** Integer
            *   **Required:** Yes
            *   **Constraints:** Minimum 0, Maximum 24.
    *   **Usage:** `/selfrole-advanced reorder-roles message-id:123456789012345678 role:@Artist new-position:0`

*   `bulk-assign`
    *   **Description:** Allows administrators to assign a specific role to multiple users at once using their user IDs.
    *   **Options:**
        *   `message-id`
            *   **Description:** The ID of the self-role message associated with the role.
            *   **Type:** String
            *   **Required:** Yes
        *   `role`
            *   **Description:** The role to assign to the users.
            *   **Type:** Role
            *   **Required:** Yes
        *   `user-ids`
            *   **Description:** A comma-separated list of user IDs to assign the role to.
            *   **Type:** String
            *   **Required:** Yes
    *   **Usage:** `/selfrole-advanced bulk-assign message-id:123456789012345678 role:@Verified user-ids:12345,67890,11223`

*   `export-data`
    *   **Description:** Exports self-role message data as a JSON file. You can export data for a specific message or all messages in the server.
    *   **Options:**
        *   `message-id`
            *   **Description:** The ID of the self-role message to export. If omitted, all self-role messages for the server will be exported.
            *   **Type:** String
            *   **Required:** No
    *   **Usage:** `/selfrole-advanced export-data message-id:123456789012345678`

*   `reset-stats`
    *   **Description:** Resets the interaction statistics (total interactions, unique users, role assignments) for a specific self-role message.
    *   **Options:**
        *   `message-id`
            *   **Description:** The ID of the self-role message whose statistics you want to reset.
            *   **Type:** String
            *   **Required:** Yes
    *   **Usage:** `/selfrole-advanced reset-stats message-id:123456789012345678`

## Examples

*   **Limit the "Event Attendee" role to 50 assignments:**
    `/selfrole-advanced role-limits message-id:123456789012345678 role:@EventAttendee max-assignments:50`
*   **Add a conflict between "Red Team" and "Blue Team" roles:**
    `/selfrole-advanced role-conflicts message-id:123456789012345678 role:@RedTeam conflicting-role:@BlueTeam action:add`
*   **Move the "Announcements" role button to the first position:**
    `/selfrole-advanced reorder-roles message-id:123456789012345678 role:@Announcements new-position:0`
*   **Export data for a specific self-role message:**
    `/selfrole-advanced export-data message-id:123456789012345678`

## Related Advanced Guide Sections

*   [SelfRole System](/advanced-guide/server-management/selfrole_documentation)