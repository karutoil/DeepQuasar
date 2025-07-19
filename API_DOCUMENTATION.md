# DeepQuasar Dashboard API Documentation

This API provides comprehensive endpoints for managing your Discord server through the DeepQuasar dashboard. All endpoints require authentication and guild access validation.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All API requests (except health check) require a Bearer token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Getting Started

1. **Login**: Use the `/auth/login` endpoint with your Discord user ID and guild ID
2. **Token**: Include the returned JWT token in all subsequent requests
3. **Guild Access**: Ensure you have appropriate permissions in the guild

## Rate Limiting

- **General endpoints**: 50 requests per minute
- **Music endpoints**: 30 requests per minute  
- **Authentication endpoints**: No rate limit

## Error Responses

All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Human readable error message"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Rate Limited (too many requests)
- `500` - Internal Server Error

---

## Authentication Endpoints

### Login
Generate an authentication token for dashboard access.

```http
POST /api/auth/login
Content-Type: application/json

{
  "userId": "123456789012345678",
  "guildId": "987654321098765432"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123456789012345678",
    "username": "john_doe",
    "displayName": "John Doe",
    "avatar": "https://cdn.discordapp.com/avatars/...",
    "permissions": {
      "administrator": true,
      "manageGuild": true,
      "moderateMembers": true,
      "manageMessages": true
    }
  },
  "guild": {
    "id": "987654321098765432",
    "name": "My Discord Server",
    "icon": "https://cdn.discordapp.com/icons/...",
    "memberCount": 1234
  }
}
```

### Verify Token
Verify if the current token is valid and get user/guild information.

```http
POST /api/auth/verify
Authorization: Bearer <token>
```

### Get User Guilds
Get list of guilds where the user has admin permissions and the bot is present.

```http
GET /api/auth/guilds/{userId}
```

### Refresh Token
Generate a new token with extended expiration.

```http
POST /api/auth/refresh
Authorization: Bearer <token>
```

---

## Guild Management

### Get Guild Information
Retrieve comprehensive guild information and bot settings.

```http
GET /api/guild/{guildId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "guild": {
    "id": "987654321098765432",
    "name": "My Discord Server",
    "icon": "https://cdn.discordapp.com/icons/...",
    "memberCount": 1234,
    "botJoinedAt": "2023-01-01T00:00:00.000Z",
    "features": ["COMMUNITY", "NEWS"],
    "settings": {
      "musicSettings": { /* guild music config */ },
      "commandSettings": { /* command config */ },
      "chatbot": { /* AI chatbot config */ }
      // ... other settings
    }
  }
}
```

### Update Guild Settings
Update guild configuration (requires Administrator permissions).

```http
PUT /api/guild/{guildId}/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "musicSettings": {
    "defaultVolume": 75,
    "maxQueueSize": 200
  },
  "chatbot": {
    "enabled": true,
    "responseChance": 15
  }
}
```

### Get Guild Channels
List all channels in the guild with permission information.

```http
GET /api/guild/{guildId}/channels
Authorization: Bearer <token>
```

### Get Guild Roles
List all roles in the guild with member counts.

```http
GET /api/guild/{guildId}/roles
Authorization: Bearer <token>
```

### Get Guild Members
List guild members with pagination and search.

```http
GET /api/guild/{guildId}/members?page=1&limit=20&search=john
Authorization: Bearer <token>
```

### Get Guild Statistics
Retrieve guild statistics and bot usage metrics.

```http
GET /api/guild/{guildId}/stats
Authorization: Bearer <token>
```

---

## Music Module

### Get Player Status
Get current music player status and queue information.

```http
GET /api/music/{guildId}/player
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "player": {
    "guildId": "987654321098765432",
    "voiceChannelId": "123456789012345678",
    "connected": true,
    "playing": true,
    "paused": false,
    "volume": 75,
    "position": 45000,
    "repeatMode": "off",
    "shuffled": false
  },
  "currentTrack": {
    "title": "Song Title",
    "author": "Artist Name",
    "duration": 180000,
    "uri": "https://youtube.com/watch?v=...",
    "thumbnail": "https://img.youtube.com/vi/.../maxresdefault.jpg",
    "position": 45000
  },
  "queue": [
    {
      "title": "Next Song",
      "author": "Next Artist",
      "duration": 200000,
      "requester": "123456789012345678"
    }
  ],
  "status": "playing"
}
```

### Play Music
Add a track to the queue or start playing music.

```http
POST /api/music/{guildId}/play
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "Rick Astley Never Gonna Give You Up",
  "voiceChannelId": "123456789012345678",
  "textChannelId": "987654321098765432"
}
```

### Pause/Resume
Pause or resume music playback.

```http
POST /api/music/{guildId}/pause
Authorization: Bearer <token>
```

### Skip Track
Skip the current track.

```http
POST /api/music/{guildId}/skip
Authorization: Bearer <token>
```

### Stop Music
Stop playback and clear the queue.

```http
POST /api/music/{guildId}/stop
Authorization: Bearer <token>
```

### Set Volume
Adjust playback volume (0-150).

```http
POST /api/music/{guildId}/volume
Authorization: Bearer <token>
Content-Type: application/json

{
  "volume": 75
}
```

### Seek in Track
Seek to a specific position in the current track.

```http
POST /api/music/{guildId}/seek
Authorization: Bearer <token>
Content-Type: application/json

{
  "position": 60000
}
```

### Remove from Queue
Remove a track from the queue by index.

```http
DELETE /api/music/{guildId}/queue/{index}
Authorization: Bearer <token>
```

---

## Moderation

### Get Moderation Logs
Retrieve moderation action logs with pagination and filtering.

```http
GET /api/moderation/{guildId}/logs?page=1&type=BAN&userId=123456789012345678
Authorization: Bearer <token>
```

### Kick Member
Kick a member from the guild.

```http
POST /api/moderation/{guildId}/kick
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "123456789012345678",
  "reason": "Violation of server rules"
}
```

### Ban User
Ban a user from the guild.

```http
POST /api/moderation/{guildId}/ban
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "123456789012345678",
  "reason": "Repeated violations",
  "deleteMessageDays": 1
}
```

### Unban User
Remove a ban from a user.

```http
DELETE /api/moderation/{guildId}/ban/{userId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Appeal approved"
}
```

### Timeout Member
Apply a timeout to a member.

```http
POST /api/moderation/{guildId}/timeout
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "123456789012345678",
  "duration": 3600000,
  "reason": "Spamming"
}
```

### Get User Notes
Retrieve moderator notes for a specific user.

```http
GET /api/moderation/{guildId}/user/{userId}/notes
Authorization: Bearer <token>
```

### Add User Note
Add a moderator note to a user's record.

```http
POST /api/moderation/{guildId}/user/{userId}/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "note": "User was warned about behavior in #general"
}
```

---

## Ticket System

### Get Tickets
List all support tickets with pagination and status filtering.

```http
GET /api/tickets/{guildId}?status=open&page=1&limit=20
Authorization: Bearer <token>
```

### Get Ticket Configuration
Retrieve ticket system settings.

```http
GET /api/tickets/{guildId}/config
Authorization: Bearer <token>
```

### Update Ticket Configuration
Modify ticket system settings.

```http
PUT /api/tickets/{guildId}/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": true,
  "categoryId": "123456789012345678",
  "supportRoles": ["987654321098765432"],
  "maxTicketsPerUser": 2,
  "autoClose": true,
  "autoCloseTime": 48
}
```

### Close Ticket
Close a support ticket.

```http
POST /api/tickets/{guildId}/{ticketId}/close
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Issue resolved"
}
```

---

## Temporary Voice Channels

### Get TempVC Instances
List all active temporary voice channels.

```http
GET /api/tempvc/{guildId}/instances
Authorization: Bearer <token>
```

### Get User TempVC Settings
Retrieve a user's default TempVC settings.

```http
GET /api/tempvc/{guildId}/settings/{userId}
Authorization: Bearer <token>
```

### Update User TempVC Settings
Modify a user's default TempVC settings.

```http
PUT /api/tempvc/{guildId}/settings/{userId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "channelName": "{user}'s Channel",
  "userLimit": 10,
  "bitrate": 64000,
  "isPrivate": false,
  "allowedUsers": [],
  "blockedUsers": []
}
```

### Delete TempVC Instance
Force delete a temporary voice channel (admin only).

```http
DELETE /api/tempvc/{guildId}/instances/{channelId}
Authorization: Bearer <token>
```

---

## User Management

### Get User Information
Retrieve detailed user information including roles and permissions.

```http
GET /api/user/{guildId}/{userId}
Authorization: Bearer <token>
```

### Search Users
Search for users in the guild by username or ID.

```http
GET /api/user/{guildId}/search?q=john&limit=10
Authorization: Bearer <token>
```

---

## Role Management

### Get Self-Assignable Roles
List all roles that users can assign to themselves.

```http
GET /api/roles/{guildId}/selfroles
Authorization: Bearer <token>
```

### Add Self-Assignable Role
Make a role self-assignable.

```http
POST /api/roles/{guildId}/selfroles
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleId": "123456789012345678",
  "emoji": "🎮",
  "description": "Gamers role"
}
```

### Remove Self-Assignable Role
Remove a role from the self-assignable list.

```http
DELETE /api/roles/{guildId}/selfroles/{roleId}
Authorization: Bearer <token>
```

### Assign Role to User
Manually assign a role to a user (admin only).

```http
POST /api/roles/{guildId}/assign/{userId}/{roleId}
Authorization: Bearer <token>
```

### Remove Role from User
Manually remove a role from a user (admin only).

```http
DELETE /api/roles/{guildId}/assign/{userId}/{roleId}
Authorization: Bearer <token>
```

---

## Reminders

### Get Reminders
List reminders with optional user filtering.

```http
GET /api/reminders/{guildId}?userId=123456789012345678&page=1
Authorization: Bearer <token>
```

### Create Reminder
Set up a new reminder.

```http
POST /api/reminders/{guildId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Don't forget about the event!",
  "reminderTime": "2024-01-01T15:00:00.000Z",
  "channelId": "123456789012345678"
}
```

### Delete Reminder
Cancel a scheduled reminder.

```http
DELETE /api/reminders/{guildId}/{reminderId}
Authorization: Bearer <token>
```

---

## LFG (Looking for Group)

### Get LFG Posts
List looking-for-group posts with filtering options.

```http
GET /api/lfg/{guildId}/posts?game=valorant&status=active&page=1
Authorization: Bearer <token>
```

### Get LFG Settings
Retrieve LFG system configuration.

```http
GET /api/lfg/{guildId}/settings
Authorization: Bearer <token>
```

### Update LFG Settings
Modify LFG system settings.

```http
PUT /api/lfg/{guildId}/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": true,
  "channelId": "123456789012345678",
  "autoDeleteAfter": 24,
  "allowedGames": ["Valorant", "CS:GO", "League of Legends"],
  "maxPostsPerUser": 3
}
```

### Delete LFG Post
Remove an LFG post.

```http
DELETE /api/lfg/{guildId}/posts/{postId}
Authorization: Bearer <token>
```

---

## Template Management

### Get All Templates
List all embed templates for the guild.

```http
GET /api/templates/{guildId}
Authorization: Bearer <token>
```

### Get Specific Template
Retrieve a specific embed template.

```http
GET /api/templates/{guildId}/{templateId}
Authorization: Bearer <token>
```

### Create Template
Create a new embed template.

```http
POST /api/templates/{guildId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Welcome Template",
  "description": "Template for welcoming new members",
  "embedData": {
    "title": "Welcome!",
    "description": "Welcome to our server!",
    "color": 5814783,
    "fields": []
  }
}
```

### Update Template
Modify an existing embed template.

```http
PUT /api/templates/{guildId}/{templateId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Welcome Template",
  "description": "Updated welcome message",
  "embedData": {
    "title": "Welcome to the Server!",
    "description": "We're glad you're here!",
    "color": 3447003
  }
}
```

### Delete Template
Remove an embed template.

```http
DELETE /api/templates/{guildId}/{templateId}
Authorization: Bearer <token>
```

### Send Template
Send a template to a specific channel.

```http
POST /api/templates/{guildId}/{templateId}/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "channelId": "123456789012345678"
}
```

---

## AI/Chatbot Configuration

### Get AI Configuration
Retrieve AI/chatbot settings.

```http
GET /api/ai/{guildId}/config
Authorization: Bearer <token>
```

### Update AI Configuration
Modify AI/chatbot settings.

```http
PUT /api/ai/{guildId}/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": true,
  "model": "gpt-3.5-turbo",
  "maxTokens": 500,
  "temperature": 0.7,
  "systemPrompt": "You are a helpful Discord bot assistant.",
  "responseChance": 15,
  "channelMode": "whitelist",
  "whitelistedChannels": ["123456789012345678"],
  "requireMention": false,
  "cooldown": 5000
}
```

### Test AI Response
Test the AI chatbot with a sample message.

```http
POST /api/ai/{guildId}/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Hello, how are you?"
}
```

### Get AI Statistics
Retrieve AI usage statistics.

```http
GET /api/ai/{guildId}/stats
Authorization: Bearer <token>
```

---

## Health Check

### System Health
Check API and bot status (no authentication required).

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "botStatus": "ready",
  "guilds": 150,
  "users": 50000
}
```

---

## Permission Levels

Different endpoints require different permission levels:

- **User**: Basic authenticated user (can access own data)
- **DJ**: Music-related permissions (configurable per guild)
- **Moderator**: ModerateMembers, ManageMessages, or equivalent permissions
- **Administrator**: Administrator or ManageGuild permissions

## Best Practices

1. **Always handle errors**: Check response status and error messages
2. **Respect rate limits**: Implement proper backoff strategies
3. **Cache tokens**: Store JWT tokens securely and refresh when needed
4. **Validate permissions**: Check user permissions before making requests
5. **Use pagination**: Always handle paginated responses for large datasets

## SDKs and Examples

For implementation examples and SDKs, check our GitHub repository's `examples/` directory.

---

*This API documentation is for DeepQuasar Dashboard v1.0.0*