---
title: tempvc-templates
description: Manage channel naming templates for temp VCs
sidebar:
  badge: TempVC
---

# `tempvc-templates`

This command allows administrators to manage custom naming templates for temporary voice channels. These templates define how newly created temporary voice channels will be named, often incorporating dynamic placeholders like the user's name or their current activity.

## How to Use

Use the `/tempvc-templates` command followed by a subcommand to manage your naming templates.

**Important Permissions:** You need `Manage Channels` permissions to use this command.

### Subcommands

*   `list`
    *   **Description:** Displays a list of all custom naming templates currently configured for temporary voice channels in your server.
    *   **Usage:** 
        ```sh
        /tempvc-templates list
        ```

*   `add`
    *   **Description:** Adds a new custom naming template.
    *   **Options:**
        *   `name`
            *   **Description:** A unique name for your new template.
            *   **Type:** String
            *   **Required:** Yes
            *   **Constraints:** Minimum 1, Maximum 50 characters.
        *   `template`
            *   **Description:** The template string for channel names. You can use placeholders like `{user}`, `{activity}`, `{time}`, etc.
            *   **Type:** String
            *   **Required:** Yes
            *   **Constraints:** Minimum 1, Maximum 100 characters.
        *   `description`
            *   **Description:** An optional description for the template.
            *   **Type:** String
            *   **Required:** No
            *   **Constraints:** Maximum 200 characters.
    *   **Usage:** 
        ```sh
        /tempvc-templates add name:GamingChannel template:"{user}'s Gaming Lounge" description:"Channel for gaming sessions."
        ```

*   `remove`
    *   **Description:** Removes an existing naming template.
    *   **Options:**
        *   `name`
            *   **Description:** The name of the template to remove. Autocomplete is available.
            *   **Type:** String (Autocomplete)
            *   **Required:** Yes
    *   **Usage:** 
        ```sh
        /tempvc-templates remove name:GamingChannel
        ```

*   `edit`
    *   **Description:** Modifies an existing naming template.
    *   **Options:**
        *   `name`
            *   **Description:** The name of the template to edit. Autocomplete is available.
            *   **Type:** String (Autocomplete)
            *   **Required:** Yes
        *   `template`
            *   **Description:** The new template string. If omitted, the current template remains unchanged.
            *   **Type:** String
            *   **Required:** No
            *   **Constraints:** Minimum 1, Maximum 100 characters.
        *   `description`
            *   **Description:** The new description for the template. If omitted, the current description remains unchanged.
            *   **Type:** String
            *   **Required:** No
            *   **Constraints:** Maximum 200 characters.
    *   **Usage:** 
        ```sh
        /tempvc-templates edit name:GamingChannel template:"{user}'s {activity} Zone"
        ```

*   `preview`
    *   **Description:** Shows how a given template string would look when applied to a temporary voice channel name, using sample data for placeholders.
    *   **Options:**
        *   `template`
            *   **Description:** The template string you want to preview.
            *   **Type:** String
            *   **Required:** Yes
        *   `activity`
            *   **Description:** A sample activity name to use for the `{activity}` placeholder in the preview.
            *   **Type:** String
            *   **Required:** No
    *   **Usage:** 
        ```sh
        /tempvc-templates preview template:"{user}'s Channel" activity:Valorant
        ```

*   `placeholders`
    *   **Description:** Displays a list of all available placeholders that can be used in temporary voice channel naming templates.
    *   **Usage:** 
        ```sh
        /tempvc-templates placeholders
        ```

## Examples

```sh
# List all custom naming templates
/tempvc-templates list

# Add a new template for music channels
/tempvc-templates add name:MusicRoom template:"{user}'s Music Room" description:"A channel for listening to music."

# Preview a template with a specific activity
/tempvc-templates preview template:"Playing {activity} with {user}" activity:Minecraft

# View all available placeholders
/tempvc-templates placeholders
```

## Related Advanced Guide Sections

*   [TempVC System](/advanced-guide/server-management/tempvc_system)