const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Information',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with bot commands')
        .addStringOption(option =>
            option
                .setName('command')
                .setDescription('Get detailed help for a specific command')
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option
                .setName('category')
                .setDescription('Show commands from a specific category')
                .setRequired(false)
                .addChoices(
                    { name: '🎵 Music', value: 'music' },
                    { name: '📜 Queue', value: 'queue' },
                    { name: '⚙️ Settings', value: 'settings' },
                    { name: 'ℹ️ Information', value: 'information' },
                    { name: '🤖 AI', value: 'ai' },
                    { name: '👑 Admin', value: 'admin' }
                )
        ),

    async execute(interaction, client) {
        const commandName = interaction.options.getString('command');
        const category = interaction.options.getString('category');

        if (commandName) {
            await showCommandHelp(interaction, client, commandName);
        } else if (category) {
            await showCategoryHelp(interaction, client, category);
        } else {
            await showGeneralHelp(interaction, client);
        }
    },

    async autocomplete(interaction, client) {
        const focusedValue = interaction.options.getFocused();
        const commands = client.commands.map(cmd => cmd.data.name);
        
        const filtered = commands.filter(cmd => 
            cmd.toLowerCase().includes(focusedValue.toLowerCase())
        );

        await interaction.respond(
            filtered.slice(0, 25).map(cmd => ({ name: cmd, value: cmd }))
        );
    }
};

async function showGeneralHelp(interaction, client) {
    const embed = new EmbedBuilder()
        .setTitle('🎵 Music Bot Help')
        .setDescription('A feature-rich music bot with support for YouTube, SoundCloud, and Spotify!')
        .setColor(client.config.colors.primary)
        .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
        .setTimestamp();

    // Quick start guide
    embed.addFields({
        name: '🚀 Quick Start',
        value: '• Use `/play <song>` to start playing music\n• Use `/queue show` to view the current queue\n• Use `/help <command>` for detailed command help\n• Use `/settings` to configure the bot',
        inline: false
    });

    // Command categories
    const categories = [
        { name: '🎵 Music', value: 'Basic music playback controls', inline: true },
        { name: '📜 Queue', value: 'Queue management commands', inline: true },
        { name: '⚙️ Settings', value: 'Server configuration options', inline: true },
        { name: '🤖 AI', value: 'AI chatbot features', inline: true },
        { name: 'ℹ️ Information', value: 'Bot information and statistics', inline: true },
        { name: '👑 Admin', value: 'Administrative commands', inline: true }
    ];

    embed.addFields(categories);

    // Statistics
    const totalCommands = client.commands.size;
    const totalGuilds = client.guilds.cache.size;
    const totalUsers = client.users.cache.size;

    embed.addFields({
        name: '📊 Bot Statistics',
        value: `**Commands:** ${totalCommands}\n**Servers:** ${totalGuilds}\n**Users:** ${totalUsers}`,
        inline: true
    });

    // Links and support
    embed.addFields({
        name: '🔗 Links & Support',
        value: '• [Invite Bot](https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot+applications.commands&permissions=8)\n• [Support Server](https://discord.gg/YOUR_SUPPORT_SERVER)\n• [Premium](https://yourwebsite.com/premium)',
        inline: true
    });

    embed.setFooter({
        text: `Use /help <category> for category-specific commands • Made with ❤️`,
        iconURL: client.user.displayAvatarURL()
    });

    // Create select menu for categories
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help_category')
        .setPlaceholder('Select a category for detailed help')
        .addOptions([
            { label: '🎵 Music Commands', value: 'music', description: 'Play, pause, skip, and control music' },
            { label: '📜 Queue Management', value: 'queue', description: 'Manage the music queue' },
            { label: '⚙️ Server Settings', value: 'settings', description: 'Configure bot settings' },
            { label: '🤖 AI Chatbot', value: 'ai', description: 'AI chatbot and conversation features' },
            { label: 'ℹ️ Information', value: 'information', description: 'Bot info and statistics' },
            { label: '👑 Admin Commands', value: 'admin', description: 'Administrative commands' }
        ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({ embeds: [embed], components: [row] });
}

async function showCategoryHelp(interaction, client, category) {
    const categoryCommands = client.commands.filter(cmd => 
        cmd.category && cmd.category.toLowerCase() === category.toLowerCase()
    );

    if (categoryCommands.size === 0) {
        const embed = Utils.createErrorEmbed(
            'Category Not Found',
            `No commands found in the "${category}" category.`
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const categoryNames = {
        music: '🎵 Music Commands',
        queue: '📜 Queue Management',
        settings: '⚙️ Server Settings',
        ai: '🤖 AI Chatbot',
        information: 'ℹ️ Information Commands',
        admin: '👑 Admin Commands'
    };

    const embed = new EmbedBuilder()
        .setTitle(categoryNames[category.toLowerCase()] || `${category} Commands`)
        .setColor(client.config.colors.info)
        .setTimestamp();

    let description = '';
    categoryCommands.forEach(command => {
        description += `**/${command.data.name}** - ${command.data.description}\n`;
    });

    embed.setDescription(description);

    // Add category-specific information
    if (category.toLowerCase() === 'music') {
        embed.addFields({
            name: '🎵 Music Sources',
            value: '• YouTube (primary)\n• SoundCloud\n• Spotify (playlists)',
            inline: true
        });

        embed.addFields({
            name: '🎚️ Supported Formats',
            value: '• Direct URLs\n• Search queries\n• Playlists\n• Albums',
            inline: true
        });
    } else if (category.toLowerCase() === 'ai') {
        embed.addFields({
            name: '🤖 AI Features',
            value: '• OpenAI-compatible APIs\n• Customizable prompts\n• Channel restrictions\n• Response probability',
            inline: true
        });

        embed.addFields({
            name: '⚙️ Configuration',
            value: '• `/chatbot` - Setup & configure\n• `/ask` - Direct AI chat\n• Auto-responses in channels',
            inline: true
        });
    }

    embed.setFooter({
        text: `Use /help <command> for detailed command information`,
        iconURL: client.user.displayAvatarURL()
    });

    await interaction.reply({ embeds: [embed] });
}

async function showCommandHelp(interaction, client, commandName) {
    const command = client.commands.get(commandName);

    if (!command) {
        const embed = Utils.createErrorEmbed(
            'Command Not Found',
            `The command "${commandName}" does not exist.`
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle(`📖 Command: /${command.data.name}`)
        .setDescription(command.data.description)
        .setColor(client.config.colors.info)
        .setTimestamp();

    // Add command options if any
    if (command.data.options && command.data.options.length > 0) {
        let optionsText = '';
        
        command.data.options.forEach(option => {
            const required = option.required ? ' (required)' : ' (optional)';
            optionsText += `**${option.name}**${required}: ${option.description}\n`;
            
            if (option.choices && option.choices.length > 0) {
                optionsText += `  Choices: ${option.choices.map(choice => `\`${choice.name}\``).join(', ')}\n`;
            }
        });

        embed.addFields({
            name: '⚙️ Options',
            value: optionsText,
            inline: false
        });
    }

    // Add usage examples
    const examples = getCommandExamples(commandName);
    if (examples.length > 0) {
        embed.addFields({
            name: '📝 Examples',
            value: examples.join('\n'),
            inline: false
        });
    }

    // Add permissions required
    if (command.permissions && command.permissions.length > 0) {
        embed.addFields({
            name: '🔒 Required Permissions',
            value: command.permissions.map(perm => `\`${perm}\``).join(', '),
            inline: false
        });
    }

    // Add category
    if (command.category) {
        embed.addFields({
            name: '📂 Category',
            value: command.category,
            inline: true
        });
    }

    embed.setFooter({
        text: `Use /help to see all commands`,
        iconURL: client.user.displayAvatarURL()
    });

    await interaction.reply({ embeds: [embed] });
}

function getCommandExamples(commandName) {
    const examples = {
        play: [
            '`/play query:Never Gonna Give You Up`',
            '`/play query:https://youtu.be/dQw4w9WgXcQ`',
            '`/play query:lofi hip hop source:youtube`',
            '`/play query:chill playlist next:true`'
        ],
        queue: [
            '`/queue show`',
            '`/queue clear`',
            '`/queue shuffle`',
            '`/queue remove position:3`',
            '`/queue move from:2 to:5`'
        ],
        volume: [
            '`/volume`',
            '`/volume level:75`',
            '`/volume level:100`'
        ],
        settings: [
            '`/settings view`',
            '`/settings music volume default:60 max:120`',
            '`/settings permissions dj-role role:@DJ`',
            '`/settings commands cooldown seconds:5`'
        ],
        skip: [
            '`/skip`',
            '`/skip amount:3`'
        ],
        nowplaying: [
            '`/nowplaying`',
            '`/nowplaying controls:true`'
        ]
    };

    return examples[commandName] || [];
}
