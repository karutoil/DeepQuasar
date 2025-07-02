# Self-Role System Documentation

## Overview

The Self-Role System is a comprehensive Discord bot module that allows server administrators to create interactive role assignment messages using buttons. Users can easily assign and remove roles by clicking buttons, providing a modern alternative to reaction roles.

## Features

### Core Features
- **Button-based Role Assignment**: Modern UI using Discord buttons instead of reactions
- **Multiple Self-Role Messages**: Create unlimited self-role messages per server
- **Customizable Embeds**: Full control over title, description, and colors
- **Role Management**: Easy adding/removing of roles with visual customization
- **Flexible Settings**: Configure behavior per message

### Advanced Features
- **Role Limits**: Set maximum assignments per role or per user
- **Role Conflicts**: Prevent users from having conflicting roles
- **Required Roles**: Require users to have specific roles before assigning others
- **Statistics Tracking**: Detailed usage analytics and user interaction data
- **Bulk Operations**: Mass role assignment for administrators
- **Data Export**: Export configuration and statistics as JSON
- **Auto Cleanup**: Remove invalid/deleted roles automatically

### Templates
- **Gaming Roles**: Pre-configured for gaming communities
- **Notification Roles**: For server announcements and updates
- **Color Roles**: Cosmetic username colors with conflict management
- **Interest Roles**: Community interest-based groupings
- **Pronoun Roles**: Inclusive pronoun selection
- **Custom**: Full customization from scratch

## Commands

### Basic Commands (`/selfrole`)

#### `/selfrole create`
Create a new self-role message.
- **channel**: Target channel for the message
- **title**: Embed title (max 256 characters)
- **description**: Embed description (max 4096 characters) 
- **color**: Hex color code (optional, default: #0099ff)

#### `/selfrole add-role`
Add a role to an existing self-role message.
- **message-id**: ID of the self-role message
- **role**: Discord role to add
- **label**: Button text (max 80 characters)
- **emoji**: Button emoji (optional)
- **style**: Button style (Primary/Secondary/Success/Danger)
- **description**: Role description shown in embed (optional)
- **position**: Button position (0-24)

#### `/selfrole remove-role`
Remove a role from a self-role message.
- **message-id**: ID of the self-role message
- **role**: Discord role to remove

#### `/selfrole edit`
Edit an existing self-role message.
- **message-id**: ID of the self-role message
- **title**: New title (optional)
- **description**: New description (optional)
- **color**: New hex color (optional)

#### `/selfrole settings`
Configure self-role message settings.
- **message-id**: ID of the self-role message
- **max-roles-per-user**: Maximum roles per user (0 = unlimited)
- **allow-role-removal**: Allow users to remove roles
- **ephemeral-response**: Make responses private to user
- **log-channel**: Channel for logging role changes

#### `/selfrole list`
List all self-role messages in the server.

#### `/selfrole delete`
Delete a self-role message and its configuration.
- **message-id**: ID of the self-role message to delete

#### `/selfrole stats`
View usage statistics.
- **message-id**: Specific message ID (optional, shows server-wide if omitted)

#### `/selfrole cleanup`
Remove invalid/deleted roles from all self-role messages.

### Advanced Commands (`/selfrole-advanced`)

#### `/selfrole-advanced role-limits`
Set advanced limits for specific roles.
- **message-id**: ID of the self-role message
- **role**: Role to configure
- **max-assignments**: Maximum users who can have this role
- **required-role**: Role required to assign this role

#### `/selfrole-advanced role-conflicts`
Manage conflicting roles.
- **message-id**: ID of the self-role message
- **role**: Primary role
- **conflicting-role**: Role that conflicts with primary
- **action**: Add or remove conflict

#### `/selfrole-advanced reorder-roles`
Change button order.
- **message-id**: ID of the self-role message
- **role**: Role to move
- **new-position**: New position (0-24)

#### `/selfrole-advanced bulk-assign`
Mass assign roles to users (Administrator only).
- **message-id**: ID of the self-role message
- **role**: Role to assign
- **user-ids**: Comma-separated user IDs

#### `/selfrole-advanced export-data`
Export configuration and statistics as JSON.
- **message-id**: Specific message (optional, exports all if omitted)

#### `/selfrole-advanced reset-stats`
Reset statistics for a self-role message.
- **message-id**: ID of the self-role message

### Setup Commands

#### `/selfrole-setup`
Quick setup wizard with templates.
- **channel**: Target channel
- **template**: Pre-configured template
- **title**: Custom title (for custom template)
- **description**: Custom description (for custom template)

#### `/selfrole-help`
Comprehensive help system.
- **topic**: Specific help topic (optional)

Available topics:
- `getting-started`: Step-by-step setup guide
- `basic-commands`: Essential commands overview
- `advanced-features`: Advanced functionality
- `troubleshooting`: Common issues and solutions
- `best-practices`: Tips for effective usage
- `examples`: Real-world implementation examples

## Database Schema

The system uses MongoDB with the following structure:

```javascript
{
  guildId: String,           // Discord server ID
  messageId: String,         // Discord message ID (unique)
  channelId: String,         // Channel where message is posted
  title: String,             // Embed title
  description: String,       // Embed description
  color: String,             // Hex color code
  roles: [{                  // Array of role configurations
    roleId: String,          // Discord role ID
    roleName: String,        // Role name (cached for performance)
    emoji: String,           // Button emoji
    label: String,           // Button text
    description: String,     // Role description in embed
    style: String,           // Button style
    position: Number,        // Button position
    maxAssignments: Number,  // Maximum users with this role
    currentAssignments: Number, // Current assignment count
    requiredRole: String,    // Required role ID
    conflictingRoles: [String] // Array of conflicting role IDs
  }],
  settings: {                // Message-level settings
    maxRolesPerUser: Number, // Max roles per user
    allowRoleRemoval: Boolean, // Allow role removal
    requireConfirmation: Boolean, // Require confirmation
    ephemeralResponse: Boolean, // Private responses
    logChannel: String,      // Log channel ID
    autoDelete: {            // Auto-delete settings
      enabled: Boolean,
      deleteAfter: Number
    }
  },
  statistics: {              // Usage statistics
    totalInteractions: Number,
    uniqueUsers: [{
      userId: String,
      interactions: Number,
      lastInteraction: Date
    }],
    roleAssignments: [{
      roleId: String,
      assigned: Number,
      removed: Number
    }]
  },
  createdBy: {               // Creator information
    userId: String,
    username: String
  },
  lastModified: {            // Last modification tracking
    by: {
      userId: String,
      username: String
    },
    at: Date
  }
}
```

## Permission Requirements

### Bot Permissions
- **Manage Roles**: Required for role assignment/removal
- **Send Messages**: Required for creating self-role messages
- **Embed Links**: Required for rich embed messages
- **Use External Emojis**: Optional, for custom emojis in buttons

### User Permissions
- **Manage Guild**: Required for all setup and configuration commands
- **Administrator**: Required for bulk operations and advanced features

### Role Hierarchy
The bot's role must be higher than any roles it manages. Discord's role hierarchy prevents bots from managing roles higher than their own position.

## Best Practices

### Design Guidelines
1. **Clear Labels**: Use descriptive, concise button labels
2. **Logical Grouping**: Group related roles together
3. **Visual Appeal**: Use relevant emojis and consistent styling
4. **User-Friendly**: Keep descriptions helpful but brief

### Configuration Best Practices
1. **Role Limits**: Set reasonable limits to prevent abuse
2. **Ephemeral Responses**: Use private responses to reduce channel clutter
3. **Logging**: Set up logging channels for moderation oversight
4. **Regular Cleanup**: Periodically run cleanup to remove invalid roles
5. **Testing**: Test functionality after major changes

### Security Considerations
1. **Role Permissions**: Regularly audit role permissions
2. **Hierarchy Management**: Maintain proper role hierarchy
3. **Access Control**: Use required roles for sensitive access
4. **Monitoring**: Monitor logs for unusual activity

## Troubleshooting

### Common Issues

#### "Permission denied" errors
- **Cause**: Bot lacks Manage Roles permission or role hierarchy issues
- **Solution**: Ensure bot has proper permissions and role position

#### Buttons not responding
- **Cause**: Bot offline, role deleted, or permission issues
- **Solution**: Check bot status, run cleanup command, verify permissions

#### "Role not found" errors
- **Cause**: Role was deleted or renamed
- **Solution**: Use cleanup command or re-add the role

#### Statistics not updating
- **Cause**: Database connection issues or schema problems
- **Solution**: Check database connectivity and restart bot if needed

### Error Codes and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `50013` | Missing permissions | Check bot role hierarchy and permissions |
| `10011` | Unknown role | Role was deleted, remove from self-role config |
| `10008` | Unknown message | Message was deleted, recreate self-role message |
| `50035` | Invalid form body | Check input validation (character limits, etc.) |

## API Integration

The self-role system can be extended with additional functionality:

### Custom Event Handlers
```javascript
// Listen for role assignment events
client.selfRoleManager.on('roleAssigned', (guildId, userId, roleId) => {
  // Custom logic here
});

client.selfRoleManager.on('roleRemoved', (guildId, userId, roleId) => {
  // Custom logic here
});
```

### Database Queries
```javascript
// Get all self-role messages for a guild
const selfRoles = await SelfRole.find({ guildId: 'your-guild-id' });

// Get statistics for a specific message
const stats = await selfRoleManager.getSelfRoleStats(guildId, messageId);
```

## Migration and Backup

### Exporting Data
Use `/selfrole-advanced export-data` to export configurations as JSON files for backup purposes.

### Importing Data
While direct import isn't available through commands, data can be restored by:
1. Recreating self-role messages using the setup commands
2. Using the exported JSON as reference for configuration
3. Bulk operations for role assignments if needed

## Performance Considerations

### Optimization Tips
1. **Database Indexing**: The schema includes optimized indexes for common queries
2. **Caching**: Role names are cached to reduce API calls
3. **Bulk Operations**: Use bulk assignment for large user bases
4. **Regular Cleanup**: Remove unused configurations to improve performance

### Scaling
- The system supports unlimited self-role messages per server
- Each message supports up to 25 roles (Discord button limit)
- Statistics are tracked efficiently with minimal performance impact
- Database queries are optimized for large servers

## Support and Updates

### Getting Help
1. Use `/selfrole-help` for built-in documentation
2. Check troubleshooting section for common issues
3. Review bot logs for detailed error information
4. Contact server administrators for permission-related issues

### Version Compatibility
- Compatible with Discord.js v14+
- Requires MongoDB for data persistence
- Node.js 16+ recommended for optimal performance

This documentation covers the complete self-role system. For specific implementation details, refer to the source code and inline comments.
