---
title: lfg-admin
description: LFG administration commands
sidebar:
  badge: LFG
---

# `lfg-admin`

This command provides administration tools for the LFG system.

## How to Use

Use the `/lfg-admin` command followed by a subcommand to manage the LFG system.

```sh
/lfg-admin <subcommand>
```

### Subcommands

*   `stats`
    *   **Description:** View LFG statistics for this server.

*   `active-posts`
    *   **Description:** View all active LFG posts.

*   `user-posts`
    *   **Description:** View LFG posts for a specific user.
    *   **Options:**
        *   `user`
            *   **Description:** User to check.
            *   **Type:** User
            *   **Required:** Yes

*   `cleanup`
    *   **Description:** Manually run LFG cleanup.

*   `clear-cooldowns`
    *   **Description:** Clear all user cooldowns.

*   `delete-post`
    *   **Description:** Delete a specific LFG post.
    *   **Options:**
        *   `post-id`
            *   **Description:** LFG post ID to delete.
            *   **Type:** String
            *   **Required:** Yes

## Examples

```sh
/lfg-admin stats
/lfg-admin user-posts user:@SomeUser
/lfg-admin delete-post post-id:1234567890
```
