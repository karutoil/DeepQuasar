# Welcome & Leave System Documentation

## Overview
The Welcome & Leave System provides comprehensive user greeting and farewell functionality for Discord servers. It includes customizable welcome messages, leave messages, and optional DM welcomes with detailed user information.

## Features

### 🎉 Welcome Messages
- Customizable welcome messages when users join
- Rich embed support with user information
- Account age, join position, and inviter tracking
- Automatic message deletion after specified time
- User mention support

### 👋 Leave Messages  
- Customizable leave messages when users leave/are kicked
- User information including time spent in server
- Join date and account age tracking
- Automatic message deletion support

### 💌 DM Welcome
- Optional private welcome messages
- Server-specific customization
- Embed support with server branding

### 📊 Advanced User Information
- **Account Age**: Shows when the user created their Discord account
- **Join Position**: Shows what number member they are (#1, #2, etc.)
- **Inviter Tracking**: Shows who invited the user (if trackable)
- **Server Statistics**: Current member count, server info
- **User Details**: Username, display name, user ID, avatar
- **Time Tracking**: How long user was in server (leave messages)

## Setup Commands

### Basic Setup
```
/welcome setup welcome #channel-name [enabled] [message]
/welcome setup leave #channel-name [enabled] [message] 
/welcome setup dm [enabled] [message]
```

### Configuration
```
/welcome config welcome [embed] [color] [mention-user] [show-account-age] [show-join-position] [show-inviter] [delete-after]
/welcome config leave [embed] [color] [show-account-age] [show-join-date] [show-time-in-server] [delete-after]
```

### Management
```
/welcome status          # View current configuration
/welcome test [type]     # Test welcome/leave messages
/welcome placeholders   # View available placeholders
```

## Message Placeholders

### User Placeholders
- `{user.mention}` - @Username
- `{user.tag}` - Username#1234
- `{user.username}` - Username only
- `{user.displayName}` - Server display name
- `{user.id}` - User ID

### Server Placeholders
- `{guild.name}` - Server name
- `{guild.memberCount}` - Current member count
- `{guild.id}` - Server ID

### Invite Placeholders (Welcome Only)
- `{inviter.tag}` - Who invited the user
- `{inviter.mention}` - Mention who invited
- `{invite.code}` - Invite code used
- `{invite.uses}` - Times invite was used

## Example Messages

### Welcome Message
```
Welcome {user.mention} to **{guild.name}**! 🎉

You are our **{guild.memberCount}** member!
```

### Leave Message
```
👋 **{user.tag}** has left the server.

We now have **{guild.memberCount}** members.
```

### DM Welcome
```
Welcome to **{guild.name}**! 🎉

Thanks for joining our community!
```

## Configuration Options

### Welcome System
- **Enabled**: Turn welcome messages on/off
- **Channel**: Where to send welcome messages
- **Embed**: Use rich embed format
- **Color**: Embed color (hex format)
- **Mention User**: Tag the user in the message
- **Show Account Age**: Display when account was created
- **Show Join Position**: Show member number
- **Show Inviter**: Display who invited the user
- **Delete After**: Auto-delete after X seconds (0 = never)

### Leave System
- **Enabled**: Turn leave messages on/off
- **Channel**: Where to send leave messages
- **Embed**: Use rich embed format
- **Color**: Embed color (hex format)
- **Show Account Age**: Display account creation date
- **Show Join Date**: When user joined the server
- **Show Time in Server**: How long user was member
- **Delete After**: Auto-delete after X seconds (0 = never)

### DM Welcome
- **Enabled**: Send private welcome messages
- **Embed**: Use rich embed format
- **Color**: Embed color (hex format)

## Required Permissions

### Bot Permissions
- `Send Messages` - Send welcome/leave messages
- `Embed Links` - Send rich embeds
- `Manage Guild` - Track invites
- `View Audit Log` - Distinguish kicks from leaves

### User Permissions  
- `Manage Server` - Configure welcome system

## Technical Details

### Database Schema
The welcome system data is stored in the Guild schema under `welcomeSystem`:

```javascript
welcomeSystem: {
    welcome: {
        enabled: Boolean,
        channelId: String,
        message: String,
        embedEnabled: Boolean,
        embedColor: String,
        showAccountAge: Boolean,
        showJoinPosition: Boolean,
        showInviter: Boolean,
        deleteAfter: Number,
        mentionUser: Boolean
    },
    leave: {
        enabled: Boolean,
        channelId: String,
        message: String,
        embedEnabled: Boolean,
        embedColor: String,
        showAccountAge: Boolean,
        showJoinDate: Boolean,
        showTimeInServer: Boolean,
        deleteAfter: Number
    },
    dmWelcome: {
        enabled: Boolean,
        message: String,
        embedEnabled: Boolean,
        embedColor: String
    }
}
```

### Events Used
- `guildMemberAdd` - Triggers welcome messages
- `guildMemberRemove` - Triggers leave messages
- `inviteCreate` - Updates invite cache
- `inviteDelete` - Updates invite cache

### Invite Tracking
The system maintains an invite cache to track which invite was used:
- Cached on bot startup for all guilds
- Updated when invites are created/deleted
- Compares invite uses to determine which was used

## Troubleshooting

### Welcome messages not sending
1. Check if welcome system is enabled: `/welcome status`
2. Verify bot has permissions in target channel
3. Ensure channel still exists
4. Check bot has required intents: `GuildMembers`, `GuildInvites`

### Invite tracking not working
1. Bot needs `Manage Server` permission
2. Guild must have `GuildInvites` intent enabled
3. Invites created before bot joined may not be tracked

### Debug Commands
- `/debug-welcome` - Shows detailed system status
- `/welcome test` - Test message formatting
- `/create-guild-data` - Force create guild configuration

## Performance Notes
- Invite cache is stored in memory and rebuilt on restart
- Large servers may experience slight delay in invite tracking
- Auto-delete feature uses setTimeout (not persistent across restarts)

## Privacy Considerations
- User data shown is already public Discord information
- No personal data is stored in database
- Invite tracking only shows public invite information
- Users can disable DMs in their Discord settings
