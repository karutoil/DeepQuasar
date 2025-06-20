#!/bin/bash

# Docker Build Test Script
# This script helps test the Docker build locally before pushing to CI

set -e

echo "🔨 Testing Docker Build Locally"
echo "==============================="

# Navigate to the project root
cd "$(dirname "$0")/.."

echo "📁 Current directory: $(pwd)"
echo "📦 Checking required files..."

# Check if required files exist
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

if [ ! -f "package-lock.json" ]; then
    echo "❌ package-lock.json not found"
    exit 1
fi

if [ ! -d "src" ]; then
    echo "❌ src directory not found"
    exit 1
fi

echo "✅ Required files found"

# Build the Docker image
echo ""
echo "🏗️  Building Docker image..."
docker build -f Docker/Dockerfile -t discord-bot:test .

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    
    # Test container startup
    echo ""
    echo "🧪 Testing container startup..."
    
    # Create test environment
    cat > test.env << EOF
DISCORD_TOKEN=test_token
CLIENT_ID=123456789
MONGODB_URI=mongodb://localhost:27017/test
LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=test
NODE_ENV=test
EOF
    
    # Test container (should fail due to invalid token, but container should start)
    echo "🚀 Starting test container..."
    timeout 15s docker run --rm --env-file test.env discord-bot:test || true
    
    # Cleanup
    rm -f test.env
    
    echo ""
    echo "✅ Test completed! Build appears to be working."
    echo "📋 Image details:"
    docker images discord-bot:test --format "table {{.Size}}\t{{.CreatedAt}}"
    
else
    echo "❌ Docker build failed!"
    exit 1
fi
