#!/bin/bash

# Quick start script for Discord Music Bot development

echo "🎵 Discord Music Bot - Quick Start"
echo "=================================="
echo

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your Discord token and configuration"
    echo
fi

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "🐳 Starting MongoDB with Docker..."
    docker-compose up -d mongodb
    echo "✅ MongoDB started at localhost:27017"
    echo
else
    echo "❌ Docker not found. Please install Docker or start MongoDB manually"
    echo "   Alternative: sudo systemctl start mongod"
    echo
fi

echo "📋 Next steps:"
echo "1. Edit .env with your Discord bot token"
echo "2. Start Lavalink: cd lavalink && java -jar Lavalink.jar"
echo "3. Deploy commands: npm run deploy"
echo "4. Start bot: npm run dev"
echo
echo "🔧 For setup help: npm run setup"
