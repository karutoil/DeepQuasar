---
title: CODE_GUIDE_UTILS_CHATBOT
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `ChatBot.js`
Manages AI chatbot interactions, including response logic, API calls, and conversation history.

*   **`ChatBot` (Singleton Instance)**
    *   **Description:** This module exports a singleton instance of the `ChatBot` class.
    *   **Methods:**
        *   **`shouldRespond(message, guildSettings)`**
            *   **Description:** Determines if the bot should respond to a given message based on various criteria (cooldowns, mentions, channel settings, etc.).
            *   **Parameters:**
                *   `message` (Discord.js Message)
                *   `guildSettings` (Object): Guild configuration from `Guild` schema.
            *   **Returns:** `Promise<boolean>`
            *   **Usage:** `if (await ChatBot.shouldRespond(message, guildData)) { ... }`
        *   **`isChannelAllowed(channelId, guildSettings)`**
            *   **Description:** Checks if a specific channel is allowed for chatbot responses based on whitelist/blacklist.
            *   **Parameters:**
                *   `channelId` (string)
                *   `guildSettings` (Object)
            *   **Returns:** `boolean`
            *   **Usage:** `if (ChatBot.isChannelAllowed('123', guildData)) { ... }`
        *   **`generateResponse(message, guildSettings)`**
            *   **Description:** Makes an API call to the configured AI service to generate a response.
            *   **Parameters:**
                *   `message` (Discord.js Message)
                *   `guildSettings` (Object)
            *   **Returns:** `Promise<string>`: The AI-generated response.
            *   **Usage:** `const response = await ChatBot.generateResponse(message, guildData);`
        *   **`processMessage(message)`**
            *   **Description:** The main entry point for processing incoming messages for chatbot responses. Handles all logic from checking eligibility to sending replies.
            *   **Parameters:** `message` (Discord.js Message)
            *   **Returns:** `Promise<void>`
            *   **Usage:** `ChatBot.processMessage(message);`
        *   **`testConnection(apiUrl, apiKey, model)`**
            *   **Description:** Tests the connection and authentication with the configured AI service.
            *   **Parameters:**
                *   `apiUrl` (string)
                *   `apiKey` (string)
                *   `model` (string)
            *   **Returns:** `Promise<Object>`: `{ success: boolean, response?: string, error?: string }`
            *   **Usage:** `const result = await ChatBot.testConnection('...', '...', '...');`
        *   **`cleanupCooldowns()`**
            *   **Description:** Cleans up expired cooldowns and conversation histories.
            *   **Returns:** `void`
            *   **Usage:** `ChatBot.cleanupCooldowns();` (typically called periodically)
        *   **`getConversationKey(userId, guildId)`**
            *   **Description:** Generates a unique key for storing conversation history.
            *   **Parameters:**
                *   `userId` (string)
                *   `guildId` (string)
            *   **Returns:** `string`
            *   **Usage:** `const key = ChatBot.getConversationKey('123', '456');`
        *   **`getConversationHistory(userId, guildId)`**
            *   **Description:** Retrieves the conversation history for a specific user in a guild.
            *   **Parameters:**
                *   `userId` (string)
                *   `guildId` (string)
            *   **Returns:** `Array<Object>`
            *   **Usage:** `const history = ChatBot.getConversationHistory('123', '456');`
        *   **`addToConversationHistory(userId, guildId, role, content, username)`**
            *   **Description:** Adds a message to the conversation history.
            *   **Parameters:**
                *   `userId` (string)
                *   `guildId` (string)
                *   `role` (string): 'user' or 'assistant'.
                *   `content` (string)
                *   `username` (string, optional): User's display name for user messages.
            *   **Returns:** `void`
            *   **Usage:** `ChatBot.addToConversationHistory('123', '456', 'user', 'Hello');`
        *   **`clearConversationHistory(userId, guildId)`**
            *   **Description:** Clears the entire conversation history for a user in a guild.
            *   **Parameters:**
                *   `userId` (string)
                *   `guildId` (string)
            *   **Returns:** `void`
            *   **Usage:** `ChatBot.clearConversationHistory('123', '456');`
        *   **`resetConversation(userId, guildId)`**
            *   **Description:** Resets the last message in the conversation history, effectively allowing a retry.
            *   **Parameters:**
                *   `userId` (string)
                *   `guildId` (string)
            *   **Returns:** `void`
            *   **Usage:** `ChatBot.resetConversation('123', '456');`
