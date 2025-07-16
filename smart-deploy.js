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
        // Only keep fields relevant for registration
        const filterCommandFields = (cmd) => {
            // Only include fields that are actually sent to Discord for registration
            const {
                name,
                description,
                type,
                options,
                default_member_permissions,
                dm_permission
            } = cmd;
            return {
                name,
                description,
                type: typeof type === 'undefined' ? 1 : type,
                options,
                default_member_permissions: default_member_permissions !== undefined && default_member_permissions !== null
                    ? String(default_member_permissions)
                    : undefined,
                dm_permission: typeof dm_permission === 'boolean' ? dm_permission : true
            };
        };

        // Normalize options for comparison
        const normalizeOptions = (options) => {
            if (!options) return [];
            return options.map(opt => {
                const {
                    type,
                    name,
                    description,
                    required,
                    choices,
                    options: subOptions,
                    channel_types,
                    min_value,
                    max_value,
                    min_length,
                    max_length,
                    autocomplete
                } = opt;
                const newOpt = {
                    type,
                    name,
                    description,
                    required: !!required
                };
                if (choices) {
                    newOpt.choices = [...choices].map(choice => ({
                        name: choice.name,
                        value: choice.value
                    })).sort((a, b) => a.name.localeCompare(b.name));
                }
                if (subOptions) {
                    newOpt.options = normalizeOptions(subOptions);
                }
                if (Array.isArray(channel_types) && channel_types.length > 0) newOpt.channel_types = [...channel_types].sort();
                if (typeof min_value !== 'undefined') newOpt.min_value = min_value;
                if (typeof max_value !== 'undefined') newOpt.max_value = max_value;
                if (typeof min_length !== 'undefined') newOpt.min_length = min_length;
                if (typeof max_length !== 'undefined') newOpt.max_length = max_length;
                if (typeof autocomplete !== 'undefined') newOpt.autocomplete = !!autocomplete;
                return newOpt;
            }).sort((a, b) => a.name.localeCompare(b.name));
        };

        // Remove Discord-only fields from remote command before comparison
        const stripDiscordFields = (cmd) => {
            const filtered = filterCommandFields(cmd);
            // Always ensure options is an array
            filtered.options = normalizeOptions(filtered.options);
            return filtered;
        };

        // Remove undefined/null fields for comparison
        const clean = obj => {
            // Remove keys with undefined or null values
            if (Array.isArray(obj)) {
                return obj.map(clean);
            } else if (obj && typeof obj === 'object') {
                const out = {};
                for (const [k, v] of Object.entries(obj)) {
                    if (v !== undefined && v !== null) out[k] = clean(v);
                }
                return out;
            }
            return obj;
        };

        // Compare only the relevant fields
        const local = clean(stripDiscordFields(cmd2));
        const remote = clean(stripDiscordFields(cmd1));

        return JSON.stringify(local) === JSON.stringify(remote);
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

    async smartDeploy(isGuild = false, guildId = null, isCheckOnly = false, isDebug = false) {
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
                        toUpdate.push({ id: currentCmd.id, data: newCmd, current: currentCmd });
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

            this.displayChanges(toCreate, toUpdate, toDelete, isDebug);

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
                let created = 0, updated = 0, deleted = 0;
                if (toDelete.length > 0) {
                    for (const cmd of toDelete) {
                        await this.deleteCommand(cmd.id, cmd.name, endpoint);
                        deleted++;
                    }
                }
                if (toUpdate.length > 0) {
                    for (const cmd of toUpdate) {
                        await this.updateCommand(cmd.id, cmd.data, endpoint);
                        updated++;
                    }
                }
                if (toCreate.length > 0) {
                    for (const cmd of toCreate) {
                        await this.createCommand(cmd, endpoint);
                        created++;
                    }
                }
                console.log(`\n✅ Command sync complete!`);
                console.log(`📊 Summary: ${created} created, ${updated} updated, ${deleted} deleted.`);
                process.exit(0);
            }

            console.log('\n✅ Command sync complete!');
            console.log(`📊 Summary: ${toCreate.length} created, ${toUpdate.length} updated, ${toDelete.length} deleted.`);
            process.exit(0);

        } catch (error) {
            console.error(`❌ Smart ${isCheckOnly ? 'check' : 'deployment'} failed:`, error.message);
            if (error.message.includes('daily application command creates')) {
                console.log('\n💡 Solutions:');
                console.log('1. Wait for the daily reset (midnight UTC).');
                console.log(`2. Deploy to a specific guild: node ${path.basename(__filename)} guild <guildId>`);
            }
            process.exit(1);
        }
    }

    displayChanges(toCreate, toUpdate, toDelete, isDebug = false) {
        console.log('\n🔍 Change Summary (Dry Run):');
        
        if (toCreate.length > 0) {
            console.log(`\n➕ Commands to be CREATED (${toCreate.length}):`);
            toCreate.forEach(cmd => console.log(`  - ${cmd.name}`));
        }

        if (toUpdate.length > 0) {
            console.log(`\n🔄 Commands to be UPDATED (${toUpdate.length}):`);
            toUpdate.forEach(cmd => {
                console.log(`  - ${cmd.data.name}`);
                if (isDebug) {
                    try {
                        const diff = getObjectDiff(cmd.current, cmd.data);
                        if (Object.keys(diff).length > 0) {
                            console.log(`    └─ Diff:`);
                            console.log(JSON.stringify(diff, null, 2));
                        }
                    } catch (e) {}
                }
            });
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

function getObjectDiff(obj1, obj2) {
    // Returns a shallow diff of obj1 vs obj2 (fields that differ)
    const diff = {};
    for (const key of Object.keys(obj1)) {
        if (typeof obj1[key] === 'object' && obj1[key] !== null && typeof obj2[key] === 'object' && obj2[key] !== null) {
            if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
                diff[key] = { remote: obj1[key], local: obj2[key] };
            }
        } else if (obj1[key] !== obj2[key]) {
            diff[key] = { remote: obj1[key], local: obj2[key] };
        }
    }
    for (const key of Object.keys(obj2)) {
        if (!(key in obj1)) {
            diff[key] = { remote: undefined, local: obj2[key] };
        }
    }
    return diff;
}

async function compareCommands() {
    const deployer = new SmartCommandDeployer();
    console.log('🔍 Comparing global commands with local commands...');
    const localCommands = await deployer.loadCommands();
    const endpoint = `/applications/${deployer.clientId}/commands`;
    const remoteCommands = await deployer.makeRequest(endpoint);

    const localMap = new Map(localCommands.map(cmd => [cmd.name, cmd]));
    const remoteMap = new Map(remoteCommands.map(cmd => [cmd.name, cmd]));

    const onlyLocal = [];
    const onlyRemote = [];
    const differing = [];

    for (const [name, localCmd] of localMap.entries()) {
        if (!remoteMap.has(name)) {
            onlyLocal.push(name);
        } else {
            const remoteCmd = remoteMap.get(name);
            if (!deployer.commandsEqual(remoteCmd, localCmd)) {
                differing.push(name);
            }
        }
    }
    for (const [name] of remoteMap.entries()) {
        if (!localMap.has(name)) {
            onlyRemote.push(name);
        }
    }

    console.log('\n📦 Local-only commands:', onlyLocal.length ? onlyLocal.join(', ') : 'None');
    console.log('🌐 Remote-only commands:', onlyRemote.length ? onlyRemote.join(', ') : 'None');
    console.log('🔄 Differing commands:', differing.length ? differing.join(', ') : 'None');
}

async function main() {
    const deployer = new SmartCommandDeployer();
    const args = process.argv.slice(2);

    const isCheckOnly = args.includes('--check-only');
    const isDebug = args.includes('--debug');
    const filteredArgs = args.filter(arg => arg !== '--check-only' && arg !== '--debug');

    const deployType = filteredArgs[0] || 'global';
    const guildId = filteredArgs[1] || process.env.GUILD_ID;

    try {
        if (deployType === 'compare') {
            await compareCommands();
            return;
        }

        if (deployType === 'guild' && !guildId) {
            console.error('❌ Guild ID required. Set GUILD_ID in .env or pass as an argument: node smart-deploy.js guild <guildId>');
            process.exit(1);
        }

        await deployer.smartDeploy(deployType === 'guild', guildId, isCheckOnly, isDebug);

    } catch (error) {
        console.error(`💥 Deployment script failed: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
