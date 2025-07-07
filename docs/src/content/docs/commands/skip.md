---
title: skip
description: Skip the current track
sidebar:
  badge: Music
---

# `skip`

This command allows you to skip the currently playing track or multiple tracks in the queue. It's useful for moving past songs you don't want to listen to.

## How to Use

To skip the current song, simply use the command without any options:

`/skip`

To skip multiple songs, use the `amount` option:

`/skip amount:<number>`

**Important:** You must be in the same voice channel as the bot to use this command.

### Options

*   `amount`
    *   **Description:** The number of tracks to skip, starting from the current one. The default value is 1.
    *   **Type:** Integer
    *   **Required:** No
    *   **Constraints:** Minimum 1, Maximum 10.

## Examples

*   **Skip the current song:** `/skip`
*   **Skip the next 3 songs:** `/skip amount:3`

## Related Advanced Guide Sections

*   [Music Setup](/advanced-guide/music/setup)