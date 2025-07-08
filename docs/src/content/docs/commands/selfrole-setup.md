---
title: selfrole-setup
description: Quick setup wizard for self-roles
sidebar:
  badge: SelfRole
---

# `selfrole-setup`

This command provides a quick and easy way to set up a self-role message using pre-defined templates. It streamlines the process of creating interactive messages where users can assign themselves roles by clicking buttons.

## How to Use

To set up a self-role message, use the `/selfrole-setup` command and provide the required `channel` and `template` options. If you choose the `custom` template, you will also need to provide a `title` and `description`.

```sh
# Set up a gaming roles message in #roles channel
/selfrole-setup channel:#roles template:gaming

# Create a custom self-role message for announcements
/selfrole-setup channel:#announcements template:custom title:Get Notified! description:Click a button to get roles for server updates.
```

**Important Permissions:** You need `Administrator` permissions to use this command.

### Options

*   `channel`
    *   **Description:** The text channel where the self-role message will be sent.
    *   **Type:** Channel (Text Channel)
    *   **Required:** Yes

*   `template`
    *   **Description:** Choose from a selection of pre-defined templates to quickly set up your self-role message. Selecting `Custom` allows you to define your own title and description.
    *   **Type:** String (Choices)
    *   **Required:** Yes
    *   **Choices:**
        *   `Gaming Roles`: For assigning roles related to games.
        *   `Notification Roles`: For users to opt-in to various notifications.
        *   `Color Roles`: For users to pick a display color role.
        *   `Interest Roles`: For users to select roles based on their interests.
        *   `Pronoun Roles`: For users to choose their preferred pronoun roles.
        *   `Custom`: Allows you to define a custom title and description.

*   `title`
    *   **Description:** A custom title for your self-role embed. Only applicable when `template` is set to `Custom`.
    *   **Type:** String
    *   **Required:** No (Required if `template` is `custom`)
    *   **Constraints:** Maximum length of 256 characters.

*   `description`
    *   **Description:** A custom description for your self-role embed. Only applicable when `template` is set to `Custom`.
    *   **Type:** String
    *   **Required:** No (Required if `template` is `custom`)
    *   **Constraints:** Maximum length of 4096 characters.

## Examples

```sh
# Set up a gaming roles message in #roles channel
/selfrole-setup channel:#roles template:gaming

# Create a custom self-role message for announcements
/selfrole-setup channel:#announcements template:custom title:Get Notified! description:Click a button to get roles for server updates.
```

## Related Advanced Guide Sections

*   [SelfRole System](/advanced-guide/server-management/selfrole_documentation)