# Discord Bot Docker Setup Guide

This directory contains Docker configuration files to run the Discord bot with all its dependencies (MongoDB and Lavalink) in containers.

## Prerequisites

- Docker and Docker Compose installed on your system
- Discord bot token and application ID
- (Optional) Spotify API credentials for enhanced music features

## Quick Start

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file and add your credentials:**
   ```bash
   nano .env
   ```
   Fill in at least:
   - `DISCORD_TOKEN` - Your Discord bot token
   - `CLIENT_ID` - Your Discord application/client ID

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Check the logs:**
   ```bash
   docker-compose logs -f discord-bot
   ```

## Services

### MongoDB (Database)
- **Port:** 27017
- **Username:** admin
- **Password:** password123
- **Database:** discord-music-bot
- **Data persistence:** MongoDB data is stored in a Docker volume

### Lavalink (Audio Server)
- **Port:** 2333
- **Password:** your_lavalink_password_here
- **Plugins:** YouTube and LavaSrc plugins included
- **Health checks:** Automatic health monitoring

### Discord Bot
- **Dependencies:** Waits for MongoDB and Lavalink to be healthy
- **Logs:** Stored in Docker volume
- **Health checks:** Basic health monitoring
- **Auto-restart:** Unless stopped manually

## Useful Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f discord-bot
docker-compose logs -f mongodb
docker-compose logs -f lavalink
```

### Restart bot only
```bash
docker-compose restart discord-bot
```

### Update bot code
```bash
docker-compose down
docker-compose build discord-bot
docker-compose up -d
```

### Clean up (removes volumes too)
```bash
docker-compose down -v
```

## Health Monitoring

All services include health checks:
- **MongoDB:** Checks database connectivity
- **Lavalink:** Checks HTTP endpoint availability
- **Discord Bot:** Basic process health check

You can check service health with:
```bash
docker-compose ps
```

## Troubleshooting

### Bot won't start
1. Check if MongoDB and Lavalink are healthy:
   ```bash
   docker-compose ps
   ```

2. Check bot logs:
   ```bash
   docker-compose logs discord-bot
   ```

3. Verify environment variables:
   ```bash
   docker-compose config
   ```

### Connection issues
- Ensure all required environment variables are set in `.env`
- Check if ports 27017 and 2333 are not already in use
- Verify Discord token is valid and bot is invited to your server

### Audio not working
1. Check Lavalink logs:
   ```bash
   docker-compose logs lavalink
   ```

2. Ensure Lavalink is healthy and accessible from the bot container

### Database issues
1. Check MongoDB logs:
   ```bash
   docker-compose logs mongodb
   ```

2. Connect to MongoDB to verify data:
   ```bash
   docker exec -it discord-bot-mongodb mongosh -u admin -p password123
   ```

## Configuration

### Environment Variables
Edit the `.env` file to customize:
- Discord bot settings
- Music feature limits
- Spotify integration
- OpenAI integration
- Logging levels

### Lavalink Configuration
The Lavalink configuration is mounted from `../lavalink/application.yml`. 
Modify this file to change Lavalink settings.

### Bot Configuration
Bot settings are configured through environment variables and the configuration files in the `src/config/` directory.

## Security Notes

- Change default passwords in production
- Use Docker secrets for sensitive data in production
- Regularly update container images
- Monitor container logs for security issues

## Data Persistence

- **MongoDB data:** Stored in `mongodb_data` volume
- **Bot logs:** Stored in `bot_logs` volume
- **Transcripts:** Stored in `bot_transcripts` volume

Data persists across container restarts and updates.
