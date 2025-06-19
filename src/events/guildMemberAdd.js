module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        client.logger.info(`👤 Member joined: ${member.user.tag} (${member.id}) in guild: ${member.guild.name} (${member.guild.id})`);

        try {
            // Handle autorole
            if (client.autoRoleManager) {
                await client.autoRoleManager.handleMemberJoin(member);
            }

            // Handle welcome system (existing functionality)
            const WelcomeSystem = require('../utils/WelcomeSystem');
            await WelcomeSystem.handleMemberJoin(member, client);

        } catch (error) {
            client.logger.error(`Error handling guildMemberAdd for ${member.user.tag}:`, error);
        }
    }
};
