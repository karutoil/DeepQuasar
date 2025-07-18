// interactionHandlers.test.js
// This test ensures all customIds used in commands for buttons, select menus, and modals are handled by an interaction handler.

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Utility to extract all .setCustomId(...) usages from a file
function extractCustomIdsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // We'll skip .setCustomId(...) calls on TextInputBuilder (modal fields)
  // Simple approach: for each .setCustomId match, check if the previous 2 lines contain 'new TextInputBuilder'
  const lines = content.split('\n');
  const matches = [];
  const regex = /\.setCustomId\((['"`])([^'"`]+)\1\)/g;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let match;
    while ((match = regex.exec(line)) !== null) {
      // Check previous 2 lines for 'new TextInputBuilder'
      const prev2 = (lines[i - 2] || '') + (lines[i - 1] || '') + line;
      if (/new\s+TextInputBuilder/.test(prev2)) {
        continue; // skip modal field customIds
      }
      matches.push(match[2]);
    }
  }
  return matches;
}

// Utility to extract all customId patterns handled in a handler file
function extractHandledCustomIdsFromHandler(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const handled = new Set();
  // Exact matches: customId === '...'
  const exactRegex = /customId\s*===\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = exactRegex.exec(content)) !== null) {
    handled.add({ type: 'exact', value: match[1] });
  }
  // Prefix matches: customId.startsWith('...')
  const prefixRegex = /customId\.startsWith\(['"`]([^'"`]+)['"`]\)/g;
  while ((match = prefixRegex.exec(content)) !== null) {
    handled.add({ type: 'prefix', value: match[1] });
  }
  // Includes matches: customId.includes('...')
  const includesRegex = /customId\.includes\(['"`]([^'"`]+)['"`]\)/g;
  while ((match = includesRegex.exec(content)) !== null) {
    handled.add({ type: 'includes', value: match[1] });
  }
  return Array.from(handled);
}

// Utility to check if a customId is handled
function isCustomIdHandled(customId, handledPatterns) {
  for (const pattern of handledPatterns) {
    if (pattern.type === 'exact' && customId === pattern.value) return true;
    if (pattern.type === 'prefix' && customId.startsWith(pattern.value)) return true;
    if (pattern.type === 'includes' && customId.includes(pattern.value)) return true;
  }
  return false;
}

describe('All interaction customIds used in commands are handled by a handler', () => {
  // 1. Gather all command files
  const commandFiles = glob.sync(path.join(__dirname, '../commands/**/*.js'))
    .concat(glob.sync(path.join(__dirname, '../modules/*/commands/**/*.js')));
  // 2. Gather all handler files
  const handlerFiles = glob.sync(path.join(__dirname, '../interactionHandlers/**/*.js'));

  // 3. Extract all customIds from commands
  let allCustomIds = new Set();
  for (const file of commandFiles) {
    extractCustomIdsFromFile(file).forEach(id => allCustomIds.add(id));
  }

  // 4. Extract all handled patterns from handlers
  let handledPatterns = [];
  for (const file of handlerFiles) {
    handledPatterns = handledPatterns.concat(extractHandledCustomIdsFromHandler(file));
  }

  // 5. Test each customId
  for (const customId of allCustomIds) {
    test(`CustomId '${customId}' is handled by a handler`, () => {
      expect(isCustomIdHandled(customId, handledPatterns)).toBe(true);
    });
  }
});
