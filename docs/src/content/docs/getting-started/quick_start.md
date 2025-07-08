---
title: Quick Start Guide
description: Get DeepQuasar up and running in your server quickly.
sidebar:
  badge: Setup
---

# Quick Start Guide

This guide will help you get DeepQuasar up and running in your Discord server as quickly as possible.

## Step 1: Invite the Bot

First, you need to invite the DeepQuasar bot to your Discord server. You can do this by clicking on the invitation link provided on our official website or by using the direct invite link.

[**Invite DeepQuasar to your Server**](https://discord.com/oauth2/authorize?client_id=191337632972800000&permissions=3558715944086&integration_type=0&scope=applications.commands+bot)

*   **Permissions:** Ensure the bot has the necessary permissions to function correctly. It's recommended to grant it administrator permissions initially, and then adjust them as needed.

## Step 2: Basic Configuration

Once the bot is in your server, you can start with some basic configurations.

### Set up a Welcome Message (Optional but Recommended)

To greet new members joining your server, you can set up a welcome message:

1.  Use the `/welcome setup welcome` command.
2.  Choose a channel where welcome messages will be sent (e.g., `#welcome`).
3.  Customize your welcome message using placeholders like `{user.mention}` and `{guild.name}`.

    **Example:**
    ```sh
    /welcome setup welcome channel:#welcome message:"Welcome {user.mention} to {guild.name}! We're glad to have you here."
    ```

### Enable Core Modules

DeepQuasar's functionalities are organized into modules. You can enable them based on your server's needs. For a detailed guide on enabling specific modules like the AI Chatbot, AutoRole, or ModLog, refer to the [Enabling Bot Modules](/getting-started/modules) documentation.

## Step 3: Explore Commands

DeepQuasar offers a wide range of commands for various functionalities. You can explore them using the `/help` command.

*   **General Help:** 
    ```sh
    /help
    ```
*   **Category-Specific Help:** 
    ```sh
    /help category:music
    ```
*   **Command-Specific Help:** 
    ```sh
    /help command:play
    ```

## Step 4: Advanced Configuration (Optional)

Once you're familiar with the basic setup, you can dive into more advanced configurations to tailor the bot to your server's specific requirements. This includes:

*   **Music Settings:** Adjusting default volume, queue limits, and music sources using `/settings music`.
*   **Self-Assignable Roles:** Creating interactive self-role messages with `/selfrole` or `/selfrole-setup`.
*   **Temporary Voice Channels:** Setting up dynamic voice channels with `/tempvc`.
*   **Moderation Settings:** Configuring detailed moderation logging and automated actions with `/modlog`.

---

If you encounter any issues or have questions, please refer to our [FAQ](./faq.md) or join our support server.