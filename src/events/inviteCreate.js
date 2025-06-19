const { Events } = require('discord.js');

module.exports = {
    name: Events.InviteCreate,
    async execute(invite) {
        try {
            const client = invite.client;
            
            // Initialize cache if it doesn't exist
            if (!client.inviteCache) client.inviteCache = new Map();
            if (!client.inviteCache.has(invite.guild.id)) {
                client.inviteCache.set(invite.guild.id, new Map());
            }

            // Add new invite to cache
            client.inviteCache.get(invite.guild.id).set(invite.code, {
                uses: invite.uses || 0,
                inviter: invite.inviter
            });

            client.logger?.debug(`Invite created: ${invite.code} in ${invite.guild.name}`);

        } catch (error) {
            client.logger?.error('Error handling invite create:', error);
        }
    }
};
