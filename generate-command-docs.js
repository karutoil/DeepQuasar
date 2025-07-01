// generate-command-docs.js
// Script to auto-generate a Markdown table of all commands grouped by category for README.md

const fs = require('fs');
const path = require('path');

const COMMANDS_DIR = path.join(__dirname, 'src', 'commands');

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

function extractCommandInfo(filePath) {
    try {
        const command = require(filePath);
        // Support both module.exports = { ... } and export default
        const data = command.data || command;
        if (!data) return null;
        const name = data.name || path.basename(filePath, '.js');
        const description = data.description || data.desc || '';
        let options = [];
        if (Array.isArray(data.options)) {
            options = data.options.map(opt => {
                if (typeof opt === 'object') {
                    return opt.name ? `\`${opt.name}\`` : '';
                }
                return String(opt);
            }).filter(Boolean);
        }
        return { name, description, options };
    } catch (e) {
        return null;
    }
}

function groupByCategory(files) {
    const categories = {};
    files.forEach(file => {
        const rel = path.relative(COMMANDS_DIR, file);
        const parts = rel.split(path.sep);
        const category = parts.length > 1 ? parts[0] : 'Other';
        if (!categories[category]) categories[category] = [];
        categories[category].push(file);
    });
    return categories;
}

function generateMarkdownTable(commands) {
    let md = '| Command | Description | Options/Subcommands |\n|---|---|---|\n';
    commands.forEach(cmd => {
        md += `| \`${cmd.name}\` | ${cmd.description} | ${cmd.options && cmd.options.length ? cmd.options.join(', ') : ''} |\n`;
    });
    return md;
}

function main() {
    const files = getCommandFiles(COMMANDS_DIR);
    const categories = groupByCategory(files);
    let output = '# Command Reference\n\n';
    Object.keys(categories).sort().forEach(category => {
        output += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Commands\n\n`;
        const commands = categories[category]
            .map(extractCommandInfo)
            .filter(Boolean)
            .sort((a, b) => a.name.localeCompare(b.name));
        output += generateMarkdownTable(commands) + '\n';
    });
    fs.writeFileSync('COMMANDS.md', output);
    console.log('COMMANDS.md generated!');
}

if (require.main === module) {
    main();
}
