require('dotenv').config();
const fs = require('fs');
const path = require('path');

class SmartCommandDeployer {
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
            console.log(`⏳ Rate limited. Retry after ${retryAfter} seconds.`);
            console.log(`Daily limit: ${errorBody.message}`);
            throw new Error(`Rate limited: ${errorBody.message}`);
        }
        
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorBody}`);
        }

        return await response.json();
    }

    // Compare two commands to see if they're different
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

    async checkDailyLimit() {
        try {
            // Try a small test request to check if we're rate limited
            await this.makeRequest(`/applications/${this.clientId}`);
            console.log('✅ No rate limiting detected');
            return false;
        } catch (error) {
            if (error.message.includes('daily application command creates')) {
                console.log('🚫 Daily command creation limit reached');
                return true;
            }
            throw error;
        }
    }

    async smartDeploy(isGuild = false, guildId = null) {
        try {
            console.log(`🤖 Smart deployment ${isGuild ? `to guild ${guildId}` : 'globally'}...`);
            
            // Check daily limit first
            const rateLimited = await this.checkDailyLimit();
            if (rateLimited) {
                console.log('❌ Cannot deploy: Daily limit reached. Try again tomorrow or deploy to guild.');
                return;
            }

            // Load commands from files
            const newCommands = await this.loadCommands();
            console.log(`📦 Loaded ${newCommands.length} local commands`);

            // Get current deployed commands
            const endpoint = isGuild 
                ? `/applications/${this.clientId}/guilds/${guildId}/commands`
                : `/applications/${this.clientId}/commands`;
            
            const currentCommands = await this.makeRequest(endpoint);
            console.log(`📋 Current deployed commands: ${currentCommands.length}`);

            // Compare commands
            const commandsChanged = this.compareCommandSets(currentCommands, newCommands);
            
            if (!commandsChanged) {
                console.log('✅ No changes detected. Skipping deployment.');
                return;
            }

            console.log('📝 Changes detected. Deploying...');
            
            // Deploy changes
            const deployed = await this.makeRequest(endpoint, 'PUT', newCommands);
            console.log(`✅ Successfully deployed ${deployed.length} commands!`);
            
        } catch (error) {
            console.error('❌ Smart deployment failed:', error.message);
            
            if (error.message.includes('daily application command creates')) {
                console.log('\n💡 Solutions:');
                console.log('1. Wait until tomorrow (resets at midnight UTC)');
                console.log('2. Deploy to guild instead: node smart-deploy.js guild <guildId>');
                console.log('3. Use existing commands without changes');
            }
        }
    }

    compareCommandSets(current, new_) {
        if (current.length !== new_.length) {
            console.log(`📊 Command count changed: ${current.length} → ${new_.length}`);
            return true;
        }

        for (let i = 0; i < new_.length; i++) {
            const newCmd = new_[i];
            const currentCmd = current.find(cmd => cmd.name === newCmd.name);
            
            if (!currentCmd) {
                console.log(`➕ New command: ${newCmd.name}`);
                return true;
            }
            
            if (!this.commandsEqual(currentCmd, newCmd)) {
                console.log(`🔄 Changed command: ${newCmd.name}`);
                return true;
            }
        }

        // Check for deleted commands
        for (const currentCmd of current) {
            if (!new_.find(cmd => cmd.name === currentCmd.name)) {
                console.log(`➖ Deleted command: ${currentCmd.name}`);
                return true;
            }
        }

        return false;
    }

    async loadCommands() {
        const commands = [];
        const commandsPath = path.join(__dirname, 'src', 'commands');
        
        if (!fs.existsSync(commandsPath)) {
            console.log('❌ Commands directory not found');
            return [];
        }

        const commandFolders = fs.readdirSync(commandsPath);
        
        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            if (!fs.lstatSync(folderPath).isDirectory()) continue;
            
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                try {
                    const filePath = path.join(folderPath, file);
                    delete require.cache[require.resolve(filePath)]; // Clear cache
                    const command = require(filePath);
                    if (command.data) {
                        commands.push(command.data.toJSON());
                        console.log(`📝 Loaded command: ${command.data.name}`);
                    }
                } catch (error) {
                    console.log(`❌ Failed to load ${file}: ${error.message}`);
                }
            }
        }
        
        return commands;
    }
}

// Main execution
async function main() {
    const deployer = new SmartCommandDeployer();
    const args = process.argv.slice(2);
    const deployType = args[0] || 'global';
    
    try {
        if (deployType === 'guild') {
            const guildId = args[1] || process.env.GUILD_ID;
            if (!guildId) {
                console.error('❌ Guild ID required. Set GUILD_ID in .env or pass as argument: node smart-deploy.js guild <guildId>');
                process.exit(1);
            }
            await deployer.smartDeploy(true, guildId);
        } else {
            await deployer.smartDeploy(false);
        }
    } catch (error) {
        console.error('💥 Failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
