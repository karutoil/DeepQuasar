---
title: lfg-presets
description: Manage LFG game presets
sidebar:
  badge: LFG
---

# `lfg-presets`

This command allows you to manage game presets for the LFG system.

## How to Use

Use the `/lfg-presets` command followed by a subcommand to manage game presets.

```sh
/lfg-presets <subcommand>
```

### Subcommands

*   `add`
    *   **Description:** Add a new game preset.
    *   **Options:**
        *   `name`
            *   **Description:** Game name.
            *   **Type:** String
            *   **Required:** Yes
            *   **Constraints:** Maximum length of 50 characters.
        *   `icon`
            *   **Description:** Emoji or icon for the game.
            *   **Type:** String
            *   **Required:** No
            *   **Constraints:** Maximum length of 10 characters.
        *   `color`
            *   **Description:** Embed color (hex code).
            *   **Type:** String
            *   **Required:** No
        *   `default-message`
            *   **Description:** Default LFG message template.
            *   **Type:** String
            *   **Required:** No
            *   **Constraints:** Maximum length of 200 characters.

*   `remove`
    *   **Description:** Remove a game preset.
    *   **Options:**
        *   `name`
            *   **Description:** Game name to remove.
            *   **Type:** String
            *   **Required:** Yes
            *   **Autocomplete:** Yes

*   `list`
    *   **Description:** List all game presets.

*   `load-defaults`
    *   **Description:** Load default game presets.

## Examples

```sh
/lfg-presets add name:"Valorant" icon:"🔫" color:"#ff4554"
/lfg-presets remove name:"Valorant"
/lfg-presets list
```
