// MongoDB initialization script
// This script creates the bot user and database with proper permissions

db = db.getSiblingDB('discord-music-bot');

// Create a user for the bot with read/write permissions
db.createUser({
  user: 'botuser',
  pwd: 'botpassword123',
  roles: [
    {
      role: 'readWrite',
      db: 'discord-music-bot'
    }
  ]
});

// Insert initial data or create collections if needed
db.createCollection('guilds');
db.createCollection('users');
db.createCollection('playlists');
db.createCollection('embedtemplates');

print('MongoDB initialization completed for discord-music-bot database');
