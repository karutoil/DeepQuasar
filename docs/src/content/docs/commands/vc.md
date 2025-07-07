---
title: vc
description: Manage your temporary voice channel
sidebar:
  badge: TempVC
---

# `vc`

This command allows you to manage your own temporary voice channel. You can rename it, set user limits, change bitrate, lock/hide it, transfer ownership, manage user permissions, kick members, view channel information, and save/load your preferred settings.

## How to Use

To use this command, you must be in a temporary voice channel that you own or have moderation rights for. Use the `/vc` command followed by a subcommand to perform a specific action.

### Subcommands

*   `rename`
    *   **Description:** Changes the name of your temporary voice channel.
    *   **Options:**
        *   `name`
            *   **Description:** The new name for your voice channel.
            *   **Type:** String
            *   **Required:** Yes
            *   **Constraints:** Minimum 1, Maximum 100 characters.
    *   **Usage:** `/vc rename name:My Awesome VC`

*   `limit`
    *   **Description:** Sets a user limit for your voice channel, controlling how many members can join.
    *   **Options:**
        *   `limit`
            *   **Description:** The maximum number of users allowed in the channel. Set to `0` for no limit.
            *   **Type:** Integer
            *   **Required:** Yes
            *   **Constraints:** Minimum 0, Maximum 99.
    *   **Usage:** `/vc limit limit:5`

*   `bitrate`
    *   **Description:** Adjusts the audio quality (bitrate) of your voice channel.
    *   **Options:**
        *   `bitrate`
            *   **Description:** The desired bitrate in kilobits per second (kbps).
            *   **Type:** Integer
            *   **Required:** Yes
            *   **Constraints:** Minimum 8, Maximum 384 (depending on server boost level).
    *   **Usage:** `/vc bitrate bitrate:128`

*   `lock`
    *   **Description:** Toggles the locked status of your voice channel. When locked, only users you explicitly allow can join.
    *   **Usage:** `/vc lock`

*   `hide`
    *   **Description:** Toggles the visibility of your voice channel. When hidden, the channel is not visible to users who are not explicitly allowed to see it.
    *   **Usage:** `/vc hide`

*   `transfer`
    *   **Description:** Transfers ownership of your temporary voice channel to another user in the same channel.
    *   **Options:**
        *   `user`
            *   **Description:** The user to whom you want to transfer ownership.
            *   **Type:** User
            *   **Required:** Yes
    *   **Usage:** `/vc transfer user:@NewOwner`

*   `allow`
    *   **Description:** Grants a specific user permission to join your locked or hidden voice channel.
    *   **Options:**
        *   `user`
            *   **Description:** The user to allow.
            *   **Type:** User
            *   **Required:** Yes
    *   **Usage:** `/vc allow user:@Friend`

*   `deny`
    *   **Description:** Revokes a specific user's permission to join your voice channel. If the user is currently in the channel, they will be kicked.
    *   **Options:**
        *   `user`
            *   **Description:** The user to deny.
            *   **Type:** User
            *   **Required:** Yes
    *   **Usage:** `/vc deny user:@Troublemaker`

*   `kick`
    *   **Description:** Removes a user from your voice channel.
    *   **Options:**
        *   `user`
            *   **Description:** The user to kick.
            *   **Type:** User
            *   **Required:** Yes
    *   **Usage:** `/vc kick user:@AnnoyingMember`

*   `info`
    *   **Description:** Displays detailed information about your current temporary voice channel, including its owner, members, settings, and statistics.
    *   **Usage:** `/vc info`

*   `settings`
    *   **Description:** Allows you to view, save, load, or toggle auto-save for your preferred temporary voice channel settings.
    *   **Options:**
        *   `action`
            *   **Description:** The action to perform on your saved settings.
            *   **Type:** String (Choices)
            *   **Required:** Yes
            *   **Choices:**
                *   `View Saved Settings`: Shows your currently saved default settings.
                *   `Save Current Settings`: Saves the current channel's settings as your personal defaults for future temporary VCs.
                *   `Load Saved Settings`: Applies your saved default settings to the current channel.
                *   `Toggle Auto-Save`: Enables or disables automatic saving of channel settings when you make changes.
    *   **Usage:** `/vc settings action:save`

*   `delete`
    *   **Description:** Deletes your temporary voice channel. This action is irreversible.
    *   **Usage:** `/vc delete`

## Examples

*   **Rename your channel to "Chill Zone":**
    `/vc rename name:Chill Zone`
*   **Set the user limit to 10:**
    `/vc limit limit:10`
*   **Lock your channel:**
    `/vc lock`
*   **Transfer ownership to another user:**
    `/vc transfer user:@CoOwner`
*   **Save your current channel settings as default:**
    `/vc settings action:save`

## Related Advanced Guide Sections

*   [TempVC System](/advanced-guide/server-management/tempvc_system)