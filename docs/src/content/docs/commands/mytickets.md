---
title: mytickets
description: View your ticket history and manage your tickets
sidebar:
    badge: Tickets
---

# `mytickets`

This command allows you to view your ticket history and manage your tickets.

## How to Use

Use the `/mytickets` command to see a list of your tickets.

```sh
/mytickets [status]
```

### Options

*   `status`
    *   **Description:** Filter tickets by status.
    *   **Type:** String
    *   **Required:** No
    *   **Choices:** `Open`, `Closed`, `All`

## Features

- Shows your latest 10 tickets.
- Displays ticket status, priority, type, creation time, assigned staff, and channel.
- Provides quick links to open ticket channels.

## Example

```sh
/mytickets status:Open
```
