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

module.exports = {
    category: 'Settings',
    permissions: [PermissionFlagsBits.ManageMessages],
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Interactive embed builder')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('builder')
                .setDescription('Launch the interactive embed builder')
        ),

    async execute(interaction) {
        // Check permissions
        if (!this.hasPermission(interaction.member, interaction.guild)) {
            return interaction.reply({
                content: '❌ **Access Denied**\n\nYou need one of the following permissions to use the embed builder:\n• `Manage Messages`\n• `Administrator`\n• Be the server owner',
                ephemeral: true
            });
        }

        // Initialize embed builder session
        const embedData = {
            title: null,
            description: null,
            url: null,
            color: null,
            timestamp: false,
            author: { name: null, iconURL: null, url: null },
            thumbnail: { url: null },
            image: { url: null },
            footer: { text: null, iconURL: null },
            fields: []
        };

        const messageContent = '';

        await this.showEmbedBuilder(interaction, embedData, messageContent);
    },

    hasPermission(member, guild) {
        // Check if user is server owner
        if (guild.ownerId === member.id) return true;

        // Check for required permissions
        return member.permissions.has(PermissionFlagsBits.ManageMessages) || 
               member.permissions.has(PermissionFlagsBits.Administrator);
    },

    async showEmbedBuilder(interaction, embedData, messageContent, update = false) {
        const embed = this.createPreviewEmbed(embedData);
        const components = this.createBuilderComponents();

        const response = {
            content: `**🎨 Embed Builder**\n${messageContent ? `**Message Content:** ${messageContent}\n` : ''}**Preview:**`,
            embeds: [embed],
            components: components,
            ephemeral: true
        };

        let message;
        if (update) {
            message = await interaction.editReply(response);
        } else {
            message = await interaction.reply(response);
        }

        // Store the message reference for later updates
        if (!interaction.client.embedBuilderMessages) {
            interaction.client.embedBuilderMessages = new Map();
        }
        interaction.client.embedBuilderMessages.set(interaction.user.id, message);

        // Set up collector for button interactions
        this.setupCollector(interaction, embedData, messageContent);
    },

    createPreviewEmbed(embedData) {
        const embed = new EmbedBuilder();

        if (embedData.title) embed.setTitle(embedData.title);
        if (embedData.description) embed.setDescription(embedData.description);
        
        // Validate URL before setting
        if (embedData.url) {
            try {
                if (this.isValidUrl(embedData.url)) {
                    embed.setURL(embedData.url);
                }
            } catch (error) {
                // Invalid URL, skip setting it
            }
        }
        
        if (embedData.color) embed.setColor(embedData.color);
        if (embedData.timestamp) embed.setTimestamp();
        
        if (embedData.author.name) {
            const authorData = { name: embedData.author.name };
            
            // Validate author icon URL
            if (embedData.author.iconURL && this.isValidUrl(embedData.author.iconURL)) {
                authorData.iconURL = embedData.author.iconURL;
            }
            
            // Validate author URL
            if (embedData.author.url && this.isValidUrl(embedData.author.url)) {
                authorData.url = embedData.author.url;
            }
            
            embed.setAuthor(authorData);
        }
        
        // Validate thumbnail URL
        if (embedData.thumbnail.url) {
            try {
                if (this.isValidUrl(embedData.thumbnail.url)) {
                    embed.setThumbnail(embedData.thumbnail.url);
                }
            } catch (error) {
                // Invalid URL, skip setting it
            }
        }
        
        // Validate image URL
        if (embedData.image.url) {
            try {
                if (this.isValidUrl(embedData.image.url)) {
                    embed.setImage(embedData.image.url);
                }
            } catch (error) {
                // Invalid URL, skip setting it
            }
        }
        
        if (embedData.footer.text) {
            const footerData = { text: embedData.footer.text };
            
            // Validate footer icon URL
            if (embedData.footer.iconURL && this.isValidUrl(embedData.footer.iconURL)) {
                footerData.iconURL = embedData.footer.iconURL;
            }
            
            embed.setFooter(footerData);
        }

        if (embedData.fields.length > 0) {
            embed.addFields(embedData.fields);
        }

        // If embed is empty, show placeholder
        if (!embed.data.title && !embed.data.description && !embed.data.fields?.length && 
            !embed.data.author && !embed.data.image && !embed.data.thumbnail) {
            embed.setDescription('*Your embed preview will appear here...*');
            embed.setColor(0x2b2d31);
        }

        return embed;
    },

    createBuilderComponents() {
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_title')
                    .setLabel('Title')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📝'),
                new ButtonBuilder()
                    .setCustomId('embed_description')
                    .setLabel('Description')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📄'),
                new ButtonBuilder()
                    .setCustomId('embed_url')
                    .setLabel('URL')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔗'),
                new ButtonBuilder()
                    .setCustomId('embed_color')
                    .setLabel('Color')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎨'),
                new ButtonBuilder()
                    .setCustomId('embed_timestamp')
                    .setLabel('Timestamp')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⏰')
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_author')
                    .setLabel('Author')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👤'),
                new ButtonBuilder()
                    .setCustomId('embed_thumbnail')
                    .setLabel('Thumbnail')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🖼️'),
                new ButtonBuilder()
                    .setCustomId('embed_image')
                    .setLabel('Image')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🖼️'),
                new ButtonBuilder()
                    .setCustomId('embed_footer')
                    .setLabel('Footer')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⬇️'),
                new ButtonBuilder()
                    .setCustomId('embed_message_content')
                    .setLabel('Message')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💬')
            );

        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_add_field')
                    .setLabel('Add Field')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('➕'),
                new ButtonBuilder()
                    .setCustomId('embed_edit_field')
                    .setLabel('Edit Field')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✏️'),
                new ButtonBuilder()
                    .setCustomId('embed_remove_field')
                    .setLabel('Remove Field')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('➖'),
                new ButtonBuilder()
                    .setCustomId('embed_clear_fields')
                    .setLabel('Clear Fields')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🗑️'),
                new ButtonBuilder()
                    .setCustomId('embed_clear_all')
                    .setLabel('Clear All')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔄')
            );

        const row4 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('embed_export_json')
                    .setLabel('Export JSON')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📋'),
                new ButtonBuilder()
                    .setCustomId('embed_send')
                    .setLabel('Send Embed')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('📤'),
                new ButtonBuilder()
                    .setCustomId('embed_save_template')
                    .setLabel('Save Template')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('💾'),
                new ButtonBuilder()
                    .setCustomId('embed_load_template')
                    .setLabel('Load Template')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📁'),
                new ButtonBuilder()
                    .setCustomId('embed_cancel')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

        return [row1, row2, row3, row4];
    },

    setupCollector(interaction, embedData, messageContent) {
        const filter = (i) => {
            return i.user.id === interaction.user.id && i.customId.startsWith('embed_');
        };
        
        const collector = interaction.channel.createMessageComponentCollector({ 
            filter, 
            time: 600000 // 10 minutes
        });

        collector.on('collect', async (i) => {
            try {
                // Store session data
                if (!i.client.embedBuilderSessions) {
                    i.client.embedBuilderSessions = new Map();
                }
                if (!i.client.embedBuilderMessageContent) {
                    i.client.embedBuilderMessageContent = new Map();
                }
                
                i.client.embedBuilderSessions.set(i.user.id, embedData);
                i.client.embedBuilderMessageContent.set(i.user.id, messageContent);
                
                await this.handleBuilderInteraction(i, embedData, messageContent, collector);
            } catch (error) {
                console.error('Embed builder interaction error:', error);
                if (!i.replied && !i.deferred) {
                    await i.reply({ content: '❌ An error occurred while processing your request.', ephemeral: true });
                }
            }
        });

        collector.on('end', async () => {
            try {
                // Clean up session data
                if (interaction.client.embedBuilderSessions) {
                    interaction.client.embedBuilderSessions.delete(interaction.user.id);
                }
                if (interaction.client.embedBuilderMessageContent) {
                    interaction.client.embedBuilderMessageContent.delete(interaction.user.id);
                }
                if (interaction.client.embedBuilderEditIndex) {
                    interaction.client.embedBuilderEditIndex.delete(interaction.user.id);
                }
                if (interaction.client.embedBuilderMessages) {
                    interaction.client.embedBuilderMessages.delete(interaction.user.id);
                }

                const disabledComponents = this.createBuilderComponents().map(row => {
                    row.components.forEach(component => component.setDisabled(true));
                    return row;
                });

                await interaction.editReply({ components: disabledComponents }).catch(() => {});
            } catch (error) {
                // Ignore errors when disabling components
            }
        });
    },

    async handleBuilderInteraction(interaction, embedData, messageContent, collector) {
        const { customId } = interaction;

        // Get current session data
        const currentEmbedData = interaction.client.embedBuilderSessions?.get(interaction.user.id) || embedData;
        let currentMessageContent = interaction.client.embedBuilderMessageContent?.get(interaction.user.id) || messageContent;

        switch (customId) {
            case 'embed_title':
                await this.showTextModal(interaction, 'Title', 'Enter embed title', currentEmbedData.title, 256);
                break;
            case 'embed_description':
                await this.showTextModal(interaction, 'Description', 'Enter embed description', currentEmbedData.description, 4000, TextInputStyle.Paragraph);
                break;
            case 'embed_url':
                await this.showTextModal(interaction, 'URL', 'Enter embed URL', currentEmbedData.url, 500);
                break;
            case 'embed_color':
                await this.showColorModal(interaction);
                break;
            case 'embed_timestamp':
                currentEmbedData.timestamp = !currentEmbedData.timestamp;
                interaction.client.embedBuilderSessions?.set(interaction.user.id, currentEmbedData);
                await this.showEmbedBuilder(interaction, currentEmbedData, currentMessageContent, true);
                break;
            case 'embed_author':
                await this.showAuthorModal(interaction, currentEmbedData.author);
                break;
            case 'embed_thumbnail':
                await this.showTextModal(interaction, 'Thumbnail', 'Enter thumbnail URL', currentEmbedData.thumbnail.url, 500);
                break;
            case 'embed_image':
                await this.showTextModal(interaction, 'Image', 'Enter image URL', currentEmbedData.image.url, 500);
                break;
            case 'embed_footer':
                await this.showFooterModal(interaction, currentEmbedData.footer);
                break;
            case 'embed_message_content':
                await this.showTextModal(interaction, 'Message Content', 'Enter message content (outside embed)', currentMessageContent, 2000, TextInputStyle.Paragraph);
                break;
            case 'embed_add_field':
                await this.showAddFieldModal(interaction);
                break;
            case 'embed_edit_field':
                await this.showEditFieldSelect(interaction, currentEmbedData.fields);
                break;
            case 'embed_remove_field':
                await this.showRemoveFieldSelect(interaction, currentEmbedData.fields);
                break;
            case 'embed_clear_fields':
                currentEmbedData.fields = [];
                interaction.client.embedBuilderSessions?.set(interaction.user.id, currentEmbedData);
                await this.showEmbedBuilder(interaction, currentEmbedData, currentMessageContent, true);
                break;
            case 'embed_clear_all':
                Object.assign(currentEmbedData, {
                    title: null, description: null, url: null, color: null, timestamp: false,
                    author: { name: null, iconURL: null, url: null },
                    thumbnail: { url: null }, image: { url: null },
                    footer: { text: null, iconURL: null }, fields: []
                });
                currentMessageContent = '';
                interaction.client.embedBuilderSessions?.set(interaction.user.id, currentEmbedData);
                interaction.client.embedBuilderMessageContent?.set(interaction.user.id, currentMessageContent);
                await this.showEmbedBuilder(interaction, currentEmbedData, currentMessageContent, true);
                break;
            case 'embed_export_json':
                await this.exportJSON(interaction, currentEmbedData, currentMessageContent);
                break;
            case 'embed_send':
                await this.showChannelSelect(interaction, currentEmbedData, currentMessageContent);
                break;
            case 'embed_save_template':
                await this.showSaveTemplateModal(interaction);
                break;
            case 'embed_load_template':
                await this.showLoadTemplateSelect(interaction);
                break;
            case 'embed_cancel':
                collector.stop();
                await interaction.update({ 
                    content: '❌ Embed builder cancelled.', 
                    embeds: [], 
                    components: [] 
                });
                break;
        }
    },

    async showTextModal(interaction, title, placeholder, currentValue = '', maxLength = 256, style = TextInputStyle.Short) {
        const modal = new ModalBuilder()
            .setCustomId(`embed_modal_${title.toLowerCase().replace(' ', '_')}`)
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
    },

    async showColorModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('embed_modal_color')
            .setTitle('Set Embed Color');

        const colorInput = new TextInputBuilder()
            .setCustomId('color_input')
            .setLabel('Color')
            .setPlaceholder('Enter hex color (e.g., #FF0000, FF0000, or red)')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(20)
            .setRequired(false);

        modal.addComponents(new ActionRowBuilder().addComponents(colorInput));
        await interaction.showModal(modal);
    },

    async showAuthorModal(interaction, currentAuthor) {
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
            .setPlaceholder('Enter author icon URL')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(500)
            .setRequired(false);

        const urlInput = new TextInputBuilder()
            .setCustomId('author_url')
            .setLabel('Author URL')
            .setPlaceholder('Enter author URL')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(500)
            .setRequired(false);

        if (currentAuthor.name) nameInput.setValue(currentAuthor.name);
        if (currentAuthor.iconURL) iconInput.setValue(currentAuthor.iconURL);
        if (currentAuthor.url) urlInput.setValue(currentAuthor.url);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(iconInput),
            new ActionRowBuilder().addComponents(urlInput)
        );

        await interaction.showModal(modal);
    },

    async showFooterModal(interaction, currentFooter) {
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
            .setPlaceholder('Enter footer icon URL')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(500)
            .setRequired(false);

        if (currentFooter.text) textInput.setValue(currentFooter.text);
        if (currentFooter.iconURL) iconInput.setValue(currentFooter.iconURL);

        modal.addComponents(
            new ActionRowBuilder().addComponents(textInput),
            new ActionRowBuilder().addComponents(iconInput)
        );

        await interaction.showModal(modal);
    },

    async showAddFieldModal(interaction) {
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
            .setLabel('Inline (true/false)')
            .setPlaceholder('Enter true or false')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(5)
            .setRequired(false)
            .setValue('false');

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(valueInput),
            new ActionRowBuilder().addComponents(inlineInput)
        );

        await interaction.showModal(modal);
    },

    async showEditFieldSelect(interaction, fields) {
        if (fields.length === 0) {
            return interaction.reply({ content: '❌ No fields to edit.', ephemeral: true });
        }

        const options = fields.map((field, index) => ({
            label: field.name.slice(0, 100),
            description: field.value.slice(0, 100),
            value: index.toString()
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('embed_select_edit_field')
            .setPlaceholder('Select a field to edit')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: 'Select a field to edit:',
            components: [row],
            ephemeral: true
        });
    },

    async showRemoveFieldSelect(interaction, fields) {
        if (fields.length === 0) {
            return interaction.reply({ content: '❌ No fields to remove.', ephemeral: true });
        }

        const options = fields.map((field, index) => ({
            label: field.name.slice(0, 100),
            description: field.value.slice(0, 100),
            value: index.toString()
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('embed_select_remove_field')
            .setPlaceholder('Select a field to remove')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: 'Select a field to remove:',
            components: [row],
            ephemeral: true
        });
    },

    async exportJSON(interaction, embedData, messageContent) {
        const exportData = {
            content: messageContent || null,
            embeds: [this.cleanEmbedData(embedData)]
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        
        if (jsonString.length > 1900) {
            // If too long, send as file
            const buffer = Buffer.from(jsonString, 'utf8');
            await interaction.reply({
                content: '📋 **Export JSON** (file attachment)',
                files: [{
                    attachment: buffer,
                    name: 'embed_export.json'
                }],
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: `📋 **Export JSON**\n\`\`\`json\n${jsonString}\n\`\`\``,
                ephemeral: true
            });
        }
    },

    async showChannelSelect(interaction, embedData, messageContent) {
        const channels = interaction.guild.channels.cache
            .filter(channel => 
                channel.type === ChannelType.GuildText && 
                channel.permissionsFor(interaction.client.user).has(['SendMessages', 'EmbedLinks'])
            )
            .first(25); // Discord limit

        if (channels.length === 0) {
            return interaction.reply({
                content: '❌ No available text channels found where I can send embeds.',
                ephemeral: true
            });
        }

        const options = channels.map(channel => ({
            label: `#${channel.name}`,
            description: channel.topic?.slice(0, 100) || 'No description',
            value: channel.id
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('embed_select_channel')
            .setPlaceholder('Select a channel to send the embed')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: 'Select a channel to send your embed:',
            components: [row],
            ephemeral: true
        });
    },

    async showSaveTemplateModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('embed_modal_save_template')
            .setTitle('Save Template');

        const nameInput = new TextInputBuilder()
            .setCustomId('template_name')
            .setLabel('Template Name')
            .setPlaceholder('Enter a name for this template')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(50)
            .setRequired(true);

        const descInput = new TextInputBuilder()
            .setCustomId('template_description')
            .setLabel('Template Description (Optional)')
            .setPlaceholder('Enter a description for this template')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(200)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(descInput)
        );

        await interaction.showModal(modal);
    },

    async showLoadTemplateSelect(interaction) {
        try {
            const templates = await EmbedTemplate.find({ guildId: interaction.guild.id })
                .sort({ createdAt: -1 })
                .limit(25);

            if (templates.length === 0) {
                return interaction.reply({
                    content: '❌ No saved templates found for this server.',
                    ephemeral: true
                });
            }

            const options = templates.map(template => ({
                label: template.name,
                description: template.description || 'No description',
                value: template._id.toString()
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('embed_select_load_template')
                .setPlaceholder('Select a template to load')
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({
                content: 'Select a template to load:',
                components: [row],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error loading templates:', error);
            await interaction.reply({
                content: '❌ An error occurred while loading templates.',
                ephemeral: true
            });
        }
    },

    cleanEmbedData(embedData) {
        const cleaned = {};
        
        if (embedData.title) cleaned.title = embedData.title;
        if (embedData.description) cleaned.description = embedData.description;
        if (embedData.url) cleaned.url = embedData.url;
        if (embedData.color) cleaned.color = embedData.color;
        if (embedData.timestamp) cleaned.timestamp = new Date().toISOString();
        
        if (embedData.author.name) {
            cleaned.author = { name: embedData.author.name };
            if (embedData.author.iconURL) cleaned.author.icon_url = embedData.author.iconURL;
            if (embedData.author.url) cleaned.author.url = embedData.author.url;
        }
        
        if (embedData.thumbnail.url) cleaned.thumbnail = { url: embedData.thumbnail.url };
        if (embedData.image.url) cleaned.image = { url: embedData.image.url };
        
        if (embedData.footer.text) {
            cleaned.footer = { text: embedData.footer.text };
            if (embedData.footer.iconURL) cleaned.footer.icon_url = embedData.footer.iconURL;
        }
        
        if (embedData.fields.length > 0) cleaned.fields = embedData.fields;
        
        return cleaned;
    },

    parseColor(colorStr) {
        if (!colorStr) return null;
        
        // Remove # if present
        colorStr = colorStr.replace('#', '');
        
        // Named colors
        const namedColors = {
            'red': 0xFF0000, 'green': 0x00FF00, 'blue': 0x0000FF,
            'yellow': 0xFFFF00, 'orange': 0xFFA500, 'purple': 0x800080,
            'pink': 0xFFC0CB, 'black': 0x000000, 'white': 0xFFFFFF,
            'gray': 0x808080, 'grey': 0x808080
        };
        
        if (namedColors[colorStr.toLowerCase()]) {
            return namedColors[colorStr.toLowerCase()];
        }
        
        // Hex color
        const hex = parseInt(colorStr, 16);
        if (isNaN(hex) || hex < 0 || hex > 0xFFFFFF) return null;
        
        return hex;
    },

    isValidUrl(string) {
        if (!string) return false;
        
        try {
            // Clean the string
            string = string.trim();
            
            // Must start with http:// or https://
            if (!string.match(/^https?:\/\//i)) {
                return false;
            }
            
            const url = new URL(string);
            
            // Basic validation: must have a valid hostname
            if (!url.hostname || url.hostname.length === 0) {
                return false;
            }
            
            // Must contain at least one dot (for domain)
            if (!url.hostname.includes('.')) {
                return false;
            }
            
            return true;
            
        } catch (error) {
            return false;
        }
    }
};
