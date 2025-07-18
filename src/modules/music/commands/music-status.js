const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('music-status')
        .setDescription('Check the status of the music system and Lavalink connection'),

    async execute(interaction, client) {
        await interaction.deferReply();

        // Get connection health information
        const health = client.musicPlayerManager.getConnectionHealth();
        const isOperational = client.musicPlayerManager.isOperational();

        // Create status embed
        const embed = new EmbedBuilder()
            .setTitle('🎵 Music System Status')
            .setTimestamp();

        // Set color based on health
        if (isOperational) {
            embed.setColor('#00ff00'); // Green for healthy
        } else if (health.connecting > 0) {
            embed.setColor('#ffff00'); // Yellow for connecting
        } else {
            embed.setColor('#ff0000'); // Red for unhealthy
        }

        // Overall status
        let statusText = '❌ Offline';
        if (isOperational) {
            statusText = '✅ Online';
        } else if (health.connecting > 0) {
            statusText = '🔄 Reconnecting';
        }

        embed.addFields(
            { name: '📊 Overall Status', value: statusText, inline: true },
            { name: '🔗 Total Nodes', value: health.total.toString(), inline: true },
            { name: '✅ Connected', value: health.connected.toString(), inline: true },
            { name: '🔄 Connecting', value: health.connecting.toString(), inline: true },
            { name: '❌ Disconnected', value: health.disconnected.toString(), inline: true },
            { name: '💀 Destroyed', value: health.destroyed.toString(), inline: true }
        );

        // Add connected nodes info
        if (health.nodes.connected.length > 0) {
            const connectedList = health.nodes.connected
                .map(node => `• ${node.identifier} (${node.address})`)
                .join('\n');
            embed.addFields({ 
                name: '🟢 Connected Nodes', 
                value: connectedList.length > 1024 ? connectedList.substring(0, 1021) + '...' : connectedList, 
                inline: false 
            });
        }

        // Add disconnected nodes info
        if (health.nodes.disconnected.length > 0) {
            const disconnectedList = health.nodes.disconnected
                .map(node => `• ${node.identifier} (${node.address}) - Attempts: ${node.attempts || 0}`)
                .join('\n');
            embed.addFields({ 
                name: '🔴 Disconnected Nodes', 
                value: disconnectedList.length > 1024 ? disconnectedList.substring(0, 1021) + '...' : disconnectedList, 
                inline: false 
            });
        }

        // Add player information
        const playerCount = client.musicPlayerManager.getPlayerCount();
        embed.addFields({
            name: '🎮 Active Players',
            value: playerCount.toString(),
            inline: true
        });

        // Add recommendations based on status
        if (!isOperational) {
            let recommendation = '';
            if (health.connecting > 0) {
                recommendation = '⏳ System is attempting to reconnect. Please wait a moment before using music commands.';
            } else if (health.disconnected > 0) {
                recommendation = '🔧 Music server is disconnected. The bot will automatically attempt to reconnect.';
            } else if (health.total === 0) {
                recommendation = '⚙️ No music nodes are configured. Please contact an administrator.';
            }
            
            if (recommendation) {
                embed.addFields({
                    name: '💡 Recommendation',
                    value: recommendation,
                    inline: false
                });
            }
        } else {
            embed.addFields({
                name: '💡 Status',
                value: '🎉 Music system is fully operational! You can use all music commands.',
                inline: false
            });
        }

        return interaction.editReply({ embeds: [embed] });
    }
};