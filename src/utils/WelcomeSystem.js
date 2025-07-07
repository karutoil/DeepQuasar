const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const Utils = require('./utils');
const Guild = require('../schemas/Guild');

class WelcomeSystem {
    /**
     * Handle member join event
     * @param {GuildMember} member - The member who joined
     * @param {Client} client - Discord client
     */
    static async handleMemberJoin(member, client) {
        try {
            client.logger?.debug(`Handling member join for ${member.user.tag} in ${member.guild.name}`);
            
            const guildData = await Utils.getGuildData(member.guild.id, member.guild.name);
            
            if (!guildData) {
                client.logger?.warn(`No guild data found for ${member.guild.name} (${member.guild.id})`);
                return;
            }
            
            if (!guildData.welcomeSystem?.welcome?.enabled) {
                client.logger?.debug(`Welcome system disabled for ${member.guild.name}`);
                return;
            }

            const welcomeConfig = guildData.welcomeSystem.welcome;
            
            // Get welcome channel
            const welcomeChannel = member.guild.channels.cache.get(welcomeConfig.channelId);
            if (!welcomeChannel) {
                client.logger?.warn(`Welcome channel not found for ${member.guild.name}. Channel ID: ${welcomeConfig.channelId}`);
                return;
            }

            // Get inviter information
            const inviter = await this.getInviter(member, client);

            // Create welcome message/embed
            const welcomeData = await this.createWelcomeMessage(member, guildData, inviter);

            // Send welcome message
            const sentMessage = await welcomeChannel.send(welcomeData);
            client.logger?.info(`Sent welcome message for ${member.user.tag} in ${member.guild.name} to #${welcomeChannel.name}`);

            // Delete after specified time if configured
            if (welcomeConfig.deleteAfter > 0) {
                setTimeout(async () => {
                    try {
                        await sentMessage.delete();
                        client.logger?.debug(`Deleted welcome message for ${member.user.tag} after ${welcomeConfig.deleteAfter}s`);
                    } catch (error) {
                        // Message might already be deleted
                    }
                }, welcomeConfig.deleteAfter * 1000);
            }

            // Send DM welcome if enabled
            if (guildData.welcomeSystem.dmWelcome.enabled) {
                await this.sendDMWelcome(member, guildData);
            }

        } catch (error) {
            client.logger?.error(`Error handling member join for ${member.user.tag} in ${member.guild.name}:`, error);
        }
    }

    /**
     * Handle member leave event
     * @param {GuildMember} member - The member who left
     * @param {Client} client - Discord client
     */
    static async handleMemberLeave(member, client) {
        try {
            client.logger?.debug(`Handling member leave for ${member.user.tag} in ${member.guild.name}`);
            
            const guildData = await Utils.getGuildData(member.guild.id);
            
            if (!guildData) {
                client.logger?.warn(`No guild data found for ${member.guild.name} (${member.guild.id})`);
                return;
            }
            
            if (!guildData.welcomeSystem?.leave?.enabled) {
                client.logger?.debug(`Leave system disabled for ${member.guild.name}`);
                return;
            }

            const leaveConfig = guildData.welcomeSystem.leave;
            
            // Get leave channel
            const leaveChannel = member.guild.channels.cache.get(leaveConfig.channelId);
            if (!leaveChannel) {
                client.logger?.warn(`Leave channel not found for ${member.guild.name}. Channel ID: ${leaveConfig.channelId}`);
                return;
            }

            // Create leave message/embed
            const leaveData = await this.createLeaveMessage(member, guildData);

            // Send leave message
            const sentMessage = await leaveChannel.send(leaveData);
            client.logger?.info(`Sent leave message for ${member.user.tag} in ${member.guild.name} to #${leaveChannel.name}`);

            // Delete after specified time if configured
            if (leaveConfig.deleteAfter > 0) {
                setTimeout(async () => {
                    try {
                        await sentMessage.delete();
                        client.logger?.debug(`Deleted leave message for ${member.user.tag} after ${leaveConfig.deleteAfter}s`);
                    } catch (error) {
                        // Message might already be deleted
                    }
                }, leaveConfig.deleteAfter * 1000);
            }

        } catch (error) {
            client.logger?.error(`Error handling member leave for ${member.user.tag} in ${member.guild.name}:`, error);
        }
    }

    /**
     * Create welcome message/embed
     * @param {GuildMember} member - The member who joined
     * @param {Object} guildData - Guild configuration data
     * @param {Object} inviter - Inviter information
     */
    static async createWelcomeMessage(member, guildData, inviter) {
        const welcomeConfig = guildData.welcomeSystem.welcome;
        
        // Check if custom embed is enabled
        if (welcomeConfig.customEmbed && welcomeConfig.customEmbed.enabled && welcomeConfig.customEmbed.embedData) {
            return this.createCustomWelcomeEmbed(member, guildData, inviter, welcomeConfig.customEmbed.embedData);
        }
        
        // Replace placeholders in message
        const message = this.replacePlaceholders(welcomeConfig.message, member, member.guild, inviter);

        if (!welcomeConfig.embedEnabled) {
            return {
                content: welcomeConfig.mentionUser ? `${member.user} ${message}` : message
            };
        }

        // Create embed
        const embed = new EmbedBuilder()
            .setColor(welcomeConfig.embedColor || '#57F287')
            .setTitle('🎉 Welcome to the Server!')
            .setDescription(message)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setTimestamp();

        // Add user information fields
        const fields = [];

        // Basic user info
        fields.push({
            name: '👤 User Information',
            value: [
                `**Username:** ${member.user.tag}`,
                `**Display Name:** ${member.displayName}`,
                `**ID:** ${member.user.id}`,
                `**Bot:** ${member.user.bot ? 'Yes' : 'No'}`
            ].join('\n'),
            inline: true
        });

        // Account age
        if (welcomeConfig.showAccountAge) {
            const accountAge = this.getAccountAge(member.user.createdAt);
            fields.push({
                name: '📅 Account Created',
                value: [
                    `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
                    `*${accountAge} ago*`
                ].join('\n'),
                inline: true
            });
        }

        // Join position
        if (welcomeConfig.showJoinPosition) {
            const joinPosition = member.guild.memberCount;
            fields.push({
                name: '📊 Member Count',
                value: [
                    `**Join Position:** #${joinPosition}`,
                    `**Total Members:** ${member.guild.memberCount}`
                ].join('\n'),
                inline: true
            });
        }

        // Inviter information
        if (welcomeConfig.showInviter && inviter) {
            fields.push({
                name: '💌 Invited By',
                value: [
                    `**User:** ${inviter.inviter.tag}`,
                    `**Invite Code:** ${inviter.code}`,
                    `**Uses:** ${inviter.uses || 'Unknown'}`
                ].join('\n'),
                inline: true
            });
        }

        // Server information
        fields.push({
            name: '🏠 Server Information',
            value: [
                `**Server:** ${member.guild.name}`,
                `**Created:** <t:${Math.floor(member.guild.createdTimestamp / 1000)}:R>`,
                `**Owner:** ${member.guild.ownerId ? `<@${member.guild.ownerId}>` : 'Unknown'}`
            ].join('\n'),
            inline: false
        });

        embed.addFields(fields);

        // Set server icon as footer
        if (member.guild.iconURL()) {
            embed.setFooter({
                text: member.guild.name,
                iconURL: member.guild.iconURL({ dynamic: true })
            });
        }

        return {
            content: welcomeConfig.mentionUser ? `${member.user}` : undefined,
            embeds: [embed]
        };
    }

    /**
     * Create custom welcome embed with placeholder replacement
     * @param {GuildMember} member - The member who joined
     * @param {Object} guildData - Guild configuration data
     * @param {Object} inviter - Inviter information
     * @param {Object} embedData - Custom embed data
     */
    static createCustomWelcomeEmbed(member, guildData, inviter, embedData) {
        const welcomeConfig = guildData.welcomeSystem.welcome;
        
        // Create embed with custom data
        const embed = new EmbedBuilder();

        // Replace placeholders in all text fields
        if (embedData.title) {
            embed.setTitle(this.replacePlaceholdersExtended(embedData.title, member, member.guild, inviter));
        }
        
        if (embedData.description) {
            embed.setDescription(this.replacePlaceholdersExtended(embedData.description, member, member.guild, inviter));
        }
        
        if (embedData.color !== null && embedData.color !== undefined) {
            embed.setColor(embedData.color);
        }
        
        if (embedData.timestamp) {
            embed.setTimestamp();
        }
        
        if (embedData.author && embedData.author.name) {
            const authorObj = { 
                name: this.replacePlaceholdersExtended(embedData.author.name, member, member.guild, inviter) 
            };
            if (embedData.author.iconURL) {
                const iconURL = this.replacePlaceholdersExtended(embedData.author.iconURL, member, member.guild, inviter);
                if (iconURL && !this.containsPlaceholders(iconURL)) {
                    authorObj.iconURL = iconURL;
                }
            }
            if (embedData.author.url) {
                const url = this.replacePlaceholdersExtended(embedData.author.url, member, member.guild, inviter);
                if (url && !this.containsPlaceholders(url)) {
                    authorObj.url = url;
                }
            }
            embed.setAuthor(authorObj);
        }
        
        if (embedData.footer && embedData.footer.text) {
            const footerObj = { 
                text: this.replacePlaceholdersExtended(embedData.footer.text, member, member.guild, inviter) 
            };
            if (embedData.footer.iconURL) {
                const iconURL = this.replacePlaceholdersExtended(embedData.footer.iconURL, member, member.guild, inviter);
                if (iconURL && !this.containsPlaceholders(iconURL)) {
                    footerObj.iconURL = iconURL;
                }
            }
            embed.setFooter(footerObj);
        }
        
        if (embedData.thumbnail && embedData.thumbnail.url) {
            const thumbnailUrl = this.replacePlaceholdersExtended(embedData.thumbnail.url, member, member.guild, inviter);
            // Only set thumbnail if it's a valid URL (not containing unprocessed placeholders)
            if (thumbnailUrl && !this.containsPlaceholders(thumbnailUrl)) {
                try {
                    embed.setThumbnail(thumbnailUrl);
                } catch (error) {
                    console.warn('Invalid thumbnail URL:', thumbnailUrl);
                }
            }
        }
        
        if (embedData.image && embedData.image.url) {
            const imageUrl = this.replacePlaceholdersExtended(embedData.image.url, member, member.guild, inviter);
            // Only set image if it's a valid URL (not containing unprocessed placeholders)
            if (imageUrl && !this.containsPlaceholders(imageUrl)) {
                try {
                    embed.setImage(imageUrl);
                } catch (error) {
                    console.warn('Invalid image URL:', imageUrl);
                }
            }
        }
        
        if (embedData.fields && Array.isArray(embedData.fields) && embedData.fields.length > 0) {
            const processedFields = embedData.fields
                .filter(field => field && field.name && field.value)
                .map(field => ({
                    name: this.replacePlaceholdersExtended(field.name, member, member.guild, inviter),
                    value: this.replacePlaceholdersExtended(field.value, member, member.guild, inviter),
                    inline: field.inline || false
                }));
            
            if (processedFields.length > 0) {
                embed.addFields(processedFields);
            }
        }

        // Prepare content - custom content takes priority, then mention user setting
        let messageContent;
        if (embedData.messageContent && embedData.messageContent.trim()) {
            messageContent = this.replacePlaceholdersExtended(embedData.messageContent, member, member.guild, inviter);
        } else if (welcomeConfig.mentionUser) {
            messageContent = `${member.user}`;
        }

        return {
            content: messageContent,
            embeds: [embed]
        };
    }

    /**
     * Create custom leave embed with placeholder replacement
     * @param {GuildMember} member - The member who left
     * @param {Object} guildData - Guild configuration data
     * @param {Object} embedData - Custom embed data
     */
    static createCustomLeaveEmbed(member, guildData, embedData) {
        // Create embed with custom data
        const embed = new EmbedBuilder();

        // Replace placeholders in all text fields
        if (embedData.title) {
            embed.setTitle(this.replacePlaceholdersExtended(embedData.title, member, member.guild));
        }
        
        if (embedData.description) {
            embed.setDescription(this.replacePlaceholdersExtended(embedData.description, member, member.guild));
        }
        
        if (embedData.color !== null && embedData.color !== undefined) {
            embed.setColor(embedData.color);
        }
        
        if (embedData.timestamp) {
            embed.setTimestamp();
        }
        
        if (embedData.author && embedData.author.name) {
            const authorObj = { 
                name: this.replacePlaceholdersExtended(embedData.author.name, member, member.guild) 
            };
            if (embedData.author.iconURL) {
                const iconURL = this.replacePlaceholdersExtended(embedData.author.iconURL, member, member.guild);
                if (iconURL && !this.containsPlaceholders(iconURL)) {
                    authorObj.iconURL = iconURL;
                }
            }
            if (embedData.author.url) {
                const url = this.replacePlaceholdersExtended(embedData.author.url, member, member.guild);
                if (url && !this.containsPlaceholders(url)) {
                    authorObj.url = url;
                }
            }
            embed.setAuthor(authorObj);
        }
        
        if (embedData.footer && embedData.footer.text) {
            const footerObj = { 
                text: this.replacePlaceholdersExtended(embedData.footer.text, member, member.guild) 
            };
            if (embedData.footer.iconURL) {
                const iconURL = this.replacePlaceholdersExtended(embedData.footer.iconURL, member, member.guild);
                if (iconURL && !this.containsPlaceholders(iconURL)) {
                    footerObj.iconURL = iconURL;
                }
            }
            embed.setFooter(footerObj);
        }
        
        if (embedData.thumbnail && embedData.thumbnail.url) {
            const thumbnailUrl = this.replacePlaceholdersExtended(embedData.thumbnail.url, member, member.guild);
            if (thumbnailUrl && !this.containsPlaceholders(thumbnailUrl)) {
                try {
                    embed.setThumbnail(thumbnailUrl);
                } catch (error) {
                    console.warn('Invalid thumbnail URL:', thumbnailUrl);
                }
            }
        }
        
        if (embedData.image && embedData.image.url) {
            const imageUrl = this.replacePlaceholdersExtended(embedData.image.url, member, member.guild);
            if (imageUrl && !this.containsPlaceholders(imageUrl)) {
                try {
                    embed.setImage(imageUrl);
                } catch (error) {
                    console.warn('Invalid image URL:', imageUrl);
                }
            }
        }
        
        if (embedData.fields && Array.isArray(embedData.fields) && embedData.fields.length > 0) {
            const processedFields = embedData.fields
                .filter(field => field && field.name && field.value)
                .map(field => ({
                    name: this.replacePlaceholdersExtended(field.name, member, member.guild),
                    value: this.replacePlaceholdersExtended(field.value, member, member.guild),
                    inline: field.inline || false
                }));
            
            if (processedFields.length > 0) {
                embed.addFields(processedFields);
            }
        }

        // Prepare content if available
        let messageContent;
        if (embedData.messageContent && embedData.messageContent.trim()) {
            messageContent = this.replacePlaceholdersExtended(embedData.messageContent, member, member.guild);
        }

        return { 
            content: messageContent,
            embeds: [embed] 
        };
    }

    /**
     * Create custom DM welcome embed with placeholder replacement
     * @param {GuildMember} member - The member who joined
     * @param {Object} guildData - Guild configuration data
     * @param {Object} embedData - Custom embed data
     */
    static createCustomDMEmbed(member, guildData, embedData) {
        // Create embed with custom data
        const embed = new EmbedBuilder();

        // Replace placeholders in all text fields
        if (embedData.title) {
            embed.setTitle(this.replacePlaceholdersExtended(embedData.title, member, member.guild));
        }
        
        if (embedData.description) {
            embed.setDescription(this.replacePlaceholdersExtended(embedData.description, member, member.guild));
        }
        
        if (embedData.color !== null && embedData.color !== undefined) {
            embed.setColor(embedData.color);
        }
        
        if (embedData.timestamp) {
            embed.setTimestamp();
        }
        
        if (embedData.author && embedData.author.name) {
            const authorObj = { 
                name: this.replacePlaceholdersExtended(embedData.author.name, member, member.guild) 
            };
            if (embedData.author.iconURL) {
                const iconURL = this.replacePlaceholdersExtended(embedData.author.iconURL, member, member.guild);
                if (iconURL && !this.containsPlaceholders(iconURL)) {
                    authorObj.iconURL = iconURL;
                }
            }
            if (embedData.author.url) {
                const url = this.replacePlaceholdersExtended(embedData.author.url, member, member.guild);
                if (url && !this.containsPlaceholders(url)) {
                    authorObj.url = url;
                }
            }
            embed.setAuthor(authorObj);
        }
        
        if (embedData.footer && embedData.footer.text) {
            const footerObj = { 
                text: this.replacePlaceholdersExtended(embedData.footer.text, member, member.guild) 
            };
            if (embedData.footer.iconURL) {
                const iconURL = this.replacePlaceholdersExtended(embedData.footer.iconURL, member, member.guild);
                if (iconURL && !this.containsPlaceholders(iconURL)) {
                    footerObj.iconURL = iconURL;
                }
            }
            embed.setFooter(footerObj);
        }
        
        if (embedData.thumbnail && embedData.thumbnail.url) {
            const thumbnailUrl = this.replacePlaceholdersExtended(embedData.thumbnail.url, member, member.guild);
            if (thumbnailUrl && !this.containsPlaceholders(thumbnailUrl)) {
                try {
                    embed.setThumbnail(thumbnailUrl);
                } catch (error) {
                    console.warn('Invalid thumbnail URL:', thumbnailUrl);
                }
            }
        }
        
        if (embedData.image && embedData.image.url) {
            const imageUrl = this.replacePlaceholdersExtended(embedData.image.url, member, member.guild);
            if (imageUrl && !this.containsPlaceholders(imageUrl)) {
                try {
                    embed.setImage(imageUrl);
                } catch (error) {
                    console.warn('Invalid image URL:', imageUrl);
                }
            }
        }
        
        if (embedData.fields && Array.isArray(embedData.fields) && embedData.fields.length > 0) {
            const processedFields = embedData.fields
                .filter(field => field && field.name && field.value)
                .map(field => ({
                    name: this.replacePlaceholdersExtended(field.name, member, member.guild),
                    value: this.replacePlaceholdersExtended(field.value, member, member.guild),
                    inline: field.inline || false
                }));
            
            if (processedFields.length > 0) {
                embed.addFields(processedFields);
            }
        }

        // Prepare content if available
        let messageContent;
        if (embedData.messageContent && embedData.messageContent.trim()) {
            messageContent = this.replacePlaceholdersExtended(embedData.messageContent, member, member.guild);
        }

        return { 
            content: messageContent,
            embeds: [embed] 
        };
    }

    /**
     * Create leave message/embed
     * @param {GuildMember} member - The member who left
     * @param {Object} guildData - Guild configuration data
     */
    static async createLeaveMessage(member, guildData) {
        const leaveConfig = guildData.welcomeSystem.leave;
        
        // Check if custom embed is enabled
        if (leaveConfig.customEmbed && leaveConfig.customEmbed.enabled && leaveConfig.customEmbed.embedData) {
            return this.createCustomLeaveEmbed(member, guildData, leaveConfig.customEmbed.embedData);
        }
        
        // Replace placeholders in message
        const message = this.replacePlaceholders(leaveConfig.message, member, member.guild);

        if (!leaveConfig.embedEnabled) {
            return { content: message };
        }

        // Create embed
        const embed = new EmbedBuilder()
            .setColor(leaveConfig.embedColor || '#ED4245')
            .setTitle('👋 Member Left')
            .setDescription(message)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setTimestamp();

        // Add user information fields
        const fields = [];

        // Basic user info
        fields.push({
            name: '👤 User Information',
            value: [
                `**Username:** ${member.user.tag}`,
                `**Display Name:** ${member.displayName}`,
                `**ID:** ${member.user.id}`
            ].join('\n'),
            inline: true
        });

        // Account age
        if (leaveConfig.showAccountAge) {
            const accountAge = this.getAccountAge(member.user.createdAt);
            fields.push({
                name: '📅 Account Created',
                value: [
                    `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
                    `*${accountAge} ago*`
                ].join('\n'),
                inline: true
            });
        }

        // Join date and time in server
        if (leaveConfig.showJoinDate && member.joinedAt) {
            fields.push({
                name: '📈 Joined Server',
                value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`,
                inline: true
            });
        }

        if (leaveConfig.showTimeInServer && member.joinedAt) {
            const timeInServer = Date.now() - member.joinedTimestamp;
            const timeFormatted = Utils.formatDuration(timeInServer);
            fields.push({
                name: '⏱️ Time in Server',
                value: timeFormatted,
                inline: true
            });
        }

        // Server stats
        fields.push({
            name: '📊 Server Stats',
            value: [
                `**Members Left:** ${member.guild.memberCount}`,
                `**Server:** ${member.guild.name}`
            ].join('\n'),
            inline: false
        });

        embed.addFields(fields);

        // Set server icon as footer
        if (member.guild.iconURL()) {
            embed.setFooter({
                text: member.guild.name,
                iconURL: member.guild.iconURL({ dynamic: true })
            });
        }

        return { embeds: [embed] };
    }

    /**
     * Send DM welcome message to user
     * @param {GuildMember} member - The member who joined
     * @param {Object} guildData - Guild configuration data
     */
    static async sendDMWelcome(member, guildData) {
        try {
            const dmConfig = guildData.welcomeSystem.dmWelcome;
            
            // Check if custom embed is enabled
            if (dmConfig.customEmbed && dmConfig.customEmbed.enabled && dmConfig.customEmbed.embedData) {
                const dmData = this.createCustomDMEmbed(member, guildData, dmConfig.customEmbed.embedData);
                await member.send(dmData);
                return;
            }
            
            const message = this.replacePlaceholders(dmConfig.message, member, member.guild);

            if (!dmConfig.embedEnabled) {
                await member.send({ content: message });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(dmConfig.embedColor || '#5865F2')
                .setTitle(`Welcome to ${member.guild.name}!`)
                .setDescription(message)
                .setThumbnail(member.guild.iconURL({ dynamic: true }))
                .setTimestamp();

            await member.send({ embeds: [embed] });

        } catch (error) {
            // User might have DMs disabled, ignore error
        }
    }

    /**
     * Get inviter information for a member
     * @param {GuildMember} member - The member who joined
     * @param {Client} client - Discord client
     */
    static async getInviter(member, client) {
        try {
            // Get cached invites before member joined
            const cachedInvites = client.inviteCache?.get(member.guild.id) || new Map();
            
            // Get current invites
            const currentInvites = await member.guild.invites.fetch();
            
            // Compare to find which invite was used
            for (const [code, currentInvite] of currentInvites) {
                const cachedInvite = cachedInvites.get(code);
                
                if (cachedInvite && currentInvite.uses > cachedInvite.uses) {
                    // Update cache
                    if (!client.inviteCache) client.inviteCache = new Map();
                    if (!client.inviteCache.has(member.guild.id)) {
                        client.inviteCache.set(member.guild.id, new Map());
                    }
                    client.inviteCache.get(member.guild.id).set(code, {
                        uses: currentInvite.uses,
                        inviter: currentInvite.inviter
                    });

                    return {
                        code: currentInvite.code,
                        inviter: currentInvite.inviter,
                        uses: currentInvite.uses
                    };
                }
            }

            // Update cache with current invites
            if (!client.inviteCache) client.inviteCache = new Map();
            if (!client.inviteCache.has(member.guild.id)) {
                client.inviteCache.set(member.guild.id, new Map());
            }
            
            for (const [code, invite] of currentInvites) {
                client.inviteCache.get(member.guild.id).set(code, {
                    uses: invite.uses,
                    inviter: invite.inviter
                });
            }

            return null;

        } catch (error) {
            return null;
        }
    }

    /**
     * Replace placeholders in messages
     * @param {string} text - Text with placeholders
     * @param {GuildMember} member - Member object
     * @param {Guild} guild - Guild object
     * @param {Object} inviter - Inviter information
     */
    static replacePlaceholders(text, member, guild, inviter = null) {
        if (!text) return '';

        return text
            .replace(/\{user\.mention\}/g, member.toString())
            .replace(/\{user\.tag\}/g, member.user.tag)
            .replace(/\{user\.username\}/g, member.user.username)
            .replace(/\{user\.displayName\}/g, member.displayName)
            .replace(/\{user\.id\}/g, member.user.id)
            .replace(/\{user\.avatar\}/g, member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .replace(/\{user\.banner\}/g, member.user.bannerURL({ dynamic: true, size: 1024 }) || '')
            .replace(/\{guild\.name\}/g, guild.name)
            .replace(/\{guild\.memberCount\.ordinal\}/g, this.getOrdinalSuffix(guild.memberCount))
            .replace(/\{guild\.memberCount\}/g, this.getOrdinalSuffix(guild.memberCount))
            .replace(/\{guild\.id\}/g, guild.id)
            .replace(/\{guild\.icon\}/g, guild.iconURL({ dynamic: true, size: 1024 }) || '')
            .replace(/\{guild\.banner\}/g, guild.bannerURL({ dynamic: true, size: 1024 }) || '')
            .replace(/\{guild\.description\}/g, guild.description || 'No description')
            .replace(/\{inviter\.tag\}/g, inviter?.inviter?.tag || 'Unknown')
            .replace(/\{inviter\.mention\}/g, inviter?.inviter ? `<@${inviter.inviter.id}>` : 'Unknown')
            .replace(/\{invite\.code\}/g, inviter?.code || 'Unknown')
            .replace(/\{invite\.uses\}/g, inviter?.uses?.toString() || 'Unknown');
    }

    /**
     * Replace placeholders with extended options for custom embeds
     * @param {string} text - Text with placeholders
     * @param {GuildMember} member - Member object
     * @param {Guild} guild - Guild object
     * @param {Object} inviter - Inviter information
     */
    static replacePlaceholdersExtended(text, member, guild, inviter = null) {
        if (!text) return '';

        const now = new Date();
        const accountAge = this.getAccountAge(member.user.createdAt);
        const joinedAt = member.joinedAt ? new Date(member.joinedTimestamp) : null;
        const timeInServer = joinedAt ? Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24)) : 0;

        return text
            // Basic user placeholders
            .replace(/\{user\.mention\}/g, member.toString())
            .replace(/\{user\.tag\}/g, member.user.tag)
            .replace(/\{user\.username\}/g, member.user.username)
            .replace(/\{user\.displayName\}/g, member.displayName)
            .replace(/\{user\.id\}/g, member.user.id)
            .replace(/\{user\.avatar\}/g, member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .replace(/\{user\.banner\}/g, member.user.bannerURL({ dynamic: true, size: 1024 }) || '')
            
            // Guild placeholders
            .replace(/\{guild\.name\}/g, guild.name)
            .replace(/\{guild\.memberCount\.ordinal\}/g, this.getOrdinalSuffix(guild.memberCount))
            .replace(/\{guild\.memberCount\}/g, this.getOrdinalSuffix(guild.memberCount))
            .replace(/\{guild\.id\}/g, guild.id)
            .replace(/\{guild\.icon\}/g, guild.iconURL({ dynamic: true, size: 1024 }) || '')
            .replace(/\{guild\.banner\}/g, guild.bannerURL({ dynamic: true, size: 1024 }) || '')
            .replace(/\{guild\.description\}/g, guild.description || 'No description')
            .replace(/\{guild\.boostLevel\}/g, guild.premiumTier.toString())
            .replace(/\{guild\.boostCount\}/g, guild.premiumSubscriptionCount?.toString() || '0')
            
            // Time placeholders
            .replace(/\{time\}/g, now.toLocaleTimeString())
            .replace(/\{date\}/g, now.toLocaleDateString())
            .replace(/\{timestamp\}/g, `<t:${Math.floor(now.getTime() / 1000)}:F>`)
            .replace(/\{timestamp\.short\}/g, `<t:${Math.floor(now.getTime() / 1000)}:f>`)
            
            // Inviter placeholders (welcome only)
            .replace(/\{inviter\.tag\}/g, inviter?.inviter?.tag || 'Unknown')
            .replace(/\{inviter\.mention\}/g, inviter?.inviter ? `<@${inviter.inviter.id}>` : 'Unknown')
            .replace(/\{invite\.code\}/g, inviter?.code || 'Unknown')
            .replace(/\{invite\.uses\}/g, inviter?.uses?.toString() || 'Unknown')
            
            // Extended placeholders
            .replace(/\{account\.age\}/g, accountAge)
            .replace(/\{account\.created\}/g, `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`)
            .replace(/\{join\.position\}/g, `#${this.getOrdinalSuffix(guild.memberCount)}`)
            .replace(/\{join\.date\}/g, joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Unknown')
            .replace(/\{time\.in\.server\}/g, timeInServer > 0 ? `${timeInServer} day${timeInServer !== 1 ? 's' : ''}` : 'Less than a day');
    }

    /**
     * Get account age in a human readable format
     * @param {Date} createdAt - Account creation date
     */
    static getAccountAge(createdAt) {
        const now = new Date();
        const diffInMilliseconds = now - createdAt;
        
        const years = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24 * 365));
        const months = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24 * 30));
        const days = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
        const minutes = Math.floor(diffInMilliseconds / (1000 * 60));

        if (years > 0) {
            return `${years} year${years !== 1 ? 's' : ''}`;
        } else if (months > 0) {
            return `${months} month${months !== 1 ? 's' : ''}`;
        } else if (days > 0) {
            return `${days} day${days !== 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Initialize invite cache for a guild
     * @param {Guild} guild - Discord guild
     * @param {Client} client - Discord client
     */
    static async initializeInviteCache(guild, client) {
        try {
            const invites = await guild.invites.fetch();
            
            if (!client.inviteCache) client.inviteCache = new Map();
            if (!client.inviteCache.has(guild.id)) {
                client.inviteCache.set(guild.id, new Map());
            }

            for (const [code, invite] of invites) {
                client.inviteCache.get(guild.id).set(code, {
                    uses: invite.uses,
                    inviter: invite.inviter
                });
            }

        } catch (error) {
            // Guild might not have MANAGE_GUILD permission
        }
    }

    /**
     * Check if string contains placeholder patterns
     */
    static containsPlaceholders(string) {
        // Check if string contains any placeholder patterns like {user.avatar}, {guild.icon}, etc.
        return /\{[a-zA-Z_][a-zA-Z0-9_.]*\}/.test(string);
    }

    /**
     * Convert number to ordinal format (1st, 2nd, 3rd, etc.)
     * @param {number} num - The number to convert
     */
    static getOrdinalSuffix(num) {
        const number = parseInt(num);
        if (isNaN(number)) return num.toString();
        
        const lastDigit = number % 10;
        const lastTwoDigits = number % 100;
        
        // Special cases for 11th, 12th, 13th
        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
            return number + 'th';
        }
        
        // Regular cases
        switch (lastDigit) {
            case 1:
                return number + 'st';
            case 2:
                return number + 'nd';
            case 3:
                return number + 'rd';
            default:
                return number + 'th';
        }
    }
}

module.exports = WelcomeSystem;
