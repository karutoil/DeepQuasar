---
title: welcome
description: Configure welcome and leave messages for the server
sidebar:
  badge: General
---

# `welcome`

This command allows server administrators to fully configure the welcome and leave message systems for their Discord server. You can set up custom messages, channels, embed styles, and various display options for new members joining or leaving.

## How to Use

Use the `/welcome` command followed by a subcommand group or a direct subcommand to manage the welcome and leave message systems.

**Important Permissions:** You need `Manage Guild` permissions to use this command.

### Subcommand Groups

*   `setup`
    *   **Description:** Used for the initial setup and enabling of welcome, leave, and DM welcome messages.
    *   **Subcommands:**
        *   `welcome`
            *   **Description:** Configures the welcome message sent in a channel when a new member joins.
            *   **Options:**
                *   `channel`
                    *   **Description:** The text channel where welcome messages will be sent.
                    *   **Type:** Channel (Text Channel)
                    *   **Required:** Yes
                *   `enabled`
                    *   **Description:** Enable or disable welcome messages. Defaults to `True`.
                    *   **Type:** Boolean
                    *   **Required:** No
                *   `message`
                    *   **Description:** A custom welcome message. You can use placeholders like `{user.mention}` or `{guild.name}`.
                    *   **Type:** String
                    *   **Required:** No
            *   **Usage:** `/welcome setup welcome channel:#welcome-new-members message:Welcome {user.mention} to {guild.name}!`
        *   `leave`
            *   **Description:** Configures the leave message sent in a channel when a member leaves.
            *   **Options:** (Similar to `welcome` subcommand, but for leave messages)
            *   **Usage:** `/welcome setup leave channel:#farewells message:{user.tag} has left the server.`
        *   `dm`
            *   **Description:** Configures a welcome message sent directly to a new member's DMs.
            *   **Options:**
                *   `enabled`
                    *   **Description:** Enable or disable DM welcome messages.
                    *   **Type:** Boolean
                    *   **Required:** Yes
                *   `message`
                    *   **Description:** A custom DM welcome message.
                    *   **Type:** String
                    *   **Required:** No
            *   **Usage:** `/welcome setup dm enabled:True message:Welcome to our community!`

*   `config`
    *   **Description:** Allows for detailed configuration of welcome and leave message settings, such as embed options, colors, and what information to display.
    *   **Subcommands:**
        *   `welcome`
            *   **Description:** Configures advanced settings for welcome messages.
            *   **Options:**
                *   `embed`
                    *   **Description:** Use an embed format for welcome messages.
                    *   **Type:** Boolean
                    *   **Required:** No
                *   `color`
                    *   **Description:** The hex color code for the embed (e.g., `#57F287`).
                    *   **Type:** String
                    *   **Required:** No
                *   `mention-user`
                    *   **Description:** Mention the user in welcome messages.
                    *   **Type:** Boolean
                    *   **Required:** No
                *   `show-account-age`
                    *   **Description:** Display the user's account creation date.
                    *   **Type:** Boolean
                    *   **Required:** No
                *   `show-join-position`
                    *   **Description:** Show the member's join position (e.g., #1st, #2nd).
                    *   **Type:** Boolean
                    *   **Required:** No
                *   `show-inviter`
                    *   **Description:** Display who invited the user.
                    *   **Type:** Boolean
                    *   **Required:** No
                *   `delete-after`
                    *   **Description:** Automatically delete the welcome message after a specified number of seconds (0 for never delete).
                    *   **Type:** Integer
                    *   **Required:** No
                    *   **Constraints:** Minimum 0, Maximum 3600.
            *   **Usage:** `/welcome config welcome embed:True color:#00FF00 show-account-age:True`
        *   `leave`
            *   **Description:** Configures advanced settings for leave messages.
            *   **Options:** (Similar to `welcome` subcommand, but for leave messages)
            *   **Usage:** `/welcome config leave embed:True color:#FF0000 show-time-in-server:True`

*   `custom`
    *   **Description:** Provides an interactive embed builder to create highly customized welcome, leave, or DM welcome messages.
    *   **Subcommands:**
        *   `welcome`
            *   **Description:** Create a custom welcome embed with an interactive builder.
            *   **Usage:** `/welcome custom welcome`
        *   `leave`
            *   **Description:** Create a custom leave embed with an interactive builder.
            *   **Usage:** `/welcome custom leave`
        *   `dm`
            *   **Description:** Create a custom DM welcome embed with an interactive builder.
            *   **Usage:** `/welcome custom dm`

### Subcommands (Top-Level)

*   `status`
    *   **Description:** Displays the current configuration and status of the welcome and leave message systems for your server.
    *   **Usage:** `/welcome status`

*   `test`
    *   **Description:** Allows you to test the configured welcome, leave, or DM welcome messages without a real member joining or leaving.
    *   **Options:**
        *   `type`
            *   **Description:** The type of message to test.
            *   **Type:** String (Choices)
            *   **Required:** Yes
            *   **Choices:** `Welcome`, `Leave`, `DM Welcome`
    *   **Usage:** `/welcome test type:welcome`

*   `placeholders`
    *   **Description:** Shows a list of all available placeholders that can be used in custom welcome and leave messages (e.g., `{user.mention}`, `{guild.name}`).
    *   **Usage:** `/welcome placeholders`

## Examples

*   **Set up a welcome message in #general:**
    `/welcome setup welcome channel:#general message:Welcome {user.mention} to {guild.name}!`
*   **Configure welcome messages to use embeds with a green color:**
    `/welcome config welcome embed:True color:#00FF00`
*   **Test the leave message:**
    `/welcome test type:leave`
*   **View all available placeholders:**
    `/welcome placeholders`

## Related Advanced Guide Sections

*   [Welcome System](/advanced-guide/server-management/welcome_system)
*   [Custom Embeds](/advanced-guide/content-creation/custom_embeds)