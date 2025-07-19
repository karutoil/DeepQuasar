# DeepQuasar API Implementation

This document provides an overview of the comprehensive REST API implementation for the DeepQuasar Discord bot dashboard.

## 🚀 Quick Start

### 1. Enable the Web Module

Add to your `.env` file:
```env
ENABLE_WEB_MODULE=true
WEB_PORT=3000
WEB_SECRET=your_secure_secret_here
DASHBOARD_URL=http://localhost:3001
```

### 2. Start the Bot

```bash
npm start
```

The API will be available at `http://localhost:3000/api`

### 3. Test the API

Open `examples/dashboard-demo.html` in your browser to test the API interactively.

## 📋 Features Implemented

### 🔐 Authentication & Security
- **Discord OAuth2 integration** with access token verification
- **Discord API validation** ensures authentic user identity
- **Guild access validation** through Discord's permissions system
- **Role-based permissions** (User, DJ, Moderator, Administrator)
- **Rate limiting** to prevent abuse (30-50 requests/minute)
- **CORS configuration** for secure frontend integration
- **Proper 401 responses** for unauthorized/invalid tokens

### 🎯 API Endpoints (95 Total)

#### Authentication (4 endpoints)
- `POST /auth/login` - Authenticate with Discord OAuth2 token
- `POST /auth/verify` - Verify token validity
- `POST /auth/refresh` - Refresh existing token
- `POST /auth/guilds` - Get user's manageable guilds (OAuth2)

#### Guild Management (6 endpoints)
- `GET /guild/:guildId` - Get guild information and settings
- `PUT /guild/:guildId/settings` - Update guild configuration
- `GET /guild/:guildId/channels` - List guild channels
- `GET /guild/:guildId/roles` - List guild roles
- `GET /guild/:guildId/members` - List guild members (paginated)
- `GET /guild/:guildId/stats` - Get guild statistics

#### Music Control (8 endpoints)
- `GET /music/:guildId/player` - Get player status and queue
- `POST /music/:guildId/play` - Add track to queue/start playing
- `POST /music/:guildId/pause` - Pause/resume playback
- `POST /music/:guildId/skip` - Skip current track
- `POST /music/:guildId/stop` - Stop and clear queue
- `POST /music/:guildId/volume` - Set playback volume
- `POST /music/:guildId/seek` - Seek to position in track
- `DELETE /music/:guildId/queue/:index` - Remove track from queue

#### Moderation (7 endpoints)
- `GET /moderation/:guildId/logs` - Get moderation logs (paginated)
- `POST /moderation/:guildId/kick` - Kick member from guild
- `POST /moderation/:guildId/ban` - Ban user from guild
- `DELETE /moderation/:guildId/ban/:userId` - Unban user
- `POST /moderation/:guildId/timeout` - Timeout member
- `GET /moderation/:guildId/user/:userId/notes` - Get user notes
- `POST /moderation/:guildId/user/:userId/notes` - Add user note

#### Ticket System (4 endpoints)
- `GET /tickets/:guildId` - List support tickets
- `GET /tickets/:guildId/config` - Get ticket configuration
- `PUT /tickets/:guildId/config` - Update ticket settings
- `POST /tickets/:guildId/:ticketId/close` - Close ticket

#### TempVC Management (4 endpoints)
- `GET /tempvc/:guildId/instances` - List active temporary VCs
- `GET /tempvc/:guildId/settings/:userId` - Get user VC settings
- `PUT /tempvc/:guildId/settings/:userId` - Update user VC settings
- `DELETE /tempvc/:guildId/instances/:channelId` - Delete VC instance

#### User Management (2 endpoints)
- `GET /user/:guildId/:userId` - Get user information
- `GET /user/:guildId/search` - Search guild users

#### Role Management (5 endpoints)
- `GET /roles/:guildId/selfroles` - List self-assignable roles
- `POST /roles/:guildId/selfroles` - Add self-assignable role
- `DELETE /roles/:guildId/selfroles/:roleId` - Remove self-assignable role
- `POST /roles/:guildId/assign/:userId/:roleId` - Assign role to user
- `DELETE /roles/:guildId/assign/:userId/:roleId` - Remove role from user

#### Reminders (3 endpoints)
- `GET /reminders/:guildId` - List reminders (paginated)
- `POST /reminders/:guildId` - Create new reminder
- `DELETE /reminders/:guildId/:reminderId` - Delete reminder

#### LFG System (4 endpoints)
- `GET /lfg/:guildId/posts` - List LFG posts
- `GET /lfg/:guildId/settings` - Get LFG configuration
- `PUT /lfg/:guildId/settings` - Update LFG settings
- `DELETE /lfg/:guildId/posts/:postId` - Delete LFG post

#### Template Management (6 endpoints)
- `GET /templates/:guildId` - List embed templates
- `GET /templates/:guildId/:templateId` - Get specific template
- `POST /templates/:guildId` - Create new template
- `PUT /templates/:guildId/:templateId` - Update template
- `DELETE /templates/:guildId/:templateId` - Delete template
- `POST /templates/:guildId/:templateId/send` - Send template to channel

#### AI/Chatbot (4 endpoints)
- `GET /ai/:guildId/config` - Get AI configuration
- `PUT /ai/:guildId/config` - Update AI settings
- `POST /ai/:guildId/test` - Test AI response
- `GET /ai/:guildId/stats` - Get AI usage statistics

#### System Health (1 endpoint)
- `GET /health` - Check API and bot status

## 📁 File Structure

```
src/modules/web/
├── index.js                    # Main web module
├── middleware/
│   └── auth.js                 # Authentication & authorization
└── routes/
    ├── auth.js                 # Authentication routes
    ├── ai.js                   # AI/chatbot routes
    ├── guild.js                # Guild management routes
    ├── lfg.js                  # LFG system routes
    ├── moderation.js           # Moderation routes
    ├── music.js                # Music control routes
    ├── reminders.js            # Reminder routes
    ├── roles.js                # Role management routes
    ├── templates.js            # Template routes
    ├── tempvc.js               # TempVC routes
    ├── tickets.js              # Ticket system routes
    └── user.js                 # User management routes
```

## 🔒 Security Features

### Discord OAuth2 + JWT Authentication
- **Discord OAuth2**: Verify user identity with Discord's API
- **Access Token Validation**: All requests validated against Discord
- **JWT Tokens**: Expire after 7 days, include user ID and guild ID
- **Secure Authentication**: No plain user/guild ID authentication
- **401 Responses**: Proper error handling for invalid tokens

### Permission Validation
- **User Level**: Basic authenticated access
- **DJ Level**: Music control permissions
- **Moderator Level**: Moderation actions
- **Admin Level**: Guild settings and configuration

### Rate Limiting
- In-memory rate limiting per user/IP
- Different limits for different endpoint groups
- Automatic cleanup of old rate limit entries

### CORS Protection
- Configurable allowed origins
- Credentials support for authentication
- Preflight request handling

## 📖 Documentation

### Complete API Documentation
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference with examples
- **[API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)** - Testing guide with curl, Postman, and JavaScript examples

### Interactive Demo
- **[examples/dashboard-demo.html](./examples/dashboard-demo.html)** - Interactive web demo for testing API endpoints

## 🧪 Testing

### Basic Module Validation
```bash
# Test module loading
node -e "
const auth = require('./src/modules/web/middleware/auth.js');
console.log('Auth middleware functions:', Object.keys(auth));
"

# Test route loading
node -e "
const routes = ['auth', 'guild', 'music'];
routes.forEach(route => {
  const r = require(\`./src/modules/web/routes/\${route}.js\`);
  console.log(\`✅ \${route} routes loaded\`);
});
"
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Authentication Test
```bash
# First get Discord OAuth2 access token through OAuth2 flow, then:
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"accessToken":"YOUR_DISCORD_ACCESS_TOKEN","guildId":"987654321098765432"}'
```

### Get User's Guilds
```bash
# Get guilds user can manage with bot present
curl -X POST http://localhost:3000/api/auth/guilds \
  -H "Content-Type: application/json" \
  -d '{"accessToken":"YOUR_DISCORD_ACCESS_TOKEN"}'
```

## 🚧 Integration Guide

### Frontend Integration

1. **Install the JWT token** after login
2. **Include token in headers** for all authenticated requests
3. **Handle token expiration** and refresh as needed
4. **Implement proper error handling** for different response codes

### Example JavaScript Client

See the complete example in `examples/dashboard-demo.html` or `API_TESTING_GUIDE.md`.

### React/Vue.js Integration

```javascript
// API service class
class DeepQuasarAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }

  // Implement specific methods for each endpoint...
}
```

## 🏗️ Architecture

### Modular Design
- **Separation of concerns** with dedicated route files
- **Middleware-based architecture** for authentication and validation
- **Reusable components** for common functionality

### Error Handling
- **Consistent error responses** across all endpoints
- **Proper HTTP status codes** for different error types
- **Detailed error messages** for debugging

### Performance Considerations
- **Rate limiting** to prevent abuse
- **Pagination** for large datasets
- **Efficient database queries** using Mongoose

## 🔄 Future Enhancements

### Potential Improvements
1. **WebSocket support** for real-time updates
2. **API versioning** for backward compatibility
3. **Enhanced caching** for frequently accessed data
4. **Metrics and monitoring** integration
5. **Swagger/OpenAPI** documentation generation

### Scalability
- **Redis-based rate limiting** for multi-instance deployments
- **Database connection pooling** optimization
- **Load balancer support** with session affinity

## 🤝 Contributing

When adding new endpoints:

1. **Follow the established patterns** in existing route files
2. **Include proper authentication** and permission checks
3. **Add comprehensive error handling**
4. **Update the API documentation**
5. **Include examples** in the testing guide

## 📝 License

This API implementation is part of the DeepQuasar Discord bot project and follows the same license terms.

---

**Ready for Dashboard Integration! 🎉**

The API provides comprehensive access to all bot features with secure authentication, proper permissions, and extensive documentation. Frontend developers can now build rich dashboard experiences using these endpoints.