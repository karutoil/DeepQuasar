# Use Node.js 18 Alpine as base image for smaller size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    && ln -sf python3 /usr/bin/python

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code (only what's needed for production)
COPY src/ ./src/
#COPY lavalink/ ./lavalink/

# Create logs directory
RUN mkdir -p logs transcripts

# Change ownership to non-root user
RUN chown -R botuser:nodejs /app

# Switch to non-root user
USER botuser

# Expose port for health checks (if needed)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "console.log('Bot health check')" || exit 1

# Start the bot
CMD ["npm", "start"]
