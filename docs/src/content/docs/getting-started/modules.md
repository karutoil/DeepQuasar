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
*   **Example:** 
    ```sh
    /chatbot toggle enabled:True
    ```
*   For more details, refer to the [chatbot command documentation](/commands/chatbot).

### 🛡️ AutoRole System

To set up and enable automatic role assignment for new members:

*   Use the `/autorole setup` command.
*   **Example:** 
    ```sh
    /autorole setup role:@NewMember delay:5
    ```
*   For more details, refer to the [autorole command documentation](/commands/autorole).

### 📝 Embed Builder

The embed builder is a utility for creating rich embeds. While not a module that needs "enabling" in the traditional sense, you start using it by launching the builder:

*   Use the `/embed builder` command.
*   **Example:** 
    ```sh
    /embed builder
    ```
*   For more details, refer to the [embed command documentation](/commands/embed-builder).

### 📜 Moderation Logging (ModLog)

To set up and enable comprehensive moderation logging for your server:

*   Use the `/modlog setup` command.
*   **Example:** 
    ```sh
    /modlog setup channel:#mod-logs
    ```
*   For more details, refer to the [modlog command documentation](/commands/modlog).

### 🏷️ SelfRole System

To create and manage self-assignable roles using interactive buttons:

*   Start by creating a new self-role message using `/selfrole create` or the quick setup wizard `/selfrole-setup`.
*   **Example:** 
    ```sh
    /selfrole create channel:#roles title:"Pick Your Roles" description:"Select roles to access different parts of the server."
    ```
*   For more details, refer to the [selfrole command documentation](/commands/selfrole) and [selfrole-setup documentation](/commands/selfrole-setup).

### 🎟️ Ticket System

To set up the ticket system for support or other inquiries:

*   Use the `/tickets setup` command.
*   **Example:** 
    ```sh
    /tickets setup
    ```
*   For more details, refer to the [tickets command documentation](/commands/tickets).

### 🔊 Temporary Voice Channels (TempVC)

To enable and configure the system for automatically created temporary voice channels:

*   Use the `/tempvc setup` command.
*   **Example:** 
    ```sh
    /tempvc setup join-channel:#create-a-vc category:"Voice Channels"
    ```
*   For more details, refer to the [tempvc command documentation](/commands/tempvc).

### 👋 Welcome and Leave Messages

To configure custom welcome and leave messages for your server:

*   Use the `/welcome setup` command.
*   **Example:** 
    ```sh
    /welcome setup welcome channel:#welcome-new-members message:"Welcome {user.mention} to {guild.name}!"
    ```
*   For more details, refer to the [welcome command documentation](/commands/welcome).

### ⏰ Reminder System

To enable and use reminders for yourself, other users, or channels:

*   Use the `/remind` command to set reminders.
*   **Example:** 
    ```sh
    /remind me time:"in 10m" task:"Check the oven"
    /remind user user:@Alice time:"on 2025-07-20 14:00" task:"Team meeting"
    /remind channel channel:#general time:"in 1h" task:"Daily standup" role:@Team
    ```
*   Use `/reminders list` to view and manage your reminders.
*   For more details, refer to the [remind command documentation](/commands/remind/remind) and [reminders command documentation](/commands/remind/reminders).

### 🎶 Music Player

To enable and use the music player features:

*   Use the `/play` command to start playing music in a voice channel.
*   **Example:** 
    ```sh
    /play query:"Never Gonna Give You Up"
    ```
*   Use `/queue`, `/skip`, `/stop`, `/history`, and other music commands to manage playback.
*   For more details, refer to the [music command documentation](/commands/music).

### 🚫 Profanity Filter

To enable and configure the profanity filter:

*   Use the `/profanity toggle` command to enable or disable the filter.
*   **Example:** 
    ```sh
    /profanity toggle enabled:True
    ```
*   For more details, refer to the [profanity command documentation](/commands/profanity).

### 🧩 Templates System

To manage embed templates for your server:

*   Use the `/templates list` command to view templates.
*   Use `/templates create`, `/templates delete`, and `/templates info` to manage them.
*   **Example:** 
    ```sh
    /templates create name:"Announcement" content:"This is an announcement!"
    ```
*   For more details, refer to the [templates command documentation](/commands/templates).

---

After enabling a module, remember to explore its specific configuration commands (e.g., `/chatbot api`, `/autorole settings`, `/modlog configure`, `/remind`, `/music settings`, `/profanity settings`, `/templates edit`) to tailor it to your server's needs.
