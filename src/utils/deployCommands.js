const { SmartDeploymentService } = require('./smartDeploy');
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

async function deployCommands(client) {
    try {
        const smartDeployer = new SmartDeploymentService();
        const guildId = process.env.GUILD_ID;
        
        client.logger.info('🚀 Starting smart command deployment...');
        
        if (guildId) {
            // Deploy to specific guild (for development)
            client.logger.info(`Deploying to guild: ${guildId}`);
            return await smartDeployer.smartDeploy(client, true, guildId);
        } else {
            // Deploy globally (for production)
            client.logger.info('Deploying globally...');
            return await smartDeployer.smartDeploy(client, false);
        }
        
    } catch (error) {
        client.logger.error('❌ Smart deployment failed:', error.message);
        return false;
    }
}

module.exports = { deployCommands };
