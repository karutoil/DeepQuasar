---
title: help
description: Get help with bot commands
sidebar:
  badge: Information
---

# `help`

This command is your go-to resource for understanding how to use the bot. It provides general information about the bot, lists command categories, and offers detailed explanations for specific commands.

## How to Use

There are several ways to use the `help` command:

*   **General Help:** Simply type `/help` to get a general overview of the bot, its features, and command categories.
*   **Category-Specific Help:** Use the `category` option to view all commands within a particular category.
*   **Command-Specific Help:** Use the `command` option to get detailed information about a single command, including its options and examples.

### Options

*   `command`
    *   **Description:** Provides detailed help for a specific command. You can start typing the command name, and the bot will offer suggestions.
    *   **Type:** String (Autocomplete)
    *   **Required:** No
    *   **Example:** `/help command:play`

*   `category`
    *   **Description:** Filters the help message to show commands from a selected category.
    *   **Type:** String (Choices)
    *   **Required:** No
    *   **Choices:**
        *   `🎵 Music`
        *   `📜 Queue`
        *   `⚙️ Settings`
        *   `ℹ️ Information`
        *   `🤖 AI`
        *   `👑 Admin`
    *   **Example:** `/help category:music`

## Examples

*   **Get general help:** `/help`
*   **View music commands:** `/help category:music`
*   **Get detailed help for the `play` command:** `/help command:play`

## Related Advanced Guide Sections

*   [All Commands](/DeepQuasar/commands)