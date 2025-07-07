---
title: loop
description: Set loop mode for the player
sidebar:
  badge: Music
---

# `loop`

This command allows you to control the playback loop mode for the music player. You can set it to loop the current track, the entire queue, or turn looping off.

## How to Use

To set a loop mode, use the `/loop` command followed by the `mode` option and select your desired loop setting. If you use the command without any options, it will display the current loop mode.

### Options

*   `mode`
    *   **Description:** The desired loop mode for the player.
    *   **Type:** String (Choices)
    *   **Required:** No
    *   **Choices:**
        *   `Off`: Turns off any active looping.
        *   `Track`: Repeats the currently playing song indefinitely.
        *   `Queue`: Repeats the entire music queue once it finishes.

## Examples

*   **Set loop mode to track:** `/loop mode:track`
*   **Loop the entire queue:** `/loop mode:queue`
*   **Turn off looping:** `/loop mode:off`
*   **Check current loop mode:** `/loop`

## Related Advanced Guide Sections

*   [Music Setup](/advanced-guide/music/setup)
*   [Playlist Management](/advanced-guide/music/playlists)