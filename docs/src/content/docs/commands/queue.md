---
title: queue
description: Show the current queue
sidebar:
  badge: Music
---

# `queue`

This command allows you to view the list of songs currently in the music queue. If the queue is long, it will be paginated for easier viewing.

## How to Use

To view the current music queue, simply use the command without any options:

`/queue`

If you want to view a specific page of the queue, use the `page` option:

`/queue page:<number>`

## Options

*   `page`
    *   **Description:** The specific page number of the queue to display.
    *   **Type:** Integer
    *   **Required:** No
    *   **Constraints:** Minimum value of 1.

## Examples

*   **View the first page of the queue:** `/queue`
*   **View the third page of the queue:** `/queue page:3`

## What it Shows

*   **Now Playing:** The title and artist of the song currently being played.
*   **Up Next:** A numbered list of songs in the queue, showing their title and artist.
*   **Pagination:** If the queue has more than 10 songs, navigation buttons will appear to browse through pages.

## Related Advanced Guide Sections

*   [Music Setup](/advanced-guide/music/setup)
*   [Playlist Management](/advanced-guide/music/playlists)