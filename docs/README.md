# 📚 DeepQuasar Documentation

Welcome to the official documentation for DeepQuasar, a powerful and versatile Discord bot.  
Use the sections below to find the right guide for your needs.

---

# 1. 🚀 Already Hosted User Guides

These guides are for users who are **using the hosted version** of the bot (no self-hosting required).

## Quick Start & User Help

- **[Command Reference](./COMMANDS.md)**  
  Full list of bot commands, options, and usage examples.

- **[Features Overview](./getting-started/FEATURES.md)**  
  Detailed explanations of all bot features and how to use them.

- **[Frequently Asked Questions](./getting-started/FAQ.md)**  
  Answers to common questions and troubleshooting tips.

## Feature-Specific User Guides

- **[AI Chatbot Module](./features/CHATBOT_MODULE.md)**  
  How to interact with the AI chatbot and configure its behavior.

- **[Embed Builder](./features/content-creation/EMBED_BUILDER.md)**  
  Create beautiful Discord embeds with an interactive builder.

- **[Cleanup System](./features/content-creation/CLEANUP_SYSTEM.md)**  
  Manage and clean up messages in your server.

- **[ModLog System](./features/moderation/MODLOG_DOCUMENTATION.md)**  
  Track server events and moderation actions.

- **[AutoRole System](./features/server-management/AUTOROLE_SYSTEM.md)**  
  Automatically assign roles to new members.

- **[Self-Role System](./features/server-management/SELFROLE_DOCUMENTATION.md)**  
  Let users assign themselves roles with buttons.

- **[TempVC System](./features/server-management/TEMPVC_SYSTEM.md)**  
  Temporary voice channels that auto-delete when empty.

- **[Ticket System](./features/server-management/TICKET_SYSTEM_DOCUMENTATION.md)**  
  Full-featured support ticket system.

- **[Welcome System](./features/server-management/WELCOME_SYSTEM.md)**  
  Custom welcome and leave messages for new members.

- **[Welcome Custom Embeds Guide](./WELCOME_CUSTOM_EMBEDS_GUIDE.md)**  
  Quick start for building custom welcome/leave embeds.

- **[Ticket System Quick Start](./TICKET_QUICK_START.md)**  
  Fast setup for the ticket system.

- **[Premium Features](./other/PREMIUM.md)**  
  Learn about premium upgrades and benefits.

---

# 2. 🛠️ Self-Hosted Setup Guides

These guides are for users who want to **host the bot themselves**.  
All steps are clearly labeled and easy to follow.

---

## 📖 Self-Hosting Table of Contents

- [Complete Setup Guide](./getting-started/SETUP_GUIDE.md)
- [Feature Guide for Server Owners](./getting-started/FEATURES.md)
- [FAQ for Self-Hosting](./getting-started/FAQ.md)
- [Utils Documentation (for developers)](./UTILS_DOCUMENTATION.md)

---

## 🏗️ Complete Setup Guide

**File:** [`docs/getting-started/SETUP_GUIDE.md`](./getting-started/SETUP_GUIDE.md)

### 1. Requirements

- **Node.js 18+**: [Download](https://nodejs.org/)
- **Java 17+** (for Lavalink): [Download](https://adoptium.net/)
- **MongoDB**: [MongoDB Atlas (free)](https://www.mongodb.com/atlas) or local install
- **Discord Account**: With server admin permissions

### 2. Create Discord Application

- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Create a new application and bot user
- Copy your bot token (keep it private!)
- Enable required intents and permissions

### 3. Configure OAuth2 & Permissions

- Use the OAuth2 URL Generator to select:
  - `bot`, `applications.commands`
  - Permissions: Send Messages, Use Slash Commands, Connect, Speak, Manage Roles, etc.

### 4. Clone & Install

- Clone the repository
- Install dependencies:  
  ```bash
  npm install
  ```
- Set up your `.env` file with your bot token and MongoDB URI

### 5. Start the Bot

- Start the bot:  
  ```bash
  npm start
  ```
- (Optional) Set up Lavalink for music features

### 6. Troubleshooting

- See the [FAQ](./getting-started/FAQ.md) for common issues

---

## 📝 Feature Guide for Server Owners

**File:** [`docs/getting-started/FEATURES.md`](./getting-started/FEATURES.md)

- Explains all bot features and how to configure them for your server
- Includes music, moderation, AI, ticketing, autorole, selfrole, and more

---

## ❓ FAQ for Self-Hosting

**File:** [`docs/getting-started/FAQ.md`](./getting-started/FAQ.md)

- Answers to common self-hosting questions
- Troubleshooting for music, permissions, and setup

---

## 🧰 Utils Documentation (for Developers)

**File:** [`docs/UTILS_DOCUMENTATION.md`](./UTILS_DOCUMENTATION.md)

- Detailed overview of utility classes and functions for bot development

---

# 3. 📂 Additional Documentation

- **[COMMANDS.md](./COMMANDS.md)**: Full command list and options
- **[WELCOME_CUSTOM_EMBEDS_GUIDE.md](./WELCOME_CUSTOM_EMBEDS_GUIDE.md)**: Custom embed builder for welcome/leave messages
- **[TICKET_QUICK_START.md](./TICKET_QUICK_START.md)**: Fast ticket system setup
- **[PREMIUM.md](./other/PREMIUM)**: Premium features and pricing

---

## 📑 Notes

- All guides are available in the `/docs` directory.
- For the latest updates, always check the README files and feature guides.
- If you need help, refer to the FAQ or open an issue on the project repository.

---

**This structure ensures users can easily find the right documentation for their needs, whether using the hosted bot or self-hosting. All self-hosted setup steps are now clearly labeled and organized for a smooth experience.**