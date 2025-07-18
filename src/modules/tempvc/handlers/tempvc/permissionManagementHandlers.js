const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, UserSelectMenuBuilder } = require('discord.js');
const Utils = require('../../../../utils/utils');

async function buildUserList(guild, userIds) {
    if (!userIds || userIds.length === 0) return 'None';
    const usernames = [];
    for (const userId of userIds.slice(0, 10)) {
        try {
            const member = await guild.members.fetch(userId);
            usernames.push(`• ${member.displayName}`);
        } catch (error) {
            usernames.push(`• <@${userId}> (left server)`);
        }
    }
    if (userIds.length > 10) {
        usernames.push(`• ... and ${userIds.length - 10} more`);
    }
    return usernames.join('\n') || 'None';
}

async function handleAllowUser(interaction, instance, channel, manager, client) {
    if (!instance.isModerator(interaction.user.id)) {
        return interaction.reply({
            content: '❌ Only the channel owner or moderators can allow users.',
            ephemeral: true
        });
    }
    const userSelectMenu = new UserSelectMenuBuilder()
        .setCustomId(`tempvc_allow_user_select_${instance.channelId}`)
        .setPlaceholder('Select user to allow...')
        .setMinValues(1)
        .setMaxValues(1);
    const row = new ActionRowBuilder().addComponents(userSelectMenu);
    await interaction.reply({
        content: '👤 **Allow User**\nSelect a user to allow access to this channel:',
        components: [row],
        ephemeral: true
    });
}

async function handleAllowUserSelection(interaction, instance, channel, manager, client) {
    if (!instance.isModerator(interaction.user.id)) {
        return interaction.reply({
            content: '❌ Only the channel owner or moderators can allow users.',
            ephemeral: true
        });
    }
    const selectedUser = interaction.users.first();
    if (!selectedUser) {
        return interaction.reply({
            content: '❌ No user selected.',
            ephemeral: true
        });
    }
    if (selectedUser.bot) {
        return interaction.reply({
            content: '❌ Cannot manage bot permissions.',
            ephemeral: true
        });
    }
    try {
        await channel.permissionOverwrites.edit(selectedUser.id, {
            ViewChannel: true,
            Connect: true
        });
        await instance.allowUser(selectedUser.id);
        await instance.autoSaveSettings();
        await interaction.reply({
            content: `✅ **${selectedUser.displayName}** can now join this channel.`,
            ephemeral: true
        });
        await manager.updateControlPanel(instance, channel);
    } catch (error) {
        client.logger.error('Error allowing user:', error);
        await interaction.reply({
            content: '❌ Failed to allow user.',
            ephemeral: true
        });
    }
}

async function handleDenyUser(interaction, instance, channel, manager, client) {
    if (!instance.isModerator(interaction.user.id)) {
        return interaction.reply({
            content: '❌ Only the channel owner or moderators can deny users.',
            ephemeral: true
        });
    }
    const userSelectMenu = new UserSelectMenuBuilder()
        .setCustomId(`tempvc_deny_user_select_${instance.channelId}`)
        .setPlaceholder('Select user to deny...')
        .setMinValues(1)
        .setMaxValues(1);
    const row = new ActionRowBuilder().addComponents(userSelectMenu);
    await interaction.reply({
        content: '🚫 **Deny User**\nSelect a user to deny access to this channel:',
        components: [row],
        ephemeral: true
    });
}

async function handleDenyUserSelection(interaction, instance, channel, manager, client) {
    if (!instance.isModerator(interaction.user.id)) {
        return interaction.reply({
            content: '❌ Only the channel owner or moderators can deny users.',
            ephemeral: true
        });
    }
    const selectedUser = interaction.users.first();
    if (!selectedUser) {
        return interaction.reply({
            content: '❌ No user selected.',
            ephemeral: true
        });
    }
    if (selectedUser.bot) {
        return interaction.reply({
            content: '❌ Cannot manage bot permissions.',
            ephemeral: true
        });
    }
    if (selectedUser.id === instance.ownerId) {
        return interaction.reply({
            content: '❌ Cannot deny the channel owner.',
            ephemeral: true
        });
    }
    try {
        await channel.permissionOverwrites.edit(selectedUser.id, {
            ViewChannel: false,
            Connect: false
        });
        await instance.blockUser(selectedUser.id);
        await instance.autoSaveSettings();
        const guild = interaction.guild;
        const member = guild.members.cache.get(selectedUser.id);
        if (member && channel.members.has(selectedUser.id)) {
            try {
                await member.voice.disconnect('Denied access to temp VC');
            } catch (error) {}
        }
        await interaction.reply({
            content: `❌ **${selectedUser.displayName}** can no longer join this channel.`,
            ephemeral: true
        });
        await manager.updateControlPanel(instance, channel);
    } catch (error) {
        client.logger.error('Error denying user:', error);
        await interaction.reply({
            content: '❌ Failed to deny user.',
            ephemeral: true
        });
    }
}

async function handleManagePermissions(interaction, instance, channel, manager, client) {
    if (!instance.isModerator(interaction.user.id)) {
        return interaction.reply({
            content: '❌ Only the channel owner or moderators can manage permissions.',
            ephemeral: true
        });
    }
    const embed = new EmbedBuilder()
        .setTitle('⚙️ Manage Permissions')
        .setDescription(`Manage user permissions for **${channel.name}**`)
        .setColor(0x5865F2);
    if (instance.permissions.allowedUsers.length > 0) {
        const allowedList = await buildUserList(interaction.guild, instance.permissions.allowedUsers);
        embed.addFields({
            name: '✅ Allowed Users',
            value: allowedList || 'None',
            inline: true
        });
    }
    if (instance.permissions.blockedUsers.length > 0) {
        const blockedList = await buildUserList(interaction.guild, instance.permissions.blockedUsers);
        embed.addFields({
            name: '❌ Denied Users',
            value: blockedList || 'None',
            inline: true
        });
    }
    if (instance.permissions.moderators.length > 0) {
        const modList = await buildUserList(interaction.guild, instance.permissions.moderators);
        embed.addFields({
            name: '👑 Moderators',
            value: modList || 'None',
            inline: true
        });
    }
    if (instance.permissions.allowedUsers.length === 0 && 
        instance.permissions.blockedUsers.length === 0 && 
        instance.permissions.moderators.length === 0) {
        embed.addFields({
            name: 'ℹ️ No Special Permissions',
            value: 'No users have been specifically allowed, denied, or made moderators.',
            inline: false
        });
    }
    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`tempvc_allow_user_${instance.channelId}`)
            .setLabel('Allow User')
            .setEmoji('✅')
            .setStyle(ButtonBuilder.Style.Success),
        new ButtonBuilder()
            .setCustomId(`tempvc_deny_user_${instance.channelId}`)
            .setLabel('Deny User')
            .setEmoji('❌')
            .setStyle(ButtonBuilder.Style.Danger)
    );
    await interaction.reply({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true
    });
}

module.exports = {
    handleAllowUser,
    handleAllowUserSelection,
    handleDenyUser,
    handleDenyUserSelection,
    handleManagePermissions,
    buildUserList
};
