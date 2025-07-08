---
title: CODE_GUIDE_UTILS_MUSICPLAYERMANAGER
sidebar:
  badge: ApiReference
---

## 3. Utilities (`src/utils/`)

### `MusicPlayerManager.js`
Manages Moonlink.js music players, including creation, searching, and common music operations.

*   **`MusicPlayerManager` (Class)**
    *   **Constructor:** `constructor(client)`
        *   **Parameters:** `client` (Discord.js Client instance)
    *   **Methods:**
        *   **`createPlayer(options)`**
            *   **Description:** Creates a new Moonlink player or retrieves an existing one for a guild.
            *   **Parameters:** `options` (Object): `{ guildId, voiceChannelId, textChannelId, autoPlay }`
            *   **Returns:** `Promise<Object>`: Moonlink player instance.
            *   **Usage:** `const player = await musicManager.createPlayer({ guildId: '...', voiceChannelId: '...', textChannelId: '...' });`
        *   **`getPlayer(guildId)`**
            *   **Description:** Retrieves an existing Moonlink player for a guild.
            *   **Parameters:** `guildId` (string)
            *   **Returns:** `Object | null`: Moonlink player instance or `null`.
            *   **Usage:** `const player = musicManager.getPlayer('123');`
        *   **`search(options)`**
            *   **Description:** Searches for tracks using Moonlink.
            *   **Parameters:** `options` (Object): `{ query, source, requester }`
            *   **Returns:** `Promise<Object>`: Search results object.
            *   **Usage:** `const results = await musicManager.search({ query: 'song', source: 'youtube' });`
        *   **`isURL(string)`**
            *   **Description:** Checks if a string is a valid URL.
            *   **Parameters:** `string` (string)
            *   **Returns:** `boolean`
            *   **Usage:** `if (musicManager.isURL('https://youtube.com')) { ... }`
        *   **`formatDuration(ms)`**
            *   **Description:** Formats duration from milliseconds to a readable `HH:MM:SS` or `MM:SS` format.
            *   **Parameters:** `ms` (number)
            *   **Returns:** `string`
            *   **Usage:** `musicManager.formatDuration(120000); // "02:00"`
        *   **`createNowPlayingEmbed(track, player)`**
            *   **Description:** Creates a Discord embed for the currently playing track.
            *   **Parameters:**
                *   `track` (Object): Moonlink track object.
                *   `player` (Object): Moonlink player object.
            *   **Returns:** `EmbedBuilder`
            *   **Usage:** `const embed = musicManager.createNowPlayingEmbed(player.current, player);`
        *   **`createQueueEmbed(player, page)`**
            *   **Description:** Creates a Discord embed displaying the music queue.
            *   **Parameters:**
                *   `player` (Object): Moonlink player object.
                *   `page` (number, default: 1)
            *   **Returns:** `EmbedBuilder`
            *   **Usage:** `const embed = musicManager.createQueueEmbed(player, 1);`
        *   **`getAllPlayers()`**
            *   **Description:** Retrieves a map of all active Moonlink players.
            *   **Returns:** `Map`
            *   **Usage:** `const players = musicManager.getAllPlayers();`
        *   **`getPlayerCount()`**
            *   **Description:** Returns the number of active Moonlink players.
            *   **Returns:** `number`
            *   **Usage:** `const count = musicManager.getPlayerCount();`
        *   **`destroyAllPlayers()`**
            *   **Description:** Destroys all active Moonlink players.
            *   **Returns:** `Promise<void>`
            *   **Usage:** `await musicManager.destroyAllPlayers();`
        *   **`isInSameVoiceChannel(member, player)`**
            *   **Description:** Checks if a member is in the same voice channel as the bot's player.
            *   **Parameters:**
                *   `member` (Discord.js GuildMember)
                *   `player` (Object): Moonlink player object.
            *   **Returns:** `boolean`
            *   **Usage:** `if (musicManager.isInSameVoiceChannel(member, player)) { ... }`
        *   **`isInVoiceChannel(member)`**
            *   **Description:** Checks if a member is in any voice channel.
            *   **Parameters:** `member` (Discord.js GuildMember)
            *   **Returns:** `boolean`
            *   **Usage:** `if (musicManager.isInVoiceChannel(member)) { ... }`
        *   **`getVoicePermissions(voiceChannel, botMember)`**
            *   **Description:** Retrieves the bot's permissions for a specific voice channel.
            *   **Parameters:**
                *   `voiceChannel` (Discord.js VoiceChannel)
                *   `botMember` (Discord.js GuildMember): The bot's member object in the guild.
            *   **Returns:** `Object`: `{ connect: boolean, speak: boolean, viewChannel: boolean }`
            *   **Usage:** `const perms = musicManager.getVoicePermissions(channel, guild.members.me);`
        *   **`convertSpotifyUrl(url)`**
            *   **Description:** (Basic implementation) Converts a Spotify URL. In a full implementation, this would involve Spotify API calls.
            *   **Parameters:** `url` (string)
            *   **Returns:** `string`
            *   **Usage:** `musicManager.convertSpotifyUrl('...');`
        *   **`playOrQueue(options)`**
            *   **Description:** Searches for tracks, creates/gets a player, and adds tracks to the queue, starting playback if not already playing.
            *   **Parameters:** `options` (Object): `{ guildId, voiceChannelId, textChannelId, query, source, requester }`
            *   **Returns:** `Promise<Object>`: Result with player and search result, or error.
            *   **Usage:** `const result = await musicManager.playOrQueue({ guildId: '...', voiceChannelId: '...', query: 'song' });`
