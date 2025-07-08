---
title: Frequently Asked Questions (FAQ)
description: Common issues and troubleshooting tips for DeepQuasar users.
sidebar:
  badge: Help
---

# Frequently Asked Questions (FAQ)

This section addresses common issues you might encounter while using DeepQuasar and provides troubleshooting steps for end-users.

## General Discord Bot Issues

### Q: The bot is offline or not responding.
**A:**
*   **Check Discord Status:** Sometimes Discord itself experiences outages. Check [Discord's official status page](https://discordstatus.com/) to see if there are any ongoing issues.
*   **Bot Status:** The bot might be temporarily offline for maintenance or updates. Please wait a few minutes and try again. If the issue persists, contact the server administrator or the bot's support server.
*   **Permissions:** Ensure the bot has the necessary permissions in the channel or server. Server administrators can verify this in Server Settings > Integrations > DeepQuasar.

### Q: Commands are not working or the bot doesn't respond to my commands.
**A:**
*   **Correct Prefix/Slash Commands:** DeepQuasar primarily uses slash commands (e.g., `/play`, `/help`). Make sure you are using the correct command format.
*   **Permissions:** You might not have the necessary permissions to use certain commands in that channel or server. Check with a server administrator.
*   **Channel Restrictions:** Some commands might be restricted to specific channels.
*   **Bot Mentions:** If the bot is configured to only respond to commands when mentioned, try mentioning it before the command (e.g., `@DeepQuasar help`).

## DeepQuasar Specific Troubleshooting (End-User)

### Q: How can I check if a DeepQuasar module is enabled?
**A:**
*   Many modules have a `status` or `info` subcommand. For example, you can try `/chatbot status` or `/modlog info` to see if the module is active and configured.
*   If a command related to a module (e.g., `/autorole setup`) gives an error about the module not being enabled or configured, it's likely not active.

### Q: Why is a specific command not working for me?
**A:**
*   **Check `/help`:** Use `/help <command_name>` (e.g., `/help play`) to see the command's usage, required permissions, and any specific conditions.
*   **Module Not Enabled:** The command might belong to a module that hasn't been enabled or fully set up by the server administrator.
*   **Role/Channel Restrictions:** The server administrator might have restricted the command's usage to specific roles or channels.

### Q: I'm having trouble with a music command (e.g., `/play` isn't working).
**A:**
*   **Valid URL/Search Term:** Ensure you are providing a valid YouTube URL, Spotify link, or a clear search query.
*   **Bot in Voice Channel:** The bot needs to be in a voice channel to play music. If it's not, try joining a voice channel and then using the `/play` command.
*   **Connectivity Issues:** There might be temporary connectivity issues between the bot and the music source. Try again after a moment.
*   **Region Restrictions:** Some content might be region-restricted.

### Q: My welcome message isn't appearing for new members.
**A:**
*   **Module Enabled:** Ensure the Welcome module is properly set up using `/welcome setup`.
*   **Channel Configured:** Verify that a welcome channel has been set.
*   **Permissions:** The bot needs permission to send messages in the designated welcome channel.
*   **Message Content:** Check if the message content is valid and doesn't contain any formatting errors.

### Q: I can't create a self-role message.
**A:**
*   **Module Enabled:** Ensure the SelfRole module is enabled and configured.
*   **Permissions:** You might need specific roles or permissions to use the `/selfrole create` or `/selfrole-setup` commands.
*   **Channel Permissions:** The bot needs permissions to send messages and create buttons in the channel where you are trying to create the self-role message.

## Contacting Support

If you've tried these steps and are still experiencing issues, please:
*   **Contact a Server Administrator:** They can check the bot's configuration and logs.
*   **Join the Official DeepQuasar Support Server:** You can usually find a link to the support server in the bot's `/help` command or on its official website. Provide as much detail as possible about your issue, including:
    *   The command you were trying to use.
    *   The exact error message (if any).
    *   What you've already tried.
    *   The time and date the issue occurred.
