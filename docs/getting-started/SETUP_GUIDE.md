# Complete Setup Guide

This guide will walk you through setting up your own Discord Music & AI Bot from start to finish.

## 🛠️ Requirements

### System Requirements
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Java 17+** (for Lavalink music server) - [Download here](https://adoptium.net/)
- **MongoDB Database** - [MongoDB Atlas (free)](https://www.mongodb.com/atlas) or local installation

### Discord Requirements
- Discord account with server admin permissions
- Ability to create Discord applications

---

## 📋 Step 1: Create Discord Application

1. **Go to Discord Developer Portal**
   - Visit [https://discord.com/developers/applications](https://discord.com/developers/applications)
   - Click "New Application" and give it a name

2. **Create Bot User**
   - Go to "Bot" section in left sidebar
   - Click "Add Bot"
   - Copy the bot token (keep this private!)

3. **Set Bot Permissions**
   - In the "Bot" section, enable these privileged intents:
     - ✅ Server Members Intent  
     - ✅ Message Content Intent
   - In "OAuth2 > URL Generator":
     - Select "bot" and "applications.commands"
     - Select these permissions:
       - Send Messages, Use Slash Commands, Connect, Speak
       - View Channels, Read Message History
       - Manage Messages, Manage Roles
       - View Audit Log (for moderation logging)

4. **Invite Bot to Server**
   - Use the generated URL to invite your bot
   - Make sure it has the necessary permissions

---

## 💾 Step 2: Database Setup

### Option A: MongoDB Atlas (Recommended - Free)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account and cluster
3. Create database user with read/write permissions
4. Get your connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/`)

### Option B: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Connection string: `mongodb://localhost:27017/discordbot`

---

## 💻 Step 3: Install Bot

1. **Download/Clone Bot Files**
   ```bash
   git clone <your-repository-url>
   cd discord-music-bot
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create Environment File**
   ```bash
   cp .env.example .env
   ```

4. **Configure Environment Variables**
   Edit `.env` file with your details:
   ```env
   # Discord
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_bot_client_id_here
   
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # Lavalink (Music Server)
   LAVALINK_HOST=localhost
   LAVALINK_PORT=2333
   LAVALINK_PASSWORD=your_lavalink_password_here
   
   # Optional: AI Chatbot
   OPENAI_API_KEY=your_openai_key_here
   ```

---

## 🎵 Step 4: Music Server Setup

The bot uses Lavalink for high-quality music playback.

1. **Download Lavalink**
   - Latest version is included in `lavalink/` folder
   - Or download from [GitHub](https://github.com/lavalink-devs/Lavalink/releases)

2. **Configure Lavalink**
   - The `lavalink/application.yml` file is pre-configured
   - Default password: `your_lavalink_password_here`

3. **Start Lavalink**
   ```bash
   cd lavalink
   java -jar Lavalink.jar
   ```
   
   Keep this running in a separate terminal!

---

## 🚀 Step 5: Start Your Bot

1. **Deploy Slash Commands**
   ```bash
   npm run deploy
   ```

2. **Start the Bot**
   ```bash
   npm start
   ```

3. **Verify It's Working**
   - Bot should appear online in Discord
   - Try `/help` command
   - Check console for any errors

---

## ⚙️ Step 6: Configure Your Server

### Set Up Music
```bash
/settings permissions dj-role @DJ     # Optional: Set DJ role
/settings music volume default:50 max:100  # Set volume limits
```

### Set Up AI Chatbot (Optional)
```bash
/chatbot api url:https://api.openai.com/v1 key:your-key model:gpt-3.5-turbo
/chatbot toggle enabled:true
/chatbot channels mode:whitelist       # Control which channels AI responds in
```

### Set Up Moderation Logging
```bash
/modlog setup #mod-logs               # Enable logging
/modlog configure                     # Choose which events to track
```

### Set Up AutoRole (Optional)
```bash
/autorole setup role:@Member delay:5  # Auto-assign role to new members
```

---

## 🔧 Advanced Configuration

### Production Deployment
- Use PM2 or similar process manager
- Set up reverse proxy (nginx) if using web dashboard
- Configure firewall rules
- Set up automated backups

### Performance Optimization
- Increase MongoDB connection pool
- Configure Lavalink for your server size
- Monitor resource usage

### Security Best Practices
- Keep bot token secure
- Use environment variables for all secrets
- Regularly update dependencies
- Monitor bot permissions

---

## 🆘 Troubleshooting

### Bot Won't Start
- ✅ Check Discord token is correct
- ✅ Verify MongoDB connection string
- ✅ Ensure all required permissions are granted
- ✅ Check Node.js version (18+ required)

### Music Not Working
- ✅ Ensure Lavalink is running (`java -jar Lavalink.jar`)
- ✅ Check Lavalink password in `.env` matches `application.yml`
- ✅ Verify bot has voice permissions

### Commands Not Appearing
- ✅ Run `npm run deploy` to register commands
- ✅ Wait a few minutes for Discord to update
- ✅ Check bot has "applications.commands" permission

### AI Chatbot Issues
- ✅ Verify API key is correct
- ✅ Check API endpoint URL
- ✅ Ensure bot has message content intent enabled

---

## 📞 Getting Help

- **Documentation**: Check other files in `docs/` folder
- **Test Suite**: Run `npm run validate` to test your setup
- **Community**: Join our Discord server [link]
- **Issues**: Report bugs on GitHub

---

**Next Steps**: Check out the [Feature Guides](FEATURES.md) to learn how to use all the bot's features!
