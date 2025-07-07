module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        client.logger.info(`👤 Member joined: ${member.user.tag} (${member.id}) in guild: ${member.guild.name} (${member.guild.id})`);

        try {
            // Handle autorole
            if (client.autoRoleManager) {
                await client.autoRoleManager.handleMemberJoin(member);
            }

            // Handle welcome system
            const WelcomeSystem = require('../utils/WelcomeSystem');
            await WelcomeSystem.handleMemberJoin(member, client);

            // Handle modlog
            const ModLogManager = require('../utils/ModLogManager');
            const embed = {
                title: 'Member Joined',
                description: `${member.user.tag} joined the server`,
                fields: [
                    {
                        name: '👤 User',
                        value: ModLogManager.formatUser(member.user),
                        inline: true
                    },
                    {
                        name: '📅 Account Created',
                        value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
                        inline: true
                    },
                    {
                        name: '🆔 User ID',
                        value: member.user.id,
                        inline: true
                    }
                ],
                thumbnail: member.user.displayAvatarURL({ dynamic: true })
            };

            await ModLogManager.logEvent(member.guild, 'memberJoin', embed);

        } catch (error) {
            client.logger.error(`Error handling guildMemberAdd for ${member.user.tag}:`, error);
        }
    }
};
