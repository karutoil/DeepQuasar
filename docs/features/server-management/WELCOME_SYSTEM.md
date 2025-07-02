# Welcome & Leave System

A comprehensive welcome and leave message system for Discord bots with detailed user information, customizable messages, and advanced features.

## Features

### Welcome Messages
- 🎉 Rich embed welcome messages with user avatars
- 👤 Detailed user information (username, account age, join position)
- 💌 Invite tracking (who invited the user)
- 🎨 Customizable colors and messages
- ⏰ Auto-delete messages after specified time
- 📱 Optional DM welcome messages

### Leave Messages
- 👋 Farewell messages when users leave
- 📊 Server statistics (remaining member count)
- ⏱️ Time spent in server
- 📅 Join date information
- 🎨 Customizable colors and messages

### Advanced Features
- 🔧 Flexible placeholder system for messages
- ⚙️ Per-server configuration
- 🛡️ Permission-based command access
- 🧪 Test functionality for setup validation
- 📦 Database-driven configuration storage

## Commands

### Setup Commands

#### `/welcome setup welcome`
Set up welcome messages for new members.

**Options:**
- `channel` - Channel to send welcome messages (required)
- `enabled` - Enable/disable welcome messages (optional, default: true)
- `message` - Custom welcome message with placeholders (optional)

**Example:**
```
/welcome setup welcome channel:#welcome enabled:true message:Welcome {user.mention} to {guild.name}! 🎉
```

#### `/welcome setup leave`
Set up leave messages for departing members.

**Options:**
- `channel` - Channel to send leave messages (required)
- `enabled` - Enable/disable leave messages (optional, default: true)
- `message` - Custom leave message with placeholders (optional)

**Example:**
```
/welcome setup leave channel:#general enabled:true message:{user.tag} has left us. We now have {guild.memberCount} members.
```

#### `/welcome setup dm`
Configure DM welcome messages sent directly to new members.

**Options:**
- `enabled` - Enable/disable DM welcome messages (required)
- `message` - Custom DM message (optional)

**Example:**
```
/welcome setup dm enabled:true message:Welcome to {guild.name}! Thanks for joining!
```

### Configuration Commands

#### `/welcome config welcome`
Fine-tune welcome message appearance and behavior.

**Options:**
- `embed` - Use embed format (true/false)
- `color` - Embed color in hex format (e.g., #57F287)
- `mention-user` - Mention the user in messages (true/false)
- `show-account-age` - Display account creation date (true/false)
- `show-join-position` - Show member join position (true/false)
- `show-inviter` - Display who invited the user (true/false)
- `delete-after` - Auto-delete message after X seconds (0 = never)

#### `/welcome config leave`
Fine-tune leave message appearance and behavior.

**Options:**
- `embed` - Use embed format (true/false)
- `color` - Embed color in hex format (e.g., #ED4245)
- `show-account-age` - Display account creation date (true/false)
- `show-join-date` - Show when user joined server (true/false)
- `show-time-in-server` - Display time spent in server (true/false)
- `delete-after` - Auto-delete message after X seconds (0 = never)

### Utility Commands

#### `/welcome status`
View current welcome and leave system configuration.

#### `/welcome test`
Test welcome/leave messages with your own user account.

**Options:**
- `type` - Type of message to test (welcome/leave/dm)

#### `/welcome placeholders`
View all available message placeholders and examples.

## Message Placeholders

### User Placeholders
- `{user.mention}` - Mentions the user (@User)
- `{user.tag}` - Full username with discriminator (User#1234)
- `{user.username}` - Username only
- `{user.displayName}` - Display name in server
- `{user.id}` - User ID

### Server Placeholders
- `{guild.name}` - Server name
- `{guild.memberCount}` - Current member count
- `{guild.id}` - Server ID

### Invite Placeholders (Welcome only)
- `{inviter.tag}` - Who invited the user
- `{inviter.mention}` - Mention who invited
- `{invite.code}` - Invite code used
- `{invite.uses}` - Number of times invite was used

## Example Configurations

### Basic Welcome Setup
```
/welcome setup welcome channel:#welcome
/welcome config welcome embed:true color:#57F287 mention-user:true
```

### Advanced Welcome with Invite Tracking
```
/welcome setup welcome channel:#welcome message:Welcome {user.mention}! 🎉 Invited by {inviter.mention} using invite {invite.code}
/welcome config welcome show-inviter:true show-account-age:true show-join-position:true
```

### Leave Messages
```
/welcome setup leave channel:#general message:Goodbye {user.tag}! They were with us for {time.in.server}
/welcome config leave show-time-in-server:true show-join-date:true
```

### DM Welcome
```
/welcome setup dm enabled:true message:Welcome to {guild.name}! 🎉 Please read our rules and have fun!
```

## Permissions

- **Setup/Config Commands**: Requires `Manage Server` permission
- **Status/Test Commands**: Requires `Manage Server` permission
- **Bot Permissions**: Requires `Send Messages`, `Embed Links`, and `Read Message History`
- **Invite Tracking**: Requires `Manage Guild` permission for the bot

## Database Schema

The welcome system stores configuration in the Guild schema under `welcomeSystem`:

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

## Technical Implementation

### Files Structure
- `src/utils/WelcomeSystem.js` - Core welcome system logic
- `src/commands/settings/welcome.js` - Slash command interface
- `src/events/modlog/guildMemberAdd.js` - Member join event handler
- `src/events/modlog/guildMemberRemove.js` - Member leave event handler
- `src/events/inviteCreate.js` - Invite creation tracking
- `src/events/inviteDelete.js` - Invite deletion tracking
- `src/schemas/Guild.js` - Database schema (updated)

### Invite Tracking
The system maintains an in-memory cache of invites for each guild to track who invited new members. The cache is initialized on bot startup and updated when invites are created/deleted.

### Error Handling
- Graceful handling of missing permissions
- Fallback for users with DMs disabled
- Automatic cleanup of invalid configurations
- Comprehensive logging for debugging

## Troubleshooting

### Common Issues

1. **Welcome messages not sending**
   - Check bot permissions in the welcome channel
   - Verify the channel ID is correct
   - Ensure welcome system is enabled

2. **Invite tracking not working**
   - Bot needs `Manage Guild` permission
   - Invite cache needs to be initialized
   - Some invite types (widget, vanity) may not be trackable

3. **DM messages failing**
   - Users may have DMs disabled
   - This is normal behavior and not an error

4. **Embed colors not working**
   - Use proper hex format (#RRGGBB)
   - Colors must be 6-digit hex codes

### Debug Commands
Use `/welcome test` to validate your configuration and `/welcome status` to check current settings.
