---
title: create-guild-data
description: Force create/update guild data with welcome system (Debug)
sidebar:
  badge: General
---

# `create-guild-data`

This is a **debug command** primarily used by developers or administrators for troubleshooting and ensuring the bot's guild data is correctly initialized or updated, specifically concerning the welcome system. It forces the creation of new guild data if it doesn't exist, or updates existing data to include the default welcome system configuration.

## How to Use

This command is typically hidden from regular users and is intended for administrative or debugging purposes. To use it, simply execute the command without any options:

```sh
/create-guild-data
```

## Examples

```sh
# Force create/update guild data
/create-guild-data
```

## Important Notes

*   This command is for **debugging and setup purposes only** and should not be used by regular server members.
*   It ensures that the necessary database entries for the welcome system are present and correctly structured for your guild.

## Related Advanced Guide Sections

*   [Welcome System](/advanced-guide/server-management/welcome_system)