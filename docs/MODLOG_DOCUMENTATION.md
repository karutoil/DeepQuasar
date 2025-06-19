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
- Add custom conditions

## Troubleshooting

### Events Not Logging
1. Check if modlog is enabled: `/modlog status`
2. Verify the specific event is enabled
3. Ensure the bot has permissions in the log channel
4. Check if the default channel is set correctly

### Missing Audit Log Information
1. Verify the bot has "View Audit Log" permission
2. Audit log entries may not always be available immediately
3. Some actions may not generate audit log entries

### Performance Considerations
1. Disable high-frequency events like `presenceUpdate` if not needed
2. Consider using specific channels for different event types
3. Monitor database storage usage with large servers

## Event Details

Each logged event includes relevant information:

- **User Information**: Username, ID, avatar
- **Timestamps**: When the event occurred
- **Context**: Channel, server, or other relevant location
- **Changes**: Before/after values for updates
- **Audit Information**: Who performed the action (when available)
- **Additional Data**: Event-specific details

## Privacy and Security

- The system only logs events that occur in servers where it's enabled
- No private message content is logged
- Sensitive information is handled according to Discord's ToS
- Audit log access is used responsibly and only for logging purposes

---

For support or feature requests, please check the bot's documentation or contact the development team.
