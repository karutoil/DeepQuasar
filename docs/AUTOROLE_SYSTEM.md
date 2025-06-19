# AutoRole System Documentation

## Overview
The AutoRole system automatically assigns a specified role to new members when they join the server. This system is highly configurable and includes various options to customize the behavior according to server needs.

## Features
- **Automatic Role Assignment**: Assigns a role to new members upon joining
- **Configurable Delay**: Option to delay role assignment by up to 1 hour
- **Bot Bypass**: Option to skip role assignment for bot accounts
- **Verification Requirement**: Option to only assign roles to verified members
- **Role Hierarchy Check**: Automatically validates bot permissions and role positions
- **Test Configuration**: Built-in testing to verify setup correctness

## Commands

### `/autorole setup`
Configures and enables the autorole system.

**Options:**
- `role` (required): The role to automatically assign to new members
- `delay` (optional): Delay in seconds before assigning role (0-3600, default: 0)
- `skip-bots` (optional): Skip role assignment for bots (default: true)
- `require-verification` (optional): Only assign role to verified members (default: false)

**Example:**
```
/autorole setup role:@Member delay:30 skip-bots:true require-verification:false
```

### `/autorole disable`
Disables the autorole system and cancels any pending role assignments.

### `/autorole status`
Displays the current autorole configuration and status, including any potential issues.

### `/autorole test`
Tests the current autorole configuration to ensure it will work correctly.

## Configuration Options

### Role Selection
- Must not be a managed role (roles created by integrations/bots)
- Must be lower in hierarchy than the bot's highest role
- Bot must have "Manage Roles" permission

### Delay Setting
- Range: 0-3600 seconds (0 to 1 hour)
- 0 = Instant assignment
- Useful for anti-raid protection or verification periods

### Bot Bypass
- **Enabled (default)**: Bots will not receive the autorole
- **Disabled**: Bots will also receive the autorole

### Verification Requirement
- **Disabled (default)**: All members receive the role immediately (or after delay)
- **Enabled**: Only members who pass Discord's verification will receive the role

## Database Schema
The autorole configuration is stored in the Guild schema:

```javascript
autoRole: {
    enabled: Boolean,           // Whether autorole is enabled
    roleId: String,            // ID of the role to assign
    delay: Number,             // Delay in seconds (0-3600)
    botBypass: Boolean,        // Skip bots (default: true)
    requireVerification: Boolean // Only assign to verified members
}
```

## Error Handling
The system includes comprehensive error handling:
- Logs all role assignments and failures
- Validates permissions before attempting role assignment
- Checks role hierarchy to prevent failures
- Handles member leaving before delayed assignment
- Provides detailed error messages in commands

## Permissions Required
- **Bot**: `Manage Roles` permission
- **User**: `Manage Guild` permission to configure autorole

## Security Considerations
- Role hierarchy is strictly enforced
- Managed roles cannot be assigned
- Bot permissions are validated before assignment
- All actions are logged for audit purposes

## Troubleshooting

### Common Issues
1. **"Role hierarchy error"**: Move the bot's role above the autorole
2. **"Missing permissions"**: Ensure bot has "Manage Roles" permission
3. **"Role not found"**: The configured role may have been deleted
4. **"Managed role"**: Cannot assign roles created by other bots/integrations

### Testing
Use `/autorole test` to quickly identify configuration issues.

### Logs
Check the bot logs for detailed information about role assignments and errors:
- Successful assignments are logged at INFO level
- Errors are logged at ERROR level
- Configuration issues are logged at WARN level

## Integration Notes
- Integrates with existing welcome system
- Works alongside other member join events
- Respects Discord's rate limits for role assignments
- Handles verification status changes automatically
