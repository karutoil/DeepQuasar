const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const LFGSettings = require('../../schemas/LFGSettings');
const LFGPost = require('../../schemas/LFGPost');
const LFGCooldown = require('../../schemas/LFGCooldown');
const LFGUtils = require('../../utils/LFGUtils');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'LFG',
    permissions: [PermissionFlagsBits.Administrator],
    data: new SlashCommandBuilder()
        .setName('lfg-test')
        .setDescription('Test LFG system functionality')
        .addSubcommand(subcommand =>
            subcommand
                .setName('system')
                .setDescription('Test core system functionality')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('database')
                .setDescription('Test database connections and operations')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('permissions')
                .setDescription('Test permission and role checks')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('cleanup')
                .setDescription('Test cleanup functionality')
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'system':
                    await this.testSystem(interaction);
                    break;
                case 'database':
                    await this.testDatabase(interaction);
                    break;
                case 'permissions':
                    await this.testPermissions(interaction);
                    break;
                case 'cleanup':
                    await this.testCleanup(interaction);
                    break;
            }

        } catch (error) {
            console.error('Error in LFG test command:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Test Error',
                    `Test failed: ${error.message}`
                )]
            });
        }
    },

    async testSystem(interaction) {
        const tests = [];
        let passed = 0;
        let failed = 0;

        // Test 1: Guild Settings Creation
        try {
            const settings = await LFGUtils.getGuildSettings(interaction.guild.id);
            tests.push({ name: 'Guild Settings Creation', status: '✅', details: `Found/created settings for guild ${interaction.guild.id}` });
            passed++;
        } catch (error) {
            tests.push({ name: 'Guild Settings Creation', status: '❌', details: error.message });
            failed++;
        }

        // Test 2: Cooldown Check
        try {
            const cooldownCheck = await LFGUtils.checkCooldown(interaction.user.id, interaction.guild.id);
            tests.push({ name: 'Cooldown Check', status: '✅', details: `Cooldown status: ${cooldownCheck.onCooldown ? 'Active' : 'None'}` });
            passed++;
        } catch (error) {
            tests.push({ name: 'Cooldown Check', status: '❌', details: error.message });
            failed++;
        }

        // Test 3: Active Post Check
        try {
            const activePost = await LFGUtils.hasActiveLFGPost(interaction.user.id, interaction.guild.id);
            tests.push({ name: 'Active Post Check', status: '✅', details: `Active post: ${activePost ? 'Yes' : 'No'}` });
            passed++;
        } catch (error) {
            tests.push({ name: 'Active Post Check', status: '❌', details: error.message });
            failed++;
        }

        // Test 4: Channel Permission Check
        try {
            const isAllowed = await LFGUtils.isChannelAllowed(interaction.channel.id, interaction.guild.id);
            tests.push({ name: 'Channel Permission Check', status: '✅', details: `Channel allowed: ${isAllowed ? 'Yes' : 'No'}` });
            passed++;
        } catch (error) {
            tests.push({ name: 'Channel Permission Check', status: '❌', details: error.message });
            failed++;
        }

        // Test 5: Role Permission Check
        try {
            const hasRole = await LFGUtils.hasRequiredRole(interaction.member, interaction.guild.id);
            tests.push({ name: 'Role Permission Check', status: '✅', details: `Has required role: ${hasRole ? 'Yes' : 'No'}` });
            passed++;
        } catch (error) {
            tests.push({ name: 'Role Permission Check', status: '❌', details: error.message });
            failed++;
        }

        // Test 6: Embed Creation
        try {
            const settings = await LFGUtils.getGuildSettings(interaction.guild.id);
            const embed = await LFGUtils.createLFGEmbed(
                interaction.user,
                'Test Game',
                'Test message',
                null,
                settings
            );
            tests.push({ name: 'Embed Creation', status: '✅', details: 'Successfully created LFG embed' });
            passed++;
        } catch (error) {
            tests.push({ name: 'Embed Creation', status: '❌', details: error.message });
            failed++;
        }

        // Test 7: Button Creation
        try {
            const settings = await LFGUtils.getGuildSettings(interaction.guild.id);
            const buttons = LFGUtils.createLFGButtons('test123', null, settings);
            tests.push({ name: 'Button Creation', status: '✅', details: `Created ${buttons.length} button row(s)` });
            passed++;
        } catch (error) {
            tests.push({ name: 'Button Creation', status: '❌', details: error.message });
            failed++;
        }

        // Create test results embed
        let description = `**Test Results: ${passed} passed, ${failed} failed**\n\n`;
        
        for (const test of tests) {
            description += `${test.status} **${test.name}**\n`;
            description += `   ${test.details}\n\n`;
        }

        const embed = Utils.createEmbed({
            title: '🧪 LFG System Test Results',
            description: description,
            color: failed === 0 ? '#57F287' : '#ED4245'
        });

        await interaction.editReply({ embeds: [embed] });
    },

    async testDatabase(interaction) {
        const tests = [];
        let passed = 0;
        let failed = 0;

        // Test 1: LFGSettings Schema
        try {
            const settings = await LFGSettings.findOne({ guildId: interaction.guild.id });
            tests.push({ name: 'LFGSettings Query', status: '✅', details: `Found: ${settings ? 'Yes' : 'No'}` });
            passed++;
        } catch (error) {
            tests.push({ name: 'LFGSettings Query', status: '❌', details: error.message });
            failed++;
        }

        // Test 2: LFGPost Schema
        try {
            const postCount = await LFGPost.countDocuments({ guildId: interaction.guild.id });
            tests.push({ name: 'LFGPost Query', status: '✅', details: `Total posts: ${postCount}` });
            passed++;
        } catch (error) {
            tests.push({ name: 'LFGPost Query', status: '❌', details: error.message });
            failed++;
        }

        // Test 3: LFGCooldown Schema
        try {
            const cooldownCount = await LFGCooldown.countDocuments({ guildId: interaction.guild.id });
            tests.push({ name: 'LFGCooldown Query', status: '✅', details: `Active cooldowns: ${cooldownCount}` });
            passed++;
        } catch (error) {
            tests.push({ name: 'LFGCooldown Query', status: '❌', details: error.message });
            failed++;
        }

        // Test 4: Database Write
        try {
            const testSettings = await LFGSettings.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { $set: { 'embed.footerText': `Test - ${Date.now()}` } },
                { upsert: true, new: true }
            );
            tests.push({ name: 'Database Write', status: '✅', details: 'Successfully updated settings' });
            passed++;
        } catch (error) {
            tests.push({ name: 'Database Write', status: '❌', details: error.message });
            failed++;
        }

        // Test 5: Database Aggregation
        try {
            const stats = await LFGPost.aggregate([
                { $match: { guildId: interaction.guild.id } },
                { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } }
            ]);
            tests.push({ name: 'Database Aggregation', status: '✅', details: `Stats calculated: ${stats.length > 0 ? 'Yes' : 'No data'}` });
            passed++;
        } catch (error) {
            tests.push({ name: 'Database Aggregation', status: '❌', details: error.message });
            failed++;
        }

        // Create test results embed
        let description = `**Database Test Results: ${passed} passed, ${failed} failed**\n\n`;
        
        for (const test of tests) {
            description += `${test.status} **${test.name}**\n`;
            description += `   ${test.details}\n\n`;
        }

        const embed = Utils.createEmbed({
            title: '💾 Database Test Results',
            description: description,
            color: failed === 0 ? '#57F287' : '#ED4245'
        });

        await interaction.editReply({ embeds: [embed] });
    },

    async testPermissions(interaction) {
        const tests = [];
        let passed = 0;
        let failed = 0;

        // Test 1: Bot Permissions
        try {
            const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
            const hasBasicPerms = interaction.channel.permissionsFor(botMember).has(['SendMessages', 'EmbedLinks', 'UseExternalEmojis']);
            tests.push({ name: 'Bot Basic Permissions', status: hasBasicPerms ? '✅' : '⚠️', details: `Send Messages, Embed Links, External Emojis: ${hasBasicPerms ? 'OK' : 'Missing'}` });
            if (hasBasicPerms) passed++; else failed++;
        } catch (error) {
            tests.push({ name: 'Bot Basic Permissions', status: '❌', details: error.message });
            failed++;
        }

        // Test 2: User Voice Channel Check
        try {
            const voiceChannel = interaction.member.voice.channel;
            tests.push({ name: 'User Voice Channel', status: '✅', details: `In voice: ${voiceChannel ? voiceChannel.name : 'No'}` });
            passed++;
        } catch (error) {
            tests.push({ name: 'User Voice Channel', status: '❌', details: error.message });
            failed++;
        }

        // Test 3: Admin Permissions
        try {
            const hasAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
            const hasManageGuild = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
            tests.push({ name: 'User Admin Permissions', status: '✅', details: `Admin: ${hasAdmin ? 'Yes' : 'No'}, Manage Guild: ${hasManageGuild ? 'Yes' : 'No'}` });
            passed++;
        } catch (error) {
            tests.push({ name: 'User Admin Permissions', status: '❌', details: error.message });
            failed++;
        }

        // Test 4: Channel Message Permissions
        try {
            const canManageMessages = interaction.channel.permissionsFor(interaction.guild.members.cache.get(interaction.client.user.id)).has(PermissionFlagsBits.ManageMessages);
            tests.push({ name: 'Bot Message Management', status: canManageMessages ? '✅' : '⚠️', details: `Can delete messages: ${canManageMessages ? 'Yes' : 'No'}` });
            if (canManageMessages) passed++; else failed++;
        } catch (error) {
            tests.push({ name: 'Bot Message Management', status: '❌', details: error.message });
            failed++;
        }

        // Create test results embed
        let description = `**Permission Test Results: ${passed} passed, ${failed} failed**\n\n`;
        
        for (const test of tests) {
            description += `${test.status} **${test.name}**\n`;
            description += `   ${test.details}\n\n`;
        }

        const embed = Utils.createEmbed({
            title: '🔐 Permission Test Results',
            description: description,
            color: failed === 0 ? '#57F287' : '#ED4245'
        });

        await interaction.editReply({ embeds: [embed] });
    },

    async testCleanup(interaction) {
        const tests = [];
        let passed = 0;
        let failed = 0;

        // Test 1: Find Expired Posts
        try {
            const expiredPosts = await LFGPost.find({
                guildId: interaction.guild.id,
                isActive: true,
                expiresAt: { $lt: new Date() }
            });
            tests.push({ name: 'Find Expired Posts', status: '✅', details: `Found ${expiredPosts.length} expired posts` });
            passed++;
        } catch (error) {
            tests.push({ name: 'Find Expired Posts', status: '❌', details: error.message });
            failed++;
        }

        // Test 2: Cleanup Task Import
        try {
            const LFGCleanupTask = require('../../handlers/lfg/LFGCleanupTask');
            tests.push({ name: 'Cleanup Task Import', status: '✅', details: 'Successfully imported cleanup task' });
            passed++;
        } catch (error) {
            tests.push({ name: 'Cleanup Task Import', status: '❌', details: error.message });
            failed++;
        }

        // Test 3: Manual Cleanup Run
        try {
            const LFGCleanupTask = require('../../handlers/lfg/LFGCleanupTask');
            await LFGCleanupTask.runCleanup(interaction.client);
            tests.push({ name: 'Manual Cleanup Execution', status: '✅', details: 'Cleanup executed successfully' });
            passed++;
        } catch (error) {
            tests.push({ name: 'Manual Cleanup Execution', status: '❌', details: error.message });
            failed++;
        }

        // Create test results embed
        let description = `**Cleanup Test Results: ${passed} passed, ${failed} failed**\n\n`;
        
        for (const test of tests) {
            description += `${test.status} **${test.name}**\n`;
            description += `   ${test.details}\n\n`;
        }

        const embed = Utils.createEmbed({
            title: '🧹 Cleanup Test Results',
            description: description,
            color: failed === 0 ? '#57F287' : '#ED4245'
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
