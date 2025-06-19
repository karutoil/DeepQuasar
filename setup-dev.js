#!/usr/bin/env node

/**
 * Development Setup Script
 * Helps set up the development environment for the Discord Music Bot
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

console.log('🛠️  Discord Music Bot - Development Setup\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
    fs.writeFileSync(envPath, envExample);
    console.log('✅ .env file created');
    console.log('⚠️  Please edit .env with your Discord token and other configuration');
    console.log('');
}

// Check MongoDB connection
async function checkMongoDB() {
    return new Promise((resolve) => {
        exec('mongod --version', (error) => {
            if (error) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

// Check if MongoDB is running
async function isMongoRunning() {
    return new Promise((resolve) => {
        exec('mongo --eval "db.runCommand({ connectionStatus: 1 })" --quiet', (error) => {
            resolve(!error);
        });
    });
}

async function main() {
    console.log('🗄️  Checking MongoDB...');
    
    const mongoInstalled = await checkMongoDB();
    if (!mongoInstalled) {
        console.log('❌ MongoDB is not installed or not in PATH');
        console.log('📦 Please install MongoDB:');
        console.log('   - Ubuntu/Debian: sudo apt install mongodb');
        console.log('   - macOS: brew install mongodb/brew/mongodb-community');
        console.log('   - Windows: Download from https://www.mongodb.com/try/download/community');
        console.log('');
        console.log('🐳 Alternative: Use Docker:');
        console.log('   docker run --name mongo-music-bot -p 27017:27017 -d mongo');
        console.log('');
    } else {
        const mongoRunning = await isMongoRunning();
        if (!mongoRunning) {
            console.log('⚠️  MongoDB is installed but not running');
            console.log('🚀 Start MongoDB:');
            console.log('   - Linux/macOS: sudo systemctl start mongod (or brew services start mongodb/brew/mongodb-community)');
            console.log('   - Windows: net start MongoDB');
            console.log('   - Docker: docker start mongo-music-bot');
        } else {
            console.log('✅ MongoDB is running');
        }
    }
    
    console.log('');
    console.log('🎵 Checking Lavalink...');
    
    const lavalinkJar = path.join(__dirname, 'lavalink', 'Lavalink.jar');
    if (fs.existsSync(lavalinkJar)) {
        console.log('✅ Lavalink.jar found');
        console.log('🚀 To start Lavalink:');
        console.log('   cd lavalink && java -jar Lavalink.jar');
    } else {
        console.log('❌ Lavalink.jar not found');
        console.log('📥 Download Lavalink v4:');
        console.log('   https://github.com/lavalink-devs/Lavalink/releases');
        console.log('   Place Lavalink.jar in the lavalink/ directory');
    }
    
    console.log('');
    console.log('📋 Setup Checklist:');
    console.log('□ MongoDB running');
    console.log('□ Lavalink server running');
    console.log('□ .env configured with Discord token');
    console.log('□ Bot invited to Discord server with proper permissions');
    console.log('');
    console.log('🎯 When ready:');
    console.log('   npm run deploy  # Deploy slash commands');
    console.log('   npm run dev     # Start development server');
}

main().catch(console.error);
