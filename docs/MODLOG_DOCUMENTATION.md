# Discord Bot Moderation Logging System

A comprehensive moderation logging system that tracks and logs all Discord server events in detailed, customizable embeds.

## Features

- **47 Different Event Types**: Covers all major Discord events including member, message, channel, role, guild, voice, and more
- **Per-Guild Configuration**: Each server has its own modlog settings stored in MongoDB
- **Granular Control**: Enable/disable individual event types or all at once
- **Flexible Channel Routing**: Set a default channel or specific channels for different event types
- **Rich Embeds**: Beautiful, detailed embeds with relevant information and audit log data
- **Audit Log Integration**: Automatically fetches audit log information to show who performed actions
- **Permission Checking**: Respects Discord permissions and bot capabilities

## Supported Events

### Member Events
- **Member Join**: When a user joins the server
- **Member Leave**: When a user leaves the server
- **Member Kick**: When a user is kicked (detected via audit logs)
- **Member Ban**: When a user is banned
- **Member Unban**: When a user is unbanned
- **Member Update**: Nickname changes, role changes, timeout changes
- **Member Timeout**: When a user is timed out

### Message Events
- **Message Delete**: When a message is deleted
- **Message Update**: When a message is edited
- **Message Bulk Delete**: When multiple messages are deleted at once
- **Message Reaction Add**: When a reaction is added to a message
- **Message Reaction Remove**: When a reaction is removed from a message

### Channel Events
- **Channel Create**: When a channel is created
- **Channel Delete**: When a channel is deleted
- **Channel Update**: When channel settings are changed
- **Channel Pins Update**: When messages are pinned/unpinned

### Role Events
- **Role Create**: When a role is created
- **Role Delete**: When a role is deleted
- **Role Update**: When role settings, permissions, or position changes

### Guild Events
- **Guild Update**: When server settings change
- **Emoji Create/Delete/Update**: When custom emojis are managed
- **Sticker Create/Delete/Update**: When custom stickers are managed

### Voice Events
- **Voice State Update**: Join/leave voice channels, mute/deafen, streaming, etc.

### Other Events
- **User Update**: When a user changes their profile (username, avatar, etc.)
- **Presence Update**: When a user's status changes (disabled by default)
- **Invite Create/Delete**: When invites are created or deleted
- **Thread Create/Delete/Update**: When threads are managed
- **Integration Create/Delete/Update**: When integrations are managed
- **Webhook Update**: When webhooks are updated
- **Stage Instance Events**: When stage channels are used
- **Scheduled Event Events**: When server events are managed

## Commands

### `/modlog setup <channel>`
- Enables moderation logging and sets the default channel
- All events will be logged to this channel unless overridden
- Requires `Manage Server` permission

### `/modlog disable`
- Disables moderation logging for the server
- Does not delete existing configuration
- Requires `Manage Server` permission

### `/modlog status`
- Shows current modlog configuration
- Displays enabled/disabled status and event counts by category
- Shows default channel setting

### `/modlog configure`
- Interactive configuration interface
- Allows browsing event categories and toggling individual events
- Provides a user-friendly way to customize settings

### `/modlog setchannel <event> [channel]`
- Sets a specific channel for an event type
- Leave channel empty to use the default channel
- Supports autocomplete for event types

### `/modlog toggle <event>`
- Toggle a specific event type on or off
- Supports autocomplete for event types

## Setup Instructions

1. **Install the Module**: The modlog system is included in your bot files
2. **Deploy Commands**: Run `npm run deploy` to register the slash commands
3. **Enable Logging**: Use `/modlog setup #channel` in your Discord server
4. **Configure Events**: Use `/modlog configure` to customize which events to log
5. **Set Permissions**: Ensure the bot has permissions to read audit logs and send messages in log channels

## Required Permissions

The bot needs the following permissions to function properly:

- **View Audit Log**: To track who performed actions
- **Send Messages**: To send log messages
- **Embed Links**: To send rich embeds
- **Read Message History**: To access message content for logging
- **View Channels**: To access channels for logging

## Database Schema

The modlog settings are stored in the `ModLog` collection with the following structure:

```javascript
{
  guildId: String,           // Discord server ID
  enabled: Boolean,          // Master enable/disable
  defaultChannel: String,    // Default channel ID
  events: {
    eventName: {
      enabled: Boolean,      // Event enabled/disabled
      channel: String        // Specific channel (optional)
    }
  }
}
```

## Customization

### Adding New Events

1. Create a new event handler in `src/events/modlog/`
2. Add the event type to `ModLogManager.colors` and `ModLogManager.emojis`
3. Add the event to the schema in `src/schemas/ModLog.js`
4. Update the command autocomplete and category mappings

### Modifying Embed Appearance

Edit the `ModLogManager` class in `src/utils/ModLogManager.js`:
- Change colors in the `colors` object
- Modify emojis in the `emojis` object
- Adjust embed formatting in the `logEvent` method

### Event Filtering

You can add custom filtering logic in individual event handlers:
- Skip certain users (e.g., other bots)
- Filter by channel types
## Configuration Examples

### Basic Server Setup
```bash
/modlog setup #mod-logs                    # Enable logging
/modlog configure                          # Use interactive menu to choose events
```

### Advanced Multi-Channel Setup
```bash
/modlog setup #general-logs                # Set default channel
/modlog setchannel member-join #welcome    # Join messages to welcome channel
/modlog setchannel member-leave #welcome   # Leave messages to welcome channel  
/modlog setchannel message-delete #message-logs  # Deleted messages separately
/modlog setchannel voice-update #voice-logs      # Voice activity separately
```

### Event Category Recommendations

**Small Servers (< 100 members)**
- Enable: Member events, message events, role events
- Skip: Voice events (can be noisy), presence updates

**Medium Servers (100-1000 members)**  
- Enable: Member events, message events, channel events
- Separate: Voice events to dedicated channel
- Skip: Presence updates, reaction events

**Large Servers (1000+ members)**
- Enable: Critical events only (bans, kicks, bulk deletes)
- Separate: Different event types to different channels
- Skip: High-frequency events (voice, presence, reactions)

## Troubleshooting

### **Events Not Logging**
1. Check status: `/modlog status`
2. Verify bot has "Send Messages" permission in log channel
3. Ensure specific event is enabled
4. Check if bot has required permissions for the event type

### **Missing Audit Log Info**
1. Bot needs "View Audit Log" permission
2. Some events may not have audit log entries
3. Audit logs may take a few seconds to appear

### **Too Many Logs/Spam**
1. Disable high-frequency events: `/modlog toggle presence-update`
2. Use separate channels for chatty events
3. Consider disabling reaction logging in active servers

### **Logs Not Detailed Enough**
1. Ensure bot has proper permissions to see full event data
2. Some information may be limited by Discord's API
3. Check if audit log permissions are granted

## Best Practices

### Channel Organization
- **#mod-logs** - General moderation events
- **#member-logs** - Joins, leaves, role changes
- **#message-logs** - Message edits, deletions
- **#voice-logs** - Voice channel activity

### Permission Setup
Required bot permissions:
- ✅ Send Messages (in log channels)
- ✅ View Audit Log (for detailed info)
- ✅ View Channels (to see events)
- ✅ Read Message History (for message events)

### Storage Considerations
- Modlogs can generate lots of data in active servers
- Consider periodic cleanup of old logs
- Monitor your MongoDB storage usage

### Privacy Respect
- The bot only logs metadata, not message content
- Sensitive actions are logged responsibly
- Configure logging to respect your community's privacy needs

---

*For technical implementation details, refer to the source code in `src/events/` and `src/commands/settings/modlog.js`*
