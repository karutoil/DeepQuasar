const Utils = require('../../../utils/utils');

async function handleModLogEventToggle(interaction, client) {
    const ModLog = require('../../../schemas/ModLog');
    const ModLogManager = require('../../../utils/ModLogManager');

    const eventType = interaction.customId.replace('modlog_toggle_', '');
    const modLog = await ModLog.getOrCreate(interaction.guild.id);

    if (!modLog.enabled) {
        const embed = Utils.createErrorEmbed(
            'Modlog Not Enabled', 
            'Please use `/modlog setup` first to enable moderation logging.'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const currentState = modLog.events[eventType].enabled;
    modLog.events[eventType].enabled = !currentState;
    await modLog.save();

    const displayName = ModLogManager.getEventDisplayName(eventType);
    const newState = !currentState ? 'enabled' : 'disabled';

    const embed = Utils.createSuccessEmbed(
        'Event Toggled',
        `**${displayName}** has been **${newState}**`
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleModLogButton(interaction, client) {
    const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
    
    if (interaction.customId === 'modlog_back') {
        // Return to category selection
        const embed = Utils.createInfoEmbed(
            'Modlog Configuration',
            'Select a category to configure event settings:'
        );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('modlog_category_select')
            .setPlaceholder('Choose a category to configure')
            .addOptions([
                {
                    label: 'Member Events',
                    description: 'Join, leave, ban, kick, timeout, etc.',
                    value: 'member',
                    emoji: '👥'
                },
                {
                    label: 'Message Events',
                    description: 'Delete, edit, bulk delete, reactions',
                    value: 'message',
                    emoji: '💬'
                },
                {
                    label: 'Channel Events',
                    description: 'Create, delete, update channels',
                    value: 'channel',
                    emoji: '📋'
                },
                {
                    label: 'Role Events',
                    description: 'Create, delete, update roles',
                    value: 'role',
                    emoji: '🎭'
                },
                {
                    label: 'Guild Events',
                    description: 'Server updates, emojis, stickers',
                    value: 'guild',
                    emoji: '🏠'
                },
                {
                    label: 'Voice Events',
                    description: 'Voice channel join/leave/move',
                    value: 'voice',
                    emoji: '🔊'
                },
                {
                    label: 'Other Events',
                    description: 'Invites, threads, integrations, etc.',
                    value: 'other',
                    emoji: '⚙️'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }
    
    if (interaction.customId.startsWith('modlog_toggle_')) {
        await handleModLogEventToggle(interaction, client);
    }
}

class ModerationInteractionHandler {
    static async handleButtonInteraction(interaction, client) {
        const customId = interaction.customId;
        
        try {
            // Handle modlog buttons
            if (customId.startsWith('modlog_')) {
                await handleModLogButton(interaction, client);
                return true;
            }

            return false;
        } catch (error) {
            client.logger.error(`Error handling moderation button interaction ${customId}:`, error);
            const embed = Utils.createErrorEmbed(
                'Moderation Button Error',
                'An error occurred while processing this moderation button interaction.'
            );

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            return true;
        }
    }
}

module.exports = { ModerationInteractionHandler, handleModLogEventToggle };