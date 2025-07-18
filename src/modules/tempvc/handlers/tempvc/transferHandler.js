const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const Utils = require('../../../../../utils/utils');

async function handleTransfer(interaction, instance, channel, manager, client) {
    const members = channel.members.filter(m => !m.user.bot && m.id !== instance.ownerId);
    if (members.size === 0) {
        return interaction.reply({
            embeds: [Utils.createWarningEmbed('No Members', 'There are no other members in the channel to transfer ownership to.')],
            ephemeral: true
        });
    }
    const options = members.map(member => ({
        label: member.displayName,
        description: member.user.tag,
        value: member.id
    }));
    if (options.length > 25) {
        return interaction.reply({
            embeds: [Utils.createWarningEmbed('Too Many Members', 'There are too many members to display. Please ask someone to leave and try again.')],
            ephemeral: true
        });
    }
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`tempvc_transfer_select_${instance.channelId}`)
        .setPlaceholder('Select new owner...')
        .addOptions(options);
    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.reply({
        content: '👑 **Transfer Ownership**\nSelect who you want to transfer ownership to:',
        components: [row],
        ephemeral: true
    });
}

async function handleTransferSelection(interaction, instance, channel, userId, manager, client) {
    const newOwner = await interaction.guild.members.fetch(userId);
    if (!newOwner) {
        return interaction.update({
            content: '❌ User not found.',
            components: []
        });
    }
    await instance.transferOwnership(userId);
    await channel.permissionOverwrites.edit(userId, {
        ViewChannel: true,
        Connect: true,
        Speak: true,
        ManageChannels: true,
        ManageRoles: true,
        MoveMembers: true,
        MuteMembers: true,
        DeafenMembers: true
    });
    await interaction.update({
        content: `✅ Ownership transferred to **${newOwner.displayName}**`,
        components: []
    });
    try {
        const embed = Utils.createSuccessEmbed(
            'Channel Ownership Transferred',
            `You are now the owner of **${channel.name}**!\nYou can manage the channel using the control panel.`
        );
        await newOwner.send({ embeds: [embed] });
    } catch (error) {}
    await manager.updateControlPanel(instance, channel);
}

module.exports = {
    handleTransfer,
    handleTransferSelection
};
