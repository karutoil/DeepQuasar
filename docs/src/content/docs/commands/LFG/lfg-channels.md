---
title: lfg-channels
description: Manage LFG channel settings
sidebar:
  badge: LFG
---

# `lfg-channels`

This command allows you to manage which channels are used for LFG posts.

## How to Use

Use the `/lfg-channels` command followed by a subcommand to manage LFG channels.

```sh
/lfg-channels <subcommand>
```

### Subcommands

*   `add`
    *   **Description:** Add a channel for LFG posts.
    *   **Options:**
        *   `channel`
            *   **Description:** Channel to add for LFG posts.
            *   **Type:** Channel (Text)
            *   **Required:** Yes
        *   `type`
            *   **Description:** Type of LFG channel.
            *   **Type:** String
            *   **Required:** Yes
            *   **Choices:** `Whitelist (slash commands allowed)`, `Auto-convert (ALL messages become LFG posts)`

*   `remove`
    *   **Description:** Remove a channel from LFG settings.
    *   **Options:**
        *   `channel`
            *   **Description:** Channel to remove.
            *   **Type:** Channel (Text)
            *   **Required:** Yes

*   `list`
    *   **Description:** List all configured LFG channels.

*   `clear`
    *   **Description:** Clear all channel configurations.
    *   **Options:**
        *   `type`
            *   **Description:** Type of channels to clear.
            *   **Type:** String
            *   **Required:** Yes
            *   **Choices:** `Whitelist channels`, `Auto-convert channels`, `All channels`

## Examples

```sh
/lfg-channels add channel:#lfg type:Whitelist
/lfg-channels remove channel:#general
/lfg-channels list
```
