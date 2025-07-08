---
title: CODE_GUIDE_UTILS_TRANSCRIPTGENERATOR
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `TranscriptGenerator.js`
Generates transcripts of Discord channel messages in various formats.

*   **`TranscriptGenerator` (Class)**
    *   **Constructor:** `constructor()`
    *   **Methods:**
        *   **`ensureTranscriptDir()`**
            *   **Description:** Ensures the local directory for storing transcripts exists.
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Called in constructor)
        *   **`generateTranscript(ticket, channel, format)`**
            *   **Description:** Fetches all messages from a channel and formats them into a transcript.
            *   **Parameters:**
                *   `ticket` (Object): The ticket object associated with the channel.
                *   `channel` (Discord.js TextChannel)
                *   `format` (string): 'html', 'txt', or 'json'.
            *   **Returns:** `Promise<{file: AttachmentBuilder, content: string, filePath: string, fileName: string}>`
            *   **Usage:** `const transcript = await transcriptGenerator.generateTranscript(ticket, channel, 'html');`
        *   **`fetchAllMessages(channel)`**
            *   **Description:** Fetches all messages from a Discord channel, handling pagination.
            *   **Parameters:** `channel` (Discord.js TextChannel)
            *   **Returns:** `Promise<Array<Message>>`
            *   **Usage:** (Called internally by `generateTranscript`)
        *   **`formatTranscript(ticket, messages, format)`**
            *   **Description:** Dispatches to the appropriate formatting method based on the requested format.
            *   **Parameters:**
                *   `ticket` (Object)
                *   `messages` (Array<Message>)
                *   `format` (string)
            *   **Returns:** `Promise<string>`
            *   **Throws:** `Error` for unsupported formats.
            *   **Usage:** (Called internally by `generateTranscript`)
        *   **`formatHTML(ticket, messages)`**
            *   **Description:** Formats messages into an HTML transcript.
            *   **Parameters:**
                *   `ticket` (Object)
                *   `messages` (Array<Message>)
            *   **Returns:** `string`
            *   **Usage:** (Called internally by `formatTranscript`)
        *   **`formatHTMLMessage(message)`**
            *   **Description:** Formats a single Discord message into an HTML string.
            *   **Parameters:** `message` (Discord.js Message)
            *   **Returns:** `string`
            *   **Usage:** (Called internally by `formatHTML`)
        *   **`formatTXT(ticket, messages)`**
            *   **Description:** Formats messages into a plain text transcript.
            *   **Parameters:**
                *   `ticket` (Object)
                *   `messages` (Array<Message>)
            *   **Returns:** `string`
            *   **Usage:** (Called internally by `formatTranscript`)
        *   **`formatJSON(ticket, messages)`**
            *   **Description:** Formats messages into a JSON transcript.
            *   **Parameters:**
                *   `ticket` (Object)
                *   `messages` (Array<Message>)
            *   **Returns:** `string`
            *   **Usage:** (Called internally by `formatTranscript`)
        *   **`escapeHTML(text)`**
            *   **Description:** Escapes HTML special characters in a string.
            *   **Parameters:** `text` (string)
            *   **Returns:** `string`
            *   **Usage:** (Called internally by HTML formatting methods)
        *   **`cleanupOldTranscripts(daysOld)`**
            *   **Description:** Deletes transcript files older than a specified number of days from local storage.
            *   **Parameters:** `daysOld` (number, default: 30)
            *   **Returns:** `Promise<void>`
            *   **Usage:** (Can be called periodically)
