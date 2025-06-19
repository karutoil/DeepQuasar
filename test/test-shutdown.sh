#!/bin/bash

# Script to test graceful shutdown
echo "🧪 Testing bot graceful shutdown..."

# Start the bot
echo "Starting the bot..."
npm start &
BOT_PID=$!

# Wait a few seconds for the bot to start
sleep 5

echo "Bot started with PID: $BOT_PID"
echo "Waiting 10 seconds before shutdown test..."
sleep 10

# Send SIGTERM signal (graceful shutdown)
echo "Sending SIGTERM signal..."
kill -TERM $BOT_PID

# Wait for the bot to shutdown gracefully
echo "Waiting for graceful shutdown..."
wait $BOT_PID
EXIT_CODE=$?

echo "Bot exited with code: $EXIT_CODE"

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Graceful shutdown test passed!"
else
    echo "❌ Graceful shutdown test failed with exit code: $EXIT_CODE"
fi
