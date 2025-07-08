---
title: settings
description: Configure bot settings for this server
sidebar:
  badge: Settings
---

# `settings`

This command provides comprehensive control over various bot settings for your Discord server. You can configure music playback, permissions, command behavior, and view or reset all settings.

## How to Use

Use the `/settings` command followed by a subcommand group or a direct subcommand to manage specific aspects of the bot's configuration.

```sh
# Set default and max music volume
/settings music volume default:75 max:150

# Set max queue size and enable auto-shuffle
/settings music queue max-size:200 auto-shuffle:True

# Set default music source to Spotify
/settings music source platform:spotify

# Set the DJ role
/settings permissions dj-role role:@DJ

# Allow music commands in #music-commands
/settings permissions channels add:#music-commands

# Set a global command cooldown
/settings commands cooldown seconds:5

# Disable the play command
/settings commands disable command:play

# Enable the play command
/settings commands enable command:play

# View all current server settings
/settings view

# Reset all settings to default
/settings reset confirm:True
```

**Important Permissions:** You need `Manage Guild` permissions to use this command.

### Subcommand Groups

*   `music`
    *   **Description:** Contains subcommands for configuring music playback settings.
    *   **Subcommands:**
        *   `volume`
            *   **Description:** Sets the default and maximum volume levels for music playback.
            *   **Options:**
                *   `default`
                    *   **Description:** The default volume level (1-150) when the bot starts playing music.
                    *   **Type:** Integer
                    *   **Required:** No
                    *   **Constraints:** Minimum 1, Maximum 150.
                *   `max`
                    *   **Description:** The maximum volume level (1-200) users can set.
                    *   **Type:** Integer
                    *   **Required:** No
                    *   **Constraints:** Minimum 1, Maximum 200.
            *   **Usage:** `/settings music volume default:75 max:150`
        *   `queue`
            *   **Description:** Configures settings related to the music queue.
            *   **Options:**
                *   `max-size`
                    *   **Description:** The maximum number of tracks allowed in the queue (1-500).
                    *   **Type:** Integer
                    *   **Required:** No
                    *   **Constraints:** Minimum 1, Maximum 500.
                *   `max-playlist`
                    *   **Description:** The maximum number of tracks allowed when adding a playlist (1-200).
                    *   **Type:** Integer
                    *   **Required:** No
                    *   **Constraints:** Minimum 1, Maximum 200.
                *   `auto-shuffle`
                    *   **Description:** Automatically shuffle new playlists when added to the queue.
                    *   **Type:** Boolean
                    *   **Required:** No
            *   **Usage:** `/settings music queue max-size:200 auto-shuffle:True`
        *   `source`
            *   **Description:** Sets the default music source platform for searches.
            *   **Options:**
                *   `platform`
                    *   **Description:** The default platform to search from.
                    *   **Type:** String (Choices)
                    *   **Required:** Yes
                    *   **Choices:** `YouTube`, `SoundCloud`, `Spotify`
            *   **Usage:** `/settings music source platform:spotify`

*   `permissions`
    *   **Description:** Contains subcommands for configuring bot permissions.
    *   **Subcommands:**
        *   `dj-role`
            *   **Description:** Sets a specific role that is allowed to use music commands.
            *   **Options:**
                *   `role`
                    *   **Description:** The role that will be designated as the DJ role. Leave empty to remove the DJ role.
                    *   **Type:** Role
                    *   **Required:** No
            *   **Usage:** `/settings permissions dj-role role:@DJ`
        *   `channels`
            *   **Description:** Configures which channels music commands can be used in.
            *   **Options:**
                *   `add`
                    *   **Description:** Adds a channel to the allowed list.
                    *   **Type:** Channel
                    *   **Required:** No
                *   `remove`
                    *   **Description:** Removes a channel from the allowed list.
                    *   **Type:** Channel
                    *   **Required:** No
                *   `clear`
                    *   **Description:** Clears all channel restrictions, allowing music commands in any channel.
                    *   **Type:** Boolean
                    *   **Required:** No
            *   **Usage:** `/settings permissions channels add:#music-commands`

*   `commands`
    *   **Description:** Contains subcommands for configuring command-specific settings.
    *   **Subcommands:**
        *   `cooldown`
            *   **Description:** Sets a global cooldown for commands to prevent spam.
            *   **Options:**
                *   `seconds`
                    *   **Description:** The cooldown duration in seconds (1-30).
                    *   **Type:** Integer
                    *   **Required:** Yes
                    *   **Constraints:** Minimum 1, Maximum 30.
            *   **Usage:** `/settings commands cooldown seconds:5`
        *   `disable`
            *   **Description:** Disables a specific command for the server.
            *   **Options:**
                *   `command`
                    *   **Description:** The name of the command to disable. Autocomplete is available.
                    *   **Type:** String (Autocomplete)
                    *   **Required:** Yes
            *   **Usage:** `/settings commands disable command:play`
        *   `enable`
            *   **Description:** Re-enables a previously disabled command.
            *   **Options:**
                *   `command`
                    *   **Description:** The name of the command to enable. Autocomplete is available.
                    *   **Type:** String (Autocomplete)
                    *   **Required:** Yes
            *   **Usage:** `/settings commands enable command:play`

### Subcommands (Top-Level)

*   `view`
    *   **Description:** Displays all current bot settings for the server in a comprehensive overview.
    *   **Usage:** `/settings view`

*   `reset`
    *   **Description:** Resets all bot settings for the server to their default values. This action requires confirmation.
    *   **Options:**
        *   `confirm`
            *   **Description:** You must set this to `True` to confirm the reset.
            *   **Type:** Boolean
            *   **Required:** Yes
    *   **Usage:** `/settings reset confirm:True`

## Examples

```sh
# Set default music volume to 60% and max to 120%
/settings music volume default:60 max:120

# Set the DJ role to @DJ
/settings permissions dj-role role:@DJ

# Disable the play command
/settings commands disable command:play

# View all current settings
/settings view

# Reset all settings to default
/settings reset confirm:True
```

## Related Advanced Guide Sections

*   [Music Setup](/advanced-guide/music/setup)
*   [Audio Quality](/advanced-guide/music/audio_quality)