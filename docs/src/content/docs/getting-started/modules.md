---
title: Enabling Bot Modules
description: A guide to enabling and configuring core modules of the DeepQuasar bot.
sidebar:
  badge: Setup
---

# Enabling Bot Modules

DeepQuasar is designed with a modular architecture, allowing you to enable and configure features as needed for your server. This guide will walk you through the commands used to activate and set up the bot's core functionalities.

Each module typically has a `setup` or `toggle` command to get started, followed by more detailed configuration options.

## Core Modules and How to Enable Them

Here's a list of key modules and the commands to enable them:

### 🤖 AI Chatbot

To enable or disable the AI Chatbot module for your server:

*   Use the `/chatbot toggle` command.
*   **Example:** `/chatbot toggle enabled:True`
*   For more details, refer to the [chatbot command documentation](/DeepQuasar/commands/chatbot).

### 🛡️ AutoRole System

To set up and enable automatic role assignment for new members:

*   Use the `/autorole setup` command.
*   **Example:** `/autorole setup role:@NewMember delay:5`
*   For more details, refer to the [autorole command documentation](/DeepQuasar/commands/autorole).

### 📝 Embed Builder

The embed builder is a utility for creating rich embeds. While not a module that needs "enabling" in the traditional sense, you start using it by launching the builder:

*   Use the `/embed builder` command.
*   **Example:** `/embed builder`
*   For more details, refer to the [embed command documentation](/DeepQuasar/commands/embed-builder).

### 📜 Moderation Logging (ModLog)

To set up and enable comprehensive moderation logging for your server:

*   Use the `/modlog setup` command.
*   **Example:** `/modlog setup channel:#mod-logs`
*   For more details, refer to the [modlog command documentation](/DeepQuasar/commands/modlog).

### 🏷️ SelfRole System

To create and manage self-assignable roles using interactive buttons:

*   Start by creating a new self-role message using `/selfrole create` or the quick setup wizard `/selfrole-setup`.
*   **Example:** `/selfrole create channel:#roles title:Pick Your Roles description:Select roles to access different parts of the server.`
*   For more details, refer to the [selfrole command documentation](/DeepQuasar/commands/selfrole) and [selfrole-setup documentation](/DeepQuasar/commands/selfrole-setup).

### 🎟️ Ticket System

To set up the ticket system for support or other inquiries:

*   Use the `/tickets setup` command.
*   **Example:** `/tickets setup`
*   For more details, refer to the [tickets command documentation](/DeepQuasar/commands/tickets).

### 🔊 Temporary Voice Channels (TempVC)

To enable and configure the system for automatically created temporary voice channels:

*   Use the `/tempvc setup` command.
*   **Example:** `/tempvc setup join-channel:#create-a-vc category:Voice Channels`
*   For more details, refer to the [tempvc command documentation](/DeepQuasar/commands/tempvc).

### 👋 Welcome and Leave Messages

To configure custom welcome and leave messages for your server:

*   Use the `/welcome setup` command.
*   **Example:** `/welcome setup welcome channel:#welcome-new-members message:Welcome {user.mention} to {guild.name}!`
*   For more details, refer to the [welcome command documentation](/DeepQuasar/commands/welcome).

---

After enabling a module, remember to explore its specific configuration commands (e.g., `/chatbot api`, `/autorole settings`, `/modlog configure`) to tailor it to your server's needs.
