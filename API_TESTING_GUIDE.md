# API Testing Examples

This document provides examples of how to test the DeepQuasar Dashboard API endpoints.

## Prerequisites

1. **Start the bot with web module enabled**:
   ```bash
   npm start
   ```
   
2. **Ensure environment variables are set**:
   ```bash
   # In your .env file
   ENABLE_WEB_MODULE=true
   WEB_PORT=3000
   WEB_SECRET=your_secret_here
   DASHBOARD_URL=http://localhost:3001
   ```

3. **Get Discord OAuth2 Access Token**:
   - Register app at [Discord Developer Portal](https://discord.com/developers/applications)
   - Set up OAuth2 with scopes: `identify guilds`
   - Implement OAuth2 flow to get access token

## Testing with curl

### 1. Health Check (No Auth Required)

```bash
curl -X GET http://localhost:3000/api/health
```

**Expected Response:**
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

### 2. Authentication (Discord OAuth2 Required)

```bash
# Get user's manageable guilds first
curl -X POST http://localhost:3000/api/auth/guilds \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "YOUR_DISCORD_OAUTH2_ACCESS_TOKEN"
  }'
```

```bash
# Login with Discord access token to get JWT
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "YOUR_DISCORD_OAUTH2_ACCESS_TOKEN",
    "guildId": "987654321098765432"
  }'
```

**Expected Response:**
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

### 3. Using the JWT Token

```bash
# Export token for easier use
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get guild information
curl -X GET http://localhost:3000/api/guild/987654321098765432 \
  -H "Authorization: Bearer $TOKEN"

# Get music player status
curl -X GET http://localhost:3000/api/music/987654321098765432/player \
  -H "Authorization: Bearer $TOKEN"

# Get guild channels
curl -X GET http://localhost:3000/api/guild/987654321098765432/channels \
  -H "Authorization: Bearer $TOKEN"
```

## Testing with Postman

### 1. Import Collection

Create a new Postman collection with these settings:

**Collection Variables:**
- `baseURL`: `http://localhost:3000/api`
- `token`: `{{loginToken}}` (will be set by login request)
- `guildId`: `987654321098765432`
- `userId`: `123456789012345678`

### 2. Authentication Request

```
POST {{baseURL}}/auth/login
Content-Type: application/json

{
  "userId": "{{userId}}",
  "guildId": "{{guildId}}"
}
```

**Test Script (in Postman):**
```javascript
// Save token for future requests
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.collectionVariables.set("loginToken", response.token);
}
```

### 3. Guild Info Request

```
GET {{baseURL}}/guild/{{guildId}}
Authorization: Bearer {{token}}
```

### 4. Music Control Requests

```
# Get player status
GET {{baseURL}}/music/{{guildId}}/player
Authorization: Bearer {{token}}

# Play music
POST {{baseURL}}/music/{{guildId}}/play
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "query": "Never Gonna Give You Up",
  "voiceChannelId": "123456789012345678"
}

# Pause music
POST {{baseURL}}/music/{{guildId}}/pause
Authorization: Bearer {{token}}

# Set volume
POST {{baseURL}}/music/{{guildId}}/volume
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "volume": 75
}
```

## Testing with JavaScript/Fetch

### Frontend Integration Example

```javascript
class DeepQuasarAPI {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('deepquasar_token');
  }

  // Get user's manageable guilds with Discord OAuth2 token
  async getGuilds(discordAccessToken) {
    const response = await fetch(`${this.baseURL}/auth/guilds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken: discordAccessToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch guilds');
    }

    return response.json();
  }

  // Login with Discord OAuth2 access token
  async login(discordAccessToken, guildId) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken: discordAccessToken, guildId }),
    });

    const data = await response.json();
    
    if (data.success) {
      this.token = data.token;
      localStorage.setItem('deepquasar_token', this.token);
      return data;
    }
    
    throw new Error(data.message || 'Login failed');
  }

  async request(endpoint, options = {}) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }
    
    return data;
  }

  // Guild methods
  async getGuildInfo(guildId) {
    return this.request(`/guild/${guildId}`);
  }

  async getGuildChannels(guildId) {
    return this.request(`/guild/${guildId}/channels`);
  }

  async updateGuildSettings(guildId, settings) {
    return this.request(`/guild/${guildId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Music methods
  async getMusicPlayer(guildId) {
    return this.request(`/music/${guildId}/player`);
  }

  async playMusic(guildId, query, voiceChannelId) {
    return this.request(`/music/${guildId}/play`, {
      method: 'POST',
      body: JSON.stringify({ query, voiceChannelId }),
    });
  }

  async pauseMusic(guildId) {
    return this.request(`/music/${guildId}/pause`, {
      method: 'POST',
    });
  }

  async setVolume(guildId, volume) {
    return this.request(`/music/${guildId}/volume`, {
      method: 'POST',
      body: JSON.stringify({ volume }),
    });
  }

  // Moderation methods
  async getModerationLogs(guildId, page = 1, type = null) {
    const params = new URLSearchParams({ page: page.toString() });
    if (type) params.append('type', type);
    
    return this.request(`/moderation/${guildId}/logs?${params}`);
  }

  async kickMember(guildId, userId, reason) {
    return this.request(`/moderation/${guildId}/kick`, {
      method: 'POST',
      body: JSON.stringify({ userId, reason }),
    });
  }

  async banUser(guildId, userId, reason, deleteMessageDays = 0) {
    return this.request(`/moderation/${guildId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ userId, reason, deleteMessageDays }),
    });
  }
}

// Usage example with Discord OAuth2
async function example() {
  const api = new DeepQuasarAPI();
  
  try {
    // First, get Discord access token through OAuth2 flow
    const discordAccessToken = 'YOUR_DISCORD_OAUTH2_ACCESS_TOKEN';
    
    // Get list of manageable guilds
    const guilds = await api.getGuilds(discordAccessToken);
    console.log('Available guilds:', guilds.guilds.map(g => g.name));
    
    // Select a guild and login
    const selectedGuild = guilds.guilds[0];
    const loginResult = await api.login(discordAccessToken, selectedGuild.id);
    console.log('Logged in:', loginResult.user.username);
    
    // Get guild info
    const guild = await api.getGuildInfo(selectedGuild.id);
    console.log('Guild:', guild.guild.name);
    
    // Get music player status
    const player = await api.getMusicPlayer('987654321098765432');
    console.log('Player status:', player.status);
    
    // Play music (if in voice channel)
    if (player.status === 'not_playing') {
      await api.playMusic('987654321098765432', 'Never Gonna Give You Up', 'VOICE_CHANNEL_ID');
      console.log('Started playing music');
    }
    
  } catch (error) {
    console.error('API Error:', error.message);
  }
}
```

## Error Handling

### Common Error Responses

```json
// 401 Unauthorized
{
  "error": "Authentication Required",
  "message": "No valid authorization header provided"
}

// 403 Forbidden
{
  "error": "Access Denied",
  "message": "Administrator permissions required"
}

// 404 Not Found
{
  "error": "Guild Not Found",
  "message": "Bot is not a member of this guild"
}

// 429 Rate Limited
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests, please try again later"
}

// 500 Internal Server Error
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

### Rate Limiting

Each endpoint group has different rate limits:
- **Authentication**: No limit
- **General endpoints**: 50 requests/minute  
- **Music endpoints**: 30 requests/minute

When rate limited, wait before retrying. Implement exponential backoff:

```javascript
async function retryWithBackoff(apiCall, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.message.includes('Rate Limit') && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

## Production Considerations

### Security

1. **Use HTTPS in production**:
   ```bash
   # Set in production environment
   DASHBOARD_URL=https://dashboard.yourdomain.com
   ```

2. **Secure the JWT secret**:
   ```bash
   # Use a strong, random secret
   WEB_SECRET=your-very-secure-random-string-here
   ```

3. **Configure CORS properly**:
   ```javascript
   // Only allow your dashboard domain
   cors({
     origin: 'https://dashboard.yourdomain.com',
     credentials: true
   })
   ```

### Performance

1. **Use a reverse proxy** (nginx, Apache)
2. **Enable compression** for API responses
3. **Implement request logging** for monitoring
4. **Set up health monitoring** endpoints

### Monitoring

Monitor these metrics:
- Request count and response times
- Error rates by endpoint
- Authentication success/failure rates
- Rate limit violations
- Memory and CPU usage

This completes the testing guide for the DeepQuasar Dashboard API!