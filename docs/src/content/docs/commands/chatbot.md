---
title: chatbot
description: Configure AI chatbot settings for this server
sidebar:
  badge: AI
---

# `chatbot`

This command allows server administrators to configure various settings for the AI chatbot, including enabling/disabling it, API connections, behavior, channel restrictions, and advanced AI parameters.

## How to Use

Use the `/chatbot` command followed by a subcommand to manage specific aspects of the chatbot.

### Subcommands

*   `status`
    *   **Description:** Displays the current configuration of the AI chatbot for your server.
    *   **Usage:**
        ```sh
        /chatbot status
        ```

*   `toggle`
    *   **Description:** Enables or disables the AI chatbot for your server.
    *   **Options:**
        *   `enabled`
            *   **Description:** Set to `True` to enable, `False` to disable.
            *   **Type:** Boolean
            *   **Required:** Yes
    *   **Usage:**
        ```sh
        /chatbot toggle enabled:True
        ```

*   `api`
    *   **Description:** Configures the API connection settings for the chatbot. This is where you link your OpenAI-compatible API.
    *   **Options:**
        *   `url`
            *   **Description:** The URL of your OpenAI-compatible API (e.g., `https://api.openai.com/v1`).
            *   **Type:** String
            *   **Required:** No
        *   `key`
            *   **Description:** Your API key for authentication with the AI service.
            *   **Type:** String
            *   **Required:** No
        *   `model`
            *   **Description:** The specific AI model to use (e.g., `gpt-3.5-turbo`, `gpt-4`).
            *   **Type:** String
            *   **Required:** No
    *   **Usage:**
        ```sh
        /chatbot api url:https://api.openai.com/v1 key:YOUR_API_KEY model:gpt-3.5-turbo
        ```

*   `behavior`
    *   **Description:** Adjusts how the chatbot behaves in your server.
    *   **Options:**
        *   `chance`
            *   **Description:** The percentage chance (0-100) that the bot will respond to a message.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 0, Maximum 100.
        *   `require-mention`
            *   **Description:** If set to `True`, the bot will only respond when explicitly mentioned.
            *   **Type:** Boolean
            *   **Required:** No
        *   `cooldown`
            *   **Description:** The cooldown period in seconds (1-60) between bot responses in a channel.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 1, Maximum 60.
    *   **Usage:**
        ```sh
        /chatbot behavior chance:50 require-mention:True cooldown:10
        ```

*   `channels`
    *   **Description:** Manages which channels the chatbot is allowed or disallowed to respond in.
    *   **Options:**
        *   `mode`
            *   **Description:** Defines the channel restriction mode.
            *   **Type:** String
            *   **Required:** Yes
            *   **Choices:** `All Channels`, `Whitelist Only`, `Blacklist (Exclude)`
        *   `channel`
            *   **Description:** The specific channel to add or remove from the list.
            *   **Type:** Channel (Text Channel)
            *   **Required:** No
        *   `action`
            *   **Description:** The action to perform on the specified channel.
            *   **Type:** String
            *   **Required:** No
            *   **Choices:** `Add`, `Remove`, `Clear All`
    *   **Usage:**
        ```sh
        /chatbot channels mode:whitelist channel:#general action:add
        ```

*   `advanced`
    *   **Description:** Configures advanced AI parameters for fine-tuning the chatbot's responses.
    *   **Options:**
        *   `max-tokens`
            *   **Description:** The maximum number of tokens (words/characters) the AI will generate in a response.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 50, Maximum 4000.
        *   `temperature`
            *   **Description:** Controls the creativity and randomness of the AI's responses (0.0 for deterministic, 2.0 for highly creative).
            *   **Type:** Number
            *   **Required:** No
            *   **Constraints:** Minimum 0.0, Maximum 2.0.
        *   `max-length`
            *   **Description:** The maximum length of the bot's message response.
            *   **Type:** Integer
            *   **Required:** No
            *   **Constraints:** Minimum 100, Maximum 2000.
    *   **Usage:**
        ```sh
        /chatbot advanced max-tokens:500 temperature:0.7 max-length:1000
        ```

*   `prompt`
    *   **Description:** Sets the system prompt that guides the AI's overall behavior and personality.
    *   **Options:**
        *   `text`
            *   **Description:** The system prompt string to use.
            *   **Type:** String
            *   **Required:** Yes
    *   **Usage:**
        ```sh
        /chatbot prompt text:You are a helpful assistant.
        ```

*   `conversation`
    *   **Description:** Manages your personal conversation history with the chatbot.
    *   **Options:**
        *   `action`
            *   **Description:** The action to perform on your conversation history.
            *   **Type:** String
            *   **Required:** Yes
            *   **Choices:** `Clear My History`, `Show My History`
    *   **Usage:**
        ```sh
        /chatbot conversation action:clear
        ```

*   `test`
    *   **Description:** Tests the current API configuration to ensure the bot can connect to the AI service.
    *   **Usage:**
        ```sh
        /chatbot test
        ```

## Examples

```sh
# Enable the chatbot
/chatbot toggle enabled:True

# Set API key
/chatbot api key:sk-YOUR_SECRET_KEY

# Set response chance to 75%
/chatbot behavior chance:75

# Whitelist a channel
/chatbot channels mode:whitelist channel:#bot-chat action:add

# Set a custom system prompt
/chatbot prompt text:You are a friendly Discord bot that loves to tell jokes.

# Show your conversation history
/chatbot conversation action:show
```

## Related Advanced Guide Sections

*   [Chatbot Module](/advanced-guide/ai/chatbot_module)
*   [AI Configuration](/advanced-guide/ai/configuration)