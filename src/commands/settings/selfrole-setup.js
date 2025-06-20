const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, ButtonStyle } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Settings',
    permissions: [PermissionFlagsBits.ManageGuild],
    data: new SlashCommandBuilder()
        .setName('selfrole-setup')
        .setDescription('Quick setup wizard for self-roles')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to send the self-role message')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('template')
                .setDescription('Choose a template')
                .setRequired(true)
                .addChoices(
                    { name: 'Gaming Roles', value: 'gaming' },
                    { name: 'Notification Roles', value: 'notifications' },
                    { name: 'Color Roles', value: 'colors' },
                    { name: 'Interest Roles', value: 'interests' },
                    { name: 'Pronoun Roles', value: 'pronouns' },
                    { name: 'Custom', value: 'custom' }
                )
        )
        .addStringOption(option =>
            option
                .setName('title')
                .setDescription('Custom title (only for custom template)')
                .setRequired(false)
                .setMaxLength(256)
        )
        .addStringOption(option =>
            option
                .setName('description')
                .setDescription('Custom description (only for custom template)')
                .setRequired(false)
                .setMaxLength(4096)
        ),

    async execute(interaction) {
        // Check permissions first
        const permissionCheck = Utils.checkSelfrolePermissions(interaction);
        if (!permissionCheck.hasPermission) {
            return interaction.reply({
                content: permissionCheck.reason,
                ephemeral: true
            });
        }

        const channel = interaction.options.getChannel('channel');
        const template = interaction.options.getString('template');
        const customTitle = interaction.options.getString('title');
        const customDescription = interaction.options.getString('description');

        // Check channel permissions
        if (!channel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
            return await interaction.reply({
                content: '❌ I don\'t have permission to send messages in that channel.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        let templateData;
        
        if (template === 'custom') {
            if (!customTitle || !customDescription) {
                return await interaction.editReply({
                    content: '❌ Custom template requires both title and description.'
                });
            }
            templateData = {
                title: customTitle,
                description: customDescription,
                color: '#0099ff',
                roles: []
            };
        } else {
            templateData = this.getTemplate(template);
        }

        const selfRoleManager = interaction.client.selfRoleManager;
        if (!selfRoleManager) {
            return await interaction.editReply({
                content: '❌ Self-role manager is not initialized.'
            });
        }

        const data = {
            ...templateData,
            settings: {
                maxRolesPerUser: null,
                allowRoleRemoval: true,
                ephemeralResponse: true,
                logChannel: null
            },
            createdBy: {
                userId: interaction.user.id,
                username: interaction.user.username
            }
        };

        const result = await selfRoleManager.createSelfRoleMessage(
            interaction.guild.id,
            channel.id,
            data
        );

        if (result.success) {
            const embed = new EmbedBuilder()
                .setTitle('✅ Self-Role Setup Complete!')
                .setColor('#00ff00')
                .setDescription(`Successfully created a ${template} self-role message in ${channel}`)
                .addFields(
                    { name: '📝 Message ID', value: `\`${result.message.id}\``, inline: true },
                    { name: '📋 Template', value: template, inline: true },
                    { name: '🔧 Next Steps', value: this.getNextSteps(template), inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply({
                content: `❌ Failed to create self-role message: ${result.error}`
            });
        }
    },

    getTemplate(templateType) {
        const templates = {
            gaming: {
                title: '🎮 Gaming Roles',
                description: 'Select your favorite games to get notified about gaming events and find teammates!\n\nClick the buttons below to toggle your gaming roles.',
                color: '#ff6b6b',
                roles: []
            },
            notifications: {
                title: '🔔 Notification Roles',
                description: 'Choose which notifications you want to receive from this server.\n\nClick the buttons below to manage your notification preferences.',
                color: '#4ecdc4',
                roles: []
            },
            colors: {
                title: '🌈 Color Roles',
                description: 'Pick a color for your username! Choose one that represents your personality.\n\n**Note:** You can only have one color role at a time.',
                color: '#ff9ff3',
                roles: []
            },
            interests: {
                title: '🎯 Interest Roles',
                description: 'Let others know what you\'re interested in! This helps you connect with like-minded members.\n\nYou can select multiple interests.',
                color: '#54a0ff',
                roles: []
            },
            pronouns: {
                title: '💭 Pronoun Roles',
                description: 'Help others know how to address you by selecting your pronouns.\n\nRespecting everyone\'s pronouns creates an inclusive community.',
                color: '#5f27cd',
                roles: []
            }
        };

        return templates[templateType] || templates.custom;
    },

    getNextSteps(template) {
        const steps = {
            gaming: '1. Use `/selfrole add-role` to add gaming roles\n2. Consider setting up conflicting roles for competitive games\n3. Set up a log channel to track role assignments',
            notifications: '1. Add roles for different types of notifications\n2. Consider using role limits to prevent spam\n3. Set ephemeral responses to keep the channel clean',
            colors: '1. Create color roles with different colors\n2. Set up conflicting roles so users can only have one color\n3. Use the "Danger" button style for remove options',
            interests: '1. Add various interest-based roles\n2. Consider setting a maximum number of roles per user\n3. Use descriptive labels and emojis for each role',
            pronouns: '1. Add common pronoun roles (he/him, she/her, they/them, etc.)\n2. Consider making responses ephemeral for privacy\n3. Set up respectful descriptions for each option',
            custom: '1. Use `/selfrole add-role` to add your custom roles\n2. Configure settings with `/selfrole settings`\n3. Use `/selfrole-advanced` for advanced features'
        };

        return steps[template] || steps.custom;
    }
};
