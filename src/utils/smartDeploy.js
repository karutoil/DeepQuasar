const fs = require('fs');
const path = require('path');

class SmartDeploymentService {
    constructor() {
        this.token = process.env.DISCORD_TOKEN;
        this.clientId = process.env.CLIENT_ID;
        this.baseURL = 'https://discord.com/api/v10';
    }

    async makeRequest(endpoint, method = 'GET', body = null) {
        const url = `${this.baseURL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Authorization': `Bot ${this.token}`,
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        
        if (response.status === 429) {
            const errorBody = await response.json();
            const retryAfter = errorBody.retry_after || 60;
            throw new Error(`Rate limited: ${errorBody.message}. Retry after ${retryAfter} seconds.`);
        }
        
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorBody}`);
        }

        return await response.json();
    }

    async loadCommands() {
        const commands = [];
        const modulesPath = path.join(__dirname, '../modules');
        
        if (!fs.existsSync(modulesPath)) {
            return [];
        }

        // Load module configuration to check which modules are enabled
        const ModuleManager = require('../modules/index.js');
        const moduleManager = new ModuleManager();
        const enabledModules = moduleManager.getEnabledModules();

        const moduleDirectories = fs.readdirSync(modulesPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        for (const moduleDir of moduleDirectories) {
            // Skip disabled modules
            if (!enabledModules.includes(moduleDir)) {
                continue;
            }

            const commandsPath = path.join(modulesPath, moduleDir, 'commands');
            
            if (!fs.existsSync(commandsPath)) {
                continue; // Module might not have commands
            }
            
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                try {
                    const filePath = path.join(commandsPath, file);
                    delete require.cache[require.resolve(filePath)]; // Clear cache
                    const command = require(filePath);
                    if (command.data && command.execute) {
                        commands.push(command.data.toJSON());
                    }
                } catch (error) {
                    // Silently skip invalid commands during auto-deploy
                    continue;
                }
            }
        }
        
        return commands;
    }

    commandsEqual(cmd1, cmd2) {
        const normalize = (cmd) => ({
            name: cmd.name,
            description: cmd.description,
            type: cmd.type || 1,
            options: cmd.options || [],
            default_permission: cmd.default_permission,
            default_member_permissions: cmd.default_member_permissions,
            dm_permission: cmd.dm_permission
        });

        const norm1 = normalize(cmd1);
        const norm2 = normalize(cmd2);
        
        return JSON.stringify(norm1) === JSON.stringify(norm2);
    }

    compareCommandSets(current, new_) {
        if (current.length !== new_.length) {
            return true;
        }

        for (let i = 0; i < new_.length; i++) {
            const newCmd = new_[i];
            const currentCmd = current.find(cmd => cmd.name === newCmd.name);
            
            if (!currentCmd || !this.commandsEqual(currentCmd, newCmd)) {
                return true;
            }
        }

        // Check for deleted commands
        for (const currentCmd of current) {
            if (!new_.find(cmd => cmd.name === currentCmd.name)) {
                return true;
            }
        }

        return false;
    }

    async smartDeploy(client, isGuild = false, guildId = null) {
        try {
            const logger = client.logger || console;
            
            // Load commands from files
            const newCommands = await this.loadCommands();
            if (newCommands.length === 0) {
                logger.warn('No valid commands found to deploy');
                return false;
            }

            // Get current deployed commands
            const endpoint = isGuild 
                ? `/applications/${this.clientId}/guilds/${guildId}/commands`
                : `/applications/${this.clientId}/commands`;
            
            let currentCommands;
            try {
                currentCommands = await this.makeRequest(endpoint);
            } catch (error) {
                if (error.message.includes('Rate limited')) {
                    logger.warn('⚠️ Command deployment skipped: Rate limited');
                    return false;
                }
                throw error;
            }

            // Compare commands
            const commandsChanged = this.compareCommandSets(currentCommands, newCommands);
            
            if (!commandsChanged) {
                logger.info('✅ Commands are up to date, skipping deployment');
                return true;
            }

            logger.info(`🔄 Commands changed, deploying ${newCommands.length} commands...`);
            
            // Deploy changes
            const deployed = await this.makeRequest(endpoint, 'PUT', newCommands);
            logger.info(`✅ Successfully deployed ${deployed.length} commands!`);
            
            return true;
            
        } catch (error) {
            const logger = client.logger || console;
            
            if (error.message.includes('daily application command creates')) {
                logger.warn('⚠️ Daily command creation limit reached. Skipping deployment.');
                logger.warn('💡 Consider deploying to guild instead or wait until tomorrow.');
                return false;
            }
            
            logger.error('❌ Smart deployment failed:', error.message);
            return false;
        }
    }
}

module.exports = { SmartDeploymentService };
