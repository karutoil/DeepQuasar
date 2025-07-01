# Discord Music & AI Bot

A modern, feature-rich Discord bot perfect for any server. Play music, chat with AI, manage your community, and keep everything organized with comprehensive logging.

## ✨ Key Features

### 🎵 **Music System**
- **Multi-Platform Support**: YouTube, Spotify, SoundCloud, Apple Music, direct URLs, and playlists
- **Smart Queue Management**: Add, remove, shuffle, loop tracks and playlists
- **Audio Enhancement**: Bass boost, speed control, nightcore, vaporwave, 8D, karaoke, vibrato, tremolo, and more
- **History & Now Playing**: View play history, detailed now playing info, and queue display
- **Advanced Controls**: Seek, skip multiple, pause, resume, stop, volume (0-200)
- **Premium Features**: Higher volume limits, larger queues, advanced filters

### 🧠 **AI Chatbot**
- **Universal Compatibility**: Works with OpenAI, Claude, local LLMs, and other providers
- **Direct Chat**: `/ask` command for instant AI conversations
- **Smart Responses**: Configurable response chance, mention detection
- **Channel Control**: Whitelist/blacklist specific channels
- **Advanced Settings**: Custom prompts, temperature, max tokens, cooldowns, and more

### 🛡️ **Moderation & Logging**
- **Complete Coverage**: 40+ event types monitored
- **Flexible Setup**: Log different events to different channels
- **Rich Information**: Audit log integration with detailed embeds
- **Easy Management**: Simple commands to configure everything

### ⚙️ **Server Management**
- **AutoRole System**: Automatic role assignment for new members
- **Self-Role System**: Button-based role assignment with advanced options
- **Welcome & Leave System**: Customizable welcome/farewell messages, invite tracking, DM support
- **Ticket System**: Interactive panels, private channels, modal forms, auto-close, rate limiting, tagging, assignment, and more
- **Temporary Voice Channels (TempVC)**: Join-to-create, auto-delete, smart permissions, control panel, renaming, user limits, and more
- **Embed Builder**: Interactive, live preview, templates, and advanced customization
- **Cleanup System**: Advanced message and channel cleanup, user/bot filtering, safety confirmations
- **Permission Control**: DJ roles, channel restrictions, command cooldowns
- **Customizable Settings**: Per-server configuration for all features
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
   npm run deploy-commands
   npm start
   ```

---

## 📚 Documentation

- **[Setup Guide](docs/SETUP_GUIDE.md)**
- **[Feature Guide](docs/FEATURES.md)**
- **[FAQ](docs/FAQ.md)**
- **[Embed Builder](docs/EMBED_BUILDER.md)**
- **[Cleanup System](docs/CLEANUP_SYSTEM.md)**
- **[AI Chatbot](docs/CHATBOT_MODULE.md)**
- **[Modlog System](docs/MODLOG_DOCUMENTATION.md)**
- **[AutoRole System](docs/AUTOROLE_SYSTEM.md)**
- **[Welcome System](docs/WELCOME_SYSTEM.md)**
- **[Ticket System](docs/TICKET_SYSTEM_DOCUMENTATION.md)**
- **[Self-Role System](docs/SELFROLE_DOCUMENTATION.md)**
- **[TempVC System](docs/TEMPVC_SYSTEM.md)**
- **[Premium Features](docs/PREMIUM.md)**

---

## 🧪 Testing
See the `test/` folder for available tests and validation scripts.

## 💬 Support
For help, join our support Discord or open a GitHub issue.

---

*This README covers all major features and modules. For detailed usage, see the docs above.*
