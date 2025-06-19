const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Guild = require('../schemas/Guild');
const User = require('../schemas/User');

class Utils {
    /**
     * Create a standardized embed
     */
    static createEmbed(options = {}) {
        const embed = new EmbedBuilder()
            .setColor(options.color || 0x5865F2)
            .setTimestamp();

        if (options.title) embed.setTitle(options.title);
        if (options.description) embed.setDescription(options.description);
        if (options.author) embed.setAuthor(options.author);
        if (options.footer) embed.setFooter(options.footer);
        if (options.thumbnail) embed.setThumbnail(options.thumbnail);
        if (options.image) embed.setImage(options.image);
        if (options.fields) embed.addFields(options.fields);

        return embed;
    }

    /**
     * Create success embed
     */
    static createSuccessEmbed(title, description) {
        return this.createEmbed({
            title: `✅ ${title}`,
            description,
            color: 0x57F287
        });
    }

    /**
     * Create error embed
     */
    static createErrorEmbed(title, description) {
        return this.createEmbed({
            title: `❌ ${title}`,
            description,
            color: 0xED4245
        });
    }

    /**
     * Create warning embed
     */
    static createWarningEmbed(title, description) {
        return this.createEmbed({
            title: `⚠️ ${title}`,
            description,
            color: 0xFEE75C
        });
    }

    /**
     * Create info embed
     */
    static createInfoEmbed(title, description) {
        return this.createEmbed({
            title: `ℹ️ ${title}`,
            description,
            color: 0x5DADE2
        });
    }

    /**
     * Create music embed
     */
    static createMusicEmbed(title, description, thumbnail = null) {
        return this.createEmbed({
            title: `🎵 ${title}`,
            description,
            color: 0x9B00FF,
            thumbnail
        });
    }

    /**
     * Format duration from milliseconds to readable format
     */
    static formatDuration(ms) {
        if (!ms || ms < 0) return '00:00';
        
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        const secs = seconds % 60;
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Format bytes to readable format
     */
    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Truncate text to specified length
     */
    static truncate(text, length = 100) {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length - 3) + '...';
    }

    /**
     * Capitalize first letter of each word
     */
    static capitalize(text) {
        if (!text) return '';
        return text.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    /**
     * Get emoji for music source
     * @param {string} source - The music source name
     * @returns {string} Emoji for the source
     */
    static getSourceEmoji(source) {
        const sourceEmojis = {
            youtube: '🎥',
            spotify: '🟢',
            soundcloud: '🟠',
            bandcamp: '🎵',
            twitch: '🟣',
            vimeo: '🔵',
            http: '🌐',
            local: '💾'
        };
        return sourceEmojis[source?.toLowerCase()] || '🎵';
    }

    /**
     * Create pagination buttons
     * @param {number} currentPage - Current page number (0-indexed)
     * @param {number} totalPages - Total number of pages
     * @returns {ActionRowBuilder} Button row with pagination controls
     */
    static createPaginationButtons(currentPage, totalPages) {
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('page_first')
                    .setLabel('First')
                    .setEmoji('⏮️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('page_prev')
                    .setLabel('Previous')
                    .setEmoji('◀️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('page_info')
                    .setLabel(`${currentPage + 1}/${totalPages}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('page_next')
                    .setLabel('Next')
                    .setEmoji('▶️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage >= totalPages - 1),
                new ButtonBuilder()
                    .setCustomId('page_last')
                    .setLabel('Last')
                    .setEmoji('⏭️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage >= totalPages - 1)
            );
    }

    /**
     * Check if user has required permissions
     */
    static async checkPermissions(interaction, requiredPermissions = []) {
        const member = interaction.member;
        const guildData = await this.getGuildData(interaction.guildId);

        // Bot owner always has permission
        if (interaction.client.config.bot.owners.includes(interaction.user.id)) {
            return { hasPermission: true };
        }

        // Check Discord permissions
        for (const permission of requiredPermissions) {
            if (!member.permissions.has(permission)) {
                return {
                    hasPermission: false,
                    reason: `You need the \`${permission}\` permission to use this command.`
                };
            }
        }

        // Check DJ role for music commands
        const musicCommands = ['play', 'pause', 'skip', 'stop', 'volume', 'seek', 'loop', 'shuffle', 'queue'];
        if (musicCommands.includes(interaction.commandName)) {
            if (guildData.permissions.djRole) {
                const hasDjRole = member.roles.cache.has(guildData.permissions.djRole);
                const hasAdminRole = guildData.permissions.adminRoles.some(roleId => 
                    member.roles.cache.has(roleId)
                );

                if (!hasDjRole && !hasAdminRole && !member.permissions.has('Administrator')) {
                    return {
                        hasPermission: false,
                        reason: 'You need the DJ role or Administrator permission to use music commands.'
                    };
                }
            }
        }

        return { hasPermission: true };
    }

    /**
     * Check command cooldown
     */
    static checkCooldown(client, userId, commandName, cooldownTime) {
        const cooldowns = client.cooldowns;
        
        if (!cooldowns.has(commandName)) {
            cooldowns.set(commandName, new Map());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(commandName);
        
        if (timestamps.has(userId)) {
            const expirationTime = timestamps.get(userId) + cooldownTime;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return {
                    onCooldown: true,
                    timeLeft: timeLeft.toFixed(1)
                };
            }
        }

        timestamps.set(userId, now);
        setTimeout(() => timestamps.delete(userId), cooldownTime);

        return { onCooldown: false };
    }

    /**
     * Get or create guild data
     */
    static async getGuildData(guildId, guildName = null) {
        let guildData = await Guild.findByGuildId(guildId);
        
        if (!guildData && guildName) {
            guildData = await Guild.createDefault(guildId, guildName);
        }
        
        return guildData;
    }

    /**
     * Get or create user data
     */
    static async getUserData(userId, username = null, discriminator = '0') {
        let userData = await User.findByUserId(userId);
        
        if (!userData && username) {
            userData = await User.createDefault(userId, username, discriminator);
        }
        
        return userData;
    }

    /**
     * Check if user is in voice channel
     */
    static checkVoiceChannel(member) {
        if (!member.voice.channel) {
            return {
                inVoice: false,
                reason: 'You need to be in a voice channel to use this command.'
            };
        }

        return { inVoice: true, channel: member.voice.channel };
    }

    /**
     * Check if bot can join voice channel
     */
    static checkBotVoicePermissions(voiceChannel) {
        const botPermissions = voiceChannel.permissionsFor(voiceChannel.guild.members.me);

        if (!botPermissions.has('Connect')) {
            return {
                canJoin: false,
                reason: 'I don\'t have permission to join that voice channel.'
            };
        }

        if (!botPermissions.has('Speak')) {
            return {
                canJoin: false,
                reason: 'I don\'t have permission to speak in that voice channel.'
            };
        }

        return { canJoin: true };
    }

    /**
     * Parse search query for advanced options
     */
    static parseSearchQuery(query) {
        const options = {
            query: query,
            source: 'youtube',
            isUrl: false,
            filters: {}
        };

        // Check if it's a URL
        const urlRegex = /^https?:\/\//;
        if (urlRegex.test(query)) {
            options.isUrl = true;
            
            // Determine source from URL
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                options.source = 'youtube';
            } else if (query.includes('soundcloud.com')) {
                options.source = 'soundcloud';
            } else if (query.includes('spotify.com')) {
                options.source = 'spotify';
            } else if (query.includes('music.apple.com')) {
                options.source = 'apple';
            }
            
            return options;
        }

        // Parse source prefix (e.g., "yt:song name", "sc:song name")
        const sourceMatch = query.match(/^(yt|youtube|sc|soundcloud|spotify|sp):(.+)/i);
        if (sourceMatch) {
            const sourcePrefix = sourceMatch[1].toLowerCase();
            options.query = sourceMatch[2].trim();
            
            switch (sourcePrefix) {
                case 'yt':
                case 'youtube':
                    options.source = 'youtube';
                    break;
                case 'sc':
                case 'soundcloud':
                    options.source = 'soundcloud';
                    break;
                case 'sp':
                case 'spotify':
                    options.source = 'spotify';
                    break;
            }
        }

        return options;
    }

    /**
     * Generate random string
     */
    static generateRandomString(length = 10) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        return result;
    }

    /**
     * Validate URL
     */
    static isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Format time ago
     * @param {Date} date - Date to format
     * @returns {string} Formatted time ago string
     */
    static timeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        const intervals = [
            { unit: 'year', seconds: 31536000 },
            { unit: 'month', seconds: 2592000 },
            { unit: 'week', seconds: 604800 },
            { unit: 'day', seconds: 86400 },
            { unit: 'hour', seconds: 3600 },
            { unit: 'minute', seconds: 60 },
            { unit: 'second', seconds: 1 }
        ];

        for (const interval of intervals) {
            const count = Math.floor(diffInSeconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.unit}${count !== 1 ? 's' : ''} ago`;
            }
        }

        return 'just now';
    }

    /**
     * Parse time string to milliseconds
     * @param {string} timeString - Time string (e.g., "1:30", "90s", "2m30s")
     * @returns {number|null} Time in milliseconds or null if invalid
     */
    static parseTimeString(timeString) {
        if (!timeString || typeof timeString !== 'string') return null;

        timeString = timeString.trim().toLowerCase();

        // Handle mm:ss format
        const colonMatch = timeString.match(/^(\d+):(\d+)$/);
        if (colonMatch) {
            const minutes = parseInt(colonMatch[1]);
            const seconds = parseInt(colonMatch[2]);
            if (seconds < 60) {
                return (minutes * 60 + seconds) * 1000;
            }
        }

        // Handle time with units (e.g., 1m30s, 90s, 2m)
        const unitMatch = timeString.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
        if (unitMatch) {
            const hours = parseInt(unitMatch[1] || 0);
            const minutes = parseInt(unitMatch[2] || 0);
            const seconds = parseInt(unitMatch[3] || 0);
            return (hours * 3600 + minutes * 60 + seconds) * 1000;
        }

        // Handle simple seconds (e.g., "90")
        const simpleMatch = timeString.match(/^(\d+)$/);
        if (simpleMatch) {
            return parseInt(simpleMatch[1]) * 1000;
        }

        return null;
    }
}

module.exports = Utils;
