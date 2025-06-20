const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EmbedTemplate = require('../schemas/EmbedTemplate');

class EmbedBuilderHandler {
    static async handleModalSubmit(interaction) {
        if (!interaction.customId.startsWith('embed_modal_')) return false;

        const embedBuilder = require('../commands/settings/embed-builder');
        const modalType = interaction.customId.replace('embed_modal_', '');

        // Get the current embed data from the original interaction
        const embedData = interaction.client.embedBuilderSessions?.get(interaction.user.id) || {
            title: null, description: null, url: null, color: null, timestamp: false,
            author: { name: null, iconURL: null, url: null },
            thumbnail: { url: null }, image: { url: null },
            footer: { text: null, iconURL: null }, fields: []
        };
        let messageContent = interaction.client.embedBuilderMessageContent?.get(interaction.user.id) || '';

        try {
            switch (modalType) {
                case 'title':
                    embedData.title = interaction.fields.getTextInputValue('text_input') || null;
                    break;
                case 'description':
                    embedData.description = interaction.fields.getTextInputValue('text_input') || null;
                    break;
                case 'url':
                    const urlValue = interaction.fields.getTextInputValue('text_input') || null;
                    if (urlValue && !embedBuilder.isValidUrl(urlValue)) {
                        // Reply with error and instructions to retry
                        await interaction.reply({
                            content: '❌ **Invalid URL Format**\n\n' +
                                   `The URL "${urlValue}" is not valid.\n\n` +
                                   '**URLs must include the protocol:**\n' +
                                   '• `https://example.com`\n' +
                                   '• `http://example.com`\n' +
                                   '• `https://www.example.com/page`\n\n' +
                                   '**Please click the "URL" button again and include http:// or https://**',
                            ephemeral: true
                        });
                        return true;
                    }
                    embedData.url = urlValue;
                    break;
                case 'message_content':
                    messageContent = interaction.fields.getTextInputValue('text_input') || '';
                    break;
                case 'thumbnail':
                    if (!embedData.thumbnail) embedData.thumbnail = {};
                    const thumbnailUrl = interaction.fields.getTextInputValue('text_input') || null;
                    if (thumbnailUrl && !embedBuilder.isValidUrl(thumbnailUrl)) {
                        await interaction.reply({
                            content: '❌ **Invalid Thumbnail URL Format**\n\n' +
                                   `The URL "${thumbnailUrl}" is not valid.\n\n` +
                                   '**Image URLs must include the protocol:**\n' +
                                   '• `https://example.com/image.png`\n' +
                                   '• `http://example.com/image.jpg`\n' +
                                   '• `https://cdn.discordapp.com/attachments/...`\n\n' +
                                   '**Please click the "Thumbnail" button again and include http:// or https://**',
                            ephemeral: true
                        });
                        return true;
                    }
                    embedData.thumbnail.url = thumbnailUrl;
                    break;
                case 'image':
                    if (!embedData.image) embedData.image = {};
                    const imageUrl = interaction.fields.getTextInputValue('text_input') || null;
                    if (imageUrl && !embedBuilder.isValidUrl(imageUrl)) {
                        await interaction.reply({
                            content: '❌ **Invalid Image URL Format**\n\n' +
                                   `The URL "${imageUrl}" is not valid.\n\n` +
                                   '**Image URLs must include the protocol:**\n' +
                                   '• `https://example.com/image.png`\n' +
                                   '• `http://example.com/image.jpg`\n' +
                                   '• `https://cdn.discordapp.com/attachments/...`\n\n' +
                                   '**Please click the "Image" button again and include http:// or https://**',
                            ephemeral: true
                        });
                        return true;
                    }
                    embedData.image.url = imageUrl;
                    break;
                case 'color':
                    const colorInput = interaction.fields.getTextInputValue('color_input');
                    embedData.color = embedBuilder.parseColor(colorInput);
                    break;
                case 'author':
                    if (!embedData.author) embedData.author = {};
                    const authorName = interaction.fields.getTextInputValue('author_name') || null;
                    const authorIcon = interaction.fields.getTextInputValue('author_icon') || null;
                    const authorUrl = interaction.fields.getTextInputValue('author_url') || null;
                    
                    // Validate author icon URL
                    if (authorIcon && !embedBuilder.isValidUrl(authorIcon)) {
                        await interaction.reply({
                            content: '❌ **Invalid Author Icon URL Format**\n\n' +
                                   `The icon URL "${authorIcon}" is not valid.\n\n` +
                                   '**Image URLs must include the protocol:**\n' +
                                   '• `https://example.com/icon.png`\n' +
                                   '• `http://example.com/icon.jpg`\n' +
                                   '• `https://cdn.discordapp.com/attachments/...`\n\n' +
                                   '**Please click the "Author" button again and include http:// or https://**',
                            ephemeral: true
                        });
                        return true;
                    }
                    
                    // Validate author URL
                    if (authorUrl && !embedBuilder.isValidUrl(authorUrl)) {
                        await interaction.reply({
                            content: '❌ **Invalid Author URL Format**\n\n' +
                                   `The URL "${authorUrl}" is not valid.\n\n` +
                                   '**URLs must include the protocol:**\n' +
                                   '• `https://example.com`\n' +
                                   '• `http://example.com`\n' +
                                   '• `https://www.example.com/page`\n\n' +
                                   '**Please click the "Author" button again and include http:// or https://**',
                            ephemeral: true
                        });
                        return true;
                    }
                    
                    embedData.author.name = authorName;
                    embedData.author.iconURL = authorIcon;
                    embedData.author.url = authorUrl;
                    break;
                case 'footer':
                    if (!embedData.footer) embedData.footer = {};
                    const footerText = interaction.fields.getTextInputValue('footer_text') || null;
                    const footerIcon = interaction.fields.getTextInputValue('footer_icon') || null;
                    
                    // Validate footer icon URL
                    if (footerIcon && !embedBuilder.isValidUrl(footerIcon)) {
                        await interaction.reply({
                            content: '❌ **Invalid Footer Icon URL Format**\n\n' +
                                   `The icon URL "${footerIcon}" is not valid.\n\n` +
                                   '**Image URLs must include the protocol:**\n' +
                                   '• `https://example.com/icon.png`\n' +
                                   '• `http://example.com/icon.jpg`\n' +
                                   '• `https://cdn.discordapp.com/attachments/...`\n\n' +
                                   '**Please click the "Footer" button again and include http:// or https://**',
                            ephemeral: true
                        });
                        return true;
                    }
                    
                    embedData.footer.text = footerText;
                    embedData.footer.iconURL = footerIcon;
                    break;
                case 'add_field':
                    const fieldName = interaction.fields.getTextInputValue('field_name');
                    const fieldValue = interaction.fields.getTextInputValue('field_value');
                    const fieldInlineStr = interaction.fields.getTextInputValue('field_inline') || 'false';
                    const fieldInline = fieldInlineStr.toLowerCase() === 'true';
                    
                    if (!embedData.fields) embedData.fields = [];
                    
                    if (embedData.fields.length >= 25) {
                        return interaction.reply({
                            content: '❌ Maximum of 25 fields allowed per embed.',
                            ephemeral: true
                        });
                    }
                    
                    embedData.fields.push({
                        name: fieldName,
                        value: fieldValue,
                        inline: fieldInline
                    });
                    break;
                case 'edit_field':
                    const editIndex = parseInt(interaction.client.embedBuilderEditIndex?.get(interaction.user.id) || '0');
                    const editName = interaction.fields.getTextInputValue('field_name');
                    const editValue = interaction.fields.getTextInputValue('field_value');
                    const editInlineStr = interaction.fields.getTextInputValue('field_inline') || 'false';
                    const editInline = editInlineStr.toLowerCase() === 'true';
                    
                    if (!embedData.fields) embedData.fields = [];
                    
                    if (embedData.fields[editIndex]) {
                        embedData.fields[editIndex] = {
                            name: editName,
                            value: editValue,
                            inline: editInline
                        };
                    }
                    break;
                case 'save_template':
                    const templateName = interaction.fields.getTextInputValue('template_name');
                    const templateDesc = interaction.fields.getTextInputValue('template_description') || '';
                    
                    await this.saveTemplate(interaction, templateName, templateDesc, embedData, messageContent);
                    return true;
            }

            // Store updated data
            if (!interaction.client.embedBuilderSessions) {
                interaction.client.embedBuilderSessions = new Map();
            }
            if (!interaction.client.embedBuilderMessageContent) {
                interaction.client.embedBuilderMessageContent = new Map();
            }
            
            interaction.client.embedBuilderSessions.set(interaction.user.id, embedData);
            interaction.client.embedBuilderMessageContent.set(interaction.user.id, messageContent);

            // Acknowledge the modal submission first
            await interaction.reply({
                content: '✅ Updated successfully!',
                ephemeral: true
            });

            // Update the embed builder immediately after acknowledging
            setTimeout(async () => {
                await this.updateEmbedBuilder(interaction, embedData, messageContent);
            }, 500);
            
            return true;
        } catch (error) {
            console.error('Modal submit error:', error);
            await interaction.reply({
                content: '❌ An error occurred while processing your input.',
                ephemeral: true
            }).catch(() => {});
            return true;
        }
    }

    static async handleSelectMenu(interaction) {
        if (!interaction.customId.startsWith('embed_select_')) return false;

        const embedBuilder = require('../commands/settings/embed-builder');
        const selectType = interaction.customId.replace('embed_select_', '');
        const embedData = interaction.client.embedBuilderSessions?.get(interaction.user.id) || {
            title: null, description: null, url: null, color: null, timestamp: false,
            author: { name: null, iconURL: null, url: null },
            thumbnail: { url: null }, image: { url: null },
            footer: { text: null, iconURL: null }, fields: []
        };
        const messageContent = interaction.client.embedBuilderMessageContent?.get(interaction.user.id) || '';

        try {
            switch (selectType) {
                case 'edit_field':
                    const editIndex = parseInt(interaction.values[0]);
                    if (!embedData.fields) embedData.fields = [];
                    const field = embedData.fields[editIndex];
                    
                    if (!field) {
                        return interaction.reply({
                            content: '❌ Field not found.',
                            ephemeral: true
                        });
                    }

                    // Store the edit index for the modal
                    if (!interaction.client.embedBuilderEditIndex) {
                        interaction.client.embedBuilderEditIndex = new Map();
                    }
                    interaction.client.embedBuilderEditIndex.set(interaction.user.id, editIndex);

                    await this.showEditFieldModal(interaction, field);
                    break;
                    
                case 'remove_field':
                    const removeIndex = parseInt(interaction.values[0]);
                    if (!embedData.fields) embedData.fields = [];
                    embedData.fields.splice(removeIndex, 1);
                    
                    interaction.client.embedBuilderSessions.set(interaction.user.id, embedData);
                    
                    await interaction.update({
                        content: '✅ Field removed!',
                        components: []
                    });
                    
                    // Update the main embed builder
                    setTimeout(async () => {
                        await this.updateEmbedBuilder(interaction, embedData, messageContent);
                    }, 1000);
                    break;
                    
                case 'channel':
                    const channelId = interaction.values[0];
                    const channel = interaction.guild.channels.cache.get(channelId);
                    
                    if (!channel) {
                        return interaction.reply({
                            content: '❌ Channel not found.',
                            ephemeral: true
                        });
                    }

                    await this.sendEmbedToChannel(interaction, channel, embedData, messageContent);
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
                content: '❌ An error occurred while processing your selection.',
                ephemeral: true
            }).catch(() => {});
            return true;
        }
    }

    static async showEditFieldModal(interaction, field) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId('embed_modal_edit_field')
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

    static async updateEmbedBuilder(interaction, embedData, messageContent) {
        const embedBuilder = require('../commands/settings/embed-builder');
        
        try {
            // First try to use the stored message reference
            const storedMessage = interaction.client.embedBuilderMessages?.get(interaction.user.id);
            
            if (storedMessage) {
                //console.log('Using stored message reference to update embed builder');

                const embed = embedBuilder.createPreviewEmbed(embedData);
                const components = embedBuilder.createBuilderComponents();

                await storedMessage.edit({
                    content: `**🎨 Embed Builder**\n${messageContent ? `**Message Content:** ${messageContent}\n` : ''}**Preview:**`,
                    embeds: [embed],
                    components: components
                });
                
                //console.log('Successfully updated embed builder using stored reference');
                return;
            }

            // Fallback: Find the original embed builder message
            console.log('Stored message not found, searching for embed builder message...');
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            
            // First try: Look for recent messages with embed builder content
            let embedBuilderMessage = messages.find(msg => 
                msg.author.id === interaction.client.user.id && 
                msg.content.includes('🎨 Embed Builder') &&
                msg.components && msg.components.length > 0 &&
                msg.components[0].components.some(button => button.customId?.startsWith('embed_'))
            );

            // Second try: Look for any message with embed builder buttons (even if content doesn't match)
            if (!embedBuilderMessage) {
                embedBuilderMessage = messages.find(msg => 
                    msg.author.id === interaction.client.user.id && 
                    msg.components && msg.components.length > 0 &&
                    msg.components[0].components.some(button => button.customId?.startsWith('embed_'))
                );
            }

            if (embedBuilderMessage) {
                console.log('Found embed builder message to update:', embedBuilderMessage.id);
                
                const embed = embedBuilder.createPreviewEmbed(embedData);
                const components = embedBuilder.createBuilderComponents();

                await embedBuilderMessage.edit({
                    content: `**🎨 Embed Builder**\n${messageContent ? `**Message Content:** ${messageContent}\n` : ''}**Preview:**`,
                    embeds: [embed],
                    components: components
                });
                
                console.log('Successfully updated embed builder message');
            } else {
                console.warn('Could not find original embed builder message to update');
                console.log('Available messages:', messages.first(5).map(m => ({ 
                    id: m.id, 
                    content: m.content.slice(0, 50), 
                    hasComponents: !!m.components?.length,
                    author: m.author.username
                })));
            }
        } catch (error) {
            console.error('Error updating embed builder:', error);
        }
    }

    static async saveTemplate(interaction, name, description, embedData, messageContent) {
        try {
            const existingTemplate = await EmbedTemplate.findOne({
                guildId: interaction.guild.id,
                name: name
            });

            if (existingTemplate) {
                return interaction.reply({
                    content: '❌ A template with that name already exists. Please choose a different name.',
                    ephemeral: true
                });
            }

            const template = new EmbedTemplate({
                guildId: interaction.guild.id,
                name: name,
                description: description,
                createdBy: interaction.user.id,
                embedData: embedData,
                messageContent: messageContent
            });

            await template.save();

            await interaction.reply({
                content: `✅ Template "${name}" saved successfully!`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error saving template:', error);
            await interaction.reply({
                content: '❌ An error occurred while saving the template.',
                ephemeral: true
            });
        }
    }

    static async loadTemplate(interaction, templateId) {
        try {
            const template = await EmbedTemplate.findOne({
                _id: templateId,
                guildId: interaction.guild.id
            });

            if (!template) {
                return interaction.reply({
                    content: '❌ Template not found.',
                    ephemeral: true
                });
            }

            // Store the loaded template data
            if (!interaction.client.embedBuilderSessions) {
                interaction.client.embedBuilderSessions = new Map();
            }
            if (!interaction.client.embedBuilderMessageContent) {
                interaction.client.embedBuilderMessageContent = new Map();
            }

            interaction.client.embedBuilderSessions.set(interaction.user.id, template.embedData);
            interaction.client.embedBuilderMessageContent.set(interaction.user.id, template.messageContent);

            await interaction.update({
                content: `✅ Template "${template.name}" loaded!`,
                components: []
            });

            // Update the main embed builder
            setTimeout(async () => {
                await this.updateEmbedBuilder(interaction, template.embedData, template.messageContent);
            }, 1000);
        } catch (error) {
            console.error('Error loading template:', error);
            await interaction.reply({
                content: '❌ An error occurred while loading the template.',
                ephemeral: true
            });
        }
    }

    static async sendEmbedToChannel(interaction, channel, embedData, messageContent) {
        try {
            const embedBuilder = require('../commands/settings/embed-builder');
            const embed = new EmbedBuilder();

            // Build the embed with URL validation
            if (embedData.title) embed.setTitle(embedData.title);
            if (embedData.description) embed.setDescription(embedData.description);
            
            // Validate URL before setting
            if (embedData.url && embedBuilder.isValidUrl(embedData.url)) {
                try {
                    embed.setURL(embedData.url);
                } catch (error) {
                    // Invalid URL, skip setting it
                }
            }
            
            if (embedData.color) embed.setColor(embedData.color);
            if (embedData.timestamp) embed.setTimestamp();
            
            if (embedData.author && embedData.author.name) {
                const authorData = { name: embedData.author.name };
                
                if (embedData.author.iconURL && embedBuilder.isValidUrl(embedData.author.iconURL)) {
                    authorData.iconURL = embedData.author.iconURL;
                }
                
                if (embedData.author.url && embedBuilder.isValidUrl(embedData.author.url)) {
                    authorData.url = embedData.author.url;
                }
                
                embed.setAuthor(authorData);
            }
            
            if (embedData.thumbnail && embedData.thumbnail.url && embedBuilder.isValidUrl(embedData.thumbnail.url)) {
                try {
                    embed.setThumbnail(embedData.thumbnail.url);
                } catch (error) {
                    // Invalid URL, skip setting it
                }
            }
            
            if (embedData.image && embedData.image.url && embedBuilder.isValidUrl(embedData.image.url)) {
                try {
                    embed.setImage(embedData.image.url);
                } catch (error) {
                    // Invalid URL, skip setting it
                }
            }
            
            if (embedData.footer && embedData.footer.text) {
                const footerData = { text: embedData.footer.text };
                
                if (embedData.footer.iconURL && embedBuilder.isValidUrl(embedData.footer.iconURL)) {
                    footerData.iconURL = embedData.footer.iconURL;
                }
                
                embed.setFooter(footerData);
            }

            if (embedData.fields && embedData.fields.length > 0) {
                embed.addFields(embedData.fields);
            }

            // Check if embed has content
            if (!embed.data.title && !embed.data.description && !embed.data.fields?.length && 
                !embed.data.author && !embed.data.image && !embed.data.thumbnail && !messageContent) {
                return interaction.update({
                    content: '❌ Cannot send empty embed. Please add some content first.',
                    components: []
                });
            }

            const messageData = { embeds: [embed] };
            if (messageContent) messageData.content = messageContent;

            await channel.send(messageData);

            await interaction.update({
                content: `✅ Embed sent to ${channel}!`,
                components: []
            });
        } catch (error) {
            console.error('Error sending embed:', error);
            await interaction.update({
                content: '❌ An error occurred while sending the embed.',
                components: []
            });
        }
    }
}

module.exports = EmbedBuilderHandler;
