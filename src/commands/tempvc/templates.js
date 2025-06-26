const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const TempVC = require('../../schemas/TempVC');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Settings',
    data: new SlashCommandBuilder()
        .setName('tempvc-templates')
        .setDescription('Manage channel naming templates for temp VCs')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all available naming templates'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new naming template')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Template name')
                        .setMinLength(1)
                        .setMaxLength(50)
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('template')
                        .setDescription('Template string (use {user}, {activity}, {time}, etc.)')
                        .setMinLength(1)
                        .setMaxLength(100)
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('Description of the template')
                        .setMaxLength(200)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a naming template')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name of the template to remove')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing template')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name of the template to edit')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option
                        .setName('template')
                        .setDescription('New template string')
                        .setMinLength(1)
                        .setMaxLength(100)
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('New description')
                        .setMaxLength(200)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('preview')
                .setDescription('Preview how a template would look')
                .addStringOption(option =>
                    option
                        .setName('template')
                        .setDescription('Template string to preview')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('activity')
                        .setDescription('Sample activity name for preview')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('placeholders')
                .setDescription('View available template placeholders')),

    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        
        if (focusedOption.name === 'name') {
            const config = await TempVC.findByGuildId(interaction.guild.id);
            
            if (!config || !config.namingTemplates) {
                return interaction.respond([]);
            }
            
            const templates = config.namingTemplates
                .filter(template => template.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
                .slice(0, 25)
                .map(template => ({
                    name: template.name,
                    value: template.name
                }));
            
            await interaction.respond(templates);
        }
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'list':
                    await this.handleList(interaction);
                    break;
                case 'add':
                    await this.handleAdd(interaction);
                    break;
                case 'remove':
                    await this.handleRemove(interaction);
                    break;
                case 'edit':
                    await this.handleEdit(interaction);
                    break;
                case 'preview':
                    await this.handlePreview(interaction);
                    break;
                case 'placeholders':
                    await this.handlePlaceholders(interaction);
                    break;
                default:
                    await interaction.reply({
                        embeds: [Utils.createErrorEmbed('Error', 'Unknown subcommand')],
                        ephemeral: true
                    });
            }
        } catch (error) {
            console.error('Error in tempvc-templates command:', error);
            const embed = Utils.createErrorEmbed('Error', 'An error occurred while processing the command.');
            
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    },

    async handleList(interaction) {
        let config = await TempVC.findByGuildId(interaction.guild.id);
        if (!config) {
            config = await TempVC.createDefault(interaction.guild.id);
        }

        if (config.namingTemplates.length === 0) {
            return interaction.reply({
                embeds: [Utils.createInfoEmbed('No Templates', 'No naming templates have been created yet.')],
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('📝 Channel Naming Templates')
            .setColor(0x5865F2)
            .setTimestamp();

        let description = '';
        
        for (const template of config.namingTemplates) {
            description += `**${template.name}**\n`;
            description += `└ Template: \`${template.template}\`\n`;
            if (template.description) {
                description += `└ Description: ${template.description}\n`;
            }
            description += '\n';
        }

        embed.setDescription(description);
        embed.setFooter({ text: `${config.namingTemplates.length} templates` });

        await interaction.reply({ embeds: [embed] });
    },

    async handleAdd(interaction) {
        let config = await TempVC.findByGuildId(interaction.guild.id);
        if (!config) {
            config = await TempVC.createDefault(interaction.guild.id);
        }

        const name = interaction.options.getString('name');
        const template = interaction.options.getString('template');
        const description = interaction.options.getString('description') || '';

        // Check if template name already exists
        const existingTemplate = config.namingTemplates.find(t => t.name.toLowerCase() === name.toLowerCase());
        if (existingTemplate) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Template Exists', 'A template with that name already exists.')],
                ephemeral: true
            });
        }

        // Validate template
        const validation = this.validateTemplate(template);
        if (!validation.valid) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Invalid Template', validation.error)],
                ephemeral: true
            });
        }

        // Add template
        config.namingTemplates.push({
            name,
            template,
            description
        });

        await config.save();

        // Preview the template
        const preview = this.previewTemplate(template, interaction.member, 'Gaming');

        const embed = Utils.createSuccessEmbed(
            'Template Added',
            [
                `**Name:** ${name}`,
                `**Template:** \`${template}\``,
                description ? `**Description:** ${description}` : '',
                `**Preview:** ${preview}`
            ].filter(line => line !== '').join('\n')
        );

        await interaction.reply({ embeds: [embed] });
    },

    async handleRemove(interaction) {
        let config = await TempVC.findByGuildId(interaction.guild.id);
        if (!config) {
            config = await TempVC.createDefault(interaction.guild.id);
        }

        const name = interaction.options.getString('name');

        const templateIndex = config.namingTemplates.findIndex(t => t.name.toLowerCase() === name.toLowerCase());
        if (templateIndex === -1) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Template Not Found', 'No template with that name exists.')],
                ephemeral: true
            });
        }

        const removedTemplate = config.namingTemplates[templateIndex];
        config.namingTemplates.splice(templateIndex, 1);

        await config.save();

        const embed = Utils.createSuccessEmbed(
            'Template Removed',
            `The template "**${removedTemplate.name}**" has been removed.`
        );

        await interaction.reply({ embeds: [embed] });
    },

    async handleEdit(interaction) {
        let config = await TempVC.findByGuildId(interaction.guild.id);
        if (!config) {
            config = await TempVC.createDefault(interaction.guild.id);
        }

        const name = interaction.options.getString('name');
        const newTemplate = interaction.options.getString('template');
        const newDescription = interaction.options.getString('description');

        const template = config.namingTemplates.find(t => t.name.toLowerCase() === name.toLowerCase());
        if (!template) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Template Not Found', 'No template with that name exists.')],
                ephemeral: true
            });
        }

        let changes = [];

        if (newTemplate) {
            // Validate template
            const validation = this.validateTemplate(newTemplate);
            if (!validation.valid) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Invalid Template', validation.error)],
                    ephemeral: true
                });
            }

            template.template = newTemplate;
            changes.push(`**Template:** \`${newTemplate}\``);
        }

        if (newDescription !== null) {
            template.description = newDescription;
            changes.push(`**Description:** ${newDescription || 'Removed'}`);
        }

        if (changes.length === 0) {
            return interaction.reply({
                embeds: [Utils.createWarningEmbed('No Changes', 'No changes were provided.')],
                ephemeral: true
            });
        }

        await config.save();

        // Preview the template if it was changed
        let preview = '';
        if (newTemplate) {
            preview = `\n**Preview:** ${this.previewTemplate(template.template, interaction.member, 'Gaming')}`;
        }

        const embed = Utils.createSuccessEmbed(
            'Template Updated',
            `Updated template "**${template.name}**":\n\n${changes.join('\n')}${preview}`
        );

        await interaction.reply({ embeds: [embed] });
    },

    async handlePreview(interaction) {
        const template = interaction.options.getString('template');
        const activity = interaction.options.getString('activity') || 'Gaming';

        // Validate template
        const validation = this.validateTemplate(template);
        if (!validation.valid) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Invalid Template', validation.error)],
                ephemeral: true
            });
        }

        const preview = this.previewTemplate(template, interaction.member, activity);

        const embed = Utils.createInfoEmbed(
            'Template Preview',
            [
                `**Template:** \`${template}\``,
                `**Sample Activity:** ${activity}`,
                `**Result:** ${preview}`
            ].join('\n')
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handlePlaceholders(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📝 Template Placeholders')
            .setDescription('Available placeholders for channel naming templates:')
            .setColor(0x5865F2)
            .addFields(
                {
                    name: '👤 User Placeholders',
                    value: [
                        '`{user}` - User display name',
                        '`{username}` - Username',
                        '`{tag}` - Full user tag (username#0000)',
                        '`{id}` - User ID'
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎮 Activity Placeholders',
                    value: [
                        '`{activity}` - Current activity/game',
                        '(Falls back to "Chilling" if no activity)'
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⏰ Time Placeholders',
                    value: [
                        '`{time}` - Current time',
                        '`{date}` - Current date'
                    ].join('\n'),
                    inline: true
                }
            )
            .addFields({
                name: '💡 Examples',
                value: [
                    '`{user}\'s Channel` → John\'s Channel',
                    '`{user} | {activity}` → John | Gaming',
                    '`🎮 {user}\'s Game` → 🎮 John\'s Game',
                    '`{username} - {time}` → john123 - 3:45:22 PM'
                ].join('\n'),
                inline: false
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    validateTemplate(template) {
        // Basic validation
        if (template.length > 100) {
            return { valid: false, error: 'Template cannot be longer than 100 characters.' };
        }

        if (template.length < 1) {
            return { valid: false, error: 'Template cannot be empty.' };
        }

        // Check for Discord channel name restrictions
        const discordBadChars = /[<>:"\/\\|?*\x00-\x1f]/;
        if (discordBadChars.test(template.replace(/{[^}]+}/g, 'test'))) {
            return { valid: false, error: 'Template contains invalid characters for Discord channel names.' };
        }

        return { valid: true };
    },

    previewTemplate(template, member, activity = 'Gaming') {
        let result = template
            .replace(/{user}/g, member.displayName || member.user.username)
            .replace(/{username}/g, member.user.username)
            .replace(/{tag}/g, member.user.tag)
            .replace(/{id}/g, member.user.id)
            .replace(/{activity}/g, activity);
        
        // Replace time placeholders
        const now = new Date();
        result = result
            .replace(/{time}/g, now.toLocaleTimeString())
            .replace(/{date}/g, now.toLocaleDateString());
        
        return result;
    }
};
