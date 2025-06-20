const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const TicketConfig = require('../../schemas/TicketConfig');
const Utils = require('../../utils/utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Manage ticket panels')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new ticket panel')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to send the panel to')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('title')
                        .setDescription('Panel title')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('Panel description')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('color')
                        .setDescription('Panel embed color (hex code)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing ticket panel')
                .addStringOption(option =>
                    option
                        .setName('panel_id')
                        .setDescription('Panel ID to edit')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('title')
                        .setDescription('New panel title')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('New panel description')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('color')
                        .setDescription('New panel embed color (hex code)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a ticket panel')
                .addStringOption(option =>
                    option
                        .setName('panel_id')
                        .setDescription('Panel ID to delete')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all ticket panels in this server'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-button')
                .setDescription('Add a button to a ticket panel')
                .addStringOption(option =>
                    option
                        .setName('panel_id')
                        .setDescription('Panel ID to add button to')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Ticket type for this button')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Support', value: 'support' },
                            { name: 'Bug Report', value: 'bug' },
                            { name: 'Partnership', value: 'partnership' },
                            { name: 'Billing', value: 'billing' },
                            { name: 'Other', value: 'other' }
                        ))
                .addStringOption(option =>
                    option
                        .setName('label')
                        .setDescription('Button label')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('emoji')
                        .setDescription('Button emoji')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('style')
                        .setDescription('Button style')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Primary (Blue)', value: 'Primary' },
                            { name: 'Secondary (Gray)', value: 'Secondary' },
                            { name: 'Success (Green)', value: 'Success' },
                            { name: 'Danger (Red)', value: 'Danger' }
                        ))
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('Button description')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-button')
                .setDescription('Remove a button from a ticket panel')
                .addStringOption(option =>
                    option
                        .setName('panel_id')
                        .setDescription('Panel ID to remove button from')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Ticket type of button to remove')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'create':
                await this.createPanel(interaction);
                break;
            case 'edit':
                await this.editPanel(interaction);
                break;
            case 'delete':
                await this.deletePanel(interaction);
                break;
            case 'list':
                await this.listPanels(interaction);
                break;
            case 'add-button':
                await this.addButton(interaction);
                break;
            case 'remove-button':
                await this.removeButton(interaction);
                break;
        }
    },

    async createPanel(interaction) {
        const channel = interaction.options.getChannel('channel');
        const title = interaction.options.getString('title') || '🎫 Support Tickets';
        const description = interaction.options.getString('description') || 'Click a button below to create a support ticket.';
        const colorInput = interaction.options.getString('color');
        
        let color = 0x5865F2;
        if (colorInput) {
            try {
                color = parseInt(colorInput.replace('#', ''), 16);
            } catch (error) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('Invalid Color', 'Please provide a valid hex color code (e.g., #5865F2)')],
                    ephemeral: true
                });
            }
        }

        try {
            await interaction.deferReply({ ephemeral: true });

            const ticketManager = interaction.client.ticketManager;
            const result = await ticketManager.createPanel(interaction.guild, channel, {
                title,
                description,
                color: `#${color.toString(16).padStart(6, '0')}`
            });

            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed(
                    'Panel Created',
                    `Ticket panel has been created in ${channel} with ID: \`${result.panelId}\``
                )]
            });

        } catch (error) {
            console.error('Error creating panel:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to create ticket panel. Please try again.')]
            });
        }
    },

    async editPanel(interaction) {
        const panelId = interaction.options.getString('panel_id');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const colorInput = interaction.options.getString('color');

        try {
            await interaction.deferReply({ ephemeral: true });

            const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            if (!config) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('No Configuration', 'No ticket configuration found for this server.')]
                });
            }

            const panel = config.panels.find(p => p.panelId === panelId);
            if (!panel) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Panel Not Found', 'No panel found with that ID.')]
                });
            }

            // Update panel properties
            if (title) panel.title = title;
            if (description) panel.description = description;
            if (colorInput) {
                try {
                    const color = parseInt(colorInput.replace('#', ''), 16);
                    panel.color = `#${color.toString(16).padStart(6, '0')}`;
                } catch (error) {
                    return interaction.editReply({
                        embeds: [Utils.createErrorEmbed('Invalid Color', 'Please provide a valid hex color code.')]
                    });
                }
            }

            await config.save();

            // Update the message
            const channel = interaction.guild.channels.cache.get(panel.channelId);
            if (channel) {
                try {
                    const message = await channel.messages.fetch(panel.messageId);
                    
                    const embed = Utils.createEmbed({
                        title: panel.title,
                        description: panel.description,
                        color: parseInt(panel.color.replace('#', ''), 16),
                        footer: { text: `Panel ID: ${panel.panelId}` }
                    });

                    const rows = this.createButtonRows(panel.buttons);
                    await message.edit({ embeds: [embed], components: rows });
                } catch (error) {
                    console.error('Error updating panel message:', error);
                }
            }

            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed('Panel Updated', 'The ticket panel has been updated successfully.')]
            });

        } catch (error) {
            console.error('Error editing panel:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to edit ticket panel.')]
            });
        }
    },

    async deletePanel(interaction) {
        const panelId = interaction.options.getString('panel_id');

        try {
            await interaction.deferReply({ ephemeral: true });

            const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            if (!config) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('No Configuration', 'No ticket configuration found for this server.')]
                });
            }

            const panelIndex = config.panels.findIndex(p => p.panelId === panelId);
            if (panelIndex === -1) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Panel Not Found', 'No panel found with that ID.')]
                });
            }

            const panel = config.panels[panelIndex];

            // Delete the message
            const channel = interaction.guild.channels.cache.get(panel.channelId);
            if (channel) {
                try {
                    const message = await channel.messages.fetch(panel.messageId);
                    await message.delete();
                } catch (error) {
                    console.log('Could not delete panel message:', error.message);
                }
            }

            // Remove from config
            config.panels.splice(panelIndex, 1);
            await config.save();

            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed('Panel Deleted', 'The ticket panel has been deleted successfully.')]
            });

        } catch (error) {
            console.error('Error deleting panel:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to delete ticket panel.')]
            });
        }
    },

    async listPanels(interaction) {
        try {
            const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            
            if (!config || config.panels.length === 0) {
                return interaction.reply({
                    embeds: [Utils.createErrorEmbed('No Panels', 'No ticket panels found in this server.')],
                    ephemeral: true
                });
            }

            const panelList = config.panels.map(panel => {
                const channel = interaction.guild.channels.cache.get(panel.channelId);
                return `**${panel.title}**\n` +
                       `ID: \`${panel.panelId}\`\n` +
                       `Channel: ${channel ? channel.toString() : 'Unknown'}\n` +
                       `Buttons: ${panel.buttons.length}\n` +
                       `Created: <t:${Math.floor(panel.createdAt.getTime() / 1000)}:R>`;
            }).join('\n\n');

            const embed = Utils.createEmbed({
                title: '🎫 Ticket Panels',
                description: panelList,
                color: 0x5865F2
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error listing panels:', error);
            await interaction.reply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to list ticket panels.')],
                ephemeral: true
            });
        }
    },

    async addButton(interaction) {
        const panelId = interaction.options.getString('panel_id');
        const type = interaction.options.getString('type');
        const label = interaction.options.getString('label');
        const emoji = interaction.options.getString('emoji');
        const style = interaction.options.getString('style') || 'Primary';
        const description = interaction.options.getString('description');

        try {
            await interaction.deferReply({ ephemeral: true });

            const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            if (!config) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('No Configuration', 'No ticket configuration found for this server.')]
                });
            }

            const panel = config.panels.find(p => p.panelId === panelId);
            if (!panel) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Panel Not Found', 'No panel found with that ID.')]
                });
            }

            if (panel.buttons.length >= 25) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Too Many Buttons', 'A panel can have a maximum of 25 buttons.')]
                });
            }

            // Check if button type already exists
            if (panel.buttons.some(btn => btn.ticketType === type)) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Button Exists', 'A button for this ticket type already exists.')]
                });
            }

            // Add button
            panel.buttons.push({
                customId: `ticket_create_${type}`,
                label,
                emoji,
                style,
                ticketType: type,
                description
            });

            await config.save();

            // Update the message
            const channel = interaction.guild.channels.cache.get(panel.channelId);
            if (channel) {
                try {
                    const message = await channel.messages.fetch(panel.messageId);
                    
                    const embed = Utils.createEmbed({
                        title: panel.title,
                        description: panel.description,
                        color: parseInt(panel.color.replace('#', ''), 16),
                        footer: { text: `Panel ID: ${panel.panelId}` }
                    });

                    const rows = this.createButtonRows(panel.buttons);
                    await message.edit({ embeds: [embed], components: rows });
                } catch (error) {
                    console.error('Error updating panel message:', error);
                }
            }

            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed('Button Added', `Added ${label} button to the panel.`)]
            });

        } catch (error) {
            console.error('Error adding button:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to add button to panel.')]
            });
        }
    },

    async removeButton(interaction) {
        const panelId = interaction.options.getString('panel_id');
        const type = interaction.options.getString('type');

        try {
            await interaction.deferReply({ ephemeral: true });

            const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
            if (!config) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('No Configuration', 'No ticket configuration found for this server.')]
                });
            }

            const panel = config.panels.find(p => p.panelId === panelId);
            if (!panel) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Panel Not Found', 'No panel found with that ID.')]
                });
            }

            const buttonIndex = panel.buttons.findIndex(btn => btn.ticketType === type);
            if (buttonIndex === -1) {
                return interaction.editReply({
                    embeds: [Utils.createErrorEmbed('Button Not Found', 'No button found for that ticket type.')]
                });
            }

            // Remove button
            panel.buttons.splice(buttonIndex, 1);
            await config.save();

            // Update the message
            const channel = interaction.guild.channels.cache.get(panel.channelId);
            if (channel) {
                try {
                    const message = await channel.messages.fetch(panel.messageId);
                    
                    const embed = Utils.createEmbed({
                        title: panel.title,
                        description: panel.description,
                        color: parseInt(panel.color.replace('#', ''), 16),
                        footer: { text: `Panel ID: ${panel.panelId}` }
                    });

                    const rows = this.createButtonRows(panel.buttons);
                    await message.edit({ embeds: [embed], components: rows });
                } catch (error) {
                    console.error('Error updating panel message:', error);
                }
            }

            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed('Button Removed', `Removed ${type} button from the panel.`)]
            });

        } catch (error) {
            console.error('Error removing button:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed('Error', 'Failed to remove button from panel.')]
            });
        }
    },

    createButtonRows(buttons) {
        const rows = [];
        
        for (let i = 0; i < buttons.length; i += 5) {
            const row = new ActionRowBuilder();
            const rowButtons = buttons.slice(i, i + 5);
            
            rowButtons.forEach(btn => {
                const button = new ButtonBuilder()
                    .setCustomId(btn.customId)
                    .setLabel(btn.label)
                    .setStyle(ButtonStyle[btn.style]);
                
                if (btn.emoji) {
                    button.setEmoji(btn.emoji);
                }
                
                row.addComponents(button);
            });
            
            rows.push(row);
        }
        
        return rows;
    }
};
