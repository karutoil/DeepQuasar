#!/usr/bin/env node

/**
 * Test script to verify that welcome/leave events are not duplicated
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for duplicate event handlers...\n');

// Simulate loading events like the event handler does
const eventsPath = path.join(__dirname, '../src/events');
const eventHandlers = new Map();

function loadEventsFromDirectory(dirPath, relativePath = '') {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
            // Load events from subdirectory
            loadEventsFromDirectory(itemPath, path.join(relativePath, item));
        } else if (item.endsWith('.js')) {
            // Load event file
            try {
                delete require.cache[require.resolve(itemPath)];
                const event = require(itemPath);
                
                if (event.name && event.execute) {
                    const fullPath = path.join(relativePath, item);
                    
                    if (!eventHandlers.has(event.name)) {
                        eventHandlers.set(event.name, []);
                    }
                    
                    eventHandlers.get(event.name).push({
                        file: fullPath,
                        path: itemPath,
                        handler: event
                    });
                    
                    console.log(`✅ Found event: ${event.name} in ${fullPath}`);
                }
            } catch (error) {
                console.log(`❌ Error loading ${item}:`, error.message);
            }
        }
    }
}

loadEventsFromDirectory(eventsPath);

console.log('\n📊 Event Handler Summary:\n');

let duplicatesFound = false;

for (const [eventName, handlers] of eventHandlers.entries()) {
    if (handlers.length > 1) {
        console.log(`⚠️  DUPLICATE: ${eventName} has ${handlers.length} handlers:`);
        handlers.forEach((handler, index) => {
            console.log(`   ${index + 1}. ${handler.file}`);
        });
        duplicatesFound = true;
        console.log('');
    } else {
        console.log(`✅ ${eventName}: 1 handler (${handlers[0].file})`);
    }
}

console.log('\n🎯 Welcome/Leave Event Analysis:\n');

// Check specifically for welcome/leave related events
const welcomeEvents = ['guildMemberAdd', 'guildMemberRemove'];
for (const eventName of welcomeEvents) {
    const handlers = eventHandlers.get(eventName) || [];
    
    console.log(`📝 ${eventName}:`);
    if (handlers.length === 0) {
        console.log(`   ❌ No handlers found!`);
    } else if (handlers.length === 1) {
        console.log(`   ✅ Single handler: ${handlers[0].file}`);
        
        // Check if it handles welcome system
        const handlerCode = fs.readFileSync(handlers[0].path, 'utf8');
        if (handlerCode.includes('WelcomeSystem')) {
            console.log(`   ✅ Handles welcome system`);
        } else {
            console.log(`   ❌ Does NOT handle welcome system`);
        }
    } else {
        console.log(`   ⚠️  Multiple handlers (${handlers.length}):`);
        handlers.forEach((handler, index) => {
            const handlerCode = fs.readFileSync(handler.path, 'utf8');
            const handlesWelcome = handlerCode.includes('WelcomeSystem');
            console.log(`     ${index + 1}. ${handler.file} ${handlesWelcome ? '(includes WelcomeSystem)' : '(modlog only)'}`);
        });
    }
    console.log('');
}

if (!duplicatesFound) {
    console.log('🎉 No duplicate event handlers found!');
} else {
    console.log('⚠️  Duplicate event handlers detected! This could cause welcome/leave messages to be sent multiple times.');
}

console.log('\n✨ Analysis complete!');
