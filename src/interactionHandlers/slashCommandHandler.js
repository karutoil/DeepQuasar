const Utils = require('../utils/utils');

async function handleSlashCommand(interaction, client) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
        const embed = Utils.createErrorEmbed(
            'Command Not Found',
            'This command is not available or has been disabled.'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
        // Check if command is in a guild
        if (!interaction.inGuild()) {
            const embed = Utils.createErrorEmbed(
                'Server Only',
                'This command can only be used in a server.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Get guild and user data
        const guildData = await Utils.getGuildData(interaction.guildId, interaction.guild.name);
        const userData = await Utils.getUserData(
            interaction.user.id, 
            interaction.user.username, 
            interaction.user.discriminator
        );

        // Check permissions
        const permissionCheck = await Utils.checkPermissions(interaction, command.permissions || []);
        if (!permissionCheck.hasPermission) {
            const embed = Utils.createErrorEmbed(
                'Insufficient Permissions',
                permissionCheck.reason
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check cooldown
        const cooldownTime = guildData.isPremium() ? 
            client.config.bot.premiumCommandCooldown : 
            client.config.bot.commandCooldown;
            
        const cooldownCheck = Utils.checkCooldown(
            client, 
            interaction.user.id, 
            interaction.commandName, 
            cooldownTime
        );
        
        if (cooldownCheck.onCooldown) {
            const embed = Utils.createWarningEmbed(
                'Command Cooldown',
                `Please wait ${cooldownCheck.timeLeft} seconds before using this command again.`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if command is disabled in this guild
        if (guildData.commandSettings.disabledCommands.includes(interaction.commandName)) {
            const embed = Utils.createErrorEmbed(
                'Command Disabled',
                'This command has been disabled in this server.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if command is restricted to specific channels
        if (guildData.commandSettings.commandChannels.length > 0) {
            if (!guildData.commandSettings.commandChannels.includes(interaction.channelId)) {
                const channels = guildData.commandSettings.commandChannels
                    .map(id => `<#${id}>`)
                    .join(', ');
                    
                const embed = Utils.createWarningEmbed(
                    'Wrong Channel',
                    `This command can only be used in: ${channels}`
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        // Attach data to interaction for command use
        interaction.guildData = guildData;
        interaction.userData = userData;

        // Execute the command
        await command.execute(interaction, client);

        // Log command usage
        client.logger.command(
            interaction.user,
            interaction.guild,
            interaction.commandName,
            interaction.options.data
        );

        // Update statistics
        guildData.incrementStats('commands');
        userData.stats.commandsUsed += 1;
        userData.stats.lastActive = new Date();

        // Save updated data
        await Promise.all([
            guildData.save(),
            userData.save()
        ]);

    } catch (error) {
        client.logger.error(`Error executing command ${interaction.commandName}:`, error);

        const errorEmbed = Utils.createErrorEmbed(
            'Command Error',
            'An error occurred while executing this command. The developers have been notified.'
        );

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

module.exports = { handleSlashCommand };