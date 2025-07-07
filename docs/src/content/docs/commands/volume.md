---
title: volume
description: Set or view the playback volume
sidebar:
  badge: Music
---

# `volume`

This command allows you to control the playback volume of the music player. You can either view the current volume level or set a new one.

## How to Use

*   **View Current Volume:** To see the current volume level, simply use the command without any options:
    `/volume`

*   **Set New Volume:** To change the volume, use the `level` option and specify a value between 0 and 200.
    `/volume level:<number>`

**Important:** You must be in the same voice channel as the bot to use this command.

### Options

*   `level`
    *   **Description:** The desired volume level for the music playback.
    *   **Type:** Integer
    *   **Required:** No
    *   **Constraints:** Minimum 0, Maximum 200.

## Examples

*   **Check the current volume:** `/volume`
*   **Set the volume to 75%:** `/volume level:75`
*   **Set the volume to maximum (200%):** `/volume level:200`
*   **Mute the bot:** `/volume level:0`

## Related Advanced Guide Sections

*   [Music Setup](/advanced-guide/music/setup)