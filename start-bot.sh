#!/bin/bash

# Discord Bot Startup Script
# This script starts MongoDB, Lavalink, and the Discord bot in the correct order

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAVALINK_DIR="$SCRIPT_DIR/lavalink"
LAVALINK_JAR="$LAVALINK_DIR/Lavalink.jar"
LAVALINK_PORT=2333
MONGO_PORT=27017
MAX_WAIT_TIME=60  # Maximum wait time in seconds for each service

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to check if a port is open
check_port() {
    local port=$1
    nc -z localhost $port 2>/dev/null
}

# Function to wait for a service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_wait=$3
    
    print_status "Waiting for $service_name to be ready on port $port..."
    
    local count=0
    while ! check_port $port; do
        if [ $count -ge $max_wait ]; then
            print_error "$service_name failed to start within $max_wait seconds"
            return 1
        fi
        
        echo -n "."
        sleep 1
        count=$((count + 1))
    done
    
    echo
    print_success "$service_name is ready!"
    return 0
}

# Function to cleanup on exit
cleanup() {
    print_warning "Shutting down services..."
    
    # Kill the bot if it's running
    if [ ! -z "$BOT_PID" ]; then
        print_status "Stopping Discord bot (PID: $BOT_PID)..."
        kill $BOT_PID 2>/dev/null || true
    fi
    
    # Kill Lavalink if it's running
    if [ ! -z "$LAVALINK_PID" ]; then
        print_status "Stopping Lavalink (PID: $LAVALINK_PID)..."
        kill $LAVALINK_PID 2>/dev/null || true
    fi
    
    # Stop MongoDB if we started it
    if [ "$MONGO_STARTED" = "true" ]; then
        print_status "Stopping MongoDB..."
        sudo systemctl stop mongod 2>/dev/null || sudo pkill mongod 2>/dev/null || true
    fi
    
    print_success "Cleanup complete"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
print_status "Starting Discord Bot Stack..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the bot's root directory."
    exit 1
fi

# Check if Lavalink jar exists
if [ ! -f "$LAVALINK_JAR" ]; then
    print_error "Lavalink.jar not found at $LAVALINK_JAR"
    print_error "Please make sure Lavalink is properly installed."
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    print_error "Java is not installed or not in PATH"
    print_error "Please install Java 17 or higher to run Lavalink"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    print_error "Please install Node.js to run the Discord bot"
    exit 1
fi

# Step 1: Start MongoDB
print_status "Starting MongoDB..."

# Check if MongoDB is already running
if check_port $MONGO_PORT; then
    print_success "MongoDB is already running on port $MONGO_PORT"
    MONGO_STARTED="false"
else
    # Try to start MongoDB using systemctl first, then fallback to direct command
    if sudo systemctl start mongod 2>/dev/null; then
        print_status "Started MongoDB using systemctl"
        MONGO_STARTED="true"
    elif sudo mongod --fork --logpath /var/log/mongodb/mongod.log --dbpath /var/lib/mongodb 2>/dev/null; then
        print_status "Started MongoDB using direct command"
        MONGO_STARTED="true"
    else
        print_error "Failed to start MongoDB"
        print_error "Please ensure MongoDB is installed and you have proper permissions"
        exit 1
    fi
    
    # Wait for MongoDB to be ready
    if ! wait_for_service "MongoDB" $MONGO_PORT $MAX_WAIT_TIME; then
        cleanup
        exit 1
    fi
fi

# Step 2: Start Lavalink
print_status "Starting Lavalink..."

# Check if Lavalink is already running
if check_port $LAVALINK_PORT; then
    print_warning "Lavalink is already running on port $LAVALINK_PORT"
    print_warning "Stopping existing Lavalink instance..."
    pkill -f "Lavalink.jar" 2>/dev/null || true
    sleep 3
fi

# Start Lavalink in the background
cd "$LAVALINK_DIR"
java -jar Lavalink.jar > ../logs/lavalink.log 2>&1 &
LAVALINK_PID=$!
cd "$SCRIPT_DIR"

print_status "Lavalink started with PID: $LAVALINK_PID"

# Wait for Lavalink to be ready
if ! wait_for_service "Lavalink" $LAVALINK_PORT $MAX_WAIT_TIME; then
    cleanup
    exit 1
fi

# Give Lavalink a few extra seconds to fully initialize
print_status "Giving Lavalink extra time to fully initialize..."
sleep 5

# Step 3: Start the Discord Bot
print_status "Starting Discord Bot..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing npm dependencies..."
    npm install
fi

# Start the bot
npm start &
BOT_PID=$!

print_status "Discord Bot started with PID: $BOT_PID"

# Wait a moment and check if the bot is still running
sleep 5
if ! kill -0 $BOT_PID 2>/dev/null; then
    print_error "Discord Bot failed to start or crashed immediately"
    print_error "Check the logs for more information"
    cleanup
    exit 1
fi

print_success "All services are running successfully!"
print_status "MongoDB: Port $MONGO_PORT"
print_status "Lavalink: Port $LAVALINK_PORT (PID: $LAVALINK_PID)"
print_status "Discord Bot: PID $BOT_PID"
print_status ""
print_status "Press Ctrl+C to stop all services"

# Keep the script running and monitor the bot
while true; do
    if ! kill -0 $BOT_PID 2>/dev/null; then
        print_error "Discord Bot process has stopped unexpectedly"
        cleanup
        exit 1
    fi
    
    if ! kill -0 $LAVALINK_PID 2>/dev/null; then
        print_error "Lavalink process has stopped unexpectedly"
        cleanup
        exit 1
    fi
    
    sleep 10
done
