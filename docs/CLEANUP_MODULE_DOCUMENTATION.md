# Message Cleanup Module Documentation

## Overview

The Message Cleanup module provides powerful moderation tools for Discord server administrators to clean up messages in channels. This module requires the `Manage Messages` permission and offers several cleanup options to help maintain clean and organized channels.

## Features

- **User-specific cleanup**: Remove messages from a specific user
- **Bulk message cleanup**: Delete a specified number of messages
- **Complete channel cleanup**: Remove all messages from a channel (with confirmation)
- **Bot message cleanup**: Remove messages from bots only
- **Permission validation**: Ensures proper permissions before execution
- **Safety measures**: Built-in safeguards and confirmation requirements

## Commands

### `/cleanup user`
Delete messages from a specific user.

**Options:**
- `user` (required): The user whose messages to delete
- `amount` (optional): Number of messages to delete (1-100, default: 50)
- `channel` (optional): Channel to clean (defaults to current channel)

**Example:**
```
/cleanup user user:@ProblematicUser amount:25 channel:#general
```

### `/cleanup amount`
Delete a specific number of messages from a channel.

**Options:**
- `count` (required): Number of messages to delete (1-100)
- `channel` (optional): Channel to clean (defaults to current channel)

**Example:**
```
/cleanup amount count:50 channel:#spam
```

### `/cleanup all`
Recreate channel to remove ALL messages completely (requires Manage Channels permission).

**Options:**
- `channel` (required): Channel to completely clean by recreation
- `confirm` (required): Must be set to `True` to proceed

**How it works:**
- Creates an exact copy of the target channel (preserving all settings)
- Deletes the original channel
- Much more efficient than deleting messages individually
- Bypasses Discord's 14-day message deletion limit

**Example:**
```
/cleanup all channel:#temp-chat confirm:True
```

**Important:** This recreates the entire channel - all message history will be permanently lost!

### `/cleanup bots`
Delete messages from bots only.

**Options:**
- `amount` (optional): Number of bot messages to delete (1-100, default: 50)
- `channel` (optional): Channel to clean (defaults to current channel)

**Example:**
```
/cleanup bots amount:30 channel:#bot-commands
```

## Required Permissions

### User Permissions
- **Manage Messages**: Required to use any cleanup command

### Bot Permissions
The bot needs the following permissions in the target channel:
- **View Channel**: To access the channel
- **Read Message History**: To fetch messages for deletion (user, amount, bots commands)
- **Manage Messages**: To delete messages (user, amount, bots commands)
- **Manage Channels**: To recreate channels (all command only)

## Important Limitations

### Discord API Limitations
- **14-day limit**: Messages older than 14 days cannot be bulk deleted
- **Single message deletion**: Messages older than 14 days must be deleted individually
- **Rate limits**: Large cleanup operations may take time due to Discord's rate limits

### Safety Features
- **Confirmation required**: The `/cleanup all` command requires explicit confirmation
- **Permission checks**: All commands verify bot permissions before execution
- **Error handling**: Comprehensive error handling with user-friendly messages
- **Ephemeral responses**: Command responses are private to the user

## Usage Examples

### Clean up spam from a user
```
/cleanup user user:@SpammerUser amount:100
```

### Remove the last 25 messages
```
/cleanup amount count:25
```

### Clean bot messages in current channel
```
/cleanup bots amount:20
```

### Completely clean a temporary channel
```
/cleanup all channel:#temp-events confirm:True
```

## Error Handling

The module handles various error scenarios:

### Permission Errors
- Missing `Manage Messages` permission for the user
- Missing bot permissions in the target channel
- Insufficient access to the specified channel

### Message Deletion Errors
- Messages older than 14 days
- Already deleted messages
- Network timeouts during bulk operations

### Invalid Parameters
- Invalid user or channel specifications
- Out-of-range message counts
- Missing required confirmations

## Best Practices

### Before Using Cleanup Commands
1. **Backup important messages**: Consider saving important content before cleanup
2. **Verify target channel**: Double-check you're cleaning the correct channel
3. **Start small**: Use smaller amounts first to test behavior
4. **Inform users**: Let channel members know about planned cleanups

### Security Considerations
1. **Restrict permissions**: Only give `Manage Messages` to trusted moderators
2. **Monitor usage**: Keep track of who uses cleanup commands
3. **Use confirmation**: Always confirm before using `/cleanup all`
4. **Test in private**: Test commands in private channels first

### Performance Tips
1. **Smaller batches**: For large cleanups, use multiple smaller operations
2. **Peak hours**: Avoid large cleanups during high server activity
3. **Rate limits**: Allow time between large cleanup operations

## Troubleshooting

### Common Issues

**"Missing Permissions" Error**
- Ensure the bot has required permissions in the target channel
- Check that you have `Manage Messages` permission
- Verify channel-specific permission overrides

**"No Messages Found" Error**
- Messages may be older than 14 days
- The specified user may not have recent messages
- Check if messages were already deleted

**"Cleanup Failed" Error**
- Network issues or Discord API problems
- Try again with a smaller batch size
- Check server status and connectivity

### Support

If you encounter issues with the cleanup module:
1. Check bot permissions in the target channel
2. Verify your own permissions
3. Try with a smaller message count
4. Check Discord's status for API issues

## Security Notes

- This module permanently deletes messages and cannot be undone
- Use with caution, especially the `/cleanup all` command
- Consider logging cleanup activities for audit purposes
- Regular backups of important channels are recommended

---

**⚠️ WARNING**: Message deletion is permanent and cannot be undone. Always verify your target channel and message count before executing cleanup commands.
