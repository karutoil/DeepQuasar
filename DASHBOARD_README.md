# DeepQuasar Dashboard

A modern, responsive web dashboard for managing your Discord bot through an intuitive interface.

## Features

- **Discord OAuth Authentication** - Secure login using Discord accounts
- **Guild Management** - Switch between multiple Discord servers
- **Music Control** - Control music playback, view queue, adjust volume
- **Real-time Data** - Live updates of bot status and server information
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Modern UI** - Built with Tailwind CSS and Heroicons for a sleek experience

## Quick Start

### Prerequisites

- Node.js 18+ 
- Discord Application with OAuth2 configured
- DeepQuasar bot running with web API enabled

### Installation

1. **Configure Discord OAuth2**
   
   In your Discord Application settings (Discord Developer Portal):
   - Add redirect URI: `http://localhost:3001/auth/callback`
   - Note your Client ID and Client Secret

2. **Environment Setup**
   
   Copy and configure the environment file:
   ```bash
   cd dashboard
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your Discord credentials:
   ```env
   NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3001
   DISCORD_CLIENT_SECRET=your_discord_client_secret
   ```

3. **Install Dependencies**
   ```bash
   cd dashboard
   npm install
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access Dashboard**
   
   Open http://localhost:3001 in your browser

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | Discord Application Client ID | `123456789012345678` |
| `NEXT_PUBLIC_API_URL` | DeepQuasar API base URL | `http://localhost:3000/api` |
| `NEXT_PUBLIC_DASHBOARD_URL` | Dashboard URL for OAuth redirects | `http://localhost:3001` |
| `DISCORD_CLIENT_SECRET` | Discord Application Client Secret | `your-secret-here` |

## Production Deployment

### Building for Production

```bash
cd dashboard
npm run build
npm start
```

### Docker Deployment

Create a `Dockerfile` in the dashboard directory:

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3001
ENV PORT 3001

CMD ["node", "server.js"]
```

### Environment Configuration for Production

Update your environment variables for production:

```env
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id
NEXT_PUBLIC_API_URL=https://your-bot-api-domain.com/api
NEXT_PUBLIC_DASHBOARD_URL=https://your-dashboard-domain.com
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

**Important**: Update Discord OAuth2 redirect URI in Discord Developer Portal to match your production URL.

## Dashboard Features

### Authentication Flow
1. User clicks "Login with Discord"
2. Redirected to Discord OAuth2
3. User authorizes application
4. Dashboard receives access token
5. User selects a guild to manage
6. JWT token generated for API access

### Available Sections

- **Overview** - Server statistics and recent activity
- **Music** - Control music playback, view queue
- **Moderation** - View moderation logs and actions
- **Tickets** - Manage support tickets
- **Members** - Guild member management
- **Settings** - Bot configuration options

### Permissions

Users need one of the following permissions in the Discord server:
- Administrator
- Manage Guild

The bot must also be present in the server for it to appear in the guild selection.

## API Integration

The dashboard communicates with the DeepQuasar bot API endpoints:

- Authentication: `/api/auth/*`
- Guild data: `/api/guild/*`
- Music control: `/api/music/*`
- Moderation: `/api/moderation/*`
- And more...

All API calls include JWT authentication and proper error handling.

## Troubleshooting

### Common Issues

**"Discord Client ID not configured"**
- Check your `.env.local` file has the correct `NEXT_PUBLIC_DISCORD_CLIENT_ID`

**"No eligible guilds found"**
- Ensure you have Administrator/Manage Guild permissions
- Verify the bot is present in your Discord server
- Check that the bot's web API is running

**"Authentication failed"**
- Verify Discord Client Secret is correct
- Check Discord OAuth2 redirect URI matches exactly
- Ensure bot API is accessible at the configured URL

**API connection errors**
- Verify the bot is running with web module enabled
- Check `NEXT_PUBLIC_API_URL` points to the correct bot API
- Ensure CORS is properly configured in bot settings

### Development Tips

- Use browser developer tools to inspect network requests
- Check browser console for JavaScript errors
- Verify environment variables are properly loaded
- Test OAuth flow with Discord's developer tools

## Security Considerations

- Never expose Discord Client Secret in frontend code
- Use HTTPS in production
- Implement proper CORS policies
- Regularly rotate Discord application secrets
- Validate all user inputs
- Use secure JWT tokens with appropriate expiration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the main project LICENSE file for details.