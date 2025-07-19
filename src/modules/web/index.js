/**
 * Web API Module for DeepQuasar Dashboard
 * Provides REST API endpoints for frontend dashboard integration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Import route handlers
const authRoutes = require('./routes/auth');
const guildRoutes = require('./routes/guild');
const musicRoutes = require('./routes/music');
const moderationRoutes = require('./routes/moderation');
const ticketRoutes = require('./routes/tickets');
const tempvcRoutes = require('./routes/tempvc');
const userRoutes = require('./routes/user');
const roleRoutes = require('./routes/roles');
const reminderRoutes = require('./routes/reminders');
const lfgRoutes = require('./routes/lfg');
const templateRoutes = require('./routes/templates');
const aiRoutes = require('./routes/ai');

class WebAPIModule {
    constructor() {
        this.app = null;
        this.server = null;
        this.client = null;
    }

    /**
     * Initialize the web API module
     */
    async load(client) {
        this.client = client;
        
        // Create Express app
        this.app = express();
        
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: false, // Allow for dashboard flexibility
        }));
        
        // CORS configuration
        this.app.use(cors({
            origin: process.env.DASHBOARD_URL || 'http://localhost:3001',
            credentials: true
        }));
        
        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Add client to request object for all routes
        this.app.use((req, res, next) => {
            req.client = client;
            next();
        });
        
        // Health check endpoint
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                botStatus: client.isReady() ? 'ready' : 'not ready',
                guilds: client.guilds.cache.size,
                users: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
            });
        });
        
        // Mount API routes
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/guild', guildRoutes);
        this.app.use('/api/music', musicRoutes);
        this.app.use('/api/moderation', moderationRoutes);
        this.app.use('/api/tickets', ticketRoutes);
        this.app.use('/api/tempvc', tempvcRoutes);
        this.app.use('/api/user', userRoutes);
        this.app.use('/api/roles', roleRoutes);
        this.app.use('/api/reminders', reminderRoutes);
        this.app.use('/api/lfg', lfgRoutes);
        this.app.use('/api/templates', templateRoutes);
        this.app.use('/api/ai', aiRoutes);
        
        // Error handling middleware
        this.app.use((error, req, res, next) => {
            client.logger.error('API Error:', error);
            
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: error.message,
                    details: error.errors
                });
            }
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: 'Authentication Error',
                    message: 'Invalid token'
                });
            }
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Authentication Error',
                    message: 'Token expired'
                });
            }
            
            res.status(error.status || 500).json({
                error: 'Internal Server Error',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        });
        
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: 'The requested endpoint does not exist'
            });
        });
        
        // Start server
        const port = process.env.WEB_PORT || 3000;
        this.server = this.app.listen(port, () => {
            client.logger.info(`🌐 Web API server listening on port ${port}`);
        });
        
        return { commandCount: 0 }; // This module doesn't add Discord commands
    }

    /**
     * Shutdown the web server
     */
    async shutdown() {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    this.client.logger.info('🌐 Web API server shut down');
                    resolve();
                });
            });
        }
    }
}

// Export module info and loader
module.exports = {
    info: {
        name: 'Web API',
        description: 'REST API for dashboard integration',
        version: '1.0.0',
        author: 'DeepQuasar Team'
    },
    load: async (client) => {
        const webModule = new WebAPIModule();
        
        // Store module instance for shutdown
        client.webModule = webModule;
        
        return await webModule.load(client);
    }
};