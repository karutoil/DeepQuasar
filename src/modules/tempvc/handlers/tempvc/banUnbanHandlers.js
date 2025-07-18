const { PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, UserSelectMenuBuilder } = require('discord.js');
const Utils = require('../../utils/utils');
const TempVCInstance = require('../../schemas/TempVCInstance');

async function handleBan(interaction, instance, channel, manager, client) {
    const bannedUserIds = new Set();
    for (const [id, overwrite] of channel.permissionOverwrites.cache) {
        if (overwrite.type === 1 && overwrite.deny.has(PermissionFlagsBits.Connect)) {
            bannedUserIds.add(id);
        }
    }
    const defaultUsers = [];
    const vcMembers = channel.members.filter(m => !m.user.bot && m.id !== instance.ownerId && !bannedUserIds.has(m.id));
    defaultUsers.push(...vcMembers.map(m => m.id));
    if (defaultUsers.length < 25) {
        try {
            const guild = interaction.guild;
            const allMembers = await guild.members.fetch({ limit: 50 });
            const additionalMembers = allMembers
                .filter(m => !m.user.bot && m.id !== instance.ownerId && !bannedUserIds.has(m.id) && !defaultUsers.includes(m.id))
                .first(25 - defaultUsers.length);
            defaultUsers.push(...additionalMembers.map(m => m.id));
        } catch (error) {
            client.logger.debug('Could not fetch additional members for ban menu:', error);
        }
    }
    const userSelectMenu = new UserSelectMenuBuilder()
        .setCustomId(`tempvc_ban_user_select_${instance.channelId}`)
        .setPlaceholder('Search and select a user to ban...')
        .setMaxValues(10)
        .setMinValues(1);
    const row = new ActionRowBuilder().addComponents(userSelectMenu);
    await interaction.reply({
        content: '🔍 **Ban Member**\nSearch for and select a user to ban from this channel:\n\n*You can type to search for any user in the server*',
        components: [row],
        ephemeral: true
    });
}

async function handleBanSelection(interaction, instance, channel, userId, manager, client) {
    try {
        const targetUser = await interaction.guild.members.fetch(userId);
        if (!targetUser) {
            return interaction.update({
                content: '❌ Member not found.',
                components: []
            });
        }
        if (targetUser.id === instance.ownerId) {
            return interaction.update({
                content: '❌ You cannot ban the channel owner.',
                components: []
            });
        }
        await channel.permissionOverwrites.edit(targetUser.id, {
            Connect: false,
            ViewChannel: false
        });
        await instance.blockUser(targetUser.id);
        await instance.autoSaveSettings();
        if (targetUser.voice.channel && targetUser.voice.channel.id === channel.id) {
            await targetUser.voice.disconnect('Banned from temp VC');
        }
        await interaction.update({
            content: `✅ **${targetUser.displayName}** has been banned from the channel.`,
            components: []
        });
        try {
            const embed = Utils.createErrorEmbed(
                'Banned from Voice Channel',
                `You have been banned from **${channel.name}** and cannot rejoin unless unbanned.`
            );
            await targetUser.send({ embeds: [embed] });
        } catch (error) {}
        await manager.updateControlPanel(instance, channel);
    } catch (error) {
        client.logger.error('Error banning member:', error);
        await interaction.update({
            content: '❌ Failed to ban member.',
            components: []
        });
    }
}

async function handleBanUserSelection(interaction, instance, channel, manager, client) {
    try {
        const userIds = interaction.values;
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        for (const userId of userIds) {
            try {
                const targetUser = await interaction.guild.members.fetch(userId).catch(() => null);
                if (!targetUser) {
                    results.push(`❌ User ID ${userId} not found in this server`);
                    errorCount++;
                    continue;
                }
                if (targetUser.id === instance.ownerId) {
                    results.push(`❌ Cannot ban ${targetUser.displayName} (channel owner)`);
                    errorCount++;
                    continue;
                }
                const existingOverwrite = channel.permissionOverwrites.cache.get(userId);
                if (existingOverwrite && existingOverwrite.deny.has(PermissionFlagsBits.Connect)) {
                    results.push(`⚠️ ${targetUser.displayName} is already banned`);
                    continue;
                }
                await channel.permissionOverwrites.edit(targetUser.id, {
                    Connect: false,
                    ViewChannel: false
                });
                await instance.blockUser(targetUser.id);
                if (targetUser.voice.channel && targetUser.voice.channel.id === channel.id) {
                    await targetUser.voice.disconnect('Banned from temp VC');
                }
                results.push(`✅ ${targetUser.displayName} banned`);
                successCount++;
                try {
                    const embed = Utils.createErrorEmbed(
                        'Banned from Voice Channel',
                        `You have been banned from **${channel.name}** and cannot rejoin unless unbanned.`
                    );
                    await targetUser.send({ embeds: [embed] });
                } catch (error) {}
            } catch (error) {
                client.logger.error(`Error banning user ${userId}:`, error);
                results.push(`❌ Failed to ban user ID ${userId}`);
                errorCount++;
            }
        }
        await instance.autoSaveSettings();
        let content = `**Ban Results:**\n${results.join('\n')}`;
        if (successCount > 0 || errorCount > 0) {
            content += `\n\n**Summary:** ${successCount} banned, ${errorCount} failed`;
        }
        await interaction.update({
            content,
            components: []
        });
        await manager.updateControlPanel(instance, channel);
    } catch (error) {
        client.logger.error('Error banning users:', error);
        await interaction.update({
            content: '❌ Failed to ban users.',
            components: []
        });
    }
}

async function handleUnban(interaction, instance, channel, manager, client) {
    const bannedUserIds = [];
    for (const [id, overwrite] of channel.permissionOverwrites.cache) {
        if (overwrite.type === 1 && overwrite.deny.has(PermissionFlagsBits.Connect)) {
            bannedUserIds.push(id);
        }
    }
    if (bannedUserIds.length === 0) {
        return interaction.reply({
            content: '❌ No banned members in this channel.',
            ephemeral: true
        });
    }
    if (bannedUserIds.length === 1) {
        const userId = bannedUserIds[0];
        let userName = 'Unknown User';
        try {
            const user = await client.users.fetch(userId);
            userName = user.tag;
        } catch (error) {
            userName = `User ID: ${userId}`;
        }
        const embed = new EmbedBuilder()
            .setTitle('🔓 Unban Member')
            .setDescription(`Do you want to unban **${userName}**?\n\nThis is the only banned user in this channel.`)
            .setColor(0x57F287);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`tempvc_unban_confirm_${instance.channelId}_${userId}`)
                .setLabel(`Unban ${userName}`)
                .setEmoji('✅')
                .setStyle(3), // Success style
            new ButtonBuilder()
                .setCustomId(`tempvc_unban_cancel_${instance.channelId}`)
                .setLabel('Cancel')
                .setEmoji('❌')
                .setStyle(2) // Secondary style
        );
        return interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    }
    const page = 1;
    const pageSize = 10;
    const totalPages = Math.ceil(bannedUserIds.length / pageSize) || 1;
    const embed = await generateBannedMembersEmbed(bannedUserIds, client, page, pageSize);
    const navRow = totalPages > 1 ? generatePaginationButtons(instance, page, totalPages) : null;
    const userSelectMenu = new UserSelectMenuBuilder()
        .setCustomId(`tempvc_unban_user_select_${instance.channelId}`)
        .setPlaceholder('Search and select a user to unban...')
        .setMaxValues(10)
        .setMinValues(1);
    const selectRow = new ActionRowBuilder().addComponents(userSelectMenu);
    const components = navRow ? [navRow, selectRow] : [selectRow];
    await interaction.reply({
        embeds: [embed],
        components,
        ephemeral: true
    });
}

// Helper: Paginate array
function paginate(array, page_size, page_number) {
    // page_number is 1-based
    return array.slice((page_number - 1) * page_size, page_number * page_size);
}

// Helper: Generate banned members embed with pagination
async function generateBannedMembersEmbed(bannedUserIds, client, page, pageSize) {
    const totalPages = Math.ceil(bannedUserIds.length / pageSize) || 1;
    const pageBannedIds = paginate(bannedUserIds, pageSize, page);
    const userTags = await Promise.all(
        pageBannedIds.map(async (id) => {
            try {
                const user = await client.users.fetch(id);
                return user.tag;
            } catch {
                return `User ID: ${id}`;
            }
        })
    );
    const description =
        userTags.length > 0
            ? userTags.map((tag, i) => `${(page - 1) * pageSize + i + 1}. ${tag}`).join('\n')
            : 'No banned members.';
    return new EmbedBuilder()
        .setTitle('🔒 Banned Members')
        .setDescription(description)
        .setFooter({ text: `Page ${page}/${totalPages}` })
        .setColor(0xED4245);
}

// Helper: Generate navigation buttons
function generatePaginationButtons(instance, page, totalPages) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`tempvc_unban_prevpage_${instance.channelId}_${page}`)
            .setLabel('Previous')
            .setStyle(ButtonBuilder.Style.Secondary)
            .setDisabled(page <= 1),
        new ButtonBuilder()
            .setCustomId(`tempvc_unban_nextpage_${instance.channelId}_${page}`)
            .setLabel('Next')
            .setStyle(ButtonBuilder.Style.Secondary)
            .setDisabled(page >= totalPages)
    );
}

// Handler for pagination navigation
async function handleUnbanListPageNavigation(interaction, instance, channel, client) {
    // customId: tempvc_unban_prevpage_<channelId>_<page> or tempvc_unban_nextpage_<channelId>_<page>
    const parts = interaction.customId.split('_');
    const direction = parts[2]; // prevpage or nextpage
    const channelId = parts[3];
    let currentPage = parseInt(parts[4], 10);
    const bannedUserIds = [];
    for (const [id, overwrite] of channel.permissionOverwrites.cache) {
        if (overwrite.type === 1 && overwrite.deny.has(PermissionFlagsBits.Connect)) {
            bannedUserIds.push(id);
        }
    }
    const pageSize = 10;
    const totalPages = Math.ceil(bannedUserIds.length / pageSize) || 1;
    let newPage = direction === 'prevpage' ? currentPage - 1 : currentPage + 1;
    if (newPage < 1) newPage = 1;
    if (newPage > totalPages) newPage = totalPages;
    const embed = await generateBannedMembersEmbed(bannedUserIds, client, newPage, pageSize);
    const navRow = totalPages > 1 ? generatePaginationButtons(instance, newPage, totalPages) : null;
    const userSelectMenu = new UserSelectMenuBuilder()
        .setCustomId(`tempvc_unban_user_select_${instance.channelId}`)
        .setPlaceholder('Search and select a user to unban...')
        .setMaxValues(10)
        .setMinValues(1);
    const selectRow = new ActionRowBuilder().addComponents(userSelectMenu);
    const components = navRow ? [navRow, selectRow] : [selectRow];
    await interaction.update({
        embeds: [embed],
        components,
        ephemeral: true
    });
}

async function handleUnbanSelection(interaction, instance, channel, userId, manager, client) {
    try {
        const overwrite = channel.permissionOverwrites.cache.get(userId);
        if (overwrite) {
            await overwrite.delete();
        }
        instance.permissions.blockedUsers = instance.permissions.blockedUsers.filter(id => id !== userId);
        await instance.save();
        await instance.autoSaveSettings();
        let userName = 'Unknown User';
        try {
            const user = await client.users.fetch(userId);
            userName = user.tag;
        } catch (error) {}
        await interaction.update({
            content: `✅ **${userName}** has been unbanned from the channel.`,
            components: []
        });
        await manager.updateControlPanel(instance, channel);
    } catch (error) {
        client.logger.error('Error unbanning member:', error);
        await interaction.update({
            content: '❌ Failed to unban member.',
            components: []
        });
    }
}

async function handleUnbanUserSelection(interaction, instance, channel, manager, client) {
    try {
        const userIds = interaction.values;
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        for (const userId of userIds) {
            try {
                const overwrite = channel.permissionOverwrites.cache.get(userId);
                if (!overwrite || !overwrite.deny.has(PermissionFlagsBits.Connect)) {
                    results.push(`⚠️ User ID ${userId} is not banned`);
                    continue;
                }
                await overwrite.delete();
                instance.permissions.blockedUsers = instance.permissions.blockedUsers.filter(id => id !== userId);
                let userName = 'Unknown User';
                try {
                    const user = await client.users.fetch(userId);
                    userName = user.tag;
                } catch (error) {
                    userName = `User ID: ${userId}`;
                }
                results.push(`✅ ${userName} unbanned`);
                successCount++;
            } catch (error) {
                client.logger.error(`Error unbanning user ${userId}:`, error);
                results.push(`❌ Failed to unban user ID ${userId}`);
                errorCount++;
            }
        }
        await instance.save();
        await instance.autoSaveSettings();
        let content = `**Unban Results:**\n${results.join('\n')}`;
        if (successCount > 0 || errorCount > 0) {
            content += `\n\n**Summary:** ${successCount} unbanned, ${errorCount} failed`;
        }
        await interaction.update({
            content,
            components: []
        });
        await manager.updateControlPanel(instance, channel);
    } catch (error) {
        client.logger.error('Error unbanning users:', error);
        await interaction.update({
            content: '❌ Failed to unban users.',
            components: []
        });
    }
}

async function handleUnbanConfirmation(interaction, manager, client) {
    const parts = interaction.customId.split('_');
    const channelId = parts[3];
    const userId = parts[4];
    const instance = await TempVCInstance.findByChannelId(channelId);
    if (!instance) {
        return interaction.update({
            content: '❌ Channel not found.',
            components: []
        });
    }
    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
        return interaction.update({
            content: '❌ Voice channel not found.',
            components: []
        });
    }
    try {
        const overwrite = channel.permissionOverwrites.cache.get(userId);
        if (!overwrite || !overwrite.deny.has(PermissionFlagsBits.Connect)) {
            return interaction.update({
                content: '❌ This user is not banned from the channel.',
                components: []
            });
        }
        await overwrite.delete();
        instance.permissions.blockedUsers = instance.permissions.blockedUsers.filter(id => id !== userId);
        await instance.save();
        await instance.autoSaveSettings();
        let userName = 'Unknown User';
        try {
            const user = await client.users.fetch(userId);
            userName = user.tag;
        } catch (error) {
            userName = `User ID: ${userId}`;
        }
        await interaction.update({
            content: `✅ **${userName}** has been unbanned from the channel.`,
            components: []
        });
        await manager.updateControlPanel(instance, channel);
    } catch (error) {
        client.logger.error('Error unbanning user:', error);
        await interaction.update({
            content: '❌ Failed to unban user.',
            components: []
        });
    }
}

async function handleUnbanCancellation(interaction) {
    await interaction.update({
        content: '✅ Unban cancelled.',
        components: []
    });
}

module.exports = {
    handleBan,
    handleBanSelection,
    handleBanUserSelection,
    handleUnban,
    handleUnbanSelection,
    handleUnbanUserSelection,
    handleUnbanConfirmation,
    handleUnbanCancellation,
    handleUnbanListPageNavigation
};
