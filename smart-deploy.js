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

        // For DELETE requests, response might be empty
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    }

    // Compare two commands to see if they're different
    commandsEqual(cmd1, cmd2) {
        const normalize = (cmd) => {
            const normalizeOptions = (options) => {
                if (!options) return [];
                
                // Create new, normalized option objects, sorting them and their choices
                return options.map(opt => {
                    const newOpt = {
                        type: opt.type,
                        name: opt.name,
                        description: opt.description,
                        required: opt.required || false,
                    };
                    if (opt.choices) {
                        // Create a sorted copy of choices
                        newOpt.choices = [...opt.choices].sort((a, b) => a.name.localeCompare(b.name));
                    }
                    if (opt.options) {
                        // Recursively normalize sub-options
                        newOpt.options = normalizeOptions(opt.options);
                    }
                    // Add other valid option fields if they exist
                    if ('channel_types' in opt) newOpt.channel_types = opt.channel_types;
                    if ('min_value' in opt) newOpt.min_value = opt.min_value;
                    if ('max_value' in opt) newOpt.max_value = opt.max_value;
                    if ('min_length' in opt) newOpt.min_length = opt.min_length;
                    if ('max_length' in opt) newOpt.max_length = opt.max_length;
                    if ('autocomplete' in opt) newOpt.autocomplete = opt.autocomplete;

                    return newOpt;
                }).sort((a, b) => a.name.localeCompare(b.name));
            };

            // Normalize the top-level command object
            return {
                name: cmd.name,
                description: cmd.description || '',
                type: cmd.type || 1,
                options: normalizeOptions(cmd.options),
                default_member_permissions: cmd.default_member_permissions ? String(cmd.default_member_permissions) : null,
                dm_permission: cmd.dm_permission === false ? false : true, // API defaults to true if undefined
            };
        };

        const norm1 = normalize(cmd1);
        const norm2 = normalize(cmd2);
        
        const str1 = JSON.stringify(norm1);
        const str2 = JSON.stringify(norm2);

        return str1 === str2;
    }

    async checkDailyLimit() {
        try {
            // A lightweight request to check for rate limiting
            await this.makeRequest(`/applications/${this.clientId}/commands`, 'GET');
            console.log('✅ No rate limiting detected.');
            return false;
        } catch (error) {
            if (error.message.includes('429')) {
                console.log('🚫 Daily command creation/update limit likely reached.');
                return true;
            }
            // Re-throw other errors
            throw error;
        }
    }

    async createCommand(command, endpoint) {
        console.log(`➕ Creating new command: ${command.name}`);
        return this.makeRequest(endpoint, 'POST', command);
    }

    async updateCommand(commandId, command, endpoint) {
        console.log(`🔄 Updating command: ${command.name}`);
        const updateEndpoint = `${endpoint}/${commandId}`;
        return this.makeRequest(updateEndpoint, 'PATCH', command);
    }

    async deleteCommand(commandId, commandName, endpoint) {
        console.log(`➖ Deleting command: ${commandName} (${commandId})`);
        const deleteEndpoint = `${endpoint}/${commandId}`;
        return this.makeRequest(deleteEndpoint, 'DELETE');
    }

    async smartDeploy(isGuild = false, guildId = null, isCheckOnly = false) {
        try {
            const mode = isCheckOnly ? 'check' : 'deployment';
            console.log(`🤖 Smart ${mode} started ${isGuild ? `for guild ${guildId}` : 'globally'}...`);

            const newCommands = await this.loadCommands();
            console.log(`📦 Loaded ${newCommands.length} local command files.`);

            const endpoint = isGuild 
                ? `/applications/${this.clientId}/guilds/${guildId}/commands`
                : `/applications/${this.clientId}/commands`;
            
            const currentCommands = await this.makeRequest(endpoint);
            console.log(`📋 Found ${currentCommands.length} currently deployed commands.`);

            const newCommandsMap = new Map(newCommands.map(cmd => [cmd.name, cmd]));
            const currentCommandsMap = new Map(currentCommands.map(cmd => [cmd.name, cmd]));

            const toCreate = [];
            const toUpdate = [];
            const toDelete = [];

            for (const [name, newCmd] of newCommandsMap.entries()) {
                if (currentCommandsMap.has(name)) {
                    const currentCmd = currentCommandsMap.get(name);
                    if (!this.commandsEqual(currentCmd, newCmd)) {
                        toUpdate.push({ id: currentCmd.id, data: newCmd });
                    } 
                } else {
                    toCreate.push(newCmd);
                }
            }

            for (const [name, currentCmd] of currentCommandsMap.entries()) {
                if (!newCommandsMap.has(name)) {
                    toDelete.push(currentCmd);
                }
            }

            if (toCreate.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
                console.log('✅ Commands are already up-to-date. No changes needed.');
                return;
            }

            this.displayChanges(toCreate, toUpdate, toDelete);

            if (isCheckOnly) {
                console.log('\nRun the command without --check-only to apply these changes.');
                return;
            }

            console.log('\n📝 Syncing commands with Discord...');

            const rateLimited = await this.checkDailyLimit();
            if (rateLimited) {
                console.log('❌ Deployment cancelled: Daily rate limit reached.');
                return;
            }

            const totalChanges = toCreate.length + toUpdate.length + toDelete.length;

            if (totalChanges > 1) {
                console.log('🔄 Multiple changes detected. Using bulk update for efficiency.');
                await this.makeRequest(endpoint, 'PUT', newCommands);
            } else {
                console.log('⚙️ Single change detected. Applying individually.');
                for (const cmd of toDelete) {
                    await this.deleteCommand(cmd.id, cmd.name, endpoint);
                }
                for (const cmd of toUpdate) {
                    await this.updateCommand(cmd.id, cmd.data, endpoint);
                }
                for (const cmd of toCreate) {
                    await this.createCommand(cmd, endpoint);
                }
            }

            console.log('\n✅ Command sync complete!');
            console.log(`📊 Summary: ${toCreate.length} created, ${toUpdate.length} updated, ${toDelete.length} deleted.`);

        } catch (error) {
            console.error(`❌ Smart ${isCheckOnly ? 'check' : 'deployment'} failed:`, error.message);
            if (error.message.includes('daily application command creates')) {
                console.log('\n💡 Solutions:');
                console.log('1. Wait for the daily reset (midnight UTC).');
                console.log(`2. Deploy to a specific guild: node ${path.basename(__filename)} guild <guildId>`);
            }
        }
    }

    displayChanges(toCreate, toUpdate, toDelete) {
        console.log('\n🔍 Change Summary (Dry Run):');
        
        if (toCreate.length > 0) {
            console.log(`\n➕ Commands to be CREATED (${toCreate.length}):`);
            toCreate.forEach(cmd => console.log(`  - ${cmd.name}`));
        }

        if (toUpdate.length > 0) {
            console.log(`\n🔄 Commands to be UPDATED (${toUpdate.length}):`);
            toUpdate.forEach(cmd => console.log(`  - ${cmd.data.name}`));
        }

        if (toDelete.length > 0) {
            console.log(`\n➖ Commands to be DELETED (${toDelete.length}):`);
            toDelete.forEach(cmd => console.log(`  - ${cmd.name}`));
        }

        console.log('\nRun the command without --check-only to apply these changes.');
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
                        const commandData = command.data.toJSON();
                        commands.push(commandData);
                        // console.log(`📝 Loaded command: ${commandData.name}`); // Optional: uncomment for verbose logging
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
    
    const isCheckOnly = args.includes('--check-only');
    const filteredArgs = args.filter(arg => arg !== '--check-only');
    
    const deployType = filteredArgs[0] || 'global';
    const guildId = filteredArgs[1] || process.env.GUILD_ID;

    try {
        if (deployType === 'guild' && !guildId) {
            console.error('❌ Guild ID required. Set GUILD_ID in .env or pass as an argument: node smart-deploy.js guild <guildId>');
            process.exit(1);
        }

        await deployer.smartDeploy(deployType === 'guild', guildId, isCheckOnly);

    } catch (error) {
        console.error(`💥 Deployment script failed: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
