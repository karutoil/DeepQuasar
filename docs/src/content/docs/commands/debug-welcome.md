---
title: debug-welcome
description: Debug welcome system configuration
sidebar:
  badge: General
---

# `debug-welcome`

This command is a diagnostic tool designed to help administrators and developers inspect the current configuration of the welcome and leave message systems. It provides detailed information about the channels, enabled status, and other settings, which is invaluable for troubleshooting setup issues.

## How to Use

To view the debug information for the welcome system, simply use the command without any additional options:

`/debug-welcome`

**Important:** This command requires `Manage Guild` permissions.

## Examples

*   `/debug-welcome`

## What it Shows

Upon execution, the bot will reply with an ephemeral message containing a detailed breakdown of your server's welcome system configuration, including:

*   **Guild Information:** Your server's ID and name.
*   **Database Entry Status:** Whether guild data for the welcome system is found in the bot's database.
*   **Welcome System Status:** Information about the welcome message configuration, including channel ID, enabled status, and channel validity.
*   **Leave System Status:** Similar details for the leave message configuration.
*   **DM Welcome Status:** Details about the direct message welcome configuration.
*   **Next Steps:** Suggestions for how to set up or test the welcome system if it's not fully configured.

## Related Advanced Guide Sections

*   [Welcome System](/advanced-guide/server-management/welcome_system)