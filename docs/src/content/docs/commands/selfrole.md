---
title: selfrole
description: Manage self-assignable roles with buttons
sidebar:
  badge: SelfRole
---

# `selfrole`

This command provides comprehensive management for self-assignable roles using interactive buttons. You can create new self-role messages, add or remove roles from them, edit their appearance, configure settings, view statistics, and perform cleanup operations.

## How to Use

Use the `/selfrole` command followed by a subcommand to manage your self-role messages.

**Important Permissions:** You need `Administrator` permissions to use this command.

### Subcommands

*   `create`
    *   **Description:** Creates a new self-role message in a specified channel with a title, description, and optional color.
    *   **Options:**
        *   `channel`
            *   **Description:** The text channel where the self-role message will be sent.
            *   **Type:** Channel (Text Channel)
            *   **Required:** Yes
        *   `title`
            *   **Description:** The main title for the self-role embed.
            *   **Type:** String
            *   **Required:** Yes
            *   **Constraints:** Maximum length of 256 characters.
        *   `description`
            *   **Description:** A detailed description for the self-role embed, explaining its purpose.
            *   **Type:** String
            *   **Required:** Yes
            *   **Constraints:** Maximum length of 4096 characters.
        *   `color`
            *   **Description:** A hex color code (e.g., `#ff0000`) for the embed's sidebar. Defaults to a standard blue if not provided.
            *   **Type:** String
            *   **Required:** No
    *   **Usage:** 
        ```sh
        /selfrole create channel:#roles title:"Pick Your Roles" description:"Select roles to access different parts of the server." color:#00ff00
        ```

*   `add-role`
    *   **Description:** Adds a new role button to an existing self-role message.
    *   **Options:**
        *   `message-id`
            *   **Description:** The ID of the self-role message to which you want to add a role. You can get this from the `create` command's response or the `list` command.
            *   **Type:** String
            *   **Required:** Yes
        *   `role`
            *   **Description:** The Discord role to associate with this button.
            *   **Type:** Role
            *   **Required:** Yes
        *   `label`
            *   **Description:** The text that will appear on the button.
            *   **Type:** String
            *   **Required:** Yes
            *   **Constraints:** Maximum length of 80 characters.
        *   `emoji`
            *   **Description:** An emoji to display on the button (optional).
            *   **Type:** String
            *   **Required:** No
        *   `style`
            *   **Description:** The visual style of the button.
            *   **Type:** String (Choices)
            *   **Required:** No
            *   **Choices:** `Primary (Blue)`, `Secondary (Gray)`, `Success (Green)`, `Danger (Red)`
        *   `description`
            *   **Description:** A short description for the role, displayed in the embed.
            *   **Type:** String
            *   **Required:** No
            *   **Constraints:** Maximum length of 100 characters.
        *   `position`
            *   **Description:** The 0-based position of the button within the message. Buttons are arranged in rows of 5.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 0, Maximum 24.
    *   **Usage:** 
        ```sh
        /selfrole add-role message-id:123456789012345678 role:@Gamer label:Gamer emoji:🎮 style:Primary description:"Access gaming channels."
        ```

*   `remove-role`
    *   **Description:** Removes a role button from an existing self-role message.
    *   **Options:**
        *   `message-id`
            *   **Description:** The ID of the self-role message.
            *   **Type:** String
            *   **Required:** Yes
        *   `role`
            *   **Description:** The role to remove from the message.
            *   **Type:** Role
            *   **Required:** Yes
    *   **Usage:** 
        ```sh
        /selfrole remove-role message-id:123456789012345678 role:@OldRole
        ```

*   `edit`
    *   **Description:** Modifies the title, description, or color of an existing self-role message.
    *   **Options:**
        *   `message-id`
            *   **Description:** The ID of the self-role message to edit.
            *   **Type:** String
            *   **Required:** Yes
        *   `title`
            *   **Description:** The new title for the embed.
            *   **Type:** String
            *   **Required:** No
            *   **Constraints:** Maximum length of 256 characters.
        *   `description`
            *   **Description:** The new description for the embed.
            *   **Type:** String
            *   **Required:** No
            *   **Constraints:** Maximum length of 4096 characters.
        *   `color`
            *   **Description:** The new hex color code for the embed.
            *   **Type:** String
            *   **Required:** No
    *   **Usage:** 
        ```sh
        /selfrole edit message-id:123456789012345678 title:"Updated Roles" description:"New description here." color:#FF00FF
        ```

*   `settings`
    *   **Description:** Configures various settings for a self-role message, such as maximum roles per user, role removal, ephemeral responses, and logging.
    *   **Options:**
        *   `message-id`
            *   **Description:** The ID of the self-role message.
            *   **Type:** String
            *   **Required:** Yes
        *   `max-roles-per-user`
            *   **Description:** The maximum number of roles a user can have from this specific message. Set to `0` for unlimited.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 0, Maximum 25.
        *   `allow-role-removal`
            *   **Description:** If `True`, users can click the button again to remove a role they already have.
            *   **Type:** Boolean
            *   **Required:** No
        *   `ephemeral-response`
            *   **Description:** If `True`, the bot's responses to role assignments/removals will only be visible to the user who interacted with the button.
            *   **Type:** Boolean
            *   **Required:** No
        *   `log-channel`
            *   **Description:** A text channel where role assignments and removals from this message will be logged.
            *   **Type:** Channel (Text Channel)
            *   **Required:** No
    *   **Usage:** 
        ```sh
        /selfrole settings message-id:123456789012345678 max-roles-per-user:3 allow-role-removal:False ephemeral-response:True log-channel:#role-logs
        ```

*   `list`
    *   **Description:** Displays a list of all self-role messages configured in your server, including their IDs, channels, and number of roles.
    *   **Usage:** 
        ```sh
        /selfrole list
        ```

*   `delete`
    *   **Description:** Deletes a self-role message from the channel and the bot's configuration.
    *   **Options:**
        *   `message-id`
            *   **Description:** The ID of the self-role message to delete.
            *   **Type:** String
            *   **Required:** Yes
    *   **Usage:** 
        ```sh
        /selfrole delete message-id:123456789012345678
        ```

*   `stats`
    *   **Description:** Shows statistics for self-role messages, including total interactions, unique users, and popular roles. You can view stats for a specific message or for the entire server.
    *   **Options:**
        *   `message-id`
            *   **Description:** The ID of a specific self-role message to view statistics for. If omitted, server-wide statistics are shown.
            *   **Type:** String
            *   **Required:** No
    *   **Usage:** 
        ```sh
        /selfrole stats message-id:123456789012345678
        ```

*   `cleanup`
    *   **Description:** Removes any invalid or deleted roles from all self-role messages in the server, helping to keep your configuration tidy.
    *   **Usage:** 
        ```sh
        /selfrole cleanup
        ```

## Examples

```sh
# Create a new self-role message
/selfrole create channel:#roles title:"Server Roles" description:"Choose your roles here."

# Add a "Member" role to a message
/selfrole add-role message-id:123456789012345678 role:@Member label:Join style:Success

# List all self-role messages
/selfrole list

# Configure a message to allow only 1 role per user
/selfrole settings message-id:123456789012345678 max-roles-per-user:1
```

## Related Advanced Guide Sections

*   [SelfRole System](/advanced-guide/server-management/selfrole_documentation)