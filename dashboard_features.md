# DeepQuasar Dashboard Features & API Endpoints

This document outlines the features available in the DeepQuasar web dashboard and what API endpoint would need to be created.

## General Settings

- **Prefix Configuration**: Change the bot's command prefix.
  - `PATCH /api/guilds/{guildId}/settings`
- **Language Selection**: Set the default language for bot responses.
  - `PATCH /api/guilds/{guildId}/settings`
- **Timezone**: Configure the server's timezone for logs and reminders.
  - `PATCH /api/guilds/{guildId}/settings`
- **Dashboard Access**: Manage permissions for who can access and modify settings in the dashboard.
  - `GET /api/guilds/{guildId}/dashboard-access`
  - `POST /api/guilds/{guildId}/dashboard-access`
  - `DELETE /api/guilds/{guildId}/dashboard-access/{roleOrUserId}`

## Module-Specific Settings

### 🧠 AI Module

- **AI Chatbot**: Enable or disable the AI chatbot.
  - `PATCH /api/guilds/{guildId}/ai/settings`
- **Chatbot Personality**: Customize the AI's personality and response style.
  - `PATCH /api/guilds/{guildId}/ai/settings`
- **Channel Whitelist**: Restrict the AI chatbot to specific channels.
  - `GET /api/guilds/{guildId}/ai/whitelist`
  - `POST /api/guilds/{guildId}/ai/whitelist`
  - `DELETE /api/guilds/{guildId}/ai/whitelist/{channelId}`

### 🛡️ Moderation Module

- **ModLog Channel**: Set the channel for moderation logs.
  - `PATCH /api/guilds/{guildId}/moderation/settings`
- **Punishment Configuration**: Customize actions for kicks, bans, and mutes.
  - `PATCH /api/guilds/{guildId}/moderation/settings`
- **Automated Moderation**:
    - **Profanity Filter**: Enable and configure the profanity filter.
      - `GET /api/guilds/{guildId}/moderation/profanity`
      - `PATCH /api/guilds/{guildId}/moderation/profanity`
    - **Anti-Raid**: Configure automatic actions to take during a raid.
      - `GET /api/guilds/{guildId}/moderation/anti-raid`
      - `PATCH /api/guilds/{guildId}/moderation/anti-raid`
- **User Management**:
    - **View User History**: See a user's moderation history.
      - `GET /api/guilds/{guildId}/users/{userId}/moderation-history`
    - **Issue Punishments**: Manually issue punishments to users.
      - `POST /api/guilds/{guildId}/moderation/punishments`

### 🎵 Music Module

- **Music Controls**: Play, pause, skip, and stop music from the dashboard.
  - `POST /api/guilds/{guildId}/music/player/play`
  - `POST /api/guilds/{guildId}/music/player/pause`
  - `POST /api/guilds/{guildId}/music/player/skip`
  - `POST /api/guilds/{guildId}/music/player/stop`
- **Queue Management**: View and manage the music queue.
  - `GET /api/guilds/{guildId}/music/queue`
  - `DELETE /api/guilds/{guildId}/music/queue/{trackPosition}`
- **Volume Control**: Adjust the music volume.
  - `PUT /api/guilds/{guildId}/music/player/volume`
- **DJ Roles**: Assign roles that have permission to manage the music player.
  - `GET /api/guilds/{guildId}/music/settings`
  - `PATCH /api/guilds/{guildId}/music/settings`

### 🎟️ Ticket System

- **Ticket Configuration**:
    - **Ticket Category**: Set the category where ticket channels are created.
      - `PATCH /api/guilds/{guildId}/tickets/settings`
    - **Support Roles**: Assign roles that can manage tickets.
      - `PATCH /api/guilds/{guildId}/tickets/settings`
- **Ticket Management**:
    - **View Open Tickets**: See a list of all open tickets.
      - `GET /api/guilds/{guildId}/tickets`
    - **Close Tickets**: Close tickets from the dashboard.
      - `POST /api/guilds/{guildId}/tickets/{ticketId}/close`
    - **Transcripts**: View and download ticket transcripts.
      - `GET /api/guilds/{guildId}/tickets/{ticketId}/transcript`

### 👋 Welcome System

- **Welcome Messages**:
    - **Enable/Disable**: Turn the welcome system on or off.
      - `PATCH /api/guilds/{guildId}/welcome/settings`
    - **Welcome Channel**: Set the channel for welcome messages.
      - `PATCH /api/guilds/{guildId}/welcome/settings`
    - **Message Content**: Customize the welcome message with variables like username, server name, etc.
      - `PATCH /api/guilds/{guildId}/welcome/settings`
- **Welcome Embeds**: Create and customize welcome message embeds.
  - `GET /api/guilds/{guildId}/welcome/embeds`
  - `POST /api/guilds/{guildId}/welcome/embeds`
  - `PUT /api/guilds/{guildId}/welcome/embeds/{embedId}`
  - `DELETE /api/guilds/{guildId}/welcome/embeds/{embedId}`

### 롤 AutoRole & SelfRole

- **AutoRole**:
    - **Assign Roles**: Automatically assign roles to new members.
      - `GET /api/guilds/{guildId}/autorole/settings`
      - `PATCH /api/guilds/{guildId}/autorole/settings`
- **SelfRole**:
    - **Role Menus**: Create and manage menus that allow users to self-assign roles.
      - `GET /api/guilds/{guildId}/selfrole/menus`
      - `POST /api/guilds/{guildId}/selfrole/menus`
      - `PUT /api/guilds/{guildId}/selfrole/menus/{menuId}`
      - `DELETE /api/guilds/{guildId}/selfrole/menus/{menuId}`

###  TEMP VC - Temporary Voice Channels

- **TempVC Category**: Set the category for temporary voice channels.
  - `PATCH /api/guilds/{guildId}/tempvc/settings`
- **Channel Configuration**: Configure the naming scheme and user limits for temporary channels.
  - `PATCH /api/guilds/{guildId}/tempvc/settings`

### ⏰ Reminders

- **View Reminders**: See a list of all active reminders for the server.
  - `GET /api/guilds/{guildId}/reminders`
- **Manage Reminders**: Add, edit, or delete reminders.
  - `POST /api/guilds/{guildId}/reminders`
  - `PUT /api/guilds/{guildId}/reminders/{reminderId}`
  - `DELETE /api/guilds/{guildId}/reminders/{reminderId}`

### 🎮 LFG (Looking for Group)

- **LFG Channel**: Set the channel for LFG posts.
  - `PATCH /api/guilds/{guildId}/lfg/settings`
- **Game List**: Manage the list of games that users can create LFG posts for.
  - `GET /api/guilds/{guildId}/lfg/games`
  - `POST /api/guilds/{guildId}/lfg/games`
  - `DELETE /api/guilds/{guildId}/lfg/games/{gameName}`
