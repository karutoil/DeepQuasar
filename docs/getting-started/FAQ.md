# Frequently Asked Questions

Common questions from server owners and bot hosters.

---

## 🤖 General Bot Questions

### **Q: Is this bot free to use?**
A: Yes! The bot is completely free and open-source. You can host it yourself or use our hosted version. Premium features are available for enhanced functionality.

### **Q: What platforms does the music bot support?**
A: YouTube, Spotify, SoundCloud, Apple Music, and direct audio file URLs. The bot can also play from playlists on these platforms.

### **Q: Can I customize the bot for my server?**
A: Absolutely! The bot has extensive per-server settings for everything from music volume to AI chatbot behavior. Use `/settings view` to see all options.

### **Q: How many servers can use the bot?**
A: There's no limit! The bot can be in as many servers as you want. Each server has its own independent configuration.

---

## 🎵 Music Questions

### **Q: Why isn't music playing?**
A: Common issues:
- Bot needs "Connect" and "Speak" permissions in voice channels
- Lavalink server must be running (for self-hosted)
- Check if a DJ role is required: `/settings view`

### **Q: Can I play music from Spotify directly?**
A: The bot searches for Spotify tracks on YouTube for playback due to Spotify's API limitations. Quality remains high and it usually finds the exact track.

### **Q: What's the maximum queue size?**
A: Default is 100 tracks, premium servers get up to 500. Admins can adjust this with `/settings music queue max-size`.

### **Q: Can I save playlists?**
A: Currently, the bot doesn't save playlists between sessions. However, you can play saved playlists from YouTube, Spotify, etc. using their URLs.

---

## 🤖 AI Chatbot Questions

### **Q: Which AI services are supported?**
A: OpenAI (GPT-3.5, GPT-4), Anthropic Claude, local AI servers (Ollama, LM Studio), and any OpenAI-compatible API.

### **Q: Do I need to pay for AI features?**
A: You need your own API key from AI providers. OpenAI has free tier options, and you can use completely free local AI models.

### **Q: Can I control where the AI responds?**
A: Yes! Use `/chatbot channels` to set up whitelists or blacklists for specific channels.

### **Q: How do I make the AI respond like a specific character?**
A: Use `/chatbot prompt` to set a custom personality. For example: "You are a helpful gaming assistant who loves retro games."

---

## 🛡️ Moderation Questions

### **Q: What events can be logged?**
A: 40+ events including member joins/leaves, message edits/deletes, role changes, voice activity, and more. See `/modlog configure` for the full list.

### **Q: Can different events go to different channels?**
A: Yes! Use `/modlog setchannel <event> #channel` to route specific events to different log channels.

### **Q: Does the bot store message content?**
A: No, the bot only logs metadata about events. It doesn't store actual message content for privacy.

---

## 🔧 Technical Questions

### **Q: What are the system requirements for hosting?**
A: 
- Node.js 18+
- Java 17+ (for Lavalink)
- MongoDB database
- ~512MB RAM minimum, 1GB+ recommended

### **Q: How do I update the bot?**
A: Pull the latest code, run `npm install` for new dependencies, then restart the bot. Check changelog for breaking changes.

### **Q: Can I run multiple instances?**
A: Yes, but each instance needs its own Discord application and bot token. They can share the same database.

### **Q: How do I backup my data?**
A: Export your MongoDB database regularly. Server settings, user data, and configurations are stored there.

---

## 🚀 Performance Questions

### **Q: How many users can the bot handle?**
A: Properly configured, the bot can handle thousands of users. Performance depends on your server specs and database setup.

### **Q: The bot is slow, how do I fix it?**
A: 
- Check your internet connection
- Verify MongoDB performance
- Ensure Lavalink has enough resources
- Monitor system resources (CPU, RAM)

### **Q: Can I use a CDN for better performance?**
A: Lavalink handles audio streaming efficiently. For web dashboards, yes, CDNs help with static assets.

---

## 🔒 Security Questions

### **Q: Is my data safe?**
A: The bot only stores necessary configuration data. Messages aren't logged, and user data is minimal. Keep your bot token secure.

### **Q: What permissions does the bot need?**
A: Minimum: Send Messages, Use Slash Commands, Connect, Speak. Optional: Manage Messages, Manage Roles, View Audit Log (for moderation features).

### **Q: Can I run the bot without admin permissions?**
A: Yes, but some features like moderation logging need specific permissions. The bot will work with basic permissions for music and AI features.

---

## 💰 Premium Questions

### **Q: What are premium features?**
A: Larger queues (500 vs 100), higher volume (200 vs 100), advanced audio filters, reduced cooldowns, and priority support.

### **Q: How do I get premium?**
A: Contact the bot developers or check the support server for premium upgrade options.

### **Q: Can I add premium features to my self-hosted bot?**
A: Some premium features can be enabled in self-hosted setups by modifying configuration files.

---

## 🆘 Troubleshooting

### **Q: Commands aren't working**
A: 
1. Check bot permissions
2. Verify commands are deployed: `npm run deploy`
3. Wait 5-10 minutes for Discord to update
4. Try the command in a different channel

### **Q: Bot keeps disconnecting**
A: 
- Check your internet connection
- Verify Discord token is correct
- Monitor console for error messages
- Ensure MongoDB connection is stable

### **Q: Features missing after update**
A: 
- Run `npm run deploy` to update slash commands
- Check if any breaking changes in update notes
- Verify environment variables are set correctly

---

## 📞 Still Need Help?

- **Documentation**: Check [Setup Guide](SETUP_GUIDE.md) and [Features Guide](FEATURES.md)
- **Test Your Setup**: Run `npm run validate` to check configuration
- **Community Support**: Join our Discord server
- **Bug Reports**: Submit issues on GitHub

---

**Can't find your question?** Ask in our support server or create a GitHub issue!
