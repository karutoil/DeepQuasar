const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const Utils = require('../../../../utils/utils');

async function handleKick(interaction, instance, channel, manager, client) {
    const membersInVC = channel.members.filter(m => !m.user.bot && m.id !== instance.ownerId);
    if (membersInVC.size === 0) {
        return interaction.reply({
            content: '❌ No members to kick from this channel.',
            ephemeral: true
        });
    }
    const options = membersInVC.map(member => ({
        label: member.displayName,
        description: `${member.user.tag}`,
        value: member.id
    }));
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`tempvc_kick_select_${instance.channelId}`)
        .setPlaceholder('Select member to kick...')
        .addOptions(options.slice(0, 25));
    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.reply({
        content: 'Select a member to kick from the channel:',
        components: [row],
        ephemeral: true
    });
}

async function handleKickSelection(interaction, instance, channel, userId, manager, client) {
    try {
        const member = await interaction.guild.members.fetch(userId);
        if (!member) {
            return interaction.update({
                content: '❌ Member not found.',
                components: []
            });
        }
        if (!member.voice.channel || member.voice.channel.id !== channel.id) {
            return interaction.update({
                content: '❌ Member is not in this voice channel.',
                components: []
            });
        }
        await member.voice.disconnect('Kicked from temp VC');
        await interaction.update({
            content: `✅ **${member.displayName}** has been kicked from the channel.`,
            components: []
        });
        try {
            const embed = Utils.createWarningEmbed(
                'Kicked from Voice Channel',
                `You were kicked from **${channel.name}** by the channel owner.`
            );
            await member.send({ embeds: [embed] });
        } catch (error) {}
        await manager.updateControlPanel(instance, channel);
    } catch (error) {
        client.logger.error('Error kicking member:', error);
        await interaction.update({
            content: '❌ Failed to kick member.',
            components: []
        });
    }
}

module.exports = {
    handleKick,
    handleKickSelection
};
