const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const LFGUtils = require('../../../utils/LFGUtils');
const LFGPost = require('../../../schemas/LFGPost');
const Utils = require('../../../utils/utils');

module.exports = {
    category: 'LFG',
    data: new SlashCommandBuilder()
        .setName('lfg')
        .setDescription('Create a Looking for Group post')
        .setDefaultMemberPermissions(null)
        .addStringOption(option =>
            option
                .setName('game')
                .setDescription('The game you want to play')
                .setRequired(true)
                .setMaxLength(100)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option
                .setName('message')
                .setDescription('Your LFG message (e.g., "looking for ranked teammates")')
                .setRequired(true)
                .setMaxLength(500)
        )
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to post in (optional - defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const gameName = interaction.options.getString('game');
            const message = interaction.options.getString('message');
            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
            const member = interaction.member;
            const user = interaction.user;

            // Get guild settings
            const settings = await LFGUtils.getGuildSettings(interaction.guild.id);

            // Check if the selected game has a preset and use its default message if none provided
            let finalMessage = message;
            const gamePreset = settings.gamePresets?.find(preset => 
                preset.name.toLowerCase() === gameName.toLowerCase()
            );
            
            // If this game has a preset with a default message, and user message is generic, enhance it
            if (gamePreset && gamePreset.defaultMessage && 
                (message.toLowerCase().includes('lfg') || message.toLowerCase().includes('looking for'))) {
                finalMessage = gamePreset.defaultMessage;
            }

            // Check if slash commands are enabled
            if (settings.triggerMode === 'message') {
                return await interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'LFG Disabled',
                        'LFG slash commands are disabled in this server. Please use message triggers instead.'
                    )]
                });
            }

            // Check if channel is allowed
            const channelAllowed = await LFGUtils.isChannelAllowed(targetChannel.id, interaction.guild.id);
            if (!channelAllowed) {
                return await interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Channel Not Allowed',
                        'LFG posts are not allowed in this channel.'
                    )]
                });
            }

            // Check required role
            const hasRole = await LFGUtils.hasRequiredRole(member, interaction.guild.id);
            if (!hasRole) {
                return await interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Missing Role',
                        'You don\'t have the required role to post LFG messages.'
                    )]
                });
            }

            // Check cooldown
            const cooldownCheck = await LFGUtils.checkCooldown(user.id, interaction.guild.id);
            if (cooldownCheck.onCooldown) {
                return await interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Cooldown Active',
                        `You can post another LFG in ${cooldownCheck.remainingTimeFormatted}.`
                    )]
                });
            }

            // Check for existing active post
            const existingPost = await LFGUtils.hasActiveLFGPost(user.id, interaction.guild.id);
            if (existingPost) {
                return await interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Active Post Exists',
                        'You already have an active LFG post. Please delete it before creating a new one.'
                    )]
                });
            }

            // Get voice channel info
            const voiceChannel = member.voice.channel;
            let postType = 'dm';
            let embed, components;

            if (voiceChannel && settings.features.voiceChannelEmbeds) {
                // User is in voice channel - create voice-based LFG
                postType = 'voice';
                embed = await LFGUtils.createLFGEmbed(
                    user, 
                    gameName, 
                    finalMessage, 
                    voiceChannel, 
                    settings
                );
            } else if (settings.features.dmEmbeds) {
                // User not in voice or DM mode - create DM-style LFG
                embed = await LFGUtils.createLFGEmbed(
                    user, 
                    gameName, 
                    finalMessage, 
                    null, 
                    settings
                );
            } else {
                return await interaction.editReply({
                    embeds: [Utils.createErrorEmbed(
                        'Feature Disabled',
                        'LFG posts are currently disabled in this server.'
                    )]
                });
            }

            // Create the LFG post in database first to get the ID
            const lfgPost = await LFGPost.create({
                messageId: 'temp', // Will be updated after message is sent
                guildId: interaction.guild.id,
                channelId: targetChannel.id,
                userId: user.id,
                gameName,
                message: finalMessage,
                voiceChannel: voiceChannel ? {
                    id: voiceChannel.id,
                    name: voiceChannel.name
                } : null,
                postType,
                expiresAt: settings.expiration.enabled ? 
                    new Date(Date.now() + settings.expiration.duration) : null
            });

            // Create action buttons
            components = LFGUtils.createLFGButtons(
                lfgPost._id.toString(), 
                voiceChannel?.id, 
                settings
            );

            // Send the LFG message
            const lfgMessage = await targetChannel.send({
                embeds: [embed],
                components
            });

            // Update the post with the actual message ID
            lfgPost.messageId = lfgMessage.id;
            await lfgPost.save();

            // Set cooldown
            await LFGUtils.setCooldown(user.id, interaction.guild.id);

            // Assign LFG role if configured
            await LFGUtils.assignLFGRole(member, interaction.guild.id);

            // Log the action
            await LFGUtils.logLFGAction(interaction.guild, 'Post Created', user, {
                gameName,
                channel: targetChannel
            });

            // Send success response
            await interaction.editReply({
                embeds: [Utils.createSuccessEmbed(
                    'LFG Post Created',
                    `Your LFG post for **${gameName}** has been created in ${targetChannel}!`
                )]
            });

        } catch (error) {
            console.error('Error in LFG command:', error);
            
            const errorEmbed = Utils.createErrorEmbed(
                'Error',
                'An error occurred while creating your LFG post. Please try again.'
            );

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        
        try {
            // Get guild settings to access game presets
            const settings = await LFGUtils.getGuildSettings(interaction.guild.id);
            
            // Get channel default game
            const channelDefaultGame = await LFGUtils.getChannelDefaultGame(interaction.channel.id, interaction.guild.id);
            
            let choices = [];
            
            // Add game presets if they exist
            if (settings.gamePresets && settings.gamePresets.length > 0) {
                choices = settings.gamePresets.map(preset => {
                    const isDefault = channelDefaultGame && preset.name === channelDefaultGame;
                    const prefix = isDefault ? '⭐ ' : '';
                    const defaultMsg = preset.defaultMessage ? ` - ${preset.defaultMessage.slice(0, 25)}${preset.defaultMessage.length > 25 ? '...' : ''}` : '';
                    return {
                        name: `${prefix}${preset.icon || '🎮'} ${preset.name}${defaultMsg}`,
                        value: preset.name
                    };
                });
                
                // Sort choices to put default game first
                if (channelDefaultGame) {
                    choices.sort((a, b) => {
                        const aIsDefault = a.value === channelDefaultGame;
                        const bIsDefault = b.value === channelDefaultGame;
                        if (aIsDefault && !bIsDefault) return -1;
                        if (!aIsDefault && bIsDefault) return 1;
                        return 0;
                    });
                }
            }
            
            // Add some default popular games if no presets or to supplement
            const defaultGames = [
                { name: '🔫 Valorant', value: 'Valorant' },
                { name: '⚔️ League of Legends', value: 'League of Legends' },
                { name: '🎯 Apex Legends', value: 'Apex Legends' },
                { name: '🏗️ Fortnite', value: 'Fortnite' },
                { name: '🔫 Call of Duty', value: 'Call of Duty' },
                { name: '💥 Counter-Strike 2', value: 'Counter-Strike 2' },
                { name: '🛡️ Overwatch 2', value: 'Overwatch 2' },
                { name: '🚗 Rocket League', value: 'Rocket League' },
                { name: '⛏️ Minecraft', value: 'Minecraft' },
                { name: '🦸 Marvel Rivals', value: 'Marvel Rivals' }
            ];
            
            // If no presets exist, use default games
            if (choices.length === 0) {
                choices = defaultGames;
            } else {
                // Add default games that aren't already in presets
                for (const defaultGame of defaultGames) {
                    if (!choices.some(choice => choice.value.toLowerCase() === defaultGame.value.toLowerCase())) {
                        choices.push(defaultGame);
                    }
                }
            }
            
            // Filter based on user input
            const filtered = choices.filter(choice => 
                choice.name.toLowerCase().includes(focusedValue.toLowerCase()) ||
                choice.value.toLowerCase().includes(focusedValue.toLowerCase())
            );
            
            // Sort to prioritize exact matches and put presets first
            filtered.sort((a, b) => {
                const aIsPreset = settings.gamePresets?.some(preset => preset.name === a.value);
                const bIsPreset = settings.gamePresets?.some(preset => preset.name === b.value);
                
                // Presets first
                if (aIsPreset && !bIsPreset) return -1;
                if (!aIsPreset && bIsPreset) return 1;
                
                // Then exact matches
                const aExact = a.value.toLowerCase() === focusedValue.toLowerCase();
                const bExact = b.value.toLowerCase() === focusedValue.toLowerCase();
                
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                
                // Then starts with
                const aStarts = a.value.toLowerCase().startsWith(focusedValue.toLowerCase());
                const bStarts = b.value.toLowerCase().startsWith(focusedValue.toLowerCase());
                
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                
                return a.name.localeCompare(b.name);
            });
            
            // Limit to 25 choices (Discord limit)
            const limitedChoices = filtered.slice(0, 25);
            
            // If only one preset exists and no user input, make it the default
            if (settings.gamePresets?.length === 1 && !focusedValue.trim()) {
                const preset = settings.gamePresets[0];
                return await interaction.respond([{
                    name: `${preset.icon || '🎮'} ${preset.name} (Default)`,
                    value: preset.name
                }]);
            }
            
            // If user hasn't typed anything, show all available options
            if (!focusedValue.trim()) {
                const limitedChoices = choices.slice(0, 25);
                return await interaction.respond(limitedChoices);
            }
            
            await interaction.respond(limitedChoices);
            
        } catch (error) {
            console.error('Error in LFG autocomplete:', error);
            // Fallback to basic games if there's an error
            const fallbackGames = [
                { name: '🔫 Valorant', value: 'Valorant' },
                { name: '⚔️ League of Legends', value: 'League of Legends' },
                { name: '🎯 Apex Legends', value: 'Apex Legends' },
                { name: '🎮 Other Game', value: 'Other' }
            ];
            
            const filtered = fallbackGames.filter(game => 
                game.name.toLowerCase().includes(focusedValue.toLowerCase())
            ).slice(0, 25);
            
            await interaction.respond(filtered);
        }
    }
};
