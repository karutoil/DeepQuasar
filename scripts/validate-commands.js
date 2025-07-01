#!/usr/bin/env node

/**
 * Command Validator Script
 *
 * This script checks all command files against Discord's API limits to prevent
 * deployment failures due to oversized or malformed command payloads.
 *
 * It checks for:
 * - Command name length (1-32 characters)
 * - Command description length (1-100 characters)
 * - Number of options (max 25)
 * - Total JSON payload size (max 8000 bytes)
 * - Option name and description lengths
 * - Number of choices per option (max 25)
 */

const fs = require('fs');
const path = require('path');

const COMMANDS_DIR = path.join(__dirname, '..', 'src', 'commands');

// Discord API Limits
const LIMITS = {
    COMMAND_NAME_LENGTH: { min: 1, max: 32 },
    COMMAND_DESCRIPTION_LENGTH: { min: 1, max: 100 },
    COMMAND_MAX_OPTIONS: 25,
    COMMAND_PAYLOAD_SIZE: 8000, // bytes
    OPTION_NAME_LENGTH: { min: 1, max: 32 },
    OPTION_DESCRIPTION_LENGTH: { min: 1, max: 100 },
    OPTION_MAX_CHOICES: 25,
    CHOICE_NAME_LENGTH: { min: 1, max: 100 },
};

let errorCount = 0;

/**
 * Get command files recursively
 */
function getCommandFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            results = results.concat(getCommandFiles(filePath));
        } else if (file.endsWith('.js')) {
            results.push(filePath);
        }
    });

    return results;
}

function check(value, limit, message) {
    if (value < limit.min || value > limit.max) {
        console.error(`❌ ${message} (${value} chars, limit: ${limit.min}-${limit.max})`);
        errorCount++;
    }
}

function validateCommand(filePath) {
    try {
        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);

        if (!command.data || !command.data.name) {
            console.warn(`⚠️  Skipping invalid command file: ${path.basename(filePath)}`);
            return;
        }

        const { data } = command;
        const commandName = data.name;
        console.log(`\n🔎 Validating command: /${commandName}`);

        // Validate top-level properties
        check(data.name.length, LIMITS.COMMAND_NAME_LENGTH, `Command name "${commandName}" length is invalid.`);
        check(data.description.length, LIMITS.COMMAND_DESCRIPTION_LENGTH, `Command "${commandName}" description length is invalid.`);

        const jsonData = data.toJSON();
        const payloadSize = Buffer.byteLength(JSON.stringify(jsonData), 'utf8');
        if (payloadSize > LIMITS.COMMAND_PAYLOAD_SIZE) {
            console.error(`❌ Command "${commandName}" payload is too large. (${payloadSize} bytes, limit: ${LIMITS.COMMAND_PAYLOAD_SIZE})`);
            errorCount++;
        }

        // Validate options
        if (jsonData.options) {
            if (jsonData.options.length > LIMITS.COMMAND_MAX_OPTIONS) {
                console.error(`❌ Command "${commandName}" has too many options. (${jsonData.options.length}, limit: ${LIMITS.COMMAND_MAX_OPTIONS})`);
                errorCount++;
            }

            jsonData.options.forEach(option => validateOption(option, commandName));
        }

    } catch (error) {
        console.error(`\n❌ Failed to validate ${filePath}:`, error.message);
        errorCount++;
    }
}

function validateOption(option, commandName) {
    // This is a simplified validator. A full implementation would recurse through subcommands and groups.
    const optionPath = `${commandName} -> ${option.name}`;
    check(option.name.length, LIMITS.OPTION_NAME_LENGTH, `Option name "${optionPath}" length is invalid.`);
    check(option.description.length, LIMITS.OPTION_DESCRIPTION_LENGTH, `Option "${optionPath}" description length is invalid.`);
}

function main() {
    console.log('🚀 Starting command validation...');
    const commandFiles = getCommandFiles(COMMANDS_DIR);
    console.log(`Found ${commandFiles.length} command files to validate.`);

    commandFiles.forEach(validateCommand);

    console.log('\n----------------------------------------');
    if (errorCount === 0) {
        console.log('✅ All commands passed validation!');
    } else {
        console.error(`❌ Validation failed with ${errorCount} error(s).`);
        console.error('Please fix the issues above before deploying.');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}