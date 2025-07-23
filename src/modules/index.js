/**
 * Module Manager for DeepQuasar Bot
 * Manages loading and enabling/disabling of command modules
 */

const fs = require('fs');
const path = require('path');

class ModuleManager {
    constructor() {
        this.modules = new Map();
        this.enabledModules = new Set();
        this.loadModuleConfig();
    }

    /**
     * Load module configuration from environment variables
     */
    loadModuleConfig() {
        // Default enabled modules - can be overridden by environment variables
        const defaultEnabledModules = [
            'ai', 'information', 'music', 'utils', 'templates', 
            'selfrole', 'autorole', 'tempvc', 'tickets', 
            'general', 'moderation', 'lfg', 'reminders', 'web'
        ];

        // Load enabled modules from environment variable or use defaults
        const enabledFromEnv = process.env.ENABLED_MODULES;
        if (enabledFromEnv) {
            const modulesList = enabledFromEnv.split(',').map(m => m.trim().toLowerCase());
            modulesList.forEach(module => this.enabledModules.add(module));
        } else {
            defaultEnabledModules.forEach(module => this.enabledModules.add(module));
        }

        // Check for individual module enable/disable flags
        const allModules = defaultEnabledModules;
        allModules.forEach(module => {
            const envVar = `ENABLE_${module.toUpperCase()}_MODULE`;
            const envValue = process.env[envVar];
            
            if (envValue !== undefined) {
                if (envValue.toLowerCase() === 'true' || envValue === '1') {
                    this.enabledModules.add(module);
                } else if (envValue.toLowerCase() === 'false' || envValue === '0') {
                    this.enabledModules.delete(module);
                }
            }
        });
    }

    /**
     * Check if a module is enabled
     */
    isModuleEnabled(moduleName) {
        return this.enabledModules.has(moduleName.toLowerCase());
    }

    /**
     * Get list of enabled modules
     */
    getEnabledModules() {
        return Array.from(this.enabledModules);
    }

    /**
     * Load all enabled modules
     */
    async loadModules(client) {
        const modulesPath = __dirname;
        const moduleDirectories = fs.readdirSync(modulesPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        let loadedCount = 0;
        let totalCommands = 0;

        for (const moduleDir of moduleDirectories) {
            if (!this.isModuleEnabled(moduleDir)) {
                client.logger.info(`Module '${moduleDir}' is disabled, skipping...`);
                continue;
            }

            const modulePath = path.join(modulesPath, moduleDir);
            const moduleIndexPath = path.join(modulePath, 'index.js');

            if (fs.existsSync(moduleIndexPath)) {
                try {
                    delete require.cache[require.resolve(moduleIndexPath)];
                    const moduleExport = require(moduleIndexPath);
                    
                    if (typeof moduleExport.load === 'function') {
                        const result = await moduleExport.load(client);
                        if (result && result.commandCount) {
                            totalCommands += result.commandCount;
                        }
                        this.modules.set(moduleDir, moduleExport);
                        loadedCount++;
                        client.logger.info(`✅ Loaded module: ${moduleDir}`);
                    } else {
                        client.logger.warn(`Module '${moduleDir}' does not export a load function`);
                    }
                } catch (error) {
                    client.logger.error(`Failed to load module '${moduleDir}':`, error);
                }
            } else {
                client.logger.warn(`Module '${moduleDir}' missing index.js file`);
            }
        }

        client.logger.info(`Loaded ${loadedCount} modules with ${totalCommands} commands total`);
        return { moduleCount: loadedCount, commandCount: totalCommands };
    }

    /**
     * Get module information
     */
    getModuleInfo(moduleName) {
        const module = this.modules.get(moduleName);
        return module ? module.info : null;
    }

    /**
     * Get all loaded modules info
     */
    getAllModulesInfo() {
        const info = {};
        for (const [name, module] of this.modules) {
            info[name] = {
                enabled: this.isModuleEnabled(name),
                info: module.info || {}
            };
        }
        return info;
    }
}

module.exports = ModuleManager;