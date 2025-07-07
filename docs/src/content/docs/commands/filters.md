---
title: filters
description: Apply audio filters to the player
sidebar:
  badge: Music
---

# `filters`

This command allows you to apply various audio filters to the currently playing music. You can enhance your listening experience with effects like bassboost, nightcore, vaporwave, and more.

## How to Use

To apply a filter, use the `/filters` command followed by the `filter` option and select your desired effect. If you use the command without any options, it will display the currently active filters.

### Options

*   `filter`
    *   **Description:** The audio filter you wish to apply or clear.
    *   **Type:** String (Choices)
    *   **Required:** No
    *   **Choices:**
        *   `Clear All`: Removes all active audio filters.
        *   `Bassboost`: Enhances the bass frequencies.
        *   `Nightcore`: Increases tempo and pitch, creating a "nightcore" effect.
        *   `Vaporwave`: Decreases tempo and pitch, creating a "vaporwave" effect.
        *   `8D`: Applies a spatial audio effect, making the sound appear to move around you.
        *   `Karaoke`: Attempts to remove vocals from the track.
        *   `Vibrato`: Adds a pulsating change in pitch.
        *   `Tremolo`: Adds a pulsating change in volume.

## Examples

*   **Apply a bassboost filter:** `/filters filter:bassboost`
*   **Activate the nightcore effect:** `/filters filter:nightcore`
*   **Clear all active filters:** `/filters filter:clear`
*   **Check active filters:** `/filters`

## Related Advanced Guide Sections

*   [Music Setup](/advanced-guide/music/setup)
*   [Audio Quality](/advanced-guide/music/audio_quality)