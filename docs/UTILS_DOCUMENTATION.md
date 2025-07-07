
# Utils Documentation

This document provides a detailed overview of the reusable utility classes and functions available in the DeepQuasar bot. The purpose of this documentation is to streamline development by preventing the recreation of existing functionalities.

## Table of Contents

- [Utils Class (`src/utils/utils.js`)](#utils-class-srcutilsutilsjs)
  - [Embed Creation](#embed-creation)
  - [Formatting](#formatting)
  - [Music Utilities](#music-utilities)
  - [Pagination](#pagination)
  - [Permissions & Cooldowns](#permissions--cooldowns)
  - [Data Management](#data-management)
  - [Voice Channel Utilities](#voice-channel-utilities)
  - [Miscellaneous](#miscellaneous)
- [Manager Classes](#manager-classes)
  - [AutoRoleManager (`src/utils/AutoRoleManager.js`)](#autorolemanager-srcutilsautorolemanagerjs)
  - [ChatBot (`src/utils/ChatBot.js`)](#chatbot-srcutilschatbotjs)
  - [ModLogManager (`src/utils/ModLogManager.js`)](#modlogmanager-srcutilsmodlogmanagerjs)
  - [MusicPlayerManager (`src/utils/MusicPlayerManager.js`)](#musicplayermanager-srcutilsmusicplayermanagerjs)
  - [SelfRoleManager (`src/utils/SelfRoleManager.js`)](#selfrolemanager-srcutilsselfrolemanagerjs)
  - [TempVCManager (`src/utils/TempVCManager.js`)](#tempvcmanager-srcutilstempvcmanagerjs)
  - [TicketManager (`src/utils/TicketManager.js`)](#ticketmanager-srcutilsticketmanagerjs)
  - [TranscriptGenerator (`src/utils/TranscriptGenerator.js`)](#transcriptgenerator-srcutilstranscriptgeneratorjs)
- [Logger (`src/utils/logger.js`)](#logger-srcutilsloggerjs)

---

## Utils Class (`src/utils/utils.js`)

The `Utils` class is a collection of static methods providing common functionalities used throughout the bot.

### Embed Creation

- **`createEmbed(options)`**: Creates a standardized embed.
  - `options`: An object with properties like `color`, `title`, `description`, etc.
- **`createSuccessEmbed(title, description)`**: Creates a success-themed embed.
- **`createErrorEmbed(title, description)`**: Creates an error-themed embed.
- **`createWarningEmbed(title, description)`**: Creates a warning-themed embed.
- **`createInfoEmbed(title, description)`**: Creates an info-themed embed.
- **`createMusicEmbed(title, description, thumbnail)`**: Creates a music-themed embed.

<details>
<summary>Usage Example</summary>

```javascript
const Utils = require('../utils/utils');

// Inside a command execute function
const successEmbed = Utils.createSuccessEmbed('Success!', 'The operation was completed successfully.');
interaction.reply({ embeds: [successEmbed] });

const customEmbed = Utils.createEmbed({
    title: 'Custom Embed',
    description: 'This is a custom embed with a blue color.',
    color: 0x3498DB,
    footer: { text: 'My Bot' }
});
interaction.followUp({ embeds: [customEmbed] });
```
</details>

### Formatting

- **`formatDuration(ms)`**: Formats milliseconds into a `HH:MM:SS` or `MM:SS` string.
- **`formatBytes(bytes, decimals)`**: Formats bytes into a human-readable string (KB, MB, GB, etc.).
- **`truncate(text, length)`**: Truncates text to a specified length.
- **`capitalize(text)`**: Capitalizes the first letter of each word in a string.
- **`timeAgo(date)`**: Formats a date into a "time ago" string (e.g., "2 hours ago").

<details>
<summary>Usage Example</summary>

```javascript
const duration = Utils.formatDuration(125000); // "2:05"
const memory = Utils.formatBytes(process.memoryUsage().rss); // "123.45 MB"
const truncated = Utils.truncate('This is a very long text.', 20); // "This is a very..."
const capitalized = Utils.capitalize('hello world'); // "Hello World"
const time = Utils.timeAgo(new Date(Date.now() - 3600000)); // "1 hour ago"
```
</details>

### Music Utilities

- **`getSourceEmoji(source)`**: Returns an emoji for a given music source (YouTube, Spotify, etc.).
- **`parseSearchQuery(query)`**: Parses a search query to extract source and filters.

<details>
<summary>Usage Example</summary>

```javascript
const emoji = Utils.getSourceEmoji('youtube'); // "🎥"
const searchQuery = Utils.parseSearchQuery('yt:Never Gonna Give You Up');
// searchQuery will be: { query: 'Never Gonna Give You Up', source: 'youtube', ... }
```
</details>

### Pagination

- **`createPaginationButtons(currentPage, totalPages)`**: Creates a `ActionRowBuilder` with pagination buttons (First, Previous, Next, Last).

<details>
<summary>Usage Example</summary>

```javascript
const pages = ['Page 1', 'Page 2', 'Page 3'];
let currentPage = 0;

const row = Utils.createPaginationButtons(currentPage, pages.length);
interaction.reply({ content: pages[currentPage], components: [row] });
```
</details>

### Permissions & Cooldowns

- **`checkPermissions(interaction, requiredPermissions)`**: Checks if a user has the required Discord permissions.
- **`checkCooldown(client, userId, commandName, cooldownTime)`**: Manages command cooldowns for users.
- **`isBotOwner(interaction)`**: Checks if the user is a bot owner.
- **`isServerOwner(interaction)`**: Checks if the user is the server owner.

<details>
<summary>Usage Example</summary>

```javascript
// In a command that requires Administrator permission
const permCheck = await Utils.checkPermissions(interaction, ['Administrator']);
if (!permCheck.hasPermission) {
    return interaction.reply({ content: permCheck.reason, ephemeral: true });
}

// In a command with a 5-second cooldown
const cooldown = Utils.checkCooldown(interaction.client, interaction.user.id, interaction.commandName, 5000);
if (cooldown.onCooldown) {
    return interaction.reply({ content: `You are on cooldown for ${cooldown.timeLeft}s.`, ephemeral: true });
}
```
</details>

### Data Management

- **`getGuildData(guildId, guildName)`**: Retrieves or creates guild data from the database.
- **`getUserData(userId, username, discriminator)`**: Retrieves or creates user data from the database.

<details>
<summary>Usage Example</summary>

```javascript
// Get guild settings
const guildData = await Utils.getGuildData(interaction.guild.id, interaction.guild.name);
if (guildData.someSetting.enabled) {
    // Do something
}
```
</details>

### Voice Channel Utilities

- **`checkVoiceChannel(member)`**: Checks if a member is in a voice channel.
- **`checkBotVoicePermissions(voiceChannel)`**: Checks if the bot has permissions to join and speak in a voice channel.

<details>
<summary>Usage Example</summary>

```javascript
// In a music command
const voiceCheck = Utils.checkVoiceChannel(interaction.member);
if (!voiceCheck.inVoice) {
    return interaction.reply({ content: voiceCheck.reason, ephemeral: true });
}
```
</details>

### Miscellaneous

- **`generateRandomString(length)`**: Generates a random alphanumeric string.
- **`isValidUrl(string)`**: Validates if a string is a valid URL.
- **`parseTimeString(timeString)`**: Parses a time string (e.g., "1m30s") into milliseconds.

<details>
<summary>Usage Example</summary>

```javascript
const randomId = Utils.generateRandomString(8);
const isValid = Utils.isValidUrl('https://google.com'); // true
const timeMs = Utils.parseTimeString('2m30s'); // 150000
```
</details>

---

## Manager Classes

These classes manage specific features of the bot. They are typically instantiated once in the main bot file (`index.js`) and attached to the `client` object.

### AutoRoleManager (`src/utils/AutoRoleManager.js`)

- **`handleMemberJoin(member)`**: Assigns a role to a new member based on guild settings.
- **`handleMemberUpdate(oldMember, newMember)`**: Handles changes in member verification status.
- **`testConfiguration(guild)`**: Tests the autorole configuration for a guild.

<details>
<summary>Usage Example</summary>

```javascript
// In your main bot file (e.g., index.js)
const AutoRoleManager = require('./utils/AutoRoleManager');
client.autoRoleManager = new AutoRoleManager(client);

// In your guildMemberAdd event handler
client.on('guildMemberAdd', member => {
    client.autoRoleManager.handleMemberJoin(member);
});
```
</details>

### ChatBot (`src/utils/ChatBot.js`)

- **`processMessage(message)`**: Processes a message and generates an AI response if applicable.
- **`testConnection(apiUrl, apiKey, model)`**: Tests the connection to the AI service.

<details>
<summary>Usage Example</summary>

```javascript
// In your main bot file (e.g., index.js)
const chatBot = require('./utils/ChatBot');
// No instantiation needed as it's a singleton

// In your messageCreate event handler
client.on('messageCreate', message => {
    if (message.guild) {
        chatBot.processMessage(message);
    }
});
```
</details>

### ModLogManager (`src/utils/ModLogManager.js`)

- **`logEvent(guild, eventType, embedOptions, executor)`**: Logs moderation events to the designated channel.
- **`getAuditLogEntry(guild, type, target)`**: Fetches an audit log entry for a specific event.

<details>
<summary>Usage Example</summary>

```javascript
// In your guildBanAdd event handler
const ModLogManager = require('../utils/ModLogManager');

client.on('guildBanAdd', async ban => {
    const auditLogEntry = await ModLogManager.getAuditLogEntry(ban.guild, 'MEMBER_BAN_ADD', ban.user);
    const executor = auditLogEntry ? auditLogEntry.executor : 'Unknown';

    ModLogManager.logEvent(
        ban.guild,
        'memberBan',
        {
            title: 'User Banned',
            description: `**User:** ${ban.user.tag}
**Reason:** ${ban.reason || 'Not specified'}`
        },
        executor
    );
});
```
</details>

### MusicPlayerManager (`src/utils/MusicPlayerManager.js`)

- **`createPlayer(options)`**: Creates or retrieves a music player for a guild.
- **`search(options)`**: Searches for tracks using Moonlink.
- **`playOrQueue(options)`**: Searches for tracks and adds them to the queue, creating a player if necessary.
- **`createNowPlayingEmbed(track, player)`**: Creates an embed for the currently playing track.
- **`createQueueEmbed(player, page)`**: Creates an embed for the music queue.

<details>
<summary>Usage Example</summary>

```javascript
// In your main bot file (e.g., index.js)
const MusicPlayerManager = require('./utils/MusicPlayerManager');
client.musicManager = new MusicPlayerManager(client);

// In a 'play' command
const { query } = interaction.options;
const result = await client.musicManager.playOrQueue({
    guildId: interaction.guild.id,
    voiceChannelId: interaction.member.voice.channel.id,
    textChannelId: interaction.channel.id,
    query: query,
    requester: interaction.user.id
});

if (result.error) {
    return interaction.reply({ content: `Error: ${result.error}` });
}
```
</details>

### SelfRoleManager (`src/utils/SelfRoleManager.js`)

- **`createSelfRoleMessage(guildId, channelId, data)`**: Creates a new self-role message with buttons.
- **`updateSelfRoleMessage(selfRoleData)`**: Updates an existing self-role message.
- **`deleteSelfRoleMessage(messageId)`**: Deletes a self-role message and its configuration.
- **`cleanupInvalidRoles(guildId)`**: Removes roles from self-role configurations that no longer exist in the guild.

<details>
<summary>Usage Example</summary>

```javascript
// In your main bot file (e.g., index.js)
const SelfRoleManager = require('./utils/SelfRoleManager');
client.selfRoleManager = new SelfRoleManager(client);

// In a command to create a self-role panel
const data = {
    title: 'Choose Your Roles',
    description: 'Click the buttons to get your roles!',
    roles: [
        { roleId: 'ROLE_ID_1', label: 'Role 1', emoji: '🔴', style: 'Primary' },
        { roleId: 'ROLE_ID_2', label: 'Role 2', emoji: '🟢', style: 'Success' }
    ],
    createdBy: interaction.user.id
};
await client.selfRoleManager.createSelfRoleMessage(interaction.guild.id, interaction.channel.id, data);
```
</details>

### TempVCManager (`src/utils/TempVCManager.js`)

- **`handleVoiceStateUpdate(oldState, newState)`**: Manages the creation and deletion of temporary voice channels.
- **`createTempChannel(member, config)`**: Creates a new temporary voice channel for a user.
- **`deleteTempChannel(instance)`**: Deletes a temporary voice channel.
- **`createControlPanel(instance, channel)`**: Creates a control panel for managing a temporary voice channel.

<details>
<summary>Usage Example</summary>

```javascript
// In your main bot file (e.g., index.js)
const TempVCManager = require('./utils/TempVCManager');
client.tempVCManager = new TempVCManager(client);

// In your voiceStateUpdate event handler
client.on('voiceStateUpdate', (oldState, newState) => {
    client.tempVCManager.handleVoiceStateUpdate(oldState, newState);
});
```
</details>

### TicketManager (`src/utils/TicketManager.js`)

- **`createPanel(guild, channel, options)`**: Creates a ticket panel with buttons to open new tickets.
- **`handleTicketButton(interaction)`**: Handles the interaction when a user clicks a "create ticket" button.
- **`createTicket(interaction, ticketType, responses, config)`**: Creates a new ticket channel and database entry.
- **`handleTicketAction(interaction)`**: Handles actions within a ticket channel (close, assign, etc.).

<details>
<summary>Usage Example</summary>

```javascript
// In your main bot file (e.g., index.js)
const TicketManager = require('./utils/TicketManager');
client.ticketManager = new TicketManager(client);

// In a command to create a ticket panel
await client.ticketManager.createPanel(interaction.guild, interaction.channel, {
    title: 'Support Center',
    description: 'Please select a category to open a ticket.'
});

// In your interactionCreate event handler
client.on('interactionCreate', interaction => {
    if (interaction.isButton() && interaction.customId.startsWith('ticket_create_')) {
        client.ticketManager.handleTicketButton(interaction);
    }
});
```
</details>

### TranscriptGenerator (`src/utils/TranscriptGenerator.js`)

- **`generateTranscript(ticket, channel, format)`**: Generates a transcript of a ticket channel in HTML, TXT, or JSON format.

<details>
<summary>Usage Example</summary>

```javascript
// In a command to generate a transcript
const TranscriptGenerator = require('../utils/TranscriptGenerator');
const transcriptGenerator = new TranscriptGenerator();

const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
if (ticket) {
    const transcript = await transcriptGenerator.generateTranscript(ticket, interaction.channel, 'html');
    interaction.reply({ files: [transcript.file] });
}
```
</details>

---

## Logger (`src/utils/logger.js`)

The logger utility uses `winston` to provide structured and leveled logging. It is a singleton and can be required directly.

- **`logger.info(message)`**: Logs informational messages.
- **`logger.warn(message)`**: Logs warnings.
- **`logger.error(message)`**: Logs errors, including stack traces.
- **`logger.debug(message)`**: Logs debug information.
- **`logger.command(user, guild, command, args)`**: Logs command executions.
- **`logger.music(action, details)`**: Logs music-related actions.
- **`logger.database(action, details)`**: Logs database operations.
- **`logger.lavalink(event, details)`**: Logs Lavalink events.

<details>
<summary>Usage Example</summary>

```javascript
const logger = require('../utils/logger');

logger.info('Bot is starting up...');

try {
    // some risky operation
} catch (error) {
    logger.error('An unexpected error occurred:', error);
}

// In a command handler
logger.command(interaction.user, interaction.guild, interaction.commandName, interaction.options.data);
```
</details>
