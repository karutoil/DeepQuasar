# Feature Guide for Server Owners

This guide explains how to use and configure all the bot's features for your Discord server.

---

## 🎵 Music System

### Basic Music Commands
- **`/play <song>`** - Play music from any platform
  - YouTube: `/play never gonna give you up`
  - Spotify: `/play https://open.spotify.com/track/...`
  - Playlists: `/play https://youtube.com/playlist?list=...`
  - Direct files: `/play https://example.com/song.mp3`

- **`/queue show`** - See what's playing and coming up
- **`/pause`** / **`/resume`** - Control playback
- **`/skip`** - Skip current song (or `/skip 3` to skip multiple)
- **`/volume 75`** - Set volume (1-100, premium: up to 200)

### Advanced Music Features
- **`/queue shuffle`** - Randomize your playlist
- **`/queue loop track`** - Repeat current song
- **`/queue loop queue`** - Repeat entire playlist
- **`/seek 1:30`** - Jump to specific time in song
- **`/nowplaying`** - Detailed info about current track

### Audio Filters
Transform your music with these effects:
- **`/filters bass 15`** - Add bass boost
- **`/filters speed 1.25`** - Speed up playback
- **`/filters nightcore`** - High-pitched, fast effect
- **`/filters vaporwave`** - Slow, deep effect
- **`/filters clear`** - Remove all effects

### Music Settings
Configure default behavior for your server:
```bash
/settings music volume default:50 max:100    # Set volume limits
/settings music queue max-size:100           # Limit queue size
/settings music source youtube               # Default search platform
/settings permissions dj-role @DJ            # Only DJs can control music
/settings permissions channels #music       # Restrict to music channels
```

---

## 🤖 AI Chatbot

### Quick Setup
1. **Get an API key** from OpenAI, Anthropic, or use local AI
2. **Configure the bot**:
   ```bash
   /chatbot api url:https://api.openai.com/v1 key:your-key model:gpt-3.5-turbo
   /chatbot toggle enabled:true
   ```

### Direct Chat
- **`/ask What's the weather like?`** - Ask anything directly
- **`/ask Explain quantum physics simply`** - Get explanations
- **`/ask Write a funny story about cats`** - Creative requests

### Automatic Responses
The AI can respond to regular messages in chat:
```bash
/chatbot behavior chance:25 require-mention:false cooldown:10
```
- **chance:25** - Responds to 25% of messages
- **require-mention:false** - Responds without @bot mention
- **cooldown:10** - 10 second delay between responses per user

### Channel Control
Choose where the AI can respond:
```bash
/chatbot channels mode:whitelist            # Only allowed channels
/chatbot channels add #general              # Add allowed channel
/chatbot channels add #ai-chat              # Add another channel

# OR

/chatbot channels mode:blacklist            # All channels except blocked
/chatbot channels add #serious-discussion   # Block this channel
```

### AI Personality
Customize how your AI responds:
```bash
/chatbot prompt You are a helpful gaming assistant who loves retro games and gives advice about gaming setups.
```

### Supported AI Services
- **OpenAI**: GPT-3.5, GPT-4 (`https://api.openai.com/v1`)
- **Anthropic Claude**: Via proxy or direct API
- **Local AI**: Ollama, LM Studio (`http://localhost:11434/v1`)
- **Other Services**: Groq, Together AI, any OpenAI-compatible API

---

## 🛡️ Moderation & Logging

### Quick Setup
```bash
/modlog setup #mod-logs                     # Start logging to this channel
/modlog configure                           # Interactive configuration menu
```

### What Gets Logged
The bot can track 40+ different events:

**Member Events**: Join, leave, kicks, bans, role changes, timeouts
**Message Events**: Deletions, edits, bulk deletes, reactions
**Channel Events**: Create, delete, modify, pin changes
**Voice Events**: Join/leave voice channels, mute/deafen
**Server Events**: Role changes, emoji/sticker updates, invite management

### Advanced Logging
Send different events to different channels:
```bash
/modlog setchannel member-join #welcome-logs
/modlog setchannel message-delete #message-logs
/modlog setchannel voice-update #voice-logs
```

Toggle specific events:
```bash
/modlog toggle member-join                  # Turn off join messages
/modlog toggle message-delete               # Turn off deletion logging
```

### Viewing Configuration
```bash
/modlog status                              # See current setup
```

---

## ⚙️ Server Management

### AutoRole System
Automatically assign roles to new members:
```bash
/autorole setup role:@Member delay:30       # Give @Member role after 30 seconds
/autorole setup role:@Verified verification:true  # Only to verified accounts
```

### Command Management
Control how commands work in your server:
```bash
/settings commands cooldown 5               # 5 second cooldown between commands
/settings commands disable play             # Disable music commands
/settings commands enable play              # Re-enable commands
```

### Permission System
Set up role-based permissions:
```bash
/settings permissions dj-role @DJ           # Only DJs can control music
/settings permissions channels #music      # Restrict music to certain channels
```

### Viewing & Resetting
```bash
/settings view                              # See all current settings
/settings reset                             # Reset everything to defaults
```

---

## 📊 Server Statistics

### Bot Usage Stats
```bash
/stats                                      # See server usage statistics
```

Shows:
- Total songs played
- AI conversations count  
- Most active users
- Popular commands
- Server ranking

---

## 🎁 Premium Features

Upgrade your server for enhanced capabilities:

### Premium Benefits
- **Larger Queues**: Up to 500 tracks vs 100
- **Higher Volume**: Up to 200 volume vs 100
- **Advanced Filters**: More audio effects
- **Reduced Cooldowns**: Faster command usage
- **Priority Support**: Direct help when needed

### How to Get Premium
Contact server admins or check `/help` for premium information.

---

## 🔧 Advanced Tips

### Creating Bot-Specific Channels
Set up dedicated channels for different features:
- `#music` - Music commands and queue
- `#ai-chat` - AI chatbot conversations  
- `#mod-logs` - Moderation logging
- `#bot-commands` - General bot usage

### Role Hierarchy
Set up roles properly for best experience:
1. **Bot Role** - High in hierarchy for permissions
2. **Admin Roles** - Can configure bot settings
3. **DJ Role** - Can control music
4. **Member Roles** - Basic bot usage

### Performance Optimization
- Use specific channels to reduce spam
- Set reasonable cooldowns
- Limit queue sizes for busy servers
- Use modlog selectively (don't log everything)

---

## 🎨 Content Creation Tools

### Embed Builder System
Create professional Discord embeds with an interactive interface:
- **`/embed builder`** - Launch the embed creation interface
- **Visual Editor**: Point-and-click interface with live preview
- **Rich Features**: Titles, descriptions, images, fields, colors, and more
- **Template System**: Save and reuse embed designs

**Perfect for**: Announcements, rules, welcome messages, information panels
**Learn More**: [Complete Embed Builder Guide](EMBED_BUILDER.md)

### Message Cleanup System  
Powerful message management and channel cleanup:
- **`/cleanup user <user>`** - Delete messages from specific users
- **`/cleanup amount <count>`** - Delete a number of recent messages
- **`/cleanup bots`** - Remove bot messages only
- **`/cleanup all <channel>`** - Complete channel reset (⚠️ destructive)

**Perfect for**: Spam removal, bot command cleanup, channel maintenance
**Learn More**: [Complete Cleanup System Guide](CLEANUP_SYSTEM.md)

---

## 🆘 Common Issues & Solutions

### "Bot not responding to commands"
- Check bot has necessary permissions
- Verify commands are enabled: `/settings view`
- Try in different channel

### "Music not playing"
- Ensure bot can connect to voice channel
- Check if DJ role is required
- Verify Lavalink server is running

### "AI not responding"
- Check API key is valid: `/chatbot test`
- Verify bot has message permissions
- Check channel isn't blacklisted

### "Modlog not working"
- Ensure bot has "View Audit Log" permission
- Check if events are enabled: `/modlog status`
- Verify log channel permissions

---

**Need more help?** Check the [Setup Guide](SETUP_GUIDE.md) or join our support server!
