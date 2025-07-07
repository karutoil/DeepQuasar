---
title: cleanup
description: Clean up messages in channels
sidebar:
  badge: Settings
---

# `cleanup`

This command provides powerful tools for managing and cleaning up messages within your Discord server's channels. It allows you to delete messages based on various criteria, including by user, by a specific count, all messages in a channel (by recreating it), or only messages sent by bots.

## How to Use

Use the `/cleanup` command followed by a subcommand to specify the type of cleanup you want to perform.

**Important Permissions:**
*   To use `cleanup user`, `cleanup amount`, or `cleanup bots`, you need `Manage Messages` permission.
*   To use `cleanup all`, you need `Manage Channels` permission.
*   The bot also requires `View Channel`, `Read Message History`, and `Manage Messages` permissions in the target channel.

### Subcommands

*   `user`
    *   **Description:** Deletes a specified number of recent messages from a particular user in a channel.
    *   **Options:**
        *   `user`
            *   **Description:** The user whose messages you want to delete.
            *   **Type:** User
            *   **Required:** Yes
        *   `amount`
            *   **Description:** The number of messages to delete from the specified user. Defaults to 50 if not provided.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 1, Maximum 100.
        *   `channel`
            *   **Description:** The channel where messages will be deleted. Defaults to the current channel if not specified.
            *   **Type:** Channel (Text or Announcement)
            *   **Required:** No
    *   **Usage:** `/cleanup user user:@BadUser amount:20 channel:#general`

*   `amount`
    *   **Description:** Deletes a specific number of the most recent messages in a channel.
    *   **Options:**
        *   `count`
            *   **Description:** The number of messages to delete.
            *   **Type:** Integer
            *   **Required:** Yes
            *   **Constraints:** Minimum 1, Maximum 100.
        *   `channel`
            *   **Description:** The channel where messages will be deleted. Defaults to the current channel if not specified.
            *   **Type:** Channel (Text or Announcement)
            *   **Required:** No
    *   **Usage:** `/cleanup amount count:50 channel:#spam-logs`

*   `all`
    *   **Description:** **WARNING:** This subcommand will delete the specified channel and recreate it with the exact same settings, effectively removing ALL message history. This action is irreversible.
    *   **Options:**
        *   `channel`
            *   **Description:** The channel to completely clean by recreation.
            *   **Type:** Channel (Text or Announcement)
            *   **Required:** Yes
        *   `confirm`
            *   **Description:** You must set this to `True` to confirm that you understand all messages will be lost.
            *   **Type:** Boolean
            *   **Required:** Yes
    *   **Usage:** `/cleanup all channel:#old-chat confirm:True`

*   `bots`
    *   **Description:** Deletes a specified number of recent messages sent only by bots in a channel.
    *   **Options:**
        *   `amount`
            *   **Description:** The number of bot messages to delete. Defaults to 50 if not provided.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 1, Maximum 100.
        *   `channel`
            *   **Description:** The channel where bot messages will be deleted. Defaults to the current channel if not specified.
            *   **Type:** Channel (Text or Announcement)
            *   **Required:** No
    *   **Usage:** `/cleanup bots amount:30 channel:#bot-commands`

## Examples

*   **Delete the last 10 messages from a user in the current channel:**
    `/cleanup user user:@Spammer amount:10`
*   **Clear the last 75 messages in #general:**
    `/cleanup amount count:75 channel:#general`
*   **Completely wipe all messages in #archive by recreating it:**
    `/cleanup all channel:#archive confirm:True`
*   **Remove the last 20 bot messages in the current channel:**
    `/cleanup bots amount:20`

## Related Advanced Guide Sections

*   [Cleanup System](/advanced-guide/content-creation/cleanup_system)