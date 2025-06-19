module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        client.logger.info(`👋 Member left: ${member.user.tag} (${member.id}) from guild: ${member.guild.name} (${member.guild.id})`);

        try {
            // Cancel any pending autorole assignments
            if (client.autoRoleManager) {
                client.autoRoleManager.cancelPendingAssignment(member.guild.id, member.id);
            }

            // Handle leave system (existing functionality)
            const WelcomeSystem = require('../utils/WelcomeSystem');
            await WelcomeSystem.handleMemberLeave(member, client);

        } catch (error) {
            client.logger.error(`Error handling guildMemberRemove for ${member.user.tag}:`, error);
        }
    }
};
