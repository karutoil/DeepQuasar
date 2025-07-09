const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const LFGSettings = require('../schemas/LFGSettings');
const LFGPost = require('../schemas/LFGPost');
const LFGCooldown = require('../schemas/LFGCooldown');
const Utils = require('./utils');

class LFGUtils {
    /**
     * Get or create LFG settings for a guild
     */
    static async getGuildSettings(guildId) {
        let settings = await LFGSettings.findOne({ guildId });
        
        if (!settings) {
            settings = await LFGSettings.create({
                guildId,
                triggerMode: 'slash',
                gamePresets: this.getDefaultGamePresets(), // Include default game presets
                cooldown: {
                    enabled: true,
                    duration: 300000 // 5 minutes
                },
                embed: {
                    color: '#5865F2'
                },
                features: {
                    voiceChannelEmbeds: true,
                    dmEmbeds: true,
                    editPosts: true,
                    deletePosts: true
                },
                messageTriggers: {
                    keywords: ['lfg', 'looking for group', 'looking for']
                }
            });
        } else if (!settings.gamePresets || settings.gamePresets.length === 0) {
            // If settings exist but no game presets, add them
            settings.gamePresets = this.getDefaultGamePresets();
            await settings.save();
        }
        
        return settings;
    }

    /**
     * Check if user is on cooldown
     */
    static async checkCooldown(userId, guildId) {
        const settings = await this.getGuildSettings(guildId);
        
        if (!settings.cooldown.enabled) {
            return { onCooldown: false };
        }
        
        const cooldownRecord = await LFGCooldown.findOne({ userId, guildId });
        
        if (!cooldownRecord) {
            return { onCooldown: false };
        }
        
        const timeSinceLastPost = Date.now() - cooldownRecord.lastPostAt.getTime();
        const cooldownRemaining = settings.cooldown.duration - timeSinceLastPost;
        
        if (cooldownRemaining > 0) {
            return {
                onCooldown: true,
                remainingTime: cooldownRemaining,
                remainingTimeFormatted: this.formatTime(cooldownRemaining)
            };
        }
        
        return { onCooldown: false };
    }

    /**
     * Set user cooldown
     */
    static async setCooldown(userId, guildId) {
        const settings = await this.getGuildSettings(guildId);
        
        if (!settings.cooldown.enabled) return;
        
        await LFGCooldown.findOneAndUpdate(
            { userId, guildId },
            {
                lastPostAt: new Date(),
                cooldownDuration: settings.cooldown.duration
            },
            { upsert: true }
        );
    }

    /**
     * Check if user has an active LFG post
     */
    static async hasActiveLFGPost(userId, guildId) {
        const activePost = await LFGPost.findOne({
            userId,
            guildId,
            isActive: true
        });
        
        return activePost;
    }

    /**
     * Deactivate user's current LFG post
     */
    static async deactivateUserLFGPost(userId, guildId) {
        await LFGPost.updateMany(
            { userId, guildId, isActive: true },
            { isActive: false }
        );
    }

    /**
     * Create LFG embed
     */
    static async createLFGEmbed(user, gameName, message, voiceChannel = null, settings) {
        const embedColor = settings.embed.color || '#5865F2';
        
        const embed = new EmbedBuilder()
            .setTitle(`🎮 ${gameName} LFG`)
            .setAuthor({
                name: user.displayName || user.username,
                iconURL: user.displayAvatarURL()
            })
            .setColor(embedColor)
            .setTimestamp();

        // Add fields based on post type
        if (voiceChannel) {
            embed.addFields([
                {
                    name: '📢 Voice Channel',
                    value: voiceChannel.name,
                    inline: true
                },
                {
                    name: '� Contact',
                    value: `${user}`,
                    inline: true
                },
                {
                    name: '⏰ Posted',
                    value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                    inline: true
                },
                {
                    name: '💬 Message',
                    value: message,
                    inline: false
                }
            ]);
        } else {
            embed.addFields([
                {
                    name: '� Contact',
                    value: `${user}`,
                    inline: true
                },
                {
                    name: '⏰ Posted',
                    value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                    inline: true
                },
                {
                    name: '💬 Message',
                    value: message,
                    inline: false
                }
            ]);
        }

        if (settings.embed.footerText) {
            embed.setFooter({ text: settings.embed.footerText });
        }

        return embed;
    }

    /**
     * Create LFG action buttons
     */
    static createLFGButtons(postId, voiceChannelId = null, settings) {
        const buttons = [];

        // Join Voice button (only if in voice channel)
        if (voiceChannelId && settings.features.voiceChannelEmbeds) {
            buttons.push(
                new ButtonBuilder()
                    .setCustomId(`lfg_join_voice_${postId}`)
                    .setLabel('Join Voice')
                    .setEmoji('🔊')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        // Edit button
        if (settings.features.editPosts) {
            buttons.push(
                new ButtonBuilder()
                    .setCustomId(`lfg_edit_${postId}`)
                    .setLabel('Edit Post')
                    .setEmoji('✏️')
                    .setStyle(ButtonStyle.Secondary)
            );
        }

        // Delete button
        if (settings.features.deletePosts) {
            buttons.push(
                new ButtonBuilder()
                    .setCustomId(`lfg_delete_${postId}`)
                    .setLabel('Delete Post')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Danger)
            );
        }

        return buttons.length > 0 ? [new ActionRowBuilder().addComponents(buttons)] : [];
    }

    /**
     * Check if channel is whitelisted for LFG posts
     */
    static async isChannelAllowed(channelId, guildId) {
        const settings = await this.getGuildSettings(guildId);
        
        // If no whitelist is set, all channels are allowed
        if (!settings.allowedChannels || settings.allowedChannels.length === 0) {
            return true;
        }
        
        // Check if channel is in whitelist (handle both old string format and new object format)
        return settings.allowedChannels.some(channel => 
            typeof channel === 'string' ? channel === channelId : channel.channelId === channelId
        );
    }

    /**
     * Get default game for a specific channel
     */
    static async getChannelDefaultGame(channelId, guildId) {
        const settings = await this.getGuildSettings(guildId);
        
        if (!settings.allowedChannels || settings.allowedChannels.length === 0) {
            return null;
        }
        
        const channelConfig = settings.allowedChannels.find(channel => 
            typeof channel === 'object' && channel.channelId === channelId
        );
        
        return channelConfig?.defaultGame || null;
    }

    /**
     * Check if user has required role
     */
    static async hasRequiredRole(member, guildId) {
        const settings = await this.getGuildSettings(guildId);
        
        if (!settings.lfgRole.requireRole) {
            return true;
        }
        
        return member.roles.cache.has(settings.lfgRole.requireRole);
    }

    /**
     * Assign LFG role to user
     */
    static async assignLFGRole(member, guildId) {
        const settings = await this.getGuildSettings(guildId);
        
        if (!settings.lfgRole.autoAssign || !settings.lfgRole.roleId) {
            return;
        }
        
        try {
            const role = member.guild.roles.cache.get(settings.lfgRole.roleId);
            if (role && !member.roles.cache.has(settings.lfgRole.roleId)) {
                await member.roles.add(role);
            }
        } catch (error) {
            console.error('Failed to assign LFG role:', error);
        }
    }

    /**
     * Log LFG action to audit channel
     */
    static async logLFGAction(guild, action, user, details = {}) {
        const settings = await this.getGuildSettings(guild.id);
        
        if (!settings.auditLog.enabled || !settings.auditLog.channelId) {
            return;
        }
        
        try {
            const logChannel = guild.channels.cache.get(settings.auditLog.channelId);
            if (!logChannel) return;
            
            const embed = Utils.createEmbed({
                title: `LFG ${action}`,
                color: this.getActionColor(action),
                fields: [
                    {
                        name: 'User',
                        value: `${user} (${user.id})`,
                        inline: true
                    },
                    {
                        name: 'Action',
                        value: action,
                        inline: true
                    },
                    {
                        name: 'Timestamp',
                        value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                        inline: true
                    }
                ]
            });
            
            // Add additional details
            if (details.gameName) {
                embed.addFields({
                    name: 'Game',
                    value: details.gameName,
                    inline: true
                });
            }
            
            if (details.channel) {
                embed.addFields({
                    name: 'Channel',
                    value: `${details.channel}`,
                    inline: true
                });
            }
            
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to log LFG action:', error);
        }
    }

    /**
     * Get color for audit log actions
     */
    static getActionColor(action) {
        const colors = {
            'Post Created': '#57F287',
            'Post Edited': '#FEE75C',
            'Post Deleted': '#ED4245',
            'Post Expired': '#99AAB5'
        };
        
        return colors[action] || '#5865F2';
    }

    /**
     * Check if message should be converted to LFG post
     */
    static async checkMessageTriggers(message, guildId) {
        const settings = await this.getGuildSettings(guildId);
        
        if (settings.triggerMode === 'slash') {
            return false;
        }
        
        // Check if channel is monitored
        if (settings.monitorChannels.length > 0) {
            // If channels are specified, only convert messages in those channels
            return settings.monitorChannels.includes(message.channel.id);
        }
        
        // If no specific channels are monitored, don't auto-convert
        return false;
    }

    /**
     * Extract game name and message from text, with optional channel default fallback
     */
    static async extractLFGInfo(text, channelId = null, guildId = null) {
        const originalText = text.trim();
        
        // Enhanced game detection with more keywords and variations
        const gameKeywords = [
            { keywords: ['valorant', 'val'], name: 'Valorant' },
            { keywords: ['league of legends', 'league', 'lol'], name: 'League of Legends' },
            { keywords: ['apex legends', 'apex'], name: 'Apex Legends' },
            { keywords: ['fortnite', 'fn'], name: 'Fortnite' },
            { keywords: ['call of duty', 'cod', 'warzone'], name: 'Call of Duty' },
            { keywords: ['counter-strike', 'counter strike', 'cs2', 'csgo', 'cs'], name: 'Counter-Strike 2' },
            { keywords: ['overwatch', 'ow2', 'ow'], name: 'Overwatch 2' },
            { keywords: ['rocket league', 'rl'], name: 'Rocket League' },
            { keywords: ['minecraft', 'mc'], name: 'Minecraft' },
            { keywords: ['world of warcraft', 'wow'], name: 'World of Warcraft' },
            { keywords: ['final fantasy', 'ff14', 'ffxiv'], name: 'Final Fantasy XIV' },
            { keywords: ['marvel rivals', 'rivals'], name: 'Marvel Rivals' },
            { keywords: ['destiny', 'destiny 2', 'd2'], name: 'Destiny 2' },
            { keywords: ['gta', 'grand theft auto'], name: 'Grand Theft Auto' },
            { keywords: ['dead by daylight', 'dbd'], name: 'Dead by Daylight' },
            { keywords: ['among us'], name: 'Among Us' },
            { keywords: ['fall guys'], name: 'Fall Guys' },
            { keywords: ['rust'], name: 'Rust' },
            { keywords: ['pubg', 'battlegrounds'], name: 'PUBG' },
            { keywords: ['rainbow six', 'r6', 'siege'], name: 'Rainbow Six Siege' }
        ];
        
        const lowerText = originalText.toLowerCase();
        
        // Find matching game
        for (const game of gameKeywords) {
            for (const keyword of game.keywords) {
                if (lowerText.includes(keyword)) {
                    return { 
                        gameName: game.name, 
                        message: originalText 
                    };
                }
            }
        }
        
        // If no specific game found, check for channel default game
        if (channelId && guildId) {
            const channelDefaultGame = await this.getChannelDefaultGame(channelId, guildId);
            if (channelDefaultGame) {
                return {
                    gameName: channelDefaultGame,
                    message: originalText
                };
            }
        }
        
        // If no specific game found, try to extract from first word or phrase
        const words = originalText.split(' ');
        if (words.length > 0) {
            // Check if first word looks like a game name (capitalized)
            const firstWord = words[0];
            if (firstWord.length > 2 && /^[A-Z]/.test(firstWord)) {
                return {
                    gameName: firstWord,
                    message: originalText
                };
            }
        }
        
        // Default fallback
        return { 
            gameName: 'Game', 
            message: originalText 
        };
    }

    /**
     * Format game name for display
     */
    static formatGameName(keyword) {
        const gameNames = {
            'valorant': 'Valorant',
            'league': 'League of Legends',
            'lol': 'League of Legends',
            'apex': 'Apex Legends',
            'fortnite': 'Fortnite',
            'cod': 'Call of Duty',
            'csgo': 'Counter-Strike',
            'cs2': 'Counter-Strike 2',
            'overwatch': 'Overwatch 2',
            'ow2': 'Overwatch 2',
            'rocket league': 'Rocket League',
            'rl': 'Rocket League',
            'minecraft': 'Minecraft',
            'wow': 'World of Warcraft',
            'ff14': 'Final Fantasy XIV',
            'marvel rivals': 'Marvel Rivals'
        };
        
        return gameNames[keyword.toLowerCase()] || keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }

    /**
     * Format time duration
     */
    static formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Clean up expired LFG posts
     */
    static async cleanupExpiredPosts(client) {
        try {
            const expiredPosts = await LFGPost.find({
                isActive: true,
                expiresAt: { $lt: new Date() }
            });

            for (const post of expiredPosts) {
                try {
                    const guild = client.guilds.cache.get(post.guildId);
                    if (!guild) continue;

                    const channel = guild.channels.cache.get(post.channelId);
                    if (!channel) continue;

                    const message = await channel.messages.fetch(post.messageId).catch(() => null);
                    if (message) {
                        await message.delete().catch(() => {});
                    }

                    // Mark as inactive
                    post.isActive = false;
                    await post.save();

                    // Log expiration
                    const user = await client.users.fetch(post.userId).catch(() => null);
                    if (user) {
                        await this.logLFGAction(guild, 'Post Expired', user, {
                            gameName: post.gameName,
                            channel: channel
                        });
                    }
                } catch (error) {
                    console.error('Error cleaning up expired LFG post:', error);
                }
            }
        } catch (error) {
            console.error('Error in LFG cleanup task:', error);
        }
    }

    /**
     * Get default game presets
     */
    static getDefaultGamePresets() {
        return [
            {
                name: 'Valorant',
                icon: '🔫',
                color: '#FF4654',
                defaultMessage: 'Looking for ranked teammates!'
            },
            {
                name: 'League of Legends',
                icon: '⚔️',
                color: '#C89B3C',
                defaultMessage: 'LFG ranked/normals!'
            },
            {
                name: 'Apex Legends',
                icon: '🎯',
                color: '#FF6600',
                defaultMessage: 'Looking for squad!'
            },
            {
                name: 'Fortnite',
                icon: '🏗️',
                color: '#9147FF',
                defaultMessage: 'LFG duos/squads!'
            },
            {
                name: 'Call of Duty',
                icon: '🔫',
                color: '#D2691E',
                defaultMessage: 'Looking for team!'
            },
            {
                name: 'Counter-Strike 2',
                icon: '💥',
                color: '#F7941D',
                defaultMessage: 'LFG competitive/premier!'
            },
            {
                name: 'Overwatch 2',
                icon: '🛡️',
                color: '#F99E1A',
                defaultMessage: 'Looking for group!'
            },
            {
                name: 'Rocket League',
                icon: '🚗',
                color: '#005F99',
                defaultMessage: 'LFG ranked/casual!'
            },
            {
                name: 'Minecraft',
                icon: '⛏️',
                color: '#62B47A',
                defaultMessage: 'Looking for players to join!'
            },
            {
                name: 'World of Warcraft',
                icon: '⚔️',
                color: '#F4D03F',
                defaultMessage: 'LFG dungeons/raids!'
            },
            {
                name: 'Final Fantasy XIV',
                icon: '🗡️',
                color: '#9C88C4',
                defaultMessage: 'Looking for party!'
            },
            {
                name: 'Marvel Rivals',
                icon: '🦸',
                color: '#ED1C24',
                defaultMessage: 'Looking for team!'
            }
        ];
    }
}

module.exports = LFGUtils;
