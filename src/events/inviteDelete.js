const { Events } = require('discord.js');

module.exports = {
    name: Events.InviteDelete,
    async execute(invite) {
        try {
            const client = invite.client;
            
            // Remove invite from cache
            if (client.inviteCache && client.inviteCache.has(invite.guild.id)) {
                client.inviteCache.get(invite.guild.id).delete(invite.code);
            }

            client.logger?.debug(`Invite deleted: ${invite.code} in ${invite.guild.name}`);

        } catch (error) {
            client.logger?.error('Error handling invite delete:', error);
        }
    }
};
