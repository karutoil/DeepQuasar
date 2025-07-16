---
title: canned-response
description: Manage canned responses for quick replies
sidebar:
    badge: Tickets
---

# `canned-response`

This command allows you to manage canned responses for quick replies in tickets.

## How to Use

Use the `/canned-response` command followed by a subcommand.

```sh
/canned-response <subcommand>
```

### Subcommands

*   `create`
    *   **Description:** Create a new canned response.
    *   **Options:**
        *   `name` (required): Name/identifier for the response.
        *   `content` (required): The response content.

*   `list`
    *   **Description:** List all canned responses.

*   `edit`
    *   **Description:** Edit an existing canned response.
    *   **Options:**
        *   `name` (required): Name of the response to edit.

*   `delete`
    *   **Description:** Delete a canned response.
    *   **Options:**
        *   `name` (required): Name of the response to delete.

*   `use`
    *   **Description:** Send a canned response in this channel.
    *   **Options:**
        *   `name` (required): Name of the response to send.

## Example

```sh
/canned-response create name:"greeting" content:"Hello! How can I help you today?"
```
