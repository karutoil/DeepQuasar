const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output with colors
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        const coloredLevel = {
            error: chalk.red.bold('ERROR'),
            warn: chalk.yellow.bold('WARN'),
            info: chalk.blue.bold('INFO'),
            debug: chalk.green.bold('DEBUG')
        }[level] || level.toUpperCase();

        const coloredTimestamp = chalk.gray(timestamp);
        const coloredMessage = level === 'error' ? chalk.red(message) : message;

        let output = `${coloredTimestamp} [${coloredLevel}] ${coloredMessage}`;
        
        if (stack) {
            output += `\n${chalk.red(stack)}`;
        }
        
        return output;
    })
);

// File format (without colors)
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: fileFormat,
    transports: [
        // Console transport with colors
        new winston.transports.Console({
            format: consoleFormat
        }),

        // Error logs
        new DailyRotateFile({
            filename: path.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true
        }),

        // Combined logs
        new DailyRotateFile({
            filename: path.join(logsDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true
        }),

        // Command logs
        new DailyRotateFile({
            filename: path.join(logsDir, 'commands-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            zippedArchive: true,
            level: 'info'
        })
    ]
});

// Add custom methods for specific logging types
logger.command = (user, guild, command, args) => {
    logger.info(`Command executed: ${command}`, {
        userId: user.id,
        username: user.username,
        guildId: guild?.id,
        guildName: guild?.name,
        command,
        args,
        type: 'command'
    });
};

logger.music = (action, details) => {
    logger.info(`Music action: ${action}`, {
        ...details,
        type: 'music'
    });
};

logger.database = (action, details) => {
    logger.info(`Database action: ${action}`, {
        ...details,
        type: 'database'
    });
};

logger.lavalink = (event, details) => {
    logger.info(`Lavalink event: ${event}`, {
        ...details,
        type: 'lavalink'
    });
};

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
    new DailyRotateFile({
        filename: path.join(logsDir, 'exceptions-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true
    })
);

logger.rejections.handle(
    new DailyRotateFile({
        filename: path.join(logsDir, 'rejections-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true
    })
);

module.exports = logger;
