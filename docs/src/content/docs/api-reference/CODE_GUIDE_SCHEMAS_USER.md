---
title: CODE_GUIDE_SCHEMAS_USER
sidebar:
  badge: ApiReference
---

## 2. Schemas (`src/schemas/`)

Mongoose schemas define the structure and behavior of data stored in MongoDB.

### `User.js`
Mongoose model for storing user-specific data, preferences, and statistics.

*   **`User` (Mongoose Model)**
    *   **Instance Methods:**
        *   **`isPremium()`**
            *   **Description:** Checks if the user has an active premium subscription.
            *   **Returns:** `boolean`
            *   **Usage:** `if (userData.isPremium()) { ... }`
        *   **`addToHistory(trackInfo, guildInfo)`**
            *   **Description:** Adds a track to the user's listening history.
            *   **Parameters:**
                *   `trackInfo` (Object): Details about the track.
                *   `guildInfo` (Object): Details about the guild where it was played.
            *   **Returns:** `void`
            *   **Usage:** `userData.addToHistory({ title: 'Song', uri: '...' }, { id: '...', name: '...' });`
        *   **`addToFavorites(type, item)`**
            *   **Description:** Adds an item (track, artist, album) to the user's favorites.
            *   **Parameters:**
                *   `type` (string): 'tracks', 'artists', or 'albums'.
                *   `item` (Object): The item to add.
            *   **Returns:** `boolean`: `true` if added, `false` if already exists.
            *   **Usage:** `userData.addToFavorites('tracks', { title: 'Song', uri: '...' });`
        *   **`removeFromFavorites(type, identifier)`**
            *   **Description:** Removes an item from the user's favorites.
            *   **Parameters:**
                *   `type` (string): 'tracks', 'artists', or 'albums'.
                *   `identifier` (string): Unique identifier for the item (e.g., track URI, artist name).
            *   **Returns:** `boolean`: `true` if removed, `false` if not found.
            *   **Usage:** `userData.removeFromFavorites('tracks', 'trackUri');`
        *   **`createPlaylist(name, tracks, options)`**
            *   **Description:** Creates a new personal playlist for the user.
            *   **Parameters:**
                *   `name` (string)
                *   `tracks` (Array<Object>, default: `[]`)
                *   `options` (Object, optional): `isPublic`, `description`.
            *   **Returns:** `Object`: The newly created playlist object.
            *   **Usage:** `const playlist = userData.createPlaylist('My Jams');`
        *   **`getPlaylist(name)`**
            *   **Description:** Retrieves a user's playlist by name (case-insensitive).
            *   **Parameters:** `name` (string)
            *   **Returns:** `Object | undefined`
            *   **Usage:** `const playlist = userData.getPlaylist('My Jams');`
        *   **`deletePlaylist(name)`**
            *   **Description:** Deletes a user's playlist by name (case-insensitive).
            *   **Parameters:** `name` (string)
            *   **Returns:** `boolean`: `true` if deleted, `false` if not found.
            *   **Usage:** `userData.deletePlaylist('My Jams');`
        *   **`getGuildSettings(guildId)`**
            *   **Description:** Retrieves or initializes user's settings specific to a guild.
            *   **Parameters:** `guildId` (string)
            *   **Returns:** `Object`: Guild-specific settings.
            *   **Usage:** `const settings = userData.getGuildSettings('12345');`
        *   **`updateGuildSettings(guildId, settings)`**
            *   **Description:** Updates user's settings for a specific guild.
            *   **Parameters:**
                *   `guildId` (string)
                *   `settings` (Object): Settings to update.
            *   **Returns:** `Object`: The updated guild settings object.
            *   **Usage:** `userData.updateGuildSettings('12345', { volume: 70 });`
    *   **Static Methods:**
        *   **`findByUserId(userId)`**
            *   **Description:** Finds a user's data by their ID.
            *   **Parameters:** `userId` (string)
            *   **Returns:** `Query<Document>`
            *   **Usage:** `const userData = await User.findByUserId('12345');`
        *   **`createDefault(userId, username, discriminator)`**
            *   **Description:** Creates a new user data entry with default settings.
            *   **Parameters:**
                *   `userId` (string)
                *   `username` (string)
                *   `discriminator` (string, default: '0')
            *   **Returns:** `Promise<Document>`
            *   **Usage:** `const newUser = await User.createDefault('12345', 'TestUser');`
        *   **`getPremiumUsers()`**
            *   **Description:** Retrieves all users with active premium subscriptions.
            *   **Returns:** `Query<Array<Document>>`
            *   **Usage:** `const premiumUsers = await User.getPremiumUsers();`
        *   **`getTopUsers(limit)`**
            *   **Description:** Retrieves top users based on songs played and listening time.
            *   **Parameters:** `limit` (number, default: 10)
            *   **Returns:** `Query<Array<Document>>`
            *   **Usage:** `const topUsers = await User.getTopUsers(3);`
