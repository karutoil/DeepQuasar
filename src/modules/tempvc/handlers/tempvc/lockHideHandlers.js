const { PermissionFlagsBits } = require('discord.js');
const Utils = require('../../../../utils/utils');

async function handleLock(interaction, instance, channel, manager, client) {
    try {
        const isLocked = instance.settings.locked;
        if (isLocked) {
            await channel.permissionOverwrites.edit(channel.guild.id, { Connect: null });
            instance.settings.locked = false;
            await instance.save();
            await instance.autoSaveSettings();
            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Channel Unlocked', 'Anyone can now join this channel.')],
                ephemeral: true
            });
        } else {
            await channel.permissionOverwrites.edit(channel.guild.id, { Connect: false });
            for (const member of channel.members.values()) {
                if (!member.user.bot) {
                    await channel.permissionOverwrites.edit(member.id, { Connect: true });
                }
            }
            instance.settings.locked = true;
            await instance.save();
            await instance.autoSaveSettings();
            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Channel Locked', 'Only current members and those you allow can join.')],
                ephemeral: true
            });
        }
        await manager.updateControlPanel(instance, channel);
    } catch (error) {
        client.logger.error('Error locking/unlocking channel:', error);
        await interaction.reply({
            embeds: [Utils.createErrorEmbed('Error', 'Failed to change channel lock status.')],
            ephemeral: true
        });
    }
}

async function handleHide(interaction, instance, channel, manager, client) {
    try {
        const isHidden = instance.settings.hidden;
        if (isHidden) {
            await channel.permissionOverwrites.edit(channel.guild.id, { ViewChannel: null });
            instance.settings.hidden = false;
            await instance.save();
            await instance.autoSaveSettings();
            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Channel Unhidden', 'Channel is now visible to everyone.')],
                ephemeral: true
            });
        } else {
            await channel.permissionOverwrites.edit(channel.guild.id, { ViewChannel: false });
            for (const member of channel.members.values()) {
                if (!member.user.bot) {
                    await channel.permissionOverwrites.edit(member.id, { ViewChannel: true });
                }
            }
            instance.settings.hidden = true;
            await instance.save();
            await instance.autoSaveSettings();
            await interaction.reply({
                embeds: [Utils.createSuccessEmbed('Channel Hidden', 'Channel is now hidden from others.')],
                ephemeral: true
            });
        }
        await manager.updateControlPanel(instance, channel);
    } catch (error) {
        client.logger.error('Error hiding/unhiding channel:', error);
        await interaction.reply({
            embeds: [Utils.createErrorEmbed('Error', 'Failed to change channel visibility.')],
            ephemeral: true
        });
    }
}

module.exports = {
    handleLock,
    handleHide
};
