# Discord Music & AI Bot

A modern, feature-rich Discord bot perfect for any server. Play music, chat with AI, manage your community, and keep everything organized with comprehensive logging.

## ✨ Key Features

### 🎵 **Music System**
- **Multi-Platform Support**: YouTube, Spotify, SoundCloud, Apple Music, and direct URLs
- **Smart Queue Management**: Add, remove, shuffle, loop tracks and playlists  
- **Audio Enhancement**: Bass boost, speed control, nightcore, vaporwave effects
- **Premium Features**: Higher volume limits, larger queues, advanced filters

### 🤖 **AI Chatbot**  
- **Universal Compatibility**: Works with OpenAI, Claude, local LLMs, and other providers
- **Smart Responses**: Configurable response chance, mention detection
- **Channel Control**: Whitelist/blacklist specific channels
- **Direct Chat**: `/ask` command for instant AI conversations

### 🛡️ **Moderation & Logging**
- **Complete Coverage**: 40+ event types monitored
- **Flexible Setup**: Log different events to different channels
- **Rich Information**: Audit log integration with detailed embeds
- **Easy Management**: Simple commands to configure everything

### ⚙️ **Server Management**
- **Role Management**: AutoRole system for new members
- **Permission Control**: DJ roles, channel restrictions, command cooldowns
- **Customizable Settings**: Per-server configuration for all features
- **Content Creation**: Professional embed builder and message cleanup tools
- **Easy Reset**: Restore default settings anytime

## 🚀 Quick Setup (Self-Hosting)

### **Prerequisites**
- Node.js 18+ 
- MongoDB database
- Discord Application with Bot Token

### **Installation Steps**

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd discord-music-bot
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Discord token, MongoDB URL, etc.
   ```

3. **Start Lavalink (Music Server)**
   ```bash
   cd lavalink
   java -jar Lavalink.jar
   ```

4. **Deploy Commands & Start Bot**
   ```bash
   npm run deploy
   npm start
   ```

> **Need Help?** Check the [Setup Guide](docs/SETUP_GUIDE.md) for detailed instructions.

---

## 📋 Complete Command Reference

### 🎵 **Music Commands**
| Command | What It Does |
|---------|-------------|
| `/play <song>` | Play music from YouTube, Spotify, SoundCloud, or URLs |
| `/queue show` | Display current music queue with pagination |
| `/queue clear` | Clear the entire music queue |
| `/queue shuffle` | Randomize the order of queued songs |
| `/queue remove <position>` | Remove a specific track from queue |
| `/queue move <from> <to>` | Move a track to different position |
| `/queue loop <mode>` | Set loop mode (off/track/queue) |
| `/queue history` | Show recently played tracks |
| `/pause` | Pause current music playback |
| `/resume` | Resume paused music |
| `/skip [amount]` | Skip current song or multiple songs |
| `/stop` | Stop music and clear queue |
| `/volume [1-100]` | Set playback volume (premium: up to 200) |
| `/nowplaying` | Show detailed info about current track |
| `/seek <time>` | Jump to specific time in current song |
| `/search <query>` | Search for music without playing |

### 🎚️ **Audio Filters**
| Command | What It Does |
|---------|-------------|
| `/filters bass [level]` | Add bass boost effect |
| `/filters speed <multiplier>` | Change playback speed |
| `/filters nightcore` | Apply nightcore effect (high pitch + fast) |
| `/filters vaporwave` | Apply vaporwave effect (slow + deep) |
| `/filters clear` | Remove all audio effects |

### 🤖 **AI Chatbot Commands**  
| Command | What It Does |
|---------|-------------|
| `/ask <question>` | Ask the AI anything directly |
| `/chatbot toggle` | Enable/disable AI for your server |
| `/chatbot status` | View current AI configuration |
| `/chatbot api` | Configure AI service (OpenAI, Claude, etc.) |
| `/chatbot behavior` | Set response chance and cooldowns |
| `/chatbot channels` | Control which channels AI responds in |
| `/chatbot advanced` | Configure AI parameters (temperature, tokens) |
| `/chatbot prompt` | Set custom AI personality |
| `/chatbot test` | Test AI connection and setup |
| `/chatbot conversation` | Manage conversation history |

### 🛡️ **Moderation & Logging**
| Command | What It Does |
|---------|-------------|
| `/modlog setup <channel>` | Enable server event logging |
| `/modlog disable` | Turn off moderation logging |
| `/modlog status` | View current logging configuration |
| `/modlog configure` | Interactive event configuration menu |
| `/modlog setchannel <event> <channel>` | Route specific events to channels |
| `/modlog toggle <event>` | Enable/disable specific event types |

### 🧹 **Cleanup & Management**
| Command | What It Does |
|---------|-------------|
| `/cleanup user <user> [amount]` | Delete messages from specific user |
| `/cleanup amount <count>` | Delete a number of recent messages |
| `/cleanup bots [amount]` | Remove bot messages only |
| `/cleanup all <channel>` | ⚠️ Recreate channel (deletes ALL messages) |
| `/embed builder` | Create beautiful embed messages |

### 🎫 **Ticket System**
| Command | What It Does |
|---------|-------------|
| `/tickets setup` | Configure support ticket system |
| `/tickets config` | View ticket system status |
| `/tickets staff add/remove <role>` | Manage staff roles |
| `/tickets settings` | Configure ticket behavior |
| `/panel create <channel>` | Create ticket creation panel |
| `/ticket close` | Close current ticket |
| `/ticket add/remove <user>` | Manage ticket participants |

### 👥 **Role Management**
| Command | What It Does |
|---------|-------------|
| `/autorole setup <role>` | Auto-assign roles to new members |
| `/autorole disable` | Turn off automatic role assignment |
| `/autorole status` | View autorole configuration |
| `/autorole test` | Test autorole setup |
| `/selfrole create` | Create self-assignable role buttons |
| `/selfrole manage` | Manage existing self-role messages |
| `/selfrole settings` | Configure self-role behavior |

### 💬 **Welcome & Community**
| Command | What It Does |
|---------|-------------|
| `/welcome setup` | Configure welcome/leave messages |
| `/welcome disable` | Turn off welcome system |
| `/welcome test` | Test welcome message setup |

### ⚙️ **Server Settings**
| Command | What It Does |
|---------|-------------|
| `/settings view` | View all current bot settings |
| `/settings reset` | Reset all settings to defaults |
| `/settings music volume` | Set default/max volume limits |
| `/settings music queue` | Configure queue size limits |
| `/settings music source` | Set default music search platform |
| `/settings permissions dj-role` | Set DJ role for music control |
| `/settings permissions channels` | Restrict commands to specific channels |
| `/settings commands cooldown` | Set command usage cooldowns |
| `/settings commands disable/enable` | Turn commands on/off |

### 📊 **Information & Stats**
| Command | What It Does |
|---------|-------------|
| `/help [command]` | Get help with commands |
| `/stats` | View server and bot usage statistics |
| `/globalstats` | View bot statistics across all servers |
| `/linecount` | View bot code statistics (developer info) |

### 🔧 **Advanced & Debug**
| Command | What It Does |
|---------|-------------|
| `/templates` | Manage embed and message templates |
| `/fix-tickets` | Repair ticket system issues |
| `/debug-welcome` | Test welcome system (admin only) |

---

## 🎯 Perfect For Your Server

### **Community Servers**
- Keep members entertained with music and AI chat
- Track member activity with comprehensive logging
- Automatically welcome new members with roles

### **Gaming Communities**  
- Background music during gaming sessions
- AI assistant for game tips and general questions
- Voice channel activity monitoring

### **Study/Work Groups**
- Focus music and ambient sounds
- AI help with questions and explanations  
- Clean moderation logs for peaceful environment

### **Music Communities**
- High-quality audio with premium filters
- Support for all major music platforms
- Advanced queue management for music sessions

---

## 💝 Support & Links

- **Documentation**: [Complete Setup Guide](docs/SETUP_GUIDE.md) | [All Features](docs/FEATURES.md)
- **Premium**: [Upgrade for Enhanced Features](docs/PREMIUM.md) 
- **Support**: Join our [Discord Server](https://discord.gg/your-invite) or create an [Issue](https://github.com/yourusername/discord-music-bot/issues)
- **Community**: Check out the [FAQ](docs/FAQ.md) for common questions

---

**Made with ❤️ for Discord communities**  
*Licensed under MIT - Free to use and modify*
