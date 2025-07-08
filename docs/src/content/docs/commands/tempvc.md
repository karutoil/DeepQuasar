---
title: tempvc
description: Configure the temporary voice channel system
sidebar:
  badge: TempVC
---

# `tempvc`

This command allows server administrators to set up and configure the temporary voice channel system. This system automatically creates voice channels for users when they join a designated "join channel" and manages their lifecycle, including deletion when empty.

## How to Use

Use the `/tempvc` command followed by a subcommand to manage the temporary voice channel system.

**Important Permissions:** You need `Manage Channels` permissions to use this command.

### Subcommands

*   `setup`
    *   **Description:** Performs the initial setup of the temporary voice channel system. You need to define a join channel and a category for the temporary VCs.
    *   **Options:**
        *   `join-channel`
            *   **Description:** The voice channel that users will join to automatically create a temporary voice channel.
            *   **Type:** Channel (Voice Channel)
            *   **Required:** Yes
        *   `category`
            *   **Description:** The category under which all temporary voice channels will be created.
            *   **Type:** Channel (Category)
            *   **Required:** Yes
        *   `log-channel`
            *   **Description:** An optional text channel where logs related to temporary voice channel creation and deletion will be sent.
            *   **Type:** Channel (Text Channel)
            *   **Required:** No
    *   **Usage:** 
        ```sh
        /tempvc setup join-channel:#create-vc category:"Temporary VCs" log-channel:#tempvc-logs
        ```

*   `toggle`
    *   **Description:** Enables or disables the entire temporary voice channel system.
    *   **Options:**
        *   `enabled`
            *   **Description:** Set to `True` to enable the system, `False` to disable it.
            *   **Type:** Boolean
            *   **Required:** Yes
    *   **Usage:** 
        ```sh
        /tempvc toggle enabled:True
        ```

*   `config`
    *   **Description:** Displays the current configuration of the temporary voice channel system, including channels, default settings, permissions, and advanced options.
    *   **Usage:** 
        ```sh
        /tempvc config
        ```

*   `settings`
    *   **Description:** Configures the default settings for newly created temporary voice channels.
    *   **Options:**
        *   `channel-name`
            *   **Description:** The default naming template for new temporary voice channels. You can use placeholders (e.g., `{user}'s Channel`).
            *   **Type:** String
            *   **Required:** No
        *   `user-limit`
            *   **Description:** The default user limit for new temporary voice channels. Set to `0` for no limit.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 0, Maximum 99.
        *   `bitrate`
            *   **Description:** The default audio bitrate in kbps for new temporary voice channels.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 8, Maximum 384.
        *   `locked`
            *   **Description:** If `True`, new channels will be locked by default, meaning only invited users can join.
            *   **Type:** Boolean
            *   **Required:** No
        *   `hidden`
            *   **Description:** If `True`, new channels will be hidden by default, meaning they are not visible to everyone.
            *   **Type:** Boolean
            *   **Required:** No
    *   **Usage:** 
        ```sh
        /tempvc settings channel-name:"{user}'s VC" user-limit:10 bitrate:96 locked:False
        ```

*   `permissions`
    *   **Description:** Configures who is allowed to create temporary voice channels.
    *   **Options:**
        *   `mode`
            *   **Description:** Defines the permission mode for creating temporary VCs.
            *   **Type:** String (Choices)
            *   **Required:** Yes
            *   **Choices:** `Everyone`, `Specific Roles`, `Specific Users`
        *   `role`
            *   **Description:** A role to allow or deny creation permissions. Used with `Specific Roles` mode.
            *   **Type:** Role
            *   **Required:** No
        *   `user`
            *   **Description:** A user to allow or deny creation permissions. Used with `Specific Users` mode.
            *   **Type:** User
            *   **Required:** No
        *   `action`
            *   **Description:** The action to perform on the specified role or user.
            *   **Type:** String (Choices)
            *   **Required:** No
            *   **Choices:** `Allow`, `Deny`, `Clear`
    *   **Usage:** 
        ```sh
        /tempvc permissions mode:role role:@Creator action:allow
        ```

*   `advanced`
    *   **Description:** Configures advanced settings for the temporary voice channel system.
    *   **Options:**
        *   `max-channels`
            *   **Description:** The maximum number of temporary channels a single user can create.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 1, Maximum 10.
        *   `cooldown`
            *   **Description:** The cooldown period in minutes between a user's temporary channel creations.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 0, Maximum 60.
        *   `auto-delete`
            *   **Description:** If `True`, empty temporary channels will be automatically deleted.
            *   **Type:** Boolean
            *   **Required:** No
        *   `delete-delay`
            *   **Description:** The time in minutes to wait before deleting an empty temporary channel.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 0, Maximum 60.
        *   `control-panel`
            *   **Description:** If `True`, a control panel message will be sent to the temporary channel for easy management.
            *   **Type:** Boolean
            *   **Required:** No
        *   `panel-style`
            *   **Description:** The visual style of the control panel.
            *   **Type:** String (Choices)
            *   **Required:** No
            *   **Choices:** `Buttons`, `Select Menu`, `Both`
    *   **Usage:** 
        ```sh
        /tempvc advanced max-channels:2 cooldown:5 auto-delete:True delete-delay:10
        ```

## Examples

```sh
# Set up the TempVC system
/tempvc setup join-channel:#create-a-vc category:"Voice Channels" log-channel:#vc-logs

# Enable the TempVC system
/tempvc toggle enabled:True

# Set default user limit for new VCs to 5
/tempvc settings user-limit:5

# Allow only users with the "VIP" role to create VCs
/tempvc permissions mode:role role:@VIP action:allow

# Configure advanced settings for auto-deletion and control panel
/tempvc advanced auto-delete:True delete-delay:5 control-panel:True panel-style:buttons
```

## Related Advanced Guide Sections

*   [TempVC System](/advanced-guide/server-management/tempvc_system)