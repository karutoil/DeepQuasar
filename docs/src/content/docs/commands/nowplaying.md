---
title: nowplaying
description: Show information about the currently playing track
sidebar:
  badge: Music
---

# `nowplaying`

This command displays detailed information about the song that is currently playing in the voice channel. It provides a quick overview of the track, its duration, who requested it, and the current playback progress.

## How to Use

Simply use the command without any additional options:

```sh
/nowplaying
```

## Examples

```sh
/nowplaying
```

## What it Shows

Upon execution, the bot will reply with an embed containing the following information about the current track:

*   **Title and Artist:** The name of the song and its artist/author.
*   **Duration:** The total length of the track.
*   **Requested by:** The user who added the song to the queue.
*   **Volume:** The current playback volume.
*   **Queue:** The number of tracks remaining in the queue.
*   **Progress Bar:** A visual representation of the current playback position within the track.
*   **Loop Status:** Indicates if the track or queue is currently set to loop.
*   **Thumbnail:** The artwork or thumbnail of the track, if available.
*   **Status:** (If paused) Indicates that the player is paused.

## Related Advanced Guide Sections

*   [Music Setup](/advanced-guide/music/setup)
*   [Audio Quality](/advanced-guide/music/audio_quality)