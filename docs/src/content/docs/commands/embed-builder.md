---
title: embed
description: Advanced embed builder with templates and live preview
sidebar:
  badge: Settings
---

# `embed`

This command provides a powerful and interactive embed builder, allowing you to create visually appealing embeds with ease. It also supports saving and loading templates for frequently used embed designs.

## How to Use

Use the `/embed` command followed by a subcommand to either launch the interactive builder or manage your saved templates.

**Important Permissions:** You need `Manage Messages` permission to use this command.

### Subcommands

*   `builder`
    *   **Description:** Launches an interactive session where you can construct an embed step-by-step using buttons and modals. You can set the title, description, color, add fields, images, and more.
    *   **Usage:** 
        ```sh
        /embed builder
        ```

*   `templates`
    *   **Description:** Manages your saved embed templates. You can list, delete, or search for templates.
    *   **Options:**
        *   `action`
            *   **Description:** The action to perform on your templates.
            *   **Type:** String (Choices)
            *   **Required:** Yes
            *   **Choices:**
                *   `List all templates`: Displays a list of all templates saved for your server.
                *   `Delete template`: Removes a saved template. Requires the `query` option to specify the template name.
                *   `Search templates`: Finds templates matching a specific search term. Requires the `query` option.
        *   `query`
            *   **Description:** Used with `delete` to specify the template name to remove, or with `search` to provide a search term.
            *   **Type:** String
            *   **Required:** No (required for `delete` and `search` actions)
    *   **Usage:**
        ```sh
        /embed templates action:list
        /embed templates action:delete query:"My Announcement"
        /embed templates action:search query:welcome
        ```

## Examples

```sh
# Start building a new embed
/embed builder

# List all saved embed templates
/embed templates action:list

# Delete a template named "Event Invite"
/embed templates action:delete query:"Event Invite"

# Search for templates containing "rule"
/embed templates action:search query:rule
```

## Related Advanced Guide Sections

*   [Embed Builder](/advanced-guide/content-creation/embed_builder)
*   [Custom Embeds](/advanced-guide/content-creation/custom_embeds)