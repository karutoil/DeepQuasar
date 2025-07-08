---
title: selfrole-help
description: Get help with the self-role system
sidebar:
  badge: SelfRole
---

# `selfrole-help`

This command provides comprehensive help and guidance for the self-role system. You can use it to get a general overview or dive into specific topics like getting started, basic commands, advanced features, troubleshooting, best practices, and examples.

## How to Use

*   **General Help:** To get a general overview of the self-role system, simply use the command without any options:
    ```sh
    /selfrole-help
    ```

*   **Topic-Specific Help:** To get detailed information on a specific aspect of the self-role system, use the `topic` option and select from the available choices:
    ```sh
    /selfrole-help topic:<topic_name>
    ```

### Options

*   `topic`
    *   **Description:** Select a specific topic to get detailed help.
    *   **Type:** String (Choices)
    *   **Required:** No
    *   **Choices:**
        *   `Getting Started`: Learn how to set up your first self-role message.
        *   `Basic Commands`: Overview of essential commands for managing self-roles.
        *   `Advanced Features`: Explore advanced functionalities like role limits and conflicts.
        *   `Troubleshooting`: Find solutions to common issues.
        *   `Best Practices`: Tips for creating effective self-role systems.
        *   `Examples`: Real-world examples of self-role implementations.

## Examples

```sh
# Get general help for self-roles
/selfrole-help

# Get help on advanced features
/selfrole-help topic:advanced-features

# View examples of self-role setups
/selfrole-help topic:examples
```

## Related Advanced Guide Sections

*   [SelfRole System](/advanced-guide/server-management/selfrole_documentation)