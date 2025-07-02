# Temporary Voice Channel System

A comprehensive temporary voice channel system that allows users to create their own private voice channels on demand.

## Features

### 🎙️ Core Functionality
- **Join-to-Create**: Users join a designated channel to automatically create their own temp VC
- **Auto-Delete**: Channels automatically delete when empty (configurable delay)
- **Smart Permissions**: Automatic permission management for channel owners
- **Control Panel**: Integrated text channel with management controls

### ⚙️ Channel Management
- **Rename Channels**: Custom naming with template support
- **User Limits**: Set maximum number of users (0-99)
- **Bitrate Control**: Adjust audio quality (server tier dependent)
- **Lock/Unlock**: Control who can join the channel
- **Hide/Unhide**: Control channel visibility
- **Region Selection**: Choose voice server region

### 👑 Ownership & Permissions
- **Channel Ownership**: Original creator becomes owner with full control
- **Transfer Ownership**: Transfer control to another user
- **Moderators**: Grant management permissions to trusted users
- **Allow/Block Lists**: Control specific user access
- **Kick Users**: Remove users from your channel

### 📝 Naming Templates
- **Custom Templates**: Create reusable naming patterns
- **Dynamic Placeholders**: Use user info, activity, time, etc.
- **Preview System**: Test templates before applying
- **Pre-built Templates**: Common patterns included by default

## Setup Guide

### 1. Basic Setup

```bash
# Set up the temp VC system
/tempvc setup join-channel:#Join-to-Create category:Temp-VCs log-channel:#temp-vc-logs

# Enable the system
/tempvc toggle enabled:True
```

### 2. Configure Settings

```bash
# Set default channel settings
/tempvc settings channel-name:"{user}'s Channel" user-limit:10 bitrate:64 locked:False hidden:False

# Configure advanced options
/tempvc advanced max-channels:2 cooldown:5 auto-delete:True delete-delay:2 control-panel:True panel-style:buttons
```

### 3. Set Permissions

```bash
# Allow everyone to create channels
/tempvc permissions mode:everyone

# Restrict to specific roles
/tempvc permissions mode:role role:@Members action:allow

# Blacklist specific users/roles
/tempvc permissions mode:everyone role:@Muted action:deny
```

## Available Commands

### Configuration Commands (Admin)
- `/tempvc setup` - Initial system setup
- `/tempvc toggle` - Enable/disable the system
- `/tempvc config` - View current configuration
- `/tempvc settings` - Configure default channel settings
- `/tempvc permissions` - Manage creation permissions
- `/tempvc advanced` - Configure advanced options

### Template Management (Admin)
- `/tempvc-templates list` - View all templates
- `/tempvc-templates add` - Create new template
- `/tempvc-templates remove` - Delete template
- `/tempvc-templates edit` - Modify existing template
- `/tempvc-templates preview` - Test template output
- `/tempvc-templates placeholders` - View available placeholders

### User Commands
- `/vc rename` - Rename your channel
- `/vc limit` - Set user limit
- `/vc bitrate` - Change audio quality
- `/vc lock` - Lock/unlock channel
- `/vc hide` - Hide/unhide channel
- `/vc transfer` - Transfer ownership
- `/vc allow` - Allow specific user
- `/vc deny` - Block specific user
- `/vc kick` - Remove user from channel
- `/vc info` - View channel information
- `/vc delete` - Delete your channel

### Management Commands
- `/tempvc-list all` - List all active channels
- `/tempvc-list mine` - List your channels
- `/tempvc-list user` - List user's channels
- `/tempvc-list cleanup` - Clean up inactive channels (Admin)
- `/tempvc-list stats` - View server statistics

## Control Panel

Each temp VC gets an integrated text channel with a control panel featuring:

### 📊 Channel Information
- Real-time member count and list
- Channel statistics and uptime
- Current settings display
- Peak member count tracking

### 🎛️ Control Buttons/Menu
- **Rename**: Change channel name
- **User Limit**: Set maximum users
- **Bitrate**: Adjust audio quality
- **Region**: Change voice region
- **Lock/Unlock**: Control access
- **Hide/Unhide**: Control visibility
- **Transfer**: Give ownership to another user
- **Delete**: Remove the channel

### 💬 Integrated Chat
- Text communication for voice channel members
- Permission sync with voice channel
- Automatic cleanup when voice channel is deleted

## Template System

### Available Placeholders
- `{user}` - User display name
- `{username}` - Username
- `{tag}` - Full user tag
- `{id}` - User ID
- `{activity}` - Current activity/game
- `{time}` - Current time
- `{date}` - Current date

### Example Templates
```
{user}'s Channel          → John's Channel
{user} | {activity}       → John | Gaming
🎮 {user}'s Game         → 🎮 John's Game
{username} - {time}       → john123 - 3:45:22 PM
🎵 {user}'s Music Room   → 🎵 John's Music Room
```

## Configuration Options

### Default Settings
- **Channel Name**: Template for new channels
- **User Limit**: Default maximum users (0 = unlimited)
- **Bitrate**: Default audio quality (8-384 kbps)
- **Locked**: Create channels locked by default
- **Hidden**: Create channels hidden by default
- **Region**: Default voice region

### Permission Settings
- **Who Can Create**: everyone, role, specific
- **Allowed Roles**: Roles that can create channels
- **Allowed Users**: Specific users that can create
- **Blacklisted Roles**: Roles blocked from creating
- **Blacklisted Users**: Users blocked from creating

### Advanced Settings
- **Max Channels Per User**: Limit simultaneous channels (1-10)
- **Creation Cooldown**: Minutes between creations (0-60)
- **Auto Delete**: Automatically delete empty channels
- **Delete Delay**: Minutes to wait before deletion (0-60)
- **Control Panel**: Send management interface
- **Panel Style**: buttons, select, both

## Database Schema

### TempVC Configuration
```javascript
{
  guildId: String,
  enabled: Boolean,
  joinToCreateChannelId: String,
  tempVCCategoryId: String,
  defaultSettings: {
    channelName: String,
    userLimit: Number,
    bitrate: Number,
    locked: Boolean,
    hidden: Boolean,
    region: String
  },
  autoDelete: {
    enabled: Boolean,
    delayMinutes: Number
  },
  permissions: {
    whoCanCreate: enum,
    allowedRoles: [String],
    allowedUsers: [String],
    blacklistedRoles: [String],
    blacklistedUsers: [String]
  },
  namingTemplates: [{
    name: String,
    template: String,
    description: String
  }],
  advanced: {
    maxChannelsPerUser: Number,
    cooldownMinutes: Number,
    requireBotPermissions: Boolean,
    logChannelId: String,
    sendControlPanel: Boolean,
    panelStyle: enum
  }
}
```

### TempVC Instance
```javascript
{
  guildId: String,
  channelId: String,
  ownerId: String,
  originalName: String,
  currentName: String,
  settings: {
    userLimit: Number,
    bitrate: Number,
    locked: Boolean,
    hidden: Boolean,
    region: String
  },
  permissions: {
    allowedUsers: [String],
    blockedUsers: [String],
    moderators: [String]
  },
  activity: {
    lastActive: Date,
    totalTimeActive: Number,
    memberCount: Number,
    peakMemberCount: Number
  },
  controlPanel: {
    messageId: String,
    channelId: String,
    enabled: Boolean
  }
}
```

## Required Permissions

### Bot Permissions
- **View Channels**: See channels in category
- **Manage Channels**: Create/delete temp VCs
- **Manage Roles**: Set channel permissions
- **Connect**: Join voice channels
- **Speak**: Use voice features
- **Move Members**: Kick users from channels
- **Send Messages**: Control panel functionality
- **Manage Messages**: Control panel management
- **Read Message History**: Control panel context

### Category Permissions
The bot needs full permissions in the temp VC category:
- View Channel
- Manage Channels
- Manage Roles
- Connect
- Speak
- Move Members

## Troubleshooting

### Common Issues

1. **Channels not creating**
   - Check bot has required permissions
   - Verify join channel and category are set
   - Ensure system is enabled

2. **Control panel not working**
   - Check bot can send messages in category
   - Verify control panel is enabled
   - Check button/menu interactions

3. **Permissions not working**
   - Verify bot role is above managed roles
   - Check category permission inheritance
   - Ensure bot has Manage Roles permission

4. **Auto-delete not working**
   - Check if auto-delete is enabled
   - Verify cleanup task is running
   - Check for permission errors in logs

### Performance Considerations

- Cleanup task runs every minute
- Control panel updates on member changes
- Database queries are indexed for performance
- Cooldowns prevent spam channel creation
- Maximum channels per user prevents abuse

## Integration

The temp VC system integrates seamlessly with existing bot features:

- **Modlog**: Voice events are logged if modlog is enabled
- **Permissions**: Respects server role hierarchy
- **Database**: Uses existing MongoDB connection
- **Event System**: Integrates with existing event handlers
- **Interaction System**: Uses existing interaction framework

## Support

For help with the temp VC system:
1. Check the configuration with `/tempvc config`
2. Review permissions in the category
3. Check bot logs for error messages
4. Verify database connectivity
5. Test with a simple setup first
