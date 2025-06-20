#!/bin/bash

# Discord Bot Docker Deployment Script
# This script helps you deploy the Discord bot using Docker

set -e

echo "🤖 Discord Bot Docker Deployment Script"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Navigate to Docker directory
cd "$(dirname "$0")"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    echo "⚠️  Please edit the .env file and add your Discord bot credentials:"
    echo "   - DISCORD_TOKEN (required)"
    echo "   - CLIENT_ID (required)"
    echo "   - Other optional settings"
    echo ""
    echo "After editing .env, run this script again."
    exit 0
fi

# Check if required environment variables are set
source .env

if [ -z "$DISCORD_TOKEN" ] || [ "$DISCORD_TOKEN" = "DISCORD_TOKEN_PLACEHOLDER" ]; then
    echo "❌ DISCORD_TOKEN is not set in .env file"
    exit 1
fi

if [ -z "$CLIENT_ID" ] || [ "$CLIENT_ID" = "your_client_id_here" ]; then
    echo "❌ CLIENT_ID is not set in .env file"
    exit 1
fi

echo "✅ Environment variables validated"

# Function to wait for service health
wait_for_service() {
    local service=$1
    local max_attempts=60
    local attempt=1
    
    echo "⏳ Waiting for $service to be healthy..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps | grep -q "$service.*healthy"; then
            echo "✅ $service is healthy"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts - $service is not ready yet..."
        sleep 5
        ((attempt++))
    done
    
    echo "❌ $service failed to become healthy within expected time"
    return 1
}

# Stop existing containers if running
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Build the bot image
echo "🔨 Building Discord bot image..."
docker-compose build discord-bot

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
wait_for_service "mongodb"
wait_for_service "lavalink"

# Check if bot is starting properly
echo "🤖 Starting Discord bot..."
sleep 10

# Show status
echo ""
echo "📊 Service Status:"
echo "=================="
docker-compose ps

echo ""
echo "📋 Quick Commands:"
echo "=================="
echo "View logs:           docker-compose logs -f"
echo "View bot logs:       docker-compose logs -f discord-bot"
echo "Restart bot:         docker-compose restart discord-bot"
echo "Stop all:            docker-compose down"
echo "Update bot:          docker-compose build discord-bot && docker-compose up -d"

echo ""
echo "✅ Deployment complete! Check the logs above for any issues."
echo "   The bot should now be connecting to Discord."
