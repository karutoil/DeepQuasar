const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const LFGSettings = require('../../../schemas/LFGSettings');
const LFGUtils = require('../../../utils/LFGUtils');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'LFG',
    permissions: [PermissionFlagsBits.Administrator],
    data: new SlashCommandBuilder()
        .setName('lfg-presets')
        .setDescription('Manage LFG game presets')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new game preset')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Game name')
                        .setRequired(true)
                        .setMaxLength(50)
                )
                .addStringOption(option =>
                    option
                        .setName('icon')
                        .setDescription('Emoji or icon for the game')
                        .setRequired(false)
                        .setMaxLength(10)
                )
                .addStringOption(option =>
                    option
                        .setName('color')
                        .setDescription('Embed color (hex code)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('default-message')
                        .setDescription('Default LFG message template')
                        .setRequired(false)
                        .setMaxLength(200)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a game preset')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Game name to remove')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all game presets')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('load-defaults')
                .setDescription('Load default game presets')
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const subcommand = interaction.options.getSubcommand();
            const settings = await LFGUtils.getGuildSettings(interaction.guild.id);

            switch (subcommand) {
                case 'add':
                    await this.handleAdd(interaction, settings);
                    break;
                case 'remove':
                    await this.handleRemove(interaction, settings);
                    break;
                case 'list':
                    await this.handleList(interaction, settings);
                    break;
                case 'load-defaults':
                    await this.handleLoadDefaults(interaction, settings);
                    break;
            }

        } catch (error) {
            console.error('Error in LFG presets command:', error);
            await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Preset Error',
                    'An error occurred while managing game presets.'
                )]
            });
        }
    },

    async handleAdd(interaction, settings) {
        const name = interaction.options.getString('name');
        const icon = interaction.options.getString('icon');
        const color = interaction.options.getString('color');
        const defaultMessage = interaction.options.getString('default-message');

        // Validate color if provided
        if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
            return await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Invalid Color',
                    'Please provide a valid hex color code (e.g., #5865F2).'
                )]
            });
        }

        // Check if preset already exists
        const existingPreset = settings.gamePresets.find(preset => 
            preset.name.toLowerCase() === name.toLowerCase()
        );

        if (existingPreset) {
            return await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Preset Exists',
                    `A preset for **${name}** already exists.`
                )]
            });
        }

        // Add new preset
        settings.gamePresets.push({
            name,
            icon: icon || '🎮',
            color: color || '#5865F2',
            defaultMessage: defaultMessage || 'Looking for group!'
        });

        await settings.save();

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed(
                'Preset Added',
                `Game preset for **${name}** has been added successfully!`
            )]
        });
    },

    async handleRemove(interaction, settings) {
        const name = interaction.options.getString('name');

        const presetIndex = settings.gamePresets.findIndex(preset => 
            preset.name.toLowerCase() === name.toLowerCase()
        );

        if (presetIndex === -1) {
            return await interaction.editReply({
                embeds: [Utils.createErrorEmbed(
                    'Preset Not Found',
                    `No preset found for **${name}**.`
                )]
            });
        }

        const removedPreset = settings.gamePresets[presetIndex];
        settings.gamePresets.splice(presetIndex, 1);
        await settings.save();

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed(
                'Preset Removed',
                `Game preset for **${removedPreset.name}** has been removed.`
            )]
        });
    },

    async handleList(interaction, settings) {
        if (settings.gamePresets.length === 0) {
            return await interaction.editReply({
                embeds: [Utils.createEmbed({
                    title: '🎮 Game Presets',
                    description: 'No game presets configured. Use `/lfg-presets load-defaults` to load default presets.',
                    color: '#FEE75C'
                })]
            });
        }

        let description = '';
        for (const preset of settings.gamePresets) {
            description += `${preset.icon} **${preset.name}**\n`;
            description += `• Color: ${preset.color}\n`;
            description += `• Default: ${preset.defaultMessage}\n\n`;
        }

        const embed = Utils.createEmbed({
            title: '🎮 Game Presets',
            description: description,
            color: '#5865F2'
        });

        await interaction.editReply({ embeds: [embed] });
    },

    async handleLoadDefaults(interaction, settings) {
        const LFGUtils = require('../../../utils/LFGUtils');
        const defaultPresets = LFGUtils.getDefaultGamePresets();

        // Only add presets that don't already exist
        let addedCount = 0;
        for (const defaultPreset of defaultPresets) {
            const exists = settings.gamePresets.find(preset => 
                preset.name.toLowerCase() === defaultPreset.name.toLowerCase()
            );

            if (!exists) {
                settings.gamePresets.push(defaultPreset);
                addedCount++;
            }
        }

        await settings.save();

        await interaction.editReply({
            embeds: [Utils.createSuccessEmbed(
                'Default Presets Loaded',
                `Added ${addedCount} default game preset(s). ${defaultPresets.length - addedCount} presets were already configured.`
            )]
        });
    },

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        
        try {
        const settings = await LFGUtils.getGuildSettings(interaction.guild.id);
            if (!settings || !settings.gamePresets) return await interaction.respond([]);

            const filtered = settings.gamePresets
                .filter(preset => preset.name.toLowerCase().includes(focusedValue.toLowerCase()))
                .slice(0, 25)
                .map(preset => ({
                    name: preset.name,
                    value: preset.name
                }));

            await interaction.respond(filtered);
        } catch (error) {
            console.error('Error in LFG presets autocomplete:', error);
            await interaction.respond([]);
        }
    }
};
