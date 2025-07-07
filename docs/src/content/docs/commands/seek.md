---
title: seek
description: Seek to a specific position in the current track
sidebar:
  badge: Music
---

# `seek`

This command allows you to jump to a specific point in the currently playing track. This is useful for replaying a section or skipping ahead.

## How to Use

To seek to a position, use the `/seek` command and provide the `position` option in a valid time format.

**Important:** You must be in the same voice channel as the bot to use this command.

### Options

*   `position`
    *   **Description:** The time in the track you want to jump to. Supports various formats.
    *   **Type:** String
    *   **Required:** Yes
    *   **Valid Formats:**
        *   `MM:SS` (e.g., `1:30` for 1 minute and 30 seconds)
        *   `HH:MM:SS` (e.g., `1:05:00` for 1 hour and 5 minutes)
        *   `Xs` (e.g., `90s` for 90 seconds)
        *   `Xm` (e.g., `2m` for 2 minutes)
        *   `XmYs` (e.g., `2m30s` for 2 minutes and 30 seconds)

## Examples

*   **Seek to 1 minute and 45 seconds:** `/seek position:1:45`
*   **Seek to 30 seconds:** `/seek position:30s`
*   **Seek to 5 minutes and 10 seconds:** `/seek position:5m10s`

## Related Advanced Guide Sections

*   [Music Setup](/advanced-guide/music/setup)