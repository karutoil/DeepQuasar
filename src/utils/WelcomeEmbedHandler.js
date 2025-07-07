const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const EmbedBuilderHandler = require('./EmbedBuilderHandler');
const Utils = require('./utils');

class WelcomeEmbedHandler {
    /**
     * Handle welcome embed builder interactions
     */
    static async handleWelcomeEmbedInteraction(interaction) {
        if (!interaction.customId.startsWith('welcome_embed_')) return false;

        const action = interaction.customId.replace('welcome_embed_', '');
        const session = EmbedBuilderHandler.getSession(interaction.user.id);

        if (!session.welcomeContext || !session.welcomeContext.isWelcomeBuilder) {
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Session Error', 'Welcome embed builder session not found.')],
                ephemeral: true
            });
            return true;
        }

        try {
            switch (action) {
                case 'title':
                    await this.showWelcomeModal(interaction, 'Title', 'Enter embed title (use placeholders like {guild.name})', session.embedData.title, 256);
                    break;

                case 'description':
                    await this.showWelcomeModal(interaction, 'Description', 'Enter embed description (use placeholders like {user.mention})', session.embedData.description, 4000, TextInputStyle.Paragraph);
                    break;

                case 'color':
                    await this.showWelcomeModal(interaction, 'Color', 'Enter hex color (#57F287) or color name', session.embedData.color ? `#${session.embedData.color.toString(16).padStart(6, '0')}` : '', 20);
                    break;

                case 'author':
                    await this.showAuthorModal(interaction, session.embedData.author);
                    break;

                case 'footer':
                    await this.showFooterModal(interaction, session.embedData.footer);
                    break;

                case 'thumbnail':
                    await this.showWelcomeModal(interaction, 'Thumbnail', 'Enter thumbnail image URL', session.embedData.thumbnail?.url, 500);
                    break;

                case 'image':
                    await this.showWelcomeModal(interaction, 'Image', 'Enter image URL', session.embedData.image?.url, 500);
                    break;

                case 'timestamp':
                    session.embedData.timestamp = !session.embedData.timestamp;
                    await interaction.deferUpdate();
                    await this.updateWelcomeDisplay(interaction, session);
                    break;

                case 'add_field':
                    if (session.embedData.fields.length >= 25) {
                        await interaction.reply({
                            embeds: [Utils.createErrorEmbed('Field Limit', 'Embeds can have a maximum of 25 fields.')],
                            ephemeral: true
                        });
                        return true;
                    }
                    await this.showAddFieldModal(interaction);
                    break;

                case 'edit_field':
                    if (!session.embedData.fields || session.embedData.fields.length === 0) {
                        await interaction.reply({
                            embeds: [Utils.createErrorEmbed('No Fields', 'Add a field first before editing.')],
                            ephemeral: true
                        });
                        return true;
                    }
                    await this.showEditFieldSelect(interaction, session.embedData.fields);
                    break;

                case 'placeholders':
                    await this.showPlaceholders(interaction, session.welcomeContext.type);
                    break;

                case 'test':
                    await this.testWelcomeEmbed(interaction, session);
                    break;

                case 'save':
                    await this.saveWelcomeEmbed(interaction, session);
                    break;

                case 'disable':
                    await this.disableCustomEmbed(interaction, session);
                    break;

                case 'cancel':
                    await this.cancelWelcomeBuilder(interaction);
                    break;

                case 'content':
                    await this.showWelcomeModal(interaction, 'Content', 'Enter message content (use placeholders like {user.mention})', session.messageContent, 2000, TextInputStyle.Paragraph);
                    break;
            }

            return true;
        } catch (error) {
            console.error('Error handling welcome embed interaction:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'An error occurred while processing your request.')],
                ephemeral: true
            }).catch(() => {});
            return true;
        }
    }

    /**
     * Handle welcome embed modal submissions
     */
    static async handleWelcomeModalSubmit(interaction) {
        if (!interaction.customId.startsWith('welcome_modal_')) return false;

        const modalType = interaction.customId.replace('welcome_modal_', '');
        const session = EmbedBuilderHandler.getSession(interaction.user.id);

        if (!session.welcomeContext || !session.welcomeContext.isWelcomeBuilder) {
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Session Error', 'Welcome embed builder session not found.')],
                ephemeral: true
            });
            return true;
        }

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

                case 'content':
                    session.messageContent = interaction.fields.getTextInputValue('text_input') || '';
                    updateSuccess = true;
                    break;

                case 'color':
                    const colorInput = interaction.fields.getTextInputValue('text_input');
                    const color = this.parseColor(colorInput);
                    if (colorInput && color === null) {
                        await interaction.reply({
                            embeds: [Utils.createErrorEmbed('Invalid Color', 'Please provide a valid hex color (e.g., #FF0000) or color name.')],
                            ephemeral: true
                        });
                        return true;
                    }
                    session.embedData.color = color;
                    updateSuccess = true;
                    break;

                case 'thumbnail':
                    const thumbnailUrl = interaction.fields.getTextInputValue('text_input') || null;
                    if (thumbnailUrl && !this.isValidImageUrl(thumbnailUrl)) {
                        await interaction.reply({
                            embeds: [Utils.createErrorEmbed('Invalid Image URL', 'Please provide a valid image URL.')],
                            ephemeral: true
                        });
                        return true;
                    }
                    // Ensure thumbnail object exists
                    if (!session.embedData.thumbnail) {
                        session.embedData.thumbnail = { url: null };
                    }
                    session.embedData.thumbnail.url = thumbnailUrl;
                    updateSuccess = true;
                    break;

                case 'image':
                    const imageUrl = interaction.fields.getTextInputValue('text_input') || null;
                    if (imageUrl && !this.isValidImageUrl(imageUrl)) {
                        await interaction.reply({
                            embeds: [Utils.createErrorEmbed('Invalid Image URL', 'Please provide a valid image URL.')],
                            ephemeral: true
                        });
                        return true;
                    }
                    // Ensure image object exists
                    if (!session.embedData.image) {
                        session.embedData.image = { url: null };
                    }
                    session.embedData.image.url = imageUrl;
                    updateSuccess = true;
                    break;

                case 'author':
                    // Ensure author object exists
                    if (!session.embedData.author) {
                        session.embedData.author = { name: null, iconURL: null, url: null };
                    }
                    
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
                    // Ensure footer object exists
                    if (!session.embedData.footer) {
                        session.embedData.footer = { text: null, iconURL: null };
                    }
                    
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

                default:
                    if (modalType.startsWith('edit_field_')) {
                        const editIndex = parseInt(modalType.split('_').pop());
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
                    }
                    break;
            }

            if (updateSuccess) {
                await interaction.deferUpdate();
                await this.updateWelcomeDisplay(interaction, session);
            }

            return true;
        } catch (error) {
            console.error('Welcome modal submit error:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'An error occurred while processing your input.')],
                ephemeral: true
            }).catch(() => {});
            return true;
        }
    }

    /**
     * Show welcome-specific modal
     */
    static async showWelcomeModal(interaction, title, placeholder, currentValue = '', maxLength = 256, style = TextInputStyle.Short) {
        const modal = new ModalBuilder()
            .setCustomId(`welcome_modal_${title.toLowerCase().replace(/\s+/g, '_')}`)
            .setTitle(`Set ${title}`);

        const textInput = new TextInputBuilder()
            .setCustomId('text_input')
            .setLabel(title)
            .setPlaceholder(placeholder)
            .setStyle(style)
            .setMaxLength(maxLength)
            .setRequired(false);

        if (currentValue) {
            textInput.setValue(currentValue.toString());
        }

        modal.addComponents(new ActionRowBuilder().addComponents(textInput));
        await interaction.showModal(modal);
    }

    /**
     * Show author modal
     */
    static async showAuthorModal(interaction, currentAuthor) {
        const modal = new ModalBuilder()
            .setCustomId('welcome_modal_author')
            .setTitle('Set Author');

        const nameInput = new TextInputBuilder()
            .setCustomId('author_name')
            .setLabel('Author Name')
            .setPlaceholder('Enter author name (use placeholders like {guild.name})')
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
    }

    /**
     * Show footer modal
     */
    static async showFooterModal(interaction, currentFooter) {
        const modal = new ModalBuilder()
            .setCustomId('welcome_modal_footer')
            .setTitle('Set Footer');

        const textInput = new TextInputBuilder()
            .setCustomId('footer_text')
            .setLabel('Footer Text')
            .setPlaceholder('Enter footer text (use placeholders like {guild.name})')
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
    }

    /**
     * Show add field modal
     */
    static async showAddFieldModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('welcome_modal_add_field')
            .setTitle('Add Field');

        const nameInput = new TextInputBuilder()
            .setCustomId('field_name')
            .setLabel('Field Name')
            .setPlaceholder('Enter field name (use placeholders like {user.tag})')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(256)
            .setRequired(true);

        const valueInput = new TextInputBuilder()
            .setCustomId('field_value')
            .setLabel('Field Value')
            .setPlaceholder('Enter field value (use placeholders like {guild.memberCount})')
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
    }

    /**
     * Show edit field select menu
     */
    static async showEditFieldSelect(interaction, fields) {
        const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

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
            .setCustomId('welcome_select_edit_field')
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
    }

    /**
     * Show placeholders information
     */
    static async showPlaceholders(interaction, type) {
        const placeholderEmbed = new EmbedBuilder()
            .setTitle('📝 Available Placeholders')
            .setDescription(`Use these placeholders in your ${type} embed:`)
            .setColor(0x5865F2);

        placeholderEmbed.addFields([
            {
                name: '👤 User Placeholders',
                value: [
                    '`{user.mention}` - @User',
                    '`{user.tag}` - User#1234',
                    '`{user.username}` - Username only',
                    '`{user.displayName}` - Display name',
                    '`{user.id}` - User ID'
                ].join('\n'),
                inline: true
            },
            {
                name: '🏠 Server Placeholders',
                value: [
                    '`{guild.name}` - Server name',
                    '`{guild.memberCount}` - Member count',
                    '`{guild.id}` - Server ID'
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
        ]);

        if (type === 'welcome') {
            placeholderEmbed.addFields([
                {
                    name: '💌 Welcome Specific',
                    value: [
                        '`{inviter.tag}` - Who invited',
                        '`{inviter.mention}` - @Inviter',
                        '`{invite.code}` - Invite code',
                        '`{invite.uses}` - Times used',
                        '`{account.age}` - Account age',
                        '`{join.position}` - Join position'
                    ].join('\n'),
                    inline: false
                }
            ]);
        } else if (type === 'leave') {
            placeholderEmbed.addFields([
                {
                    name: '👋 Leave Specific',
                    value: [
                        '`{account.age}` - Account age',
                        '`{join.date}` - Join date',
                        '`{time.in.server}` - Time in server'
                    ].join('\n'),
                    inline: false
                }
            ]);
        }

        await interaction.reply({ embeds: [placeholderEmbed], ephemeral: true });
    }

    /**
     * Test welcome embed
     */
    static async testWelcomeEmbed(interaction, session) {
        const welcomeModule = require('../commands/settings/welcome');
        
        // Create test embed with placeholder replacement
        const testEmbed = welcomeModule.createWelcomePreviewEmbed(
            session.embedData, 
            interaction.member, 
            interaction.guild, 
            session.welcomeContext.type
        );

        testEmbed.setTitle(`🧪 Test ${session.welcomeContext.type.charAt(0).toUpperCase() + session.welcomeContext.type.slice(1)} Embed`);

        // Prepare message content
        let testContent = '';
        if (session.messageContent && session.messageContent.trim()) {
            const processedContent = welcomeModule.replacePlaceholdersPreview(
                session.messageContent, 
                interaction.member, 
                interaction.guild, 
                { inviter: { tag: 'Inviter#1234', id: '123456789' }, code: 'abc123', uses: 5 }
            );
            testContent = processedContent;
        }

        // Prepare message data
        const messageData = {
            content: testContent || undefined, // Only include content if it's not empty
            embeds: [testEmbed],
            ephemeral: true
        };

        await interaction.reply(messageData);
    }

    /**
     * Save welcome embed
     */
    static async saveWelcomeEmbed(interaction, session) {
        try {
            const { type, guildData } = session.welcomeContext;
            
            // Clean and validate embed data
            const cleanEmbedData = EmbedBuilderHandler.cleanEmbedData(session.embedData);
            
            // Add message content to embed data
            cleanEmbedData.messageContent = session.messageContent || '';
            
            // Update guild data
            if (type === 'welcome') {
                guildData.welcomeSystem.welcome.customEmbed = {
                    enabled: true,
                    embedData: cleanEmbedData
                };
            } else if (type === 'leave') {
                guildData.welcomeSystem.leave.customEmbed = {
                    enabled: true,
                    embedData: cleanEmbedData
                };
            } else if (type === 'dm') {
                guildData.welcomeSystem.dmWelcome.customEmbed = {
                    enabled: true,
                    embedData: cleanEmbedData
                };
            }

            await guildData.save();

            const successEmbed = Utils.createSuccessEmbed(
                'Custom Embed Saved',
                `✅ Custom ${type} embed has been saved and enabled!\n\n` +
                `The custom embed will now be used for ${type} messages instead of the default template.`
            );

            await interaction.reply({ embeds: [successEmbed], ephemeral: true });

            // Clear the session completely to prevent carrying over data to next embed builder use
            EmbedBuilderHandler.clearSession(interaction.user.id);
            
        } catch (error) {
            console.error('Error saving welcome embed:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Save Failed', 'An error occurred while saving the custom embed.')],
                ephemeral: true
            });
        }
    }

    /**
     * Disable custom embed
     */
    static async disableCustomEmbed(interaction, session) {
        try {
            const { type, guildData } = session.welcomeContext;
            
            // Disable custom embed
            if (type === 'welcome') {
                guildData.welcomeSystem.welcome.customEmbed.enabled = false;
            } else if (type === 'leave') {
                guildData.welcomeSystem.leave.customEmbed.enabled = false;
            } else if (type === 'dm') {
                guildData.welcomeSystem.dmWelcome.customEmbed.enabled = false;
            }

            await guildData.save();

            const successEmbed = Utils.createSuccessEmbed(
                'Custom Embed Disabled',
                `✅ Custom ${type} embed has been disabled.\n\n` +
                `The system will now use the default ${type} message template.`
            );

            await interaction.reply({ embeds: [successEmbed], ephemeral: true });

            // Clear the session completely to prevent carrying over data to next embed builder use
            EmbedBuilderHandler.clearSession(interaction.user.id);
            
        } catch (error) {
            console.error('Error disabling custom embed:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'An error occurred while disabling the custom embed.')],
                ephemeral: true
            });
        }
    }

    /**
     * Cancel welcome builder
     */
    static async cancelWelcomeBuilder(interaction) {
        await interaction.deferUpdate();
        
        setTimeout(async () => {
            try {
                await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle('✨ Welcome Embed Builder')
                        .setDescription('**Session Closed**\n\nThe welcome embed builder session has been closed.')
                        .setColor(0x747F8D)
                        .setTimestamp()
                    ],
                    components: []
                });
            } catch (error) {
                // Ignore errors
            }
        }, 500);

        // Clear the session completely to prevent carrying over data to next embed builder use
        EmbedBuilderHandler.clearSession(interaction.user.id);
    }

    /**
     * Update welcome display
     */
    static async updateWelcomeDisplay(interaction, session) {
        try {
            if (!session.messageRef) return;

            const welcomeModule = require('../commands/settings/welcome');
            
            // Create placeholder embed
            const placeholderEmbed = new EmbedBuilder()
                .setTitle(`🎨 Custom ${session.welcomeContext.type.charAt(0).toUpperCase() + session.welcomeContext.type.slice(1)} Embed Builder`)
                .setDescription(
                    `**Create a custom embed for ${session.welcomeContext.type} messages**\n\n` +
                    '**Available Placeholders:**\n' +
                    welcomeModule.getPlaceholdersList(session.welcomeContext.type) + '\n\n' +
                    '**Note:** All placeholders will be automatically replaced when the embed is sent.\n' +
                    'Use the embed builder below to design your custom message.'
                )
                .setColor(0x5865F2)
                .setFooter({ text: 'Use placeholders in your embed content - they will be replaced automatically' });

            // Create preview embed
            const previewEmbed = welcomeModule.createWelcomePreviewEmbed(
                session.embedData, 
                interaction.member, 
                interaction.guild, 
                session.welcomeContext.type
            );

            // Get builder components
            const components = await welcomeModule.createWelcomeBuilderComponents(interaction.guild.id, session.welcomeContext.type);

            // Prepare message data with content if available
            let messageContent = undefined;
            if (session.messageContent && session.messageContent.trim()) {
                const processedContent = welcomeModule.replacePlaceholdersPreview(
                    session.messageContent, 
                    interaction.member, 
                    interaction.guild, 
                    { inviter: { tag: 'Inviter#1234', id: '123456789' }, code: 'abc123', uses: 5 }
                );
                messageContent = `📝 **Content Preview:** ${processedContent}`;
            }

            const messageData = {
                content: messageContent,
                embeds: [placeholderEmbed, previewEmbed],
                components: components
            };

            await session.messageRef.edit(messageData);
        } catch (error) {
            console.error('Error updating welcome display:', error);
        }
    }

    /**
     * Handle select menu interactions
     */
    static async handleWelcomeSelectMenu(interaction) {
        if (!interaction.customId.startsWith('welcome_select_')) return false;

        const selectType = interaction.customId.replace('welcome_select_', '');
        const session = EmbedBuilderHandler.getSession(interaction.user.id);

        if (!session.welcomeContext || !session.welcomeContext.isWelcomeBuilder) {
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Session Error', 'Welcome embed builder session not found.')],
                ephemeral: true
            });
            return true;
        }

        try {
            switch (selectType) {
                case 'edit_field':
                    const editIndex = parseInt(interaction.values[0]);
                    if (!Array.isArray(session.embedData.fields)) {
                        session.embedData.fields = [];
                    }
                    if (editIndex >= 0 && editIndex < session.embedData.fields.length) {
                        await this.showEditFieldModal(interaction, session.embedData.fields[editIndex], editIndex);
                    }
                    break;
            }

            return true;
        } catch (error) {
            console.error('Welcome select menu error:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'An error occurred while processing your selection.')],
                ephemeral: true
            });
            return true;
        }
    }

    /**
     * Show edit field modal
     */
    static async showEditFieldModal(interaction, field, index) {
        const modal = new ModalBuilder()
            .setCustomId(`welcome_modal_edit_field_${index}`)
            .setTitle('Edit Field');

        const nameInput = new TextInputBuilder()
            .setCustomId('field_name')
            .setLabel('Field Name')
            .setPlaceholder('Enter field name (use placeholders)')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(256)
            .setRequired(true)
            .setValue(field.name);

        const valueInput = new TextInputBuilder()
            .setCustomId('field_value')
            .setLabel('Field Value')
            .setPlaceholder('Enter field value (use placeholders)')
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

    // Utility methods
    static parseColor(colorStr) {
        if (!colorStr) return null;
        
        // Remove # if present
        colorStr = colorStr.replace('#', '');
        
        // Try parsing as hex
        if (/^[0-9A-F]{6}$/i.test(colorStr)) {
            return parseInt(colorStr, 16);
        }
        
        // Color name mapping
        const colorMap = {
            'red': 0xFF0000,
            'green': 0x00FF00,
            'blue': 0x0000FF,
            'yellow': 0xFFFF00,
            'purple': 0x800080,
            'orange': 0xFFA500,
            'pink': 0xFFC0CB,
            'cyan': 0x00FFFF,
            'magenta': 0xFF00FF,
            'lime': 0x00FF00,
            'discord': 0x5865F2,
            'success': 0x57F287,
            'warning': 0xFEE75C,
            'error': 0xED4245
        };
        
        return colorMap[colorStr.toLowerCase()] || null;
    }

    static isValidUrl(string) {
        // Empty strings are valid (no URL provided)
        if (!string || string.trim() === '') return true;
        // Allow placeholders in URLs
        if (this.containsPlaceholders(string)) return true;
        
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    static isValidImageUrl(string) {
        // Empty strings are valid (no image URL provided)
        if (!string || string.trim() === '') return true;
        // Allow placeholders in image URLs
        if (this.containsPlaceholders(string)) return true;
        
        if (!this.isValidUrl(string)) return false;
        return /\.(png|jpg|jpeg|gif|webp)$/i.test(string);
    }

    static containsPlaceholders(string) {
        // Check if string contains any placeholder patterns like {user.avatar}, {guild.icon}, etc.
        return /\{[a-zA-Z_][a-zA-Z0-9_.]*\}/.test(string);
    }
}

module.exports = WelcomeEmbedHandler;
