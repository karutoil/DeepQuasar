const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'Information',
    data: new SlashCommandBuilder()
        .setName('selfrole-help')
        .setDescription('Get help with the self-role system')
        .addStringOption(option =>
            option
                .setName('topic')
                .setDescription('Get help on a specific topic')
                .setRequired(false)
                .addChoices(
                    { name: 'Getting Started', value: 'getting-started' },
                    { name: 'Basic Commands', value: 'basic-commands' },
                    { name: 'Advanced Features', value: 'advanced-features' },
                    { name: 'Troubleshooting', value: 'troubleshooting' },
                    { name: 'Best Practices', value: 'best-practices' },
                    { name: 'Examples', value: 'examples' }
                )
        ),

    async execute(interaction) {
        const topic = interaction.options.getString('topic');

        if (!topic) {
            await this.showMainHelp(interaction);
        } else {
            await this.showTopicHelp(interaction, topic);
        }
    },

    async showMainHelp(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎭 Self-Role System Help')
            .setColor('#0099ff')
            .setDescription('Welcome to the comprehensive self-role system! This system allows server administrators to create interactive role assignment messages with buttons.')
            .addFields(
                {
                    name: '🚀 Quick Start',
                    value: '1. Use `/selfrole-setup` to create your first self-role message\n2. Add roles with `/selfrole add-role`\n3. Configure settings with `/selfrole settings`',
                    inline: false
                },
                {
                    name: '📋 Main Commands',
                    value: '• `/selfrole` - Main self-role management\n• `/selfrole-advanced` - Advanced features\n• `/selfrole-setup` - Quick setup wizard\n• `/selfrole-help` - This help command',
                    inline: false
                },
                {
                    name: '🔧 Features',
                    value: '• Button-based role assignment\n• Role limits and conflicts\n• Statistics tracking\n• Bulk operations\n• Multiple templates\n• Extensive customization',
                    inline: false
                },
                {
                    name: '💡 Need Specific Help?',
                    value: 'Use `/selfrole-help` with a topic:\n• `getting-started`\n• `basic-commands`\n• `advanced-features`\n• `troubleshooting`\n• `best-practices`\n• `examples`',
                    inline: false
                }
            )
            .setFooter({ text: 'Self-Role System • Made with ❤️' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async showTopicHelp(interaction, topic) {
        const helpData = this.getHelpData(topic);
        
        const embed = new EmbedBuilder()
            .setTitle(helpData.title)
            .setColor(helpData.color)
            .setDescription(helpData.description)
            .setTimestamp();

        if (helpData.fields) {
            embed.addFields(helpData.fields);
        }

        if (helpData.footer) {
            embed.setFooter({ text: helpData.footer });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    getHelpData(topic) {
        const helpTopics = {
            'getting-started': {
                title: '🚀 Getting Started with Self-Roles',
                color: '#00ff00',
                description: 'Follow these steps to set up your first self-role system:',
                fields: [
                    {
                        name: 'Step 1: Quick Setup',
                        value: 'Use `/selfrole-setup` to create a self-role message with a template:\n```/selfrole-setup channel:#roles template:gaming```',
                        inline: false
                    },
                    {
                        name: 'Step 2: Add Roles',
                        value: 'Add roles to your message:\n```/selfrole add-role message-id:123456 role:@Gamer label:"Gaming" emoji:🎮```',
                        inline: false
                    },
                    {
                        name: 'Step 3: Configure Settings',
                        value: 'Customize your self-role message:\n```/selfrole settings message-id:123456 max-roles-per-user:3 ephemeral-response:true```',
                        inline: false
                    },
                    {
                        name: '✅ You\'re Done!',
                        value: 'Users can now click the buttons to get/remove roles. Use `/selfrole list` to see all your self-role messages.',
                        inline: false
                    }
                ],
                footer: 'Tip: Start with a template and customize from there!'
            },

            'basic-commands': {
                title: '📋 Basic Commands',
                color: '#3498db',
                description: 'Essential commands for managing self-roles:',
                fields: [
                    {
                        name: '🎯 Core Commands',
                        value: '• `/selfrole create` - Create a new self-role message\n• `/selfrole add-role` - Add a role to a message\n• `/selfrole remove-role` - Remove a role from a message\n• `/selfrole edit` - Edit message title/description\n• `/selfrole delete` - Delete a self-role message',
                        inline: false
                    },
                    {
                        name: '⚙️ Configuration',
                        value: '• `/selfrole settings` - Configure message settings\n• `/selfrole list` - List all self-role messages\n• `/selfrole stats` - View usage statistics\n• `/selfrole cleanup` - Remove invalid roles',
                        inline: false
                    },
                    {
                        name: '🚀 Quick Setup',
                        value: '• `/selfrole-setup` - Setup wizard with templates\n• `/selfrole-help` - Get help (this command)',
                        inline: false
                    }
                ],
                footer: 'All commands require Manage Guild permission'
            },

            'advanced-features': {
                title: '🔬 Advanced Features',
                color: '#9b59b6',
                description: 'Unlock the full potential of the self-role system:',
                fields: [
                    {
                        name: '🎯 Role Limits',
                        value: '• Set maximum assignments per role\n• Require specific roles to assign others\n• Limit roles per user globally',
                        inline: false
                    },
                    {
                        name: '⚔️ Role Conflicts',
                        value: '• Prevent conflicting roles (e.g., Team A vs Team B)\n• Automatic removal of conflicting roles\n• Support for multiple conflicts per role',
                        inline: false
                    },
                    {
                        name: '📊 Advanced Management',
                        value: '• Bulk role assignment\n• Role reordering\n• Statistics tracking\n• Data export/import\n• Automatic cleanup',
                        inline: false
                    },
                    {
                        name: '🔧 Commands',
                        value: '• `/selfrole-advanced role-limits`\n• `/selfrole-advanced role-conflicts`\n• `/selfrole-advanced bulk-assign`\n• `/selfrole-advanced export-data`',
                        inline: false
                    }
                ],
                footer: 'Advanced features require Administrator permission for some operations'
            },

            'troubleshooting': {
                title: '🔧 Troubleshooting',
                color: '#e74c3c',
                description: 'Common issues and their solutions:',
                fields: [
                    {
                        name: '❌ "I don\'t have permission to manage this role"',
                        value: '**Solution:** Make sure the bot\'s role is higher than the role you\'re trying to manage in the server\'s role hierarchy.',
                        inline: false
                    },
                    {
                        name: '❌ "Role assignment failed"',
                        value: '**Solutions:**\n• Check bot permissions (Manage Roles)\n• Verify role hierarchy\n• Ensure role hasn\'t been deleted\n• Check if user has maximum roles',
                        inline: false
                    },
                    {
                        name: '❌ "Self-role message not found"',
                        value: '**Solutions:**\n• Verify the message ID is correct\n• Check if message was deleted\n• Use `/selfrole list` to see all messages\n• Ensure you\'re in the right server',
                        inline: false
                    },
                    {
                        name: '❌ "Buttons not working"',
                        value: '**Solutions:**\n• Check if roles still exist\n• Run `/selfrole cleanup`\n• Verify bot is online\n• Check for role conflicts or limits',
                        inline: false
                    }
                ],
                footer: 'Still having issues? Check the bot logs or contact support'
            },

            'best-practices': {
                title: '💡 Best Practices',
                color: '#f39c12',
                description: 'Tips for creating effective self-role systems:',
                fields: [
                    {
                        name: '🎨 Design Tips',
                        value: '• Use clear, descriptive labels\n• Add relevant emojis for visual appeal\n• Keep descriptions concise\n• Use consistent button styles\n• Group related roles together',
                        inline: false
                    },
                    {
                        name: '⚙️ Configuration Tips',
                        value: '• Set reasonable role limits\n• Use ephemeral responses to reduce clutter\n• Set up logging for moderation\n• Configure conflicting roles properly\n• Regular cleanup of invalid roles',
                        inline: false
                    },
                    {
                        name: '👥 User Experience',
                        value: '• Place self-role messages in dedicated channels\n• Pin important self-role messages\n• Provide clear instructions\n• Test functionality regularly\n• Monitor usage statistics',
                        inline: false
                    },
                    {
                        name: '🔒 Security',
                        value: '• Regularly review role permissions\n• Use required roles for sensitive access\n• Monitor bulk assignments\n• Keep role hierarchy proper\n• Review logs periodically',
                        inline: false
                    }
                ],
                footer: 'Following these practices ensures a smooth experience for everyone'
            },

            'examples': {
                title: '📚 Examples',
                color: '#1abc9c',
                description: 'Real-world examples of self-role implementations:',
                fields: [
                    {
                        name: '🎮 Gaming Server Example',
                        value: '**Setup:** Gaming roles with conflicts\n**Config:** Max 3 roles per user\n**Features:** Game-specific roles, competitive team roles\n**Conflicts:** Team A ↔ Team B, Casual ↔ Competitive',
                        inline: false
                    },
                    {
                        name: '🌈 Color Roles Example',
                        value: '**Setup:** Cosmetic color roles\n**Config:** Max 1 role per user, all roles conflict\n**Features:** Visual username colors\n**Buttons:** Different colors with matching button styles',
                        inline: false
                    },
                    {
                        name: '🔔 Notification Example',
                        value: '**Setup:** Announcement pingable roles\n**Config:** Unlimited roles, removal allowed\n**Features:** Event notifications, update pings\n**Logging:** Track who opts in/out',
                        inline: false
                    },
                    {
                        name: '💼 Community Roles Example',
                        value: '**Setup:** Interest-based community roles\n**Config:** Max 5 roles, required base role\n**Features:** Hobby groups, professional interests\n**Advanced:** Age-gated roles with requirements',
                        inline: false
                    }
                ],
                footer: 'Adapt these examples to fit your server\'s needs'
            }
        };

        return helpTopics[topic] || {
            title: '❓ Unknown Topic',
            color: '#95a5a6',
            description: 'The requested help topic was not found.',
            footer: 'Use /selfrole-help to see available topics'
        };
    }
};
