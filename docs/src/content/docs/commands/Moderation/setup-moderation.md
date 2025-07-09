---
title: setup-moderation
description: Configure the moderation system for this server
sidebar:
  badge: Moderation
---

# `setup-moderation`

This command allows server administrators to set up and configure the bot's moderation system. You can define a moderation log channel, set up a mute role, configure auto-moderation thresholds, manage moderator roles, and set command-specific permissions.

## How to Use

Use the `/setup-moderation` command followed by a subcommand to configure specific aspects of the moderation system.

### Subcommands

*   `init`
    *   **Description:** Initializes the moderation system with default settings.
    *   **Usage:** 
        ```sh
        /setup-moderation init
        ```

*   `modlog`
    *   **Description:** Sets the channel where moderation actions will be logged.
    *   **Options:**
        *   `channel`
            *   **Description:** The text channel for moderation logs.
            *   **Type:** Channel (Text Channel)
            *   **Required:** Yes
    *   **Usage:** 
        ```sh
        /setup-moderation modlog channel:#mod-logs
        ```

*   `muterole`
    *   **Description:** Sets or creates the role used for muting members. If no role is provided, a new one will be created.
    *   **Options:**
        *   `role`
            *   **Description:** The role to use for muting. Leave empty to create a new role.
            *   **Type:** Role
            *   **Required:** No
    *   **Usage:** 
        ```sh
        /setup-moderation muterole role:@Muted
        /setup-moderation muterole
        ```

*   `automod`
    *   **Description:** Configures auto-moderation settings, including enabling/disabling and warning thresholds for automatic mutes, kicks, and bans.
    *   **Options:**
        *   `enabled`
            *   **Description:** Enable or disable auto-moderation.
            *   **Type:** Boolean
            *   **Required:** Yes
        *   `mute-warnings`
            *   **Description:** Number of warnings before an auto-mute (1-10).
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 1, Maximum 10.
        *   `kick-warnings`
            *   **Description:** Number of warnings before an auto-kick (1-15).
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 1, Maximum 15.
        *   `ban-warnings`
            *   **Description:** Number of warnings before an auto-ban (1-20).
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 1, Maximum 20.
    *   **Usage:** 
        ```sh
        /setup-moderation automod enabled:True mute-warnings:3 kick-warnings:5 ban-warnings:10
        ```

*   `modroles`
    *   **Description:** Configures roles that are considered default moderators and can use moderation commands.
    *   **Options:**
        *   `add`
            *   **Description:** Add a role to the list of moderator roles.
            *   **Type:** Role
            *   **Required:** No
        *   `remove`
            *   **Description:** Remove a role from the list of moderator roles.
            *   **Type:** Role
            *   **Required:** No
    *   **Usage:** 
        ```sh
        /setup-moderation modroles add:@Moderator
        /setup-moderation modroles remove:@Helper
        ```

*   `view`
    *   **Description:** Displays the current moderation settings for the server.
    *   **Usage:** 
        ```sh
        /setup-moderation view
        ```

## Examples

```sh
# Initialize the moderation system
/setup-moderation init

# Set the moderation log channel
/setup-moderation modlog channel:#server-logs

# Create a new mute role and configure it
/setup-moderation muterole

# Enable auto-moderation with custom warning thresholds
/setup-moderation automod enabled:True mute-warnings:2 kick-warnings:4 ban-warnings:8

# Add the "Staff" role as a default moderator role
/setup-moderation modroles add:@Staff

# View all current moderation settings
/setup-moderation view
```

## Important Permissions

*   You need `Administrator` permissions to use this command.

## Related Advanced Guide Sections

*   [Moderation System](/advanced-guide/moderation/modlog_documentation)
