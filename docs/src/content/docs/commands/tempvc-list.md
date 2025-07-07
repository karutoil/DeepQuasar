---
title: tempvc-list
description: View and manage active temporary voice channels
sidebar:
  badge: TempVC
---

# `tempvc-list`

This command provides various ways to view and manage active temporary voice channels within your server. You can list all active channels, view only your own, check channels owned by a specific user, clean up inactive channels, or see overall statistics.

## How to Use

Use the `/tempvc-list` command followed by a subcommand to specify the type of listing or management you want to perform.

### Subcommands

*   `all`
    *   **Description:** Lists all currently active temporary voice channels in the server, showing their owner, member count, and uptime.
    *   **Usage:** `/tempvc-list all`

*   `mine`
    *   **Description:** Displays a list of all temporary voice channels that you currently own.
    *   **Usage:** `/tempvc-list mine`

*   `user`
    *   **Description:** Shows all temporary voice channels owned by a specific user.
    *   **Options:**
        *   `user`
            *   **Description:** The user whose temporary voice channels you want to view.
            *   **Type:** User
            *   **Required:** Yes
    *   **Usage:** `/tempvc-list user:@SomeUser`

*   `cleanup`
    *   **Description:** (Admin only) Initiates a cleanup process that deletes inactive or empty temporary voice channels from the server and the bot's database.
    *   **Usage:** `/tempvc-list cleanup`
    *   **Important Permissions:** Requires `Manage Channels` permission.

*   `stats`
    *   **Description:** Displays various statistics about the temporary voice channel system, such as total channels, active channels, total members, longest uptime, and peak member count.
    *   **Usage:** `/tempvc-list stats`

## Examples

*   **List all active temporary voice channels:**
    `/tempvc-list all`
*   **View your own temporary voice channels:**
    `/tempvc-list mine`
*   **Check temporary channels owned by a specific user:**
    `/tempvc-list user:@AnotherUser`
*   **Run a cleanup of inactive temporary channels:**
    `/tempvc-list cleanup`
*   **See the overall statistics for temporary voice channels:**
    `/tempvc-list stats`

## Related Advanced Guide Sections

*   [TempVC System](/advanced-guide/server-management/tempvc_system)