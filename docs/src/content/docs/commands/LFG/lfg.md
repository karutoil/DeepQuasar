---
title: lfg
description: Create a Looking for Group post
sidebar:
  badge: LFG
---

# `lfg`

This command allows you to create a Looking for Group (LFG) post to find other players for a game.

## How to Use

To create an LFG post, use the `/lfg` command with the required options:

```sh
/lfg game:"Your Game" message:"Your Message"
```

### Options

*   `game`
    *   **Description:** The game you want to play.
    *   **Type:** String
    *   **Required:** Yes
    *   **Constraints:** Maximum length of 100 characters.
    *   **Autocomplete:** Yes

*   `message`
    *   **Description:** Your LFG message (e.g., "looking for ranked teammates").
    *   **Type:** String
    *   **Required:** Yes
    *   **Constraints:** Maximum length of 500 characters.

*   `channel`
    *   **Description:** Channel to post in (optional - defaults to current channel).
    *   **Type:** Channel (Text)
    *   **Required:** No

## Examples

```sh
/lfg game:"Valorant" message:"Looking for 2 more for competitive."
/lfg game:"Apex Legends" message:"Need a squad for ranked." channel:#lfg-squads
```
