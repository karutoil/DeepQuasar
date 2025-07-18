const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require('discord.js');
const EmbedTemplate = require('../../../schemas/EmbedTemplate');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'Settings',
    permissions: [PermissionFlagsBits.ManageMessages],
    data: new SlashCommandBuilder()
        .setName('templates')
        .setDescription('Manage embed templates')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all saved embed templates')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete an embed template')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('View information about a template')
        ),

    async execute(interaction) {
        // Check permissions
        const permissionCheck = Utils.checkEmbedPermissions(interaction);
        if (!permissionCheck.hasPermission) {
            return interaction.reply({
                content: permissionCheck.reason,
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'list':
                await this.listTemplates(interaction);
                break;
            case 'delete':
                await this.deleteTemplate(interaction);
                break;
            case 'info':
                await this.templateInfo(interaction);
                break;
        }
    },

    async listTemplates(interaction) {
        try {
            const templates = await EmbedTemplate.find({ guildId: interaction.guild.id })
                .sort({ createdAt: -1 });

            if (templates.length === 0) {
                return interaction.reply({
                    content: '📋 **No Templates Found**\n\nThis server doesn\'t have any saved embed templates yet.\n\nUse `/embed builder` to create and save your first template!',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(`📋 Embed Templates (${templates.length})`)
                .setColor(0x5865f2)
                .setFooter({ text: `Guild: ${interaction.guild.name}` })
                .setTimestamp();

            let description = '';
            for (let i = 0; i < Math.min(templates.length, 10); i++) {
                const template = templates[i];
                const creator = await interaction.client.users.fetch(template.createdBy).catch(() => null);
                const creatorName = creator ? creator.username : 'Unknown User';
                
                description += `**${i + 1}.** \`${template.name}\`\n`;
                description += `   └ *${template.description || 'No description'}*\n`;
                description += `   └ Created by ${creatorName} • <t:${Math.floor(template.createdAt.getTime() / 1000)}:R>\n\n`;
            }

            if (templates.length > 10) {
                description += `*... and ${templates.length - 10} more templates*`;
            }

            embed.setDescription(description);

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Error listing templates:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching templates.',
                ephemeral: true
            });
        }
    },

    async deleteTemplate(interaction) {
        try {
            const templates = await EmbedTemplate.find({ guildId: interaction.guild.id })
                .sort({ createdAt: -1 })
                .limit(25);

            if (templates.length === 0) {
                return interaction.reply({
                    content: '❌ No templates found to delete.',
                    ephemeral: true
                });
            }

            const options = await Promise.all(templates.map(async (template) => {
                const creator = await interaction.client.users.fetch(template.createdBy).catch(() => null);
                const creatorName = creator ? creator.username : 'Unknown';
                return {
                    label: template.name,
                    description: `By ${creatorName} • ${template.description?.slice(0, 80) || 'No description'}`,
                    value: template._id.toString()
                };
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('template_delete_select')
                .setPlaceholder('Select a template to delete')
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Delete Template')
                .setDescription('Select a template to delete from the dropdown below.\n\n⚠️ **Warning:** This action cannot be undone!')
                .setColor(0xed4245);

            await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });

            // Set up collector for deletion
            const filter = (i) => i.user.id === interaction.user.id && i.customId === 'template_delete_select';
            const collector = interaction.channel.createMessageComponentCollector({ 
                filter, 
                time: 30000 // 30 seconds
            });

            collector.on('collect', async (i) => {
                try {
                    const templateId = i.values[0];
                    const template = await EmbedTemplate.findOneAndDelete({
                        _id: templateId,
                        guildId: interaction.guild.id
                    });

                    if (!template) {
                        return i.update({
                            content: '❌ Template not found or already deleted.',
                            embeds: [],
                            components: []
                        });
                    }

                    const successEmbed = new EmbedBuilder()
                        .setTitle('✅ Template Deleted')
                        .setDescription(`Template **${template.name}** has been successfully deleted.`)
                        .setColor(0x57f287);

                    await i.update({
                        embeds: [successEmbed],
                        components: []
                    });
                } catch (error) {
                    console.error('Error deleting template:', error);
                    await i.update({
                        content: '❌ An error occurred while deleting the template.',
                        embeds: [],
                        components: []
                    });
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    try {
                        await interaction.editReply({
                            content: '⏰ Template deletion cancelled due to timeout.',
                            embeds: [],
                            components: []
                        });
                    } catch (error) {
                        // Ignore errors when editing timed out interactions
                    }
                }
            });
        } catch (error) {
            console.error('Error in delete template:', error);
            await interaction.reply({
                content: '❌ An error occurred while setting up template deletion.',
                ephemeral: true
            });
        }
    },

    async templateInfo(interaction) {
        try {
            const templates = await EmbedTemplate.find({ guildId: interaction.guild.id })
                .sort({ createdAt: -1 })
                .limit(25);

            if (templates.length === 0) {
                return interaction.reply({
                    content: '❌ No templates found.',
                    ephemeral: true
                });
            }

            const options = await Promise.all(templates.map(async (template) => {
                const creator = await interaction.client.users.fetch(template.createdBy).catch(() => null);
                const creatorName = creator ? creator.username : 'Unknown';
                return {
                    label: template.name,
                    description: `By ${creatorName} • ${template.description?.slice(0, 80) || 'No description'}`,
                    value: template._id.toString()
                };
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('template_info_select')
                .setPlaceholder('Select a template to view details')
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setTitle('ℹ️ Template Information')
                .setDescription('Select a template to view its details and preview.')
                .setColor(0x5865f2);

            await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });

            // Set up collector for info display
            const filter = (i) => i.user.id === interaction.user.id && i.customId === 'template_info_select';
            const collector = interaction.channel.createMessageComponentCollector({ 
                filter, 
                time: 60000 // 60 seconds
            });

            collector.on('collect', async (i) => {
                try {
                    const templateId = i.values[0];
                    const template = await EmbedTemplate.findOne({
                        _id: templateId,
                        guildId: interaction.guild.id
                    });

                    if (!template) {
                        return i.update({
                            content: '❌ Template not found.',
                            embeds: [],
                            components: []
                        });
                    }

                    const creator = await interaction.client.users.fetch(template.createdBy).catch(() => null);
                    const creatorName = creator ? creator.username : 'Unknown User';

                    // Create info embed
                    const infoEmbed = new EmbedBuilder()
                        .setTitle(`📋 Template: ${template.name}`)
                        .setColor(0x5865f2)
                        .addFields(
                            { name: '📝 Description', value: template.description || '*No description*', inline: false },
                            { name: '👤 Created By', value: creatorName, inline: true },
                            { name: '📅 Created', value: `<t:${Math.floor(template.createdAt.getTime() / 1000)}:F>`, inline: true },
                            { name: '🏷️ Template ID', value: `\`${template._id}\``, inline: true }
                        );

                    // Create preview embed
                    const previewEmbed = new EmbedBuilder();
                    const embedData = template.embedData;

                    if (embedData.title) previewEmbed.setTitle(embedData.title);
                    if (embedData.description) previewEmbed.setDescription(embedData.description);
                    if (embedData.url) previewEmbed.setURL(embedData.url);
                    if (embedData.color) previewEmbed.setColor(embedData.color);
                    if (embedData.timestamp) previewEmbed.setTimestamp();
                    
                    if (embedData.author?.name) {
                        previewEmbed.setAuthor({
                            name: embedData.author.name,
                            iconURL: embedData.author.iconURL || undefined,
                            url: embedData.author.url || undefined
                        });
                    }
                    
                    if (embedData.thumbnail?.url) previewEmbed.setThumbnail(embedData.thumbnail.url);
                    if (embedData.image?.url) previewEmbed.setImage(embedData.image.url);
                    
                    if (embedData.footer?.text) {
                        previewEmbed.setFooter({
                            text: embedData.footer.text,
                            iconURL: embedData.footer.iconURL || undefined
                        });
                    }

                    if (embedData.fields?.length > 0) {
                        previewEmbed.addFields(embedData.fields);
                    }

                    // If embed is empty, show placeholder
                    if (!previewEmbed.data.title && !previewEmbed.data.description && !previewEmbed.data.fields?.length && 
                        !previewEmbed.data.author && !previewEmbed.data.image && !previewEmbed.data.thumbnail) {
                        previewEmbed.setDescription('*This template contains an empty embed*');
                        previewEmbed.setColor(0x2b2d31);
                    }

                    const content = template.messageContent ? `**Message Content:** ${template.messageContent}\n\n**Preview:**` : '**Preview:**';

                    await i.update({
                        content: content,
                        embeds: [infoEmbed, previewEmbed],
                        components: []
                    });
                } catch (error) {
                    console.error('Error showing template info:', error);
                    await i.update({
                        content: '❌ An error occurred while fetching template information.',
                        embeds: [],
                        components: []
                    });
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    try {
                        await interaction.editReply({
                            content: '⏰ Template selection timed out.',
                            embeds: [],
                            components: []
                        });
                    } catch (error) {
                        // Ignore errors when editing timed out interactions
                    }
                }
            });
        } catch (error) {
            console.error('Error in template info:', error);
            await interaction.reply({
                content: '❌ An error occurred while setting up template information.',
                ephemeral: true
            });
        }
    }
};
