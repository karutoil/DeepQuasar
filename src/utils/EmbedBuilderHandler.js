const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const EmbedTemplate = require('../schemas/EmbedTemplate');
const Utils = require('./utils');

class EmbedBuilderHandler {
    constructor() {
        // Cache for embed builder sessions with automatic cleanup
        this.sessions = new Map();
        this.sessionTimeout = 15 * 60 * 1000; // 15 minutes
        
        // Cleanup expired sessions every 5 minutes
        setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
    }

    /**
     * Get or create a session for a user
     */
    getSession(userId) {
        if (!this.sessions.has(userId)) {
            this.sessions.set(userId, {
                embedData: this.createEmptyEmbedData(),
                messageContent: '',
                lastActivity: Date.now(),
                messageRef: null
            });
        }
        
        const session = this.sessions.get(userId);
        session.lastActivity = Date.now();
        
        // Ensure fields array is always properly initialized
        if (!Array.isArray(session.embedData.fields)) {
            session.embedData.fields = [];
        }
        
        return session;
    }

    /**
     * Update session data
     */
    updateSession(userId, updates) {
        const session = this.getSession(userId);
        Object.assign(session, updates);
        session.lastActivity = Date.now();
    }

    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        for (const [userId, session] of this.sessions.entries()) {
            if (now - session.lastActivity > this.sessionTimeout) {
                this.sessions.delete(userId);
            }
        }
    }

    /**
     * Create empty embed data structure
     */
    createEmptyEmbedData() {
        return {
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
    }

    /**
     * Handle modal submissions
     */
    async handleModalSubmit(interaction) {
        if (!interaction.customId.startsWith('embed_modal_')) return false;

        const modalType = interaction.customId.replace('embed_modal_', '');
        const session = this.getSession(interaction.user.id);

        try {
            let updateSuccess = false;

            switch (modalType) {
                case 'title':
                    session.embedData.title = interaction.fields.getTextInputValue('text_input') || null;
                    updateSuccess = true;
                    break;

                case 'description':
                    session.embedData.description = interaction.fields.getTextInputValue('text_input') || null;
                    updateSuccess = true;
                    break;

                case 'url':
                    const url = interaction.fields.getTextInputValue('text_input') || null;
                    if (url && !this.isValidUrl(url)) {
                        await interaction.reply({
                            embeds: [Utils.createErrorEmbed('Invalid URL', 'Please provide a valid HTTP/HTTPS URL.')],
                            ephemeral: true
                        });
                        return true;
                    }
                    session.embedData.url = url;
                    updateSuccess = true;
                    break;

                case 'message_content':
                    session.messageContent = interaction.fields.getTextInputValue('text_input') || '';
                    updateSuccess = true;
                    break;

                case 'thumbnail':
                    const thumbnailUrl = interaction.fields.getTextInputValue('text_input') || null;
                    if (thumbnailUrl && !this.isValidImageUrl(thumbnailUrl)) {
                        await interaction.reply({
                            embeds: [Utils.createErrorEmbed('Invalid Image URL', 'Please provide a valid image URL (PNG, JPG, JPEG, GIF, WebP).')],
                            ephemeral: true
                        });
                        return true;
                    }
                    session.embedData.thumbnail.url = thumbnailUrl;
                    updateSuccess = true;
                    break;

                case 'image':
                    const imageUrl = interaction.fields.getTextInputValue('text_input') || null;
                    if (imageUrl && !this.isValidImageUrl(imageUrl)) {
                        await interaction.reply({
                            embeds: [Utils.createErrorEmbed('Invalid Image URL', 'Please provide a valid image URL (PNG, JPG, JPEG, GIF, WebP).')],
                            ephemeral: true
                        });
                        return true;
                    }
                    session.embedData.image.url = imageUrl;
                    updateSuccess = true;
                    break;

                case 'color':
                    const colorInput = interaction.fields.getTextInputValue('color_input');
                    const color = this.parseColor(colorInput);
                    if (colorInput && color === null) {
                        await interaction.reply({
                            embeds: [Utils.createErrorEmbed('Invalid Color', 'Please provide a valid hex color (e.g., #FF0000, FF0000) or color name.')],
                            ephemeral: true
                        });
                        return true;
                    }
                    session.embedData.color = color;
                    updateSuccess = true;
                    break;

                case 'author':
                    session.embedData.author.name = interaction.fields.getTextInputValue('author_name') || null;
                    const authorIconURL = interaction.fields.getTextInputValue('author_icon') || null;
                    const authorURL = interaction.fields.getTextInputValue('author_url') || null;
                    
                    if (authorIconURL && !this.isValidImageUrl(authorIconURL)) {
                        await interaction.reply({
                            embeds: [Utils.createErrorEmbed('Invalid Icon URL', 'Author icon must be a valid image URL.')],
                            ephemeral: true
                        });
                        return true;
                    }
                    
                    if (authorURL && !this.isValidUrl(authorURL)) {
                        await interaction.reply({
                            embeds: [Utils.createErrorEmbed('Invalid URL', 'Author URL must be a valid HTTP/HTTPS URL.')],
                            ephemeral: true
                        });
                        return true;
                    }

                    session.embedData.author.iconURL = authorIconURL;
                    session.embedData.author.url = authorURL;
                    updateSuccess = true;
                    break;

                case 'footer':
                    session.embedData.footer.text = interaction.fields.getTextInputValue('footer_text') || null;
                    const footerIconURL = interaction.fields.getTextInputValue('footer_icon') || null;
                    
                    if (footerIconURL && !this.isValidImageUrl(footerIconURL)) {
                        await interaction.reply({
                            embeds: [Utils.createErrorEmbed('Invalid Icon URL', 'Footer icon must be a valid image URL.')],
                            ephemeral: true
                        });
                        return true;
                    }

                    session.embedData.footer.iconURL = footerIconURL;
                    updateSuccess = true;
                    break;

                case 'add_field':
                    const fieldName = interaction.fields.getTextInputValue('field_name');
                    const fieldValue = interaction.fields.getTextInputValue('field_value');
                    const fieldInline = interaction.fields.getTextInputValue('field_inline')?.toLowerCase() === 'true';

                    // Ensure fields array exists
                    if (!Array.isArray(session.embedData.fields)) {
                        session.embedData.fields = [];
                    }
                    
                    if (session.embedData.fields.length >= 25) {
                        await interaction.reply({
                            embeds: [Utils.createErrorEmbed('Field Limit Reached', 'Embeds can have a maximum of 25 fields.')],
                            ephemeral: true
                        });
                        return true;
                    }

                    session.embedData.fields.push({
                        name: fieldName,
                        value: fieldValue,
                        inline: fieldInline
                    });
                    updateSuccess = true;
                    break;

                case 'edit_field':
                    const editIndex = parseInt(interaction.customId.split('_').pop());
                    // Ensure fields array exists
                    if (!Array.isArray(session.embedData.fields)) {
                        session.embedData.fields = [];
                    }
                    if (editIndex >= 0 && editIndex < session.embedData.fields.length) {
                        session.embedData.fields[editIndex] = {
                            name: interaction.fields.getTextInputValue('field_name'),
                            value: interaction.fields.getTextInputValue('field_value'),
                            inline: interaction.fields.getTextInputValue('field_inline')?.toLowerCase() === 'true'
                        };
                        updateSuccess = true;
                    }
                    break;

                case 'save_template':
                    const templateName = interaction.fields.getTextInputValue('template_name');
                    const templateDescription = interaction.fields.getTextInputValue('template_description') || '';
                    const templateCategory = interaction.fields.getTextInputValue('template_category') || 'General';
                    
                    await this.saveTemplate(interaction, templateName, templateDescription, templateCategory, session.embedData, session.messageContent);
                    return true;
            }

            if (updateSuccess) {
                // Acknowledge the interaction without sending a visible response
                await interaction.deferUpdate();
                
                // Update the embed builder display
                setTimeout(() => this.updateEmbedBuilder(interaction, session), 100);
            }

            return true;
        } catch (error) {
            console.error('Modal submit error:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'An error occurred while processing your input.')],
                ephemeral: true
            }).catch(() => {});
            return true;
        }
    }

    /**
     * Handle select menu interactions
     */
    async handleSelectMenu(interaction) {
        if (!interaction.customId.startsWith('embed_select_')) return false;

        const selectType = interaction.customId.replace('embed_select_', '');
        const session = this.getSession(interaction.user.id);

        try {
            switch (selectType) {
                case 'edit_field':
                    const editIndex = parseInt(interaction.values[0]);
                    // Ensure fields array exists
                    if (!Array.isArray(session.embedData.fields)) {
                        session.embedData.fields = [];
                    }
                    if (editIndex >= 0 && editIndex < session.embedData.fields.length) {
                        await this.showEditFieldModal(interaction, session.embedData.fields[editIndex], editIndex);
                    }
                    break;

                case 'remove_field':
                    const removeIndex = parseInt(interaction.values[0]);
                    // Ensure fields array exists
                    if (!Array.isArray(session.embedData.fields)) {
                        session.embedData.fields = [];
                    }
                    if (removeIndex >= 0 && removeIndex < session.embedData.fields.length) {
                        session.embedData.fields.splice(removeIndex, 1);
                        // Acknowledge the interaction without sending a visible response
                        await interaction.deferUpdate();
                        // Update the embed display immediately
                        setTimeout(() => this.updateEmbedBuilder(interaction, session), 100);
                    }
                    break;

                case 'channel':
                    const channelId = interaction.values[0];
                    const channel = interaction.guild.channels.cache.get(channelId);
                    if (channel) {
                        await this.sendEmbedToChannel(interaction, channel, session.embedData, session.messageContent);
                    }
                    break;

                case 'load_template':
                    const templateId = interaction.values[0];
                    await this.loadTemplate(interaction, templateId);
                    break;
            }

            return true;
        } catch (error) {
            console.error('Select menu error:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'An error occurred while processing your selection.')],
                ephemeral: true
            }).catch(() => {});
            return true;
        }
    }

    /**
     * Update the embed builder display
     */
    async updateEmbedBuilder(interaction, session) {
        try {
            // Try to find and update the original message
            if (session.messageRef) {
                const embed = this.createPreviewEmbed(session.embedData);
                const components = await this.createBuilderComponents(interaction.guild.id);

                await session.messageRef.edit({
                    content: this.createBuilderContent(session.messageContent),
                    embeds: [embed],
                    components: components
                });
                return;
            }

            // Fallback: Search for the message
            const messages = await interaction.channel.messages.fetch({ limit: 50 });
            const embedBuilderMessage = messages.find(msg => 
                msg.author.id === interaction.client.user.id &&
                msg.content.includes('Embed Builder') &&
                msg.components?.length > 0
            );

            if (embedBuilderMessage) {
                session.messageRef = embedBuilderMessage;
                await this.updateEmbedBuilder(interaction, session);
            }
        } catch (error) {
            console.error('Error updating embed builder:', error);
        }
    }

    /**
     * Create preview embed
     */
    createPreviewEmbed(embedData) {
        const embed = new EmbedBuilder();

        if (embedData.title) embed.setTitle(embedData.title);
        if (embedData.description) embed.setDescription(embedData.description);
        if (embedData.url && this.isValidUrl(embedData.url)) embed.setURL(embedData.url);
        if (embedData.color !== null) embed.setColor(embedData.color);
        if (embedData.timestamp) embed.setTimestamp();
        
        if (embedData.author?.name) {
            const authorObj = { name: embedData.author.name };
            if (embedData.author.iconURL && this.isValidImageUrl(embedData.author.iconURL)) {
                authorObj.iconURL = embedData.author.iconURL;
            }
            if (embedData.author.url && this.isValidUrl(embedData.author.url)) {
                authorObj.url = embedData.author.url;
            }
            embed.setAuthor(authorObj);
        }

        if (embedData.thumbnail?.url && this.isValidImageUrl(embedData.thumbnail.url)) {
            embed.setThumbnail(embedData.thumbnail.url);
        }

        if (embedData.image?.url && this.isValidImageUrl(embedData.image.url)) {
            embed.setImage(embedData.image.url);
        }

        if (embedData.footer?.text) {
            const footerObj = { text: embedData.footer.text };
            if (embedData.footer.iconURL && this.isValidImageUrl(embedData.footer.iconURL)) {
                footerObj.iconURL = embedData.footer.iconURL;
            }
            embed.setFooter(footerObj);
        }

        if (embedData.fields?.length > 0) {
            // Ensure fields is an array and filter out invalid fields
            const fieldsArray = Array.isArray(embedData.fields) ? embedData.fields : [];
            const validFields = fieldsArray.filter(field => 
                field && 
                typeof field === 'object' &&
                typeof field.name === 'string' && 
                field.name.trim().length > 0 && 
                field.name.length <= 256 &&
                typeof field.value === 'string' && 
                field.value.trim().length > 0 &&
                field.value.length <= 1024
            );
            
            if (validFields.length > 0) {
                embed.addFields(validFields);
            }
        }

        // If embed is empty, show placeholder
        if (!this.hasEmbedContent(embedData)) {
            embed.setTitle('Embed Preview')
                .setDescription('*Your embed preview will appear here*\n\nStart building your embed using the buttons below.')
                .setColor(0x2F3136);
        }

        return embed;
    }

    /**
     * Check if embed has content
     */
    hasEmbedContent(embedData) {
        return !!(
            embedData.title ||
            embedData.description ||
            embedData.author?.name ||
            embedData.footer?.text ||
            embedData.image?.url ||
            embedData.thumbnail?.url ||
            embedData.fields?.length > 0
        );
    }

    /**
     * Create builder content text
     */
    createBuilderContent(messageContent) {
        const lines = ['**Embed Builder**'];
        
        if (messageContent) {
            lines.push(`**Message Content:** ${Utils.truncate(messageContent, 100)}`);
        }
        
        lines.push('**Preview:**');
        return lines.join('\n');
    }

    /**
     * Create builder components
     */
    async createBuilderComponents(guildId) {
        const templates = await EmbedTemplate.findByGuild(guildId).limit(5);
        
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
                    .setLabel('Clear All')
                    .setStyle(ButtonStyle.Danger)
            );

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
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Danger)
            );

        return [row1, row2, row3, row4];
    }

    /**
     * Save template
     */
    async saveTemplate(interaction, name, description, category, embedData, messageContent) {
        try {
            const existingTemplate = await EmbedTemplate.findOne({
                guildId: interaction.guild.id,
                name: name
            });

            if (existingTemplate) {
                await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Template Exists', `A template named "${name}" already exists.`)],
                    ephemeral: true
                });
                return;
            }

            const template = new EmbedTemplate({
                guildId: interaction.guild.id,
                name: name,
                description: description,
                category: category,
                createdBy: interaction.user.id,
                embedData: this.cleanEmbedData(embedData),
                messageContent: messageContent
            });

            await template.save();

            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Template Saved', `Template "${name}" saved successfully!`)],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error saving template:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Save Failed', 'An error occurred while saving the template.')],
                ephemeral: true
            });
        }
    }

    /**
     * Load template
     */
    async loadTemplate(interaction, templateId) {
        try {
            const template = await EmbedTemplate.findOne({
                _id: templateId,
                guildId: interaction.guild.id
            });

            if (!template) {
                await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Template Not Found', 'The selected template was not found.')],
                    ephemeral: true
                });
                return;
            }

            const session = this.getSession(interaction.user.id);
            session.embedData = { ...template.embedData };
            
            // Ensure fields array is properly initialized and validated
            if (session.embedData.fields && Array.isArray(session.embedData.fields)) {
                // Filter out any invalid fields from the template
                session.embedData.fields = session.embedData.fields.filter(field => 
                    field && 
                    typeof field.name === 'string' && 
                    field.name.trim().length > 0 && 
                    typeof field.value === 'string' && 
                    field.value.trim().length > 0
                );
            } else {
                session.embedData.fields = [];
            }
            
            session.messageContent = template.messageContent || '';

            await template.incrementUsage();

            // Acknowledge the interaction without sending a visible response
            await interaction.deferUpdate();
            
            // Update the main embed builder immediately
            setTimeout(() => this.updateEmbedBuilder(interaction, session), 100);
        } catch (error) {
            console.error('Error loading template:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Load Failed', 'An error occurred while loading the template.')],
                ephemeral: true
            });
        }
    }

    /**
     * Send embed to channel
     */
    async sendEmbedToChannel(interaction, channel, embedData, messageContent) {
        try {
            if (!this.hasEmbedContent(embedData) && !messageContent) {
                await interaction.reply({
                    embeds: [Utils.createErrorEmbed('Empty Embed', 'Cannot send an empty embed. Please add some content first.')],
                    ephemeral: true
                });
                return;
            }

            const embed = this.createPreviewEmbed(embedData);
            const messageData = { embeds: [embed] };
            
            if (messageContent) {
                messageData.content = messageContent;
            }

            await channel.send(messageData);

            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Embed Sent', `Embed sent to ${channel} successfully!`)],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error sending embed:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Send Failed', 'An error occurred while sending the embed.')],
                ephemeral: true
            });
        }
    }

    /**
     * Show edit field modal
     */
    async showEditFieldModal(interaction, field, index) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId(`embed_modal_edit_field_${index}`)
            .setTitle('Edit Field');

        const nameInput = new TextInputBuilder()
            .setCustomId('field_name')
            .setLabel('Field Name')
            .setPlaceholder('Enter field name')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(256)
            .setRequired(true)
            .setValue(field.name);

        const valueInput = new TextInputBuilder()
            .setCustomId('field_value')
            .setLabel('Field Value')
            .setPlaceholder('Enter field value')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1024)
            .setRequired(true)
            .setValue(field.value);

        const inlineInput = new TextInputBuilder()
            .setCustomId('field_inline')
            .setLabel('Inline (true/false)')
            .setPlaceholder('Enter true or false')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(5)
            .setRequired(false)
            .setValue(field.inline.toString());

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(valueInput),
            new ActionRowBuilder().addComponents(inlineInput)
        );

        await interaction.showModal(modal);
    }

    /**
     * Clean embed data by removing null/empty values
     */
    cleanEmbedData(embedData) {
        const cleaned = { ...embedData };
        
        // Clean fields array first - remove invalid fields
        if (cleaned.fields && Array.isArray(cleaned.fields)) {
            cleaned.fields = cleaned.fields.filter(field => 
                field && 
                typeof field.name === 'string' && 
                field.name.trim().length > 0 && 
                typeof field.value === 'string' && 
                field.value.trim().length > 0
            );
            
            // Remove fields array if empty
            if (cleaned.fields.length === 0) {
                delete cleaned.fields;
            }
        }
        
        // Remove null/empty properties
        Object.keys(cleaned).forEach(key => {
            if (cleaned[key] === null || cleaned[key] === undefined || cleaned[key] === '') {
                delete cleaned[key];
            } else if (typeof cleaned[key] === 'object' && !Array.isArray(cleaned[key])) {
                // Clean nested objects
                Object.keys(cleaned[key]).forEach(nestedKey => {
                    if (cleaned[key][nestedKey] === null || cleaned[key][nestedKey] === undefined || cleaned[key][nestedKey] === '') {
                        delete cleaned[key][nestedKey];
                    }
                });
                
                // Remove empty objects
                if (Object.keys(cleaned[key]).length === 0) {
                    delete cleaned[key];
                }
            }
        });

        return cleaned;
    }

    /**
     * Parse color input
     */
    parseColor(colorStr) {
        if (!colorStr) return null;
        
        colorStr = colorStr.trim();
        
        // Handle hex colors
        if (colorStr.startsWith('#')) {
            colorStr = colorStr.slice(1);
        }
        
        if (/^[0-9A-Fa-f]{6}$/.test(colorStr)) {
            return parseInt(colorStr, 16);
        }
        
        // Handle named colors
        const namedColors = {
            red: 0xFF0000,
            green: 0x00FF00,
            blue: 0x0000FF,
            yellow: 0xFFFF00,
            orange: 0xFFA500,
            purple: 0x800080,
            pink: 0xFFC0CB,
            black: 0x000000,
            white: 0xFFFFFF,
            discord: 0x5865F2
        };
        
        return namedColors[colorStr.toLowerCase()] || null;
    }

    /**
     * Validate URL
     */
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    /**
     * Validate image URL
     */
    isValidImageUrl(string) {
        if (!this.isValidUrl(string)) return false;
        return /\.(png|jpg|jpeg|gif|webp)$/i.test(string);
    }
}

module.exports = new EmbedBuilderHandler();
