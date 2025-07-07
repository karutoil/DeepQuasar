const { ActivityType } = require('discord.js');
const Utils = require('../utils/utils');
const WelcomeSystem = require('../utils/WelcomeSystem');

module.exports = {
    name: 'guildCreate',
    async execute(guild, client) {
        client.logger.info(`➕ Joined new guild: ${guild.name} (${guild.id}) - ${guild.memberCount} members`);

        try {
            // Create guild data in database
            const guildData = await Utils.getGuildData(guild.id, guild.name);
            
            if (!guildData) {
                await Guild.createDefault(guild.id, guild.name);
                client.logger.info(`Created database entry for guild: ${guild.name}`);
            }

            // Initialize invite cache for invite tracking
            await WelcomeSystem.initializeInviteCache(guild, client);

            // Send welcome message to the first available text channel
            await sendWelcomeMessage(guild, client);

            // Update bot activity
            client.user.setActivity(`${client.guilds.cache.size} servers`, { type: ActivityType.Watching });

        } catch (error) {
            client.logger.error(`Error handling guildCreate for ${guild.name}:`, error);
        }
    }
};

async function sendWelcomeMessage(guild, client) {
    try {
        // Find the best channel to send welcome message
        let channel = null;

        // Try to find a channel named 'general', 'welcome', or 'bot-commands'
        const preferredNames = ['general', 'welcome', 'bot-commands', 'commands'];
        for (const name of preferredNames) {
            channel = guild.channels.cache.find(ch => 
                ch.type === 0 && // Text channel
                ch.name.toLowerCase().includes(name) &&
                ch.permissionsFor(guild.members.me).has(['SendMessages', 'EmbedLinks'])
            );
            if (channel) break;
        }

        // If no preferred channel found, use the first available text channel
        if (!channel) {
            channel = guild.channels.cache.find(ch => 
                ch.type === 0 && // Text channel
                ch.permissionsFor(guild.members.me).has(['SendMessages', 'EmbedLinks'])
            );
        }

        // If still no channel found, try system channel
        if (!channel && guild.systemChannel) {
            const systemPerms = guild.systemChannel.permissionsFor(guild.members.me);
            if (systemPerms.has(['SendMessages', 'EmbedLinks'])) {
                channel = guild.systemChannel;
            }
        }

        if (!channel) {
            client.logger.warn(`Could not find a suitable channel to send welcome message in ${guild.name}`);
            return;
        }

        const embed = Utils.createEmbed({
            title: '🎵 Thanks for adding me!',
            description: `Hello **${guild.name}**! I'm a feature-rich music bot that can play music from YouTube, SoundCloud, and Spotify.`,
            color: client.config.colors.primary,
            fields: [
                {
                    name: '🚀 Getting Started',
                    value: '• Use `/play <song>` to start playing music\n• Use `/help` to see all available commands\n• Use `/settings` to configure the bot for your server',
                    inline: false
                },
                {
                    name: '✨ Key Features',
                    value: '• High-quality music from multiple sources\n• Advanced queue management\n• DJ role permissions\n• Customizable settings per server\n• Premium features available',
                    inline: false
                },
                {
                    name: '🔧 Setup',
                    value: `• Set up a DJ role with \`/settings dj-role\`\n• Configure music channels with \`/settings channels\`\n• Explore premium features with \`/premium\``,
                    inline: false
                },
                {
                    name: '🆘 Need Help?',
                    value: 'Use `/help` for commands or `/support` for additional assistance.',
                    inline: false
                }
            ],
            footer: {
                text: `Now serving ${client.guilds.cache.size} servers • Made with ❤️`,
                iconURL: client.user.displayAvatarURL()
            },
            thumbnail: client.user.displayAvatarURL({ size: 256 })
        });

        await channel.send({ embeds: [embed] });
        client.logger.info(`Sent welcome message to ${guild.name} in #${channel.name}`);

    } catch (error) {
        client.logger.error(`Failed to send welcome message to ${guild.name}:`, error);
    }
}
