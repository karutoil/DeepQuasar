#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Script to add frontmatter to CODE_GUIDE_*.md files
 * Adds title and sidebar badge to the top of each file
 */

// Function to extract filename without extension
function getFilenameWithoutExtension(filePath) {
    return path.basename(filePath, '.md');
}

// Function to create frontmatter
function createFrontmatter(filename) {
    return `---
title: ${filename}
sidebar:
  badge: ApiReference
---

`;
}

// Function to check if file already has frontmatter
function hasFrontmatter(content) {
    return content.trim().startsWith('---');
}

// Main function to process files
async function addFrontmatterToFiles() {
    try {
        // Find all CODE_GUIDE_*.md files
        const files = glob.sync('CODE_GUIDE_*.md', { cwd: __dirname });
        
        if (files.length === 0) {
            console.log('No CODE_GUIDE_*.md files found.');
            return;
        }

        console.log(`Found ${files.length} CODE_GUIDE_*.md files:`);
        
        let processedCount = 0;
        let skippedCount = 0;

        for (const file of files) {
            const filePath = path.join(__dirname, file);
            const filename = getFilenameWithoutExtension(file);
            
            try {
                // Read the current file content
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Check if frontmatter already exists
                if (hasFrontmatter(content)) {
                    console.log(`⏭️  Skipping ${file} - already has frontmatter`);
                    skippedCount++;
                    continue;
                }
                
                // Create new content with frontmatter
                const frontmatter = createFrontmatter(filename);
                const newContent = frontmatter + content;
                
                // Write the updated content back to file
                fs.writeFileSync(filePath, newContent, 'utf8');
                
                console.log(`✅ Added frontmatter to ${file}`);
                processedCount++;
                
            } catch (error) {
                console.error(`❌ Error processing ${file}:`, error.message);
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   Processed: ${processedCount} files`);
        console.log(`   Skipped: ${skippedCount} files`);
        console.log(`   Total: ${files.length} files`);
        
    } catch (error) {
        console.error('❌ Error finding files:', error.message);
        process.exit(1);
    }
}

// Check if glob is available, if not, provide instructions
try {
    require.resolve('glob');
} catch (error) {
    console.log('Installing required dependency: glob');
    const { execSync } = require('child_process');
    try {
        execSync('npm install glob', { stdio: 'inherit' });
        console.log('✅ Installed glob successfully');
    } catch (installError) {
        console.error('❌ Failed to install glob. Please run: npm install glob');
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    addFrontmatterToFiles().catch(console.error);
}

module.exports = { addFrontmatterToFiles };
