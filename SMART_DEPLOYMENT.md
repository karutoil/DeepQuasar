# Smart Command Deployment System

This bot now uses a **Smart Command Deployment System** that prevents hitting Discord's daily command creation limits and only deploys when commands actually change.

## How It Works

The smart deployment system:
1. **Compares** current deployed commands with local command files
2. **Skips deployment** if no changes are detected
3. **Handles rate limiting** gracefully
4. **Falls back** to legacy deployment if needed

## Commands

### NPM Scripts

```bash
# Smart deployment (recommended)
npm run deploy          # Deploy globally with smart detection
npm run deploy:guild    # Deploy to guild with smart detection

# Legacy deployment (force deploy all commands)
npm run deploy:force    # Force deploy all commands (old method)

# Other commands
npm run clear           # Clear all deployed commands
```

### Direct Usage

```bash
# Smart deployment
node smart-deploy.js global                    # Global deployment
node smart-deploy.js guild [guildId]          # Guild deployment

# Legacy deployment
node src/deploy-commands.js                   # Force deploy
```

## Environment Variables

- `GUILD_ID`: If set, deploys to this guild instead of globally
- `AUTO_DEPLOY_COMMANDS`: Set to `false` to disable auto-deployment on startup

## Auto-Deployment

The bot automatically uses smart deployment on startup unless `AUTO_DEPLOY_COMMANDS=false`.

## Benefits

1. **Saves API quota**: Only deploys when commands change
2. **Handles rate limits**: Gracefully handles Discord's daily limits
3. **Faster startup**: Skips deployment when not needed
4. **Better logging**: Clear feedback about what's happening
5. **Fallback support**: Falls back to legacy method if needed

## Troubleshooting

If you hit the daily command creation limit:
1. Wait until tomorrow (resets at midnight UTC)
2. Deploy to a guild instead: `npm run deploy:guild`
3. Use existing commands without changes

The smart system will automatically detect and handle rate limiting.
