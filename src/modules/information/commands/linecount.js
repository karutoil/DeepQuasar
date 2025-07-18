const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

function countLinesInFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.split('\n').length;
    } catch {
        return 0;
    }
}

function countLinesInDir(dir, exts = ['.js', '.json', '.md', '.yml', '.yaml', '.sh', '.env', '.ts']) {
    let total = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name.startsWith('.')) continue; // skip hidden files/folders
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            total += countLinesInDir(fullPath, exts);
        } else if (exts.includes(path.extname(entry.name))) {
            total += countLinesInFile(fullPath);
        }
    }
    return total;
}

module.exports = {
    category: 'Information',
    data: new SlashCommandBuilder()
        .setName('linecount')
        .setDescription('Show the total line count for the entire project'),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const rootDir = path.resolve(__dirname, '../../');
            const totalLines = countLinesInDir(rootDir);
            const embed = new EmbedBuilder()
                .setTitle('Project Line Count')
                .setDescription(`This project contains **${totalLines.toLocaleString()}** lines of code (including JS, JSON, MD, YAML, SH, ENV, TS).`)
                .setColor(0x00AE86)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply('❌ Failed to count lines.');
        }
    }
};
