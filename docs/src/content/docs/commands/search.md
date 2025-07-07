---
title: search
description: Search for music and select tracks to play
sidebar:
  badge: Music
---

# `search`

This command allows you to search for music across different platforms and select specific tracks to add to the queue. It provides an interactive way to find and queue songs without needing direct URLs.

## How to Use

To search for music, use the `/search` command and provide a `query`. You can optionally specify a `source` and `limit` the number of results.

**Important:** You must be in a voice channel to use this command.

### Options

*   `query`
    *   **Description:** The keywords for your search, such as song name, artist, or album.
    *   **Type:** String
    *   **Required:** Yes
    *   **Example:** `query:lofi hip hop radio`

*   `source`
    *   **Description:** The music platform to search on. If not specified, it defaults to YouTube.
    *   **Type:** String (Choices)
    *   **Required:** No
    *   **Choices:** `YouTube`, `SoundCloud`, `Spotify`
    *   **Example:** `source:spotify`

*   `limit`
    *   **Description:** The maximum number of search results to display. You can choose between 1 and 10 results.
    *   **Type:** Integer
    *   **Required:** No
    *   **Constraints:** Minimum 1, Maximum 10.
    *   **Example:** `limit:5`

## Examples

*   **Search for a song on YouTube:** `/search query:Imagine Dragons Believer`
*   **Search for a playlist on Spotify and show 5 results:** `/search query:workout playlist source:spotify limit:5`
*   **Search for an artist on SoundCloud:** `/search query:Lorn source:soundcloud`

## Related Advanced Guide Sections

*   [Music Setup](/advanced-guide/music/setup)
*   [Playlist Management](/advanced-guide/music/playlists)