# Discord Music & AI Bot

A modern, feature-rich Discord bot for music, AI chat, moderation, and server management. Built with Discord.js v14+, Lavalink V4, and MongoDB.

---

## Features

- **Music Playback:**
  - YouTube, Spotify, SoundCloud, playlists, direct URLs
  - Audio filters: bass, speed, nightcore, vaporwave, clear
  - Advanced queue: show, clear, shuffle, remove, move, loop, history
  - Loop modes: off, track, queue
  - Seek, pause, resume, skip, stop, volume (up to 200 for premium)
  - Per-guild music settings: default/max volume, queue size, playlist size, auto-shuffle, default source
- **AI Chatbot:**
  - OpenAI-compatible, Claude, local LLMs, custom personalities
  - Channel whitelist/blacklist, mention detection, response chance, cooldowns
  - `/ask` for direct chat, `/chatbot` for full config
- **Moderation & Logging:**
  - Modlog: setup, disable, status, configure, setchannel, toggle
  - 40+ event types: member, message, channel, role, guild, voice, invite, thread, emoji, sticker, etc.
  - Audit log integration, flexible routing
- **Server Settings:**
  - DJ role, allowed/restricted channels, command cooldowns, enable/disable commands
  - Reset all settings, view current config
- **AutoRole System:**
  - Automatically assign roles to new members
  - Configurable delay, bot bypass, verification requirements
  - Administrator-configurable settings
- **Premium:**
  - Larger queues (up to 500), higher volume (up to 200), advanced filters, reduced cooldowns, priority support
- **Web Dashboard (optional):**
  - GUI for server management
- **Comprehensive Logging:**
  - Command, error, music, and database logs

---

## Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/yourusername/discord-music-bot.git
   cd discord-music-bot
   npm install
   ```
2. **Configure**
   - Copy `.env.example` to `.env` and fill in your Discord, MongoDB, and Lavalink details
3. **Start Lavalink**
   ```bash
   cd lavalink
   java -jar Lavalink.jar
   ```
4. **Deploy Commands**
   ```bash
   npm run deploy
   ```
5. **Start the Bot**
   ```bash
   npm start
   ```

---

## Slash Commands

### Music
| Command                | Description                                 |
|------------------------|---------------------------------------------|
| `/play`                | Play a song, playlist, or URL               |
| `/queue show`          | Show current queue                          |
| `/queue clear`         | Clear the queue                             |
| `/queue shuffle`       | Shuffle the queue                           |
| `/queue remove`        | Remove a track by position                  |
| `/queue move`          | Move a track to a new position              |
| `/queue loop`          | Set loop mode for the queue                 |
| `/queue history`       | Show recently played tracks                 |
| `/pause`               | Pause or resume playback                    |
| `/resume`              | Resume paused music                         |
| `/skip`                | Skip current or multiple tracks             |
| `/stop`                | Stop music and clear the queue              |
| `/volume`              | Set or show playback volume                 |
| `/nowplaying`          | Show info about the current track           |
| `/seek`                | Seek to a position in the current track     |
| `/filters bass`        | Apply bass boost filter                     |
| `/filters speed`       | Change playback speed                       |
| `/filters nightcore`   | Apply nightcore effect                      |
| `/filters vaporwave`   | Apply vaporwave effect                      |
| `/filters clear`       | Clear all filters                           |

### AI Chatbot
| Command                | Description                                 |
|------------------------|---------------------------------------------|
| `/ask`                 | Direct AI chat                              |
| `/chatbot status`      | View chatbot config                         |
| `/chatbot toggle`      | Enable/disable chatbot                      |
| `/chatbot api`         | Set API URL/key/model                       |
| `/chatbot behavior`    | Set response chance/cooldown                |
| `/chatbot channels`    | Whitelist/blacklist channels                |
| `/chatbot prompt`      | Set AI personality                          |
| `/chatbot test`        | Test API connection                         |

### Moderation & Logging
| Command                | Description                                 |
|------------------------|---------------------------------------------|
| `/modlog setup`        | Enable modlog in a channel                  |
| `/modlog disable`      | Disable moderation logging                  |
| `/modlog status`       | View modlog config                          |
| `/modlog configure`    | Interactive event config                    |
| `/modlog setchannel`   | Set channel for specific event              |
| `/modlog toggle`       | Enable/disable specific event logging        |

### Server Settings
| Command                        | Description                         |
|---------------------------------|-------------------------------------|
| `/settings view`                | View current settings               |
| `/settings reset`               | Reset all settings to default       |
| `/settings music volume`        | Set default/max volume              |
| `/settings music queue`         | Set queue and playlist size, auto-shuffle |
| `/settings music source`        | Set default music source            |
| `/settings permissions dj-role` | Set DJ role                         |
| `/settings permissions channels`| Set allowed channels for music      |
| `/settings commands cooldown`   | Set command cooldown                |
| `/settings commands disable`    | Disable a command                   |
| `/settings commands enable`     | Enable a command                    |

### AutoRole System
| Command                | Description                         |
|------------------------|-------------------------------------|
| `/autorole setup`      | Configure automatic role assignment |
| `/autorole disable`    | Disable autorole system             |
| `/autorole status`     | View current autorole configuration |
| `/autorole test`       | Test autorole configuration        |

### Info
| Command      | Description                                                                 |
|--------------|----------------------------------------------------------------------------|
| `/help`      | Show help and info                                                          |
| `/stats`     | Show bot/server stats: total played songs, AI conversations, servers, users, supporters |

---

## Modules & Structure

- **src/commands/**: All slash commands (music, ai, settings, modlog, info)
- **src/events/**: Discord event handlers (message, interaction, modlog, etc.)
- **src/utils/**: Utilities (ChatBot, MusicPlayer, logger, etc.)
- **src/schemas/**: MongoDB schemas (Guild, User, ModLog)
- **lavalink/**: Lavalink server and plugins
- **test/**: Test scripts for all major features
- **docs/**: Full documentation for all modules and features

---

## Premium Features
- Larger queues (up to 500 tracks)
- Higher volume (up to 200)
- Advanced filters (nightcore, bassboost, etc.)
- Reduced cooldowns
- Priority support

---

## Documentation & Support
- Full docs: `docs/` folder
- Test suite: `test/` folder
- For help: `/help` command, GitHub Issues, or support email

---

**MIT License**

*Made with ❤️ for the Discord community*
