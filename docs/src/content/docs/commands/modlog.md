---
title: modlog
description: Configure moderation logging settings
sidebar:
  badge: Settings
---

# `modlog`

This command allows server administrators to set up and manage comprehensive moderation logging for their Discord server. You can enable/disable the system, set a default log channel, and configure which specific events are logged.

## How to Use

Use the `/modlog` command followed by a subcommand to manage the moderation logging system.

**Important Permissions:** You need `Manage Guild` permissions to use this command.

### Subcommands

*   `setup`
    *   **Description:** Enables the moderation logging system and sets a default channel where all enabled log events will be sent.
    *   **Options:**
        *   `channel`
            *   **Description:** The text channel where modlog events will be sent by default.
            *   **Type:** Channel (Text Channel)
            *   **Required:** Yes
    *   **Usage:** `/modlog setup channel:#mod-logs`

*   `disable`
    *   **Description:** Disables the entire moderation logging system for the server. No events will be logged until it's re-enabled.
    *   **Usage:** `/modlog disable`

*   `status`
    *   **Description:** Displays the current status of the modlog system, including whether it's enabled, the default channel, and a summary of enabled events by category.
    *   **Usage:** `/modlog status`

*   `configure`
    *   **Description:** Provides an interactive menu to configure individual event settings. You can choose categories like Member Events, Message Events, etc., and then toggle specific events on or off.
    *   **Usage:** `/modlog configure`

*   `setchannel`
    *   **Description:** Allows you to set a specific channel for a particular event type, overriding the default log channel for that event.
    *   **Options:**
        *   `event`
            *   **Description:** The type of event you want to configure (e.g., `memberJoin`, `messageDelete`). Autocomplete is available.
            *   **Type:** String (Autocomplete)
            *   **Required:** Yes
        *   `channel`
            *   **Description:** The specific text channel for this event. Leave empty to revert to the default log channel.
            *   **Type:** Channel (Text Channel)
            *   **Required:** No
    *   **Usage:** `/modlog setchannel event:memberJoin channel:#join-logs`

*   `toggle`
    *   **Description:** Toggles a specific event type on or off within the modlog system.
    *   **Options:**
        *   `event`
            *   **Description:** The type of event to toggle (e.g., `messageDelete`, `roleCreate`). Autocomplete is available.
            *   **Type:** String (Autocomplete)
            *   **Required:** Yes
    *   **Usage:** `/modlog toggle event:messageDelete`

## Examples

*   **Set up modlog to #server-logs:**
    `/modlog setup channel:#server-logs`
*   **Check the current modlog status:**
    `/modlog status`
*   **Enable logging for deleted messages:**
    `/modlog toggle event:messageDelete`
*   **Send member join logs to a separate channel:**
    `/modlog setchannel event:memberJoin channel:#new-members`

## Related Advanced Guide Sections

*   [ModLog System](/advanced-guide/moderation/modlog_documentation)