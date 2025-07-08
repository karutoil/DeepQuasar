---
title: templates
description: Manage embed templates
sidebar:
  badge: Settings
---

# `templates`

This command provides tools to manage your saved embed templates. You can list all templates, delete existing ones, or view detailed information about a specific template.

## How to Use

Use the `/templates` command followed by a subcommand to perform actions on your embed templates.

```sh
# List all saved templates
/templates list

# Delete a template (then select from the dropdown)
/templates delete

# View information about a template (then select from the dropdown)
/templates info
```

**Important Permissions:** You need `Manage Messages` permissions to use this command.

### Subcommands

*   `list`
    *   **Description:** Displays a list of all embed templates saved for your server, including their names, descriptions, and creation details.
    *   **Usage:** `/templates list`

*   `delete`
    *   **Description:** Allows you to delete a saved embed template. You will be presented with a dropdown menu to select the template you wish to delete.
    *   **Usage:** `/templates delete`

*   `info`
    *   **Description:** Provides detailed information about a selected embed template, including its content and a preview of the embed.
    *   **Usage:** `/templates info`

## Examples

```sh
# List all saved templates
/templates list

# Delete a template (then select from the dropdown)
/templates delete

# View information about a template (then select from the dropdown)
/templates info
```

## Related Advanced Guide Sections

*   [Embed Builder](/advanced-guide/content-creation/embed_builder)
*   [Custom Embeds](/advanced-guide/content-creation/custom_embeds)