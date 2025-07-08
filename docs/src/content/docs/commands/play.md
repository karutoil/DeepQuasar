---
title: play
description: Play a song or playlist
sidebar:
  badge: Music
---

# `play`

This is the primary command for playing music. You can use it to play individual songs, entire playlists, or search for music from various sources.

## How to Use

To play music, use the `/play` command and provide a `query`. You can also specify a `source` and control how the music is added to the queue using `next` and `shuffle`.

**Important:** You must be in a voice channel for the bot to play music.

### Options

*   `query`
    *   **Description:** The song name, a direct URL to a song or playlist, or a general search query.
    *   **Type:** String (Autocomplete)
    *   **Required:** Yes
    *   **Examples:** `Never Gonna Give You Up`, `https://youtu.be/dQw4w9WgXcQ`, `lofi hip hop`

*   `source`
    *   **Description:** Specifies the music platform to search from. If not provided, the bot will use the default search engine configured for your server.
    *   **Type:** String (Choices)
    *   **Required:** No
    *   **Choices:** `YouTube`, `SoundCloud`, `Spotify`
    *   **Example:** `source:youtube`

*   `next`
    *   **Description:** If set to `True`, the song or playlist will be added to the front of the queue, playing next after the current song finishes.
    *   **Type:** Boolean
    *   **Required:** No
    *   **Example:** `next:True`

*   `shuffle`
    *   **Description:** If you are adding a playlist, setting this to `True` will shuffle the order of the songs within that playlist before adding them to the queue.
    *   **Type:** Boolean
    *   **Required:** No
    *   **Example:** `shuffle:True`

## Examples

```sh
# Play a song by name
/play query:"Bohemian Rhapsody"

# Play a YouTube video by URL
/play query:https://www.youtube.com/watch?v=fJ9rUzIMcZQ

# Search for music on SoundCloud
/play query:"lofi beats" source:soundcloud

# Add a song to the front of the queue
/play query:"My Favorite Song" next:True

# Add a shuffled Spotify playlist
/play query:https://open.spotify.com/playlist/... shuffle:True
```

## Related Advanced Guide Sections

*   [Music Setup](/advanced-guide/music/setup)
*   [Playlist Management](/advanced-guide/music/playlists)