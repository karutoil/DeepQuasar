const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType
} = require('discord.js');
const EmbedTemplate = require('../../schemas/EmbedTemplate');
const EmbedBuilderHandler = require('../../utils/EmbedBuilderHandler');
const Utils = require('../../utils/utils');

module.exports = {
    category: 'Settings',
    permissions: [PermissionFlagsBits.ManageMessages],
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Advanced embed builder with templates and live preview')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('builder')
                .setDescription('Launch the interactive embed builder')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('templates')
                .setDescription('Manage embed templates')
                .addStringOption(option =>
                    option
                        .setName('action')
                        .setDescription('Template action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'List all templates', value: 'list' },
                            { name: 'Delete template', value: 'delete' },
                            { name: 'Search templates', value: 'search' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('query')
                        .setDescription('Template name to delete or search term')
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        // Check permissions
        if (!this.hasPermission(interaction.member, interaction.guild)) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Permission', 'You need `Manage Messages` permission to use this command.')],
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'builder') {
            await this.handleBuilder(interaction);
        } else if (subcommand === 'templates') {
            await this.handleTemplates(interaction);
        }
    },

    hasPermission(member, guild) {
        // Check if user is server owner
        if (guild.ownerId === member.id) return true;

        // Check for required permissions
        return member.permissions.has(PermissionFlagsBits.ManageMessages) || 
               member.permissions.has(PermissionFlagsBits.Administrator);
    },

    async handleBuilder(interaction) {
        const session = EmbedBuilderHandler.getSession(interaction.user.id);
        
        // Create beautiful, modern embed builder interface
        const embed = this.createBuilderEmbed(session.embedData, session.messageContent);
        const preview = EmbedBuilderHandler.createPreviewEmbed(session.embedData);
        const components = await this.createBuilderComponents(interaction.guild.id);

        const message = await interaction.reply({
            embeds: [embed, preview],
            components: components,
            ephemeral: true
        });

        // Store message reference for updates
        session.messageRef = message;
    },

    async handleTemplates(interaction) {
        const action = interaction.options.getString('action');
        const query = interaction.options.getString('query');

        switch (action) {
            case 'list':
                await this.listTemplates(interaction);
                break;
            case 'delete':
                if (!query) {
                    return interaction.reply({
                        embeds: [Utils.createErrorEmbed('Missing Query', 'Please provide a template name to delete.')],
                        ephemeral: true
                    });
                }
                await this.deleteTemplate(interaction, query);
                break;
            case 'search':
                if (!query) {
                    return interaction.reply({
                        embeds: [Utils.createErrorEmbed('Missing Query', 'Please provide a search term.')],
                        ephemeral: true
                    });
                }
                await this.searchTemplates(interaction, query);
                break;
        }
    },

    createBuilderEmbed(embedData, messageContent) {
        const embed = new EmbedBuilder()
            .setTitle('✨ Embed Builder')
            .setDescription(
                '**Create beautiful embeds with ease**\n\n' +
                '**Current Status:**\n' +
                `${this.getEmbedStats(embedData)}\n\n` +
                `${messageContent ? `**Message Content:** ${Utils.truncate(messageContent, 80)}\n\n` : ''}` +
                '**Preview:**'
            )
            .setColor(0x5865F2)
            .setFooter({ 
                text: 'Use the buttons below to build your embed • Session expires in 15 minutes',
                iconURL: 'https://cdn.discordapp.com/emojis/1234567890123456789.png' // You can replace with actual icon
            })
            .setTimestamp();

        return embed;
    },

    getEmbedStats(embedData) {
        const stats = [];
        
        if (embedData.title) stats.push('📝 Title');
        if (embedData.description) stats.push('📄 Description');
        if (embedData.author?.name) stats.push('👤 Author');
        if (embedData.footer?.text) stats.push('📍 Footer');
        if (embedData.image?.url) stats.push('🖼️ Image');
        if (embedData.thumbnail?.url) stats.push('🖼️ Thumbnail');
        if (embedData.fields?.length > 0) stats.push(`📋 ${embedData.fields.length} Field${embedData.fields.length !== 1 ? 's' : ''}`);
        if (embedData.color !== null) stats.push('🎨 Color');
        if (embedData.url) stats.push('🔗 URL');
        if (embedData.timestamp) stats.push('⏰ Timestamp');

        return stats.length > 0 ? stats.join(' • ') : '*No content added yet*';
    },

    async createBuilderComponents(guildId) {
        const templates = await EmbedTemplate.findByGuild(guildId).limit(5);
        
        // Main content controls
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_title')
                    .setLabel('Title')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('embed_description')
                    .setLabel('Description')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('embed_url')
                    .setLabel('URL')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('embed_color')
                    .setLabel('Color')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('embed_timestamp')
                    .setLabel('Timestamp')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Visual elements
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_author')
                    .setLabel('Author')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('embed_thumbnail')
                    .setLabel('Thumbnail')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('embed_image')
                    .setLabel('Image')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('embed_footer')
                    .setLabel('Footer')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('embed_message_content')
                    .setLabel('Message')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Field management
        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_add_field')
                    .setLabel('Add Field')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('embed_edit_field')
                    .setLabel('Edit Field')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('embed_remove_field')
                    .setLabel('Remove Field')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('embed_clear_fields')
                    .setLabel('Clear Fields')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('embed_clear_all')
                    .setLabel('Reset')
                    .setStyle(ButtonStyle.Danger)
            );

        // Actions
        const row4 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_export_json')
                    .setLabel('Export JSON')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('embed_send')
                    .setLabel('Send Embed')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('embed_save_template')
                    .setLabel('Save Template')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('embed_load_template')
                    .setLabel('Load Template')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(templates.length === 0),
                new ButtonBuilder()
                    .setCustomId('embed_cancel')
                    .setLabel('Done')
                    .setStyle(ButtonStyle.Secondary)
            );

        return [row1, row2, row3, row4];
    },

    async handleBuilderInteraction(interaction) {
        const { customId } = interaction;
        const session = EmbedBuilderHandler.getSession(interaction.user.id);

        switch (customId) {
            case 'embed_title':
                await this.showTextModal(interaction, 'Title', 'Enter embed title', session.embedData.title, 256);
                break;

            case 'embed_description':
                await this.showTextModal(interaction, 'Description', 'Enter embed description', session.embedData.description, 4000, TextInputStyle.Paragraph);
                break;

            case 'embed_url':
                await this.showTextModal(interaction, 'URL', 'Enter embed URL (https://...)', session.embedData.url, 500);
                break;

            case 'embed_color':
                await this.showColorModal(interaction);
                break;

            case 'embed_timestamp':
                session.embedData.timestamp = !session.embedData.timestamp;
                // Acknowledge the interaction without sending a visible response
                await interaction.deferUpdate();
                // Update the embed display immediately
                setTimeout(() => this.updateBuilderDisplay(interaction, session), 100);
                break;

            case 'embed_author':
                await this.showAuthorModal(interaction, session.embedData.author);
                break;

            case 'embed_thumbnail':
                await this.showTextModal(interaction, 'Thumbnail', 'Enter thumbnail image URL', session.embedData.thumbnail?.url, 500);
                break;

            case 'embed_image':
                await this.showTextModal(interaction, 'Image', 'Enter image URL', session.embedData.image?.url, 500);
                break;

            case 'embed_footer':
                await this.showFooterModal(interaction, session.embedData.footer);
                break;

            case 'embed_message_content':
                await this.showTextModal(interaction, 'Message Content', 'Enter message content (outside embed)', session.messageContent, 2000, TextInputStyle.Paragraph);
                break;

            case 'embed_add_field':
                if (session.embedData.fields.length >= 25) {
                    await interaction.reply({
                        embeds: [Utils.createErrorEmbed('Field Limit', 'Embeds can have a maximum of 25 fields.')],
                        ephemeral: true
                    });
                    return;
                }
                await this.showAddFieldModal(interaction);
                break;

            case 'embed_edit_field':
                // Ensure fields array exists
                if (!Array.isArray(session.embedData.fields)) {
                    session.embedData.fields = [];
                }
                if (session.embedData.fields.length === 0) {
                    await interaction.reply({
                        embeds: [Utils.createErrorEmbed('No Fields', 'Add a field first before editing.')],
                        ephemeral: true
                    });
                    return;
                }
                await this.showEditFieldSelect(interaction, session.embedData.fields);
                break;

            case 'embed_remove_field':
                // Ensure fields array exists
                if (!Array.isArray(session.embedData.fields)) {
                    session.embedData.fields = [];
                }
                if (session.embedData.fields.length === 0) {
                    await interaction.reply({
                        embeds: [Utils.createErrorEmbed('No Fields', 'No fields to remove.')],
                        ephemeral: true
                    });
                    return;
                }
                await this.showRemoveFieldSelect(interaction, session.embedData.fields);
                break;

            case 'embed_clear_fields':
                session.embedData.fields = [];
                // Acknowledge the interaction without sending a visible response
                await interaction.deferUpdate();
                // Update the embed display immediately
                setTimeout(() => this.updateBuilderDisplay(interaction, session), 100);
                break;

            case 'embed_clear_all':
                Object.assign(session, {
                    embedData: EmbedBuilderHandler.createEmptyEmbedData(),
                    messageContent: ''
                });
                // Acknowledge the interaction without sending a visible response
                await interaction.deferUpdate();
                // Update the embed display immediately
                setTimeout(() => this.updateBuilderDisplay(interaction, session), 100);
                break;

            case 'embed_export_json':
                await this.exportJSON(interaction, session.embedData, session.messageContent);
                break;

            case 'embed_send':
                await this.showChannelSelect(interaction);
                break;

            case 'embed_save_template':
                await this.showSaveTemplateModal(interaction);
                break;

            case 'embed_load_template':
                await this.showLoadTemplateSelect(interaction);
                break;

            case 'embed_cancel':
                // Close the session silently
                await interaction.deferUpdate();
                setTimeout(async () => {
                    try {
                        await interaction.editReply({
                            embeds: [new EmbedBuilder()
                                .setTitle('✨ Embed Builder')
                                .setDescription('**Session Closed**\n\nThis embed builder session has been closed.')
                                .setColor(0x747F8D)
                                .setTimestamp()
                            ],
                            components: []
                        });
                    } catch (error) {
                        // Ignore errors
                    }
                }, 500);
                break;
        }
    },

    async updateBuilderDisplay(interaction, session) {
        const embed = this.createBuilderEmbed(session.embedData, session.messageContent);
        const preview = EmbedBuilderHandler.createPreviewEmbed(session.embedData);
        const components = await this.createBuilderComponents(interaction.guild.id);

        try {
            await session.messageRef.edit({
                embeds: [embed, preview],
                components: components
            });
        } catch (error) {
            console.error('Error updating builder display:', error);
        }
    },

    async showTextModal(interaction, title, placeholder, currentValue = '', maxLength = 256, style = TextInputStyle.Short) {
        try {
            const modal = new ModalBuilder()
                .setCustomId(`embed_modal_${title.toLowerCase().replace(/\s+/g, '_')}`)
                .setTitle(`Set ${title}`);

            const textInput = new TextInputBuilder()
                .setCustomId('text_input')
                .setLabel(title)
                .setPlaceholder(placeholder)
                .setStyle(style)
                .setMaxLength(maxLength)
                .setRequired(false);

            if (currentValue) {
                textInput.setValue(currentValue);
            }

            modal.addComponents(new ActionRowBuilder().addComponents(textInput));
            await interaction.showModal(modal);
        } catch (error) {
            console.error('Error showing text modal:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Modal Error', 'Failed to show modal. Please try again.')],
                    ephemeral: true
                }).catch(() => {});
            }
        }
    },

    async showColorModal(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('embed_modal_color')
                .setTitle('Set Embed Color');

            const colorInput = new TextInputBuilder()
                .setCustomId('color_input')
                .setLabel('Color')
                .setPlaceholder('Enter hex color (#FF0000) or name (red, blue, discord)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(20)
                .setRequired(false);

            modal.addComponents(new ActionRowBuilder().addComponents(colorInput));
            await interaction.showModal(modal);
        } catch (error) {
            console.error('Error showing color modal:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Modal Error', 'Failed to show modal. Please try again.')],
                    ephemeral: true
                }).catch(() => {});
            }
        }
    },

    async showAuthorModal(interaction, currentAuthor) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('embed_modal_author')
                .setTitle('Set Author');

            const nameInput = new TextInputBuilder()
                .setCustomId('author_name')
                .setLabel('Author Name')
                .setPlaceholder('Enter author name')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(256)
                .setRequired(false);

            const iconInput = new TextInputBuilder()
                .setCustomId('author_icon')
                .setLabel('Author Icon URL')
                .setPlaceholder('Enter icon image URL (optional)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(500)
                .setRequired(false);

            const urlInput = new TextInputBuilder()
                .setCustomId('author_url')
                .setLabel('Author URL')
                .setPlaceholder('Enter clickable URL (optional)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(500)
                .setRequired(false);

            if (currentAuthor?.name) nameInput.setValue(currentAuthor.name);
            if (currentAuthor?.iconURL) iconInput.setValue(currentAuthor.iconURL);
            if (currentAuthor?.url) urlInput.setValue(currentAuthor.url);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(iconInput),
                new ActionRowBuilder().addComponents(urlInput)
            );

            await interaction.showModal(modal);
        } catch (error) {
            console.error('Error showing author modal:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Modal Error', 'Failed to show modal. Please try again.')],
                    ephemeral: true
                }).catch(() => {});
            }
        }
    },

    async showFooterModal(interaction, currentFooter) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('embed_modal_footer')
                .setTitle('Set Footer');

            const textInput = new TextInputBuilder()
                .setCustomId('footer_text')
                .setLabel('Footer Text')
                .setPlaceholder('Enter footer text')
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(2048)
                .setRequired(false);

            const iconInput = new TextInputBuilder()
                .setCustomId('footer_icon')
                .setLabel('Footer Icon URL')
                .setPlaceholder('Enter icon image URL (optional)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(500)
                .setRequired(false);

            if (currentFooter?.text) textInput.setValue(currentFooter.text);
            if (currentFooter?.iconURL) iconInput.setValue(currentFooter.iconURL);

            modal.addComponents(
                new ActionRowBuilder().addComponents(textInput),
                new ActionRowBuilder().addComponents(iconInput)
            );

            await interaction.showModal(modal);
        } catch (error) {
            console.error('Error showing footer modal:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Modal Error', 'Failed to show modal. Please try again.')],
                    ephemeral: true
                }).catch(() => {});
            }
        }
    },

    async showAddFieldModal(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('embed_modal_add_field')
                .setTitle('Add Field');

            const nameInput = new TextInputBuilder()
                .setCustomId('field_name')
                .setLabel('Field Name')
                .setPlaceholder('Enter field name')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(256)
                .setRequired(true);

            const valueInput = new TextInputBuilder()
                .setCustomId('field_value')
                .setLabel('Field Value')
                .setPlaceholder('Enter field value')
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(1024)
                .setRequired(true);

            const inlineInput = new TextInputBuilder()
                .setCustomId('field_inline')
                .setLabel('Inline Field')
                .setPlaceholder('true or false (default: false)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(5)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(valueInput),
                new ActionRowBuilder().addComponents(inlineInput)
            );

            await interaction.showModal(modal);
        } catch (error) {
            console.error('Error showing add field modal:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Modal Error', 'Failed to show modal. Please try again.')],
                    ephemeral: true
                }).catch(() => {});
            }
        }
    },

    async showEditFieldSelect(interaction, fields) {
        // Validate fields array and filter out invalid entries
        const validFields = Array.isArray(fields) ? fields.filter(field => 
            field && 
            typeof field === 'object' &&
            typeof field.name === 'string' && 
            field.name.trim().length > 0 && 
            typeof field.value === 'string' && 
            field.value.trim().length > 0
        ) : [];

        if (validFields.length === 0) {
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('No Fields', 'There are no fields to edit.')],
                ephemeral: true
            });
            return;
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('embed_select_edit_field')
            .setPlaceholder('Select a field to edit')
            .addOptions(
                validFields.map((field, index) => ({
                    label: Utils.truncate(field.name, 25),
                    description: Utils.truncate(field.value, 50),
                    value: index.toString()
                }))
            );

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({
            content: '**Select a field to edit:**',
            components: [row],
            ephemeral: true
        });
    },

    async showRemoveFieldSelect(interaction, fields) {
        // Validate fields array and filter out invalid entries
        const validFields = Array.isArray(fields) ? fields.filter(field => 
            field && 
            typeof field === 'object' &&
            typeof field.name === 'string' && 
            field.name.trim().length > 0 && 
            typeof field.value === 'string' && 
            field.value.trim().length > 0
        ) : [];

        if (validFields.length === 0) {
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('No Fields', 'There are no fields to remove.')],
                ephemeral: true
            });
            return;
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('embed_select_remove_field')
            .setPlaceholder('Select a field to remove')
            .addOptions(
                validFields.map((field, index) => ({
                    label: Utils.truncate(field.name, 25),
                    description: Utils.truncate(field.value, 50),
                    value: index.toString()
                }))
            );

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({
            content: '**Select a field to remove:**',
            components: [row],
            ephemeral: true
        });
    },

    async showChannelSelect(interaction) {
        const channels = interaction.guild.channels.cache
            .filter(channel => 
                channel.type === ChannelType.GuildText && 
                channel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'EmbedLinks'])
            )
            .first(25);

        if (channels.length === 0) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Channels', 'No suitable text channels found.')],
                ephemeral: true
            });
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('embed_select_channel')
            .setPlaceholder('Select a channel to send the embed')
            .addOptions(
                channels.map(channel => ({
                    label: `# ${channel.name}`,
                    description: channel.topic ? Utils.truncate(channel.topic, 50) : 'No topic',
                    value: channel.id
                }))
            );

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({
            content: '**Select a channel to send your embed:**',
            components: [row],
            ephemeral: true
        });
    },

    async showSaveTemplateModal(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('embed_modal_save_template')
                .setTitle('Save Template');

            const nameInput = new TextInputBuilder()
                .setCustomId('template_name')
                .setLabel('Template Name')
                .setPlaceholder('Enter a unique name for this template')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(50)
                .setRequired(true);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('template_description')
                .setLabel('Description')
                .setPlaceholder('Enter a description for this template (optional)')
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(200)
                .setRequired(false);

            const categoryInput = new TextInputBuilder()
                .setCustomId('template_category')
                .setLabel('Category')
                .setPlaceholder('Enter a category (e.g., Announcements, Rules)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(30)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(categoryInput)
            );

            await interaction.showModal(modal);
        } catch (error) {
            console.error('Error showing save template modal:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Modal Error', 'Failed to show modal. Please try again.')],
                    ephemeral: true
                }).catch(() => {});
            }
        }
    },

    async showLoadTemplateSelect(interaction) {
        const templates = await EmbedTemplate.findByGuild(interaction.guild.id).limit(25);

        if (templates.length === 0) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('No Templates', 'No templates found for this server.')],
                ephemeral: true
            });
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('embed_select_load_template')
            .setPlaceholder('Select a template to load')
            .addOptions(
                templates.map(template => ({
                    label: template.name,
                    description: template.description || 'No description',
                    value: template._id.toString()
                }))
            );

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({
            content: '**Select a template to load:**',
            components: [row],
            ephemeral: true
        });
    },

    async exportJSON(interaction, embedData, messageContent) {
        const cleanData = EmbedBuilderHandler.cleanEmbedData(embedData);
        const exportData = {
            embed: cleanData,
            content: messageContent || null
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        
        if (jsonString.length > 2000) {
            // Create a text file for large exports
            const { AttachmentBuilder } = require('discord.js');
            const attachment = new AttachmentBuilder(Buffer.from(jsonString), { name: 'embed-export.json' });
            
            await interaction.reply({
                content: '**Embed JSON Export** (file attachment)',
                files: [attachment],
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: `**Embed JSON Export:**\n\`\`\`json\n${jsonString}\n\`\`\``,
                ephemeral: true
            });
        }
    },

    async listTemplates(interaction) {
        const templates = await EmbedTemplate.findByGuild(interaction.guild.id);

        if (templates.length === 0) {
            return interaction.reply({
                embeds: [Utils.createInfoEmbed('No Templates', 'No templates found for this server. Create one using `/embed builder`!')],
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('📋 Embed Templates')
            .setDescription(`Found **${templates.length}** template${templates.length !== 1 ? 's' : ''}`)
            .setColor(0x5865F2)
            .setTimestamp();

        const templateList = templates.map((template, index) => {
            const usage = template.usage?.count || 0;
            return `**${index + 1}.** ${template.name}\n` +
                   `└ *${template.description || 'No description'}*\n` +
                   `└ Category: ${template.category} • Used: ${usage} time${usage !== 1 ? 's' : ''}`;
        }).join('\n\n');

        embed.setDescription(embed.data.description + '\n\n' + templateList);

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    },

    async deleteTemplate(interaction, templateName) {
        const template = await EmbedTemplate.findOne({
            guildId: interaction.guild.id,
            name: templateName
        });

        if (!template) {
            return interaction.reply({
                embeds: [Utils.createErrorEmbed('Template Not Found', `No template named "${templateName}" was found.`)],
                ephemeral: true
            });
        }

        await template.deleteOne();

        await interaction.reply({
            embeds: [Utils.createSuccessEmbed('Template Deleted', `Template "${templateName}" has been deleted successfully.`)],
            ephemeral: true
        });
    },

    async searchTemplates(interaction, searchTerm) {
        const templates = await EmbedTemplate.searchTemplates(interaction.guild.id, searchTerm);

        if (templates.length === 0) {
            return interaction.reply({
                embeds: [Utils.createInfoEmbed('No Results', `No templates found matching "${searchTerm}".`)],
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🔍 Template Search Results')
            .setDescription(`Found **${templates.length}** template${templates.length !== 1 ? 's' : ''} matching "${searchTerm}"`)
            .setColor(0x5865F2)
            .setTimestamp();

        const templateList = templates.map((template, index) => {
            const usage = template.usage?.count || 0;
            return `**${index + 1}.** ${template.name}\n` +
                   `└ *${template.description || 'No description'}*\n` +
                   `└ Category: ${template.category} • Used: ${usage} time${usage !== 1 ? 's' : ''}`;
        }).join('\n\n');

        embed.setDescription(embed.data.description + '\n\n' + templateList);

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
