module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember, client) {
        try {
            // Handle autorole for verification changes
            if (client.autoRoleManager) {
                await client.autoRoleManager.handleMemberUpdate(oldMember, newMember);
            }

            // Log significant member updates (handled by modlog/guildMemberUpdate.js)
            // if (oldMember.pending !== newMember.pending) {
            //     if (newMember.pending) {
            //         client.logger.info(`👤 Member ${newMember.user.tag} is now pending verification in ${newMember.guild.name}`);
            //     } else {
            //         client.logger.info(`✅ Member ${newMember.user.tag} passed verification in ${newMember.guild.name}`);
            //     }
            // }

            // Log role changes (handled by modlog/guildMemberUpdate.js)
            // const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
            // const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

            // if (addedRoles.size > 0) {
            //     client.logger.info(`🎭 Roles added to ${newMember.user.tag} in ${newMember.guild.name}: ${addedRoles.map(r => r.name).join(', ')}`);
            // }

            // if (removedRoles.size > 0) {
            //     client.logger.info(`🎭 Roles removed from ${newMember.user.tag} in ${newMember.guild.name}: ${removedRoles.map(r => r.name).join(', ')}`);
            // }

        } catch (error) {
            client.logger.error(`Error handling guildMemberUpdate for ${newMember.user.tag}:`, error);
        }
    }
};
