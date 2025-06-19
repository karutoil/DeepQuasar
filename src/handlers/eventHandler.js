const fs = require('fs');
const path = require('path');

async function loadEvents(client) {
    const eventsPath = path.join(__dirname, '../events');
    
    if (!fs.existsSync(eventsPath)) {
        client.logger.warn('Events directory not found, creating it...');
        fs.mkdirSync(eventsPath, { recursive: true });
        return;
    }

    let totalEvents = 0;

    // Load events from the root events directory
    const eventFiles = fs.readdirSync(eventsPath);
    
    for (const item of eventFiles) {
        const itemPath = path.join(eventsPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
            // Load events from subdirectory
            const subDirFiles = fs.readdirSync(itemPath).filter(file => file.endsWith('.js'));
            
            for (const file of subDirFiles) {
                const filePath = path.join(itemPath, file);
                totalEvents += await loadSingleEvent(client, filePath);
            }
        } else if (item.endsWith('.js')) {
            // Load event from root directory
            totalEvents += await loadSingleEvent(client, itemPath);
        }
    }

    client.logger.info(`Loaded ${totalEvents} events`);
}

async function loadSingleEvent(client, filePath) {
    try {
        delete require.cache[require.resolve(filePath)];
        const event = require(filePath);

        // Validate event structure
        if (!event.name || !event.execute) {
            client.logger.warn(`Event at ${filePath} is missing required properties`);
            return 0;
        }

        // Register the event
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }

        client.logger.debug(`Loaded event: ${event.name}`);
        return 1;

    } catch (error) {
        client.logger.error(`Error loading event ${path.basename(filePath)}:`, error);
        return 0;
    }
}

async function reloadEvent(client, eventName) {
    // Find the event file
    const eventsPath = path.join(__dirname, '../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    let eventPath = null;
    
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const tempEvent = require(filePath);
        
        if (tempEvent.name === eventName) {
            eventPath = filePath;
            break;
        }
    }
    
    if (!eventPath) {
        throw new Error(`Event file for ${eventName} not found`);
    }
    
    // Remove all existing listeners for this event
    client.removeAllListeners(eventName);
    
    // Delete from cache and reload
    delete require.cache[require.resolve(eventPath)];
    const newEvent = require(eventPath);
    
    // Validate new event
    if (!newEvent.name || !newEvent.execute) {
        throw new Error(`Reloaded event ${eventName} is missing required properties`);
    }
    
    // Re-register the event
    if (newEvent.once) {
        client.once(newEvent.name, (...args) => newEvent.execute(...args, client));
    } else {
        client.on(newEvent.name, (...args) => newEvent.execute(...args, client));
    }
    
    return newEvent;
}

module.exports = {
    loadEvents,
    reloadEvent
};
