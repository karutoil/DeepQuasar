const { AttachmentBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

class TranscriptGenerator {
    constructor() {
        this.transcriptDir = path.join(process.cwd(), 'transcripts');
        this.ensureTranscriptDir();
    }

    async ensureTranscriptDir() {
        try {
            await fs.mkdir(this.transcriptDir, { recursive: true });
        } catch (error) {
            console.error('Error creating transcript directory:', error);
        }
    }

    /**
     * Generate a transcript for a ticket channel
     * @param {Object} ticket - The ticket object
     * @param {TextChannel} channel - The Discord channel
     * @param {string} format - Format: 'html', 'txt', or 'json'
     * @returns {Promise<{file: AttachmentBuilder, content: string}>}
     */
    async generateTranscript(ticket, channel, format = 'html') {
        try {
            const messages = await this.fetchAllMessages(channel);
            const transcript = await this.formatTranscript(ticket, messages, format);
            const fileName = `ticket-${ticket.ticketId}-${Date.now()}.${format}`;
            const filePath = path.join(this.transcriptDir, fileName);
            
            // await fs.writeFile(filePath, transcript); // Commented out to disable saving transcripts to disk
            
            const attachment = new AttachmentBuilder(Buffer.from(transcript, 'utf-8'), { name: fileName });
            
            return {
                file: attachment,
                content: transcript,
                filePath: filePath,
                fileName: fileName
            };
        } catch (error) {
            console.error('Error generating transcript:', error);
            throw error;
        }
    }

    /**
     * Fetch all messages from a channel
     * @param {TextChannel} channel - The Discord channel
     * @returns {Promise<Array>} Array of messages
     */
    async fetchAllMessages(channel) {
        const messages = [];
        let lastMessageId = null;

        while (true) {
            try {
                const options = { limit: 100 };
                if (lastMessageId) {
                    options.before = lastMessageId;
                }

                const batch = await channel.messages.fetch(options);
                
                if (batch.size === 0) break;
                
                messages.push(...batch.values());
                lastMessageId = batch.last().id;
            } catch (error) {
                console.error('Error fetching messages:', error);
                break;
            }
        }

        return messages.reverse(); // Oldest first
    }

    /**
     * Format messages into different transcript formats
     * @param {Object} ticket - The ticket object
     * @param {Array} messages - Array of Discord messages
     * @param {string} format - Format type
     * @returns {Promise<string>} Formatted transcript
     */
    async formatTranscript(ticket, messages, format) {
        // Helper to resolve user display (Name (ID))
        const userDisplay = (user) => {
            if (!user) return 'Unknown';
            const name = user.displayName || user.username || user.tag || user.id;
            return `${name} (${user.id})`;
        };

        // Helper to resolve channel display (Name (ID))
        const channelDisplay = (channel) => {
            if (!channel) return 'Unknown';
            const name = channel.name || channel.id;
            return `${name} (${channel.id})`;
        };

        switch (format) {
            case 'html':
                return this.formatHTML(ticket, messages, { userDisplay, channelDisplay });
            case 'txt':
                return this.formatTXT(ticket, messages, { userDisplay, channelDisplay });
            case 'json':
                return this.formatJSON(ticket, messages, { userDisplay, channelDisplay });
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    /**
     * Format transcript as HTML
     */
    formatHTML(ticket, messages, helpers = {}) {
        const { userDisplay = (u) => u.id, channelDisplay = (c) => c.id } = helpers;
        // Group consecutive messages by user for Discord-like grouping
        const groupedMessages = [];
        let lastAuthorId = null;
        let lastGroup = null;
        for (const msg of messages) {
            if (lastGroup && lastAuthorId === msg.author.id) {
                lastGroup.messages.push(msg);
            } else {
                lastGroup = { author: msg.author, messages: [msg] };
                groupedMessages.push(lastGroup);
                lastAuthorId = msg.author.id;
            }
        }

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket #${ticket.ticketId} Transcript</title>
    <style>
        body {
            font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #313338;
            color: #dbdee1;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 800px;
            margin: 40px auto;
            background-color: #2b2d31;
            border-radius: 8px;
            box-shadow: 0 2px 8px #000a;
            padding: 0 0 32px 0;
        }
        .header {
            border-bottom: 1px solid #232428;
            padding: 32px 32px 16px 32px;
            margin-bottom: 0;
        }
        .ticket-info {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 16px;
        }
        .info-item {
            background-color: #232428;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 13px;
        }
        .info-label {
            font-weight: bold;
            color: #b5bac1;
            font-size: 11px;
            text-transform: uppercase;
        }
        .info-value {
            margin-top: 2px;
            color: #dbdee1;
        }
        .messages {
            padding: 24px 32px 0 32px;
        }
        .message-group {
            display: flex;
            align-items: flex-start;
            margin-bottom: 18px;
        }
        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 16px;
            flex-shrink: 0;
            background: #232428;
            object-fit: cover;
        }
        .message-block {
            flex: 1;
        }
        .username {
            font-weight: 600;
            font-size: 16px;
            margin-right: 8px;
            vertical-align: middle;
        }
        .bot-tag {
            background: #5865f2;
            color: #fff;
            font-size: 10px;
            font-weight: bold;
            border-radius: 3px;
            padding: 2px 4px;
            margin-left: 4px;
            vertical-align: middle;
        }
        .timestamp {
            color: #949ba4;
            font-size: 12px;
            margin-left: 4px;
            vertical-align: middle;
        }
        .message-content {
            color: #dbdee1;
            font-size: 15px;
            line-height: 1.5;
            margin: 2px 0 0 0;
            word-break: break-word;
        }
        .attachment {
            background-color: #232428;
            border: 1px solid #202225;
            border-radius: 4px;
            padding: 8px;
            margin-top: 8px;
            display: inline-block;
        }
        .attachment img {
            max-width: 320px;
            max-height: 240px;
            border-radius: 4px;
            display: block;
        }
        .embed {
            background-color: #232428;
            border-left: 4px solid #5865f2;
            padding: 10px 12px;
            margin-top: 8px;
            border-radius: 0 4px 4px 0;
            color: #fff;
        }
        .embed-title {
            font-weight: bold;
            font-size: 15px;
            margin-bottom: 2px;
        }
        .embed-description {
            font-size: 14px;
            margin-bottom: 2px;
        }
        .embed-field {
            margin-top: 4px;
        }
        .embed-field-name {
            font-weight: bold;
            font-size: 13px;
            color: #b5bac1;
        }
        .embed-field-value {
            font-size: 13px;
        }
        .system-message {
            color: #faa61a;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 Ticket #${ticket.ticketId} Transcript</h1>
            <div class="ticket-info">
                <div class="info-item">
                    <div class="info-label">Ticket ID</div>
                    <div class="info-value">${ticket.ticketId}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">User</div>
                    <div class="info-value">${ticket.username}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Type</div>
                    <div class="info-value">${ticket.type}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value">${ticket.status}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Created</div>
                    <div class="info-value">${new Date(ticket.createdAt).toLocaleString()}</div>
                </div>
                ${ticket.assignedTo.userId ? `
                <div class="info-item">
                    <div class="info-label">Assigned To</div>
                    <div class="info-value">${ticket.assignedTo.username}</div>
                </div>
                ` : ''}
                ${ticket.tags.length > 0 ? `
                <div class="info-item">
                    <div class="info-label">Tags</div>
                    <div class="info-value">${ticket.tags.join(', ')}</div>
                </div>
                ` : ''}
            </div>
            <div class="info-item">
                <div class="info-label">Reason</div>
                <div class="info-value">${ticket.reason}</div>
            </div>
        </div>
        <div class="messages">
            ${this.formatDiscordHTMLMessages(groupedMessages)}
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #40444b; text-align: center; color: #72767d; font-size: 12px;">
            Transcript generated on ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`;
        return htmlContent;
    }

    // Discord-like message grouping and rendering
    formatDiscordHTMLMessages(groups, helpers = {}) {
        const { userDisplay = (u) => u.id } = helpers;
        return groups.map(group => {
            const author = group.author;
            const avatar = author.displayAvatarURL?.() || author.avatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png';
            const usernameColor = author.hexAccentColor || author.hexColor || '#fff';
            const isBot = author.bot;
            // Show Name (ID) for user, and append "BOT" if bot
            const nameWithId = author.displayName
                ? `${this.escapeHTML(author.displayName)} (${author.id})`
                : author.username
                    ? `${this.escapeHTML(author.username)} (${author.id})`
                    : author.id;
            return `
            <div class="message-group">
                <img class="avatar" src="${avatar}" alt="avatar">
                <div class="message-block">
                    <div>
                        <span class="username" style="color: ${usernameColor}">${nameWithId}${isBot ? ' BOT' : ''}</span>
                        <span class="timestamp">${group.messages[0].createdAt.toLocaleString()}</span>
                    </div>
                    ${group.messages.map(msg => this.formatDiscordHTMLMessage(msg)).join('')}
                </div>
            </div>
            `;
        }).join('');
    }

    formatDiscordHTMLMessage(message) {
        let content = message.content ? this.escapeHTML(message.content) : '';
        // Attachments
        let attachments = '';
        if (message.attachments.size > 0) {
            attachments = Array.from(message.attachments.values()).map(att => {
                if (att.contentType && att.contentType.startsWith('image/')) {
                    return `<div class="attachment"><a href="${att.url}" target="_blank"><img src="${att.url}" alt="attachment"></a></div>`;
                } else {
                    return `<div class="attachment"><a href="${att.url}" target="_blank">📎 ${this.escapeHTML(att.name)} (${att.size} bytes)</a></div>`;
                }
            }).join('');
        }
        // Embeds
        let embeds = '';
        if (message.embeds.length > 0) {
            embeds = message.embeds.map(embed => {
                let fields = '';
                if (embed.fields && embed.fields.length > 0) {
                    fields = embed.fields.map(f => `<div class="embed-field"><div class="embed-field-name">${this.escapeHTML(f.name)}</div><div class="embed-field-value">${this.escapeHTML(f.value)}</div></div>`).join('');
                }
                return `<div class="embed" style="border-left-color: ${embed.color ? '#' + embed.color.toString(16).padStart(6, '0') : '#5865f2'}">
                    ${embed.title ? `<div class="embed-title">${this.escapeHTML(embed.title)}</div>` : ''}
                    ${embed.description ? `<div class="embed-description">${this.escapeHTML(embed.description)}</div>` : ''}
                    ${fields}
                </div>`;
            }).join('');
        }
        // System message
        const isSystem = message.type !== 0;
        return `<div class="message-content${isSystem ? ' system-message' : ''}">${content}${attachments}${embeds}</div>`;
    }


    /**
     * Format a single message for HTML
     */
    // formatHTMLMessage is now obsolete, replaced by formatDiscordHTMLMessages and formatDiscordHTMLMessage


    /**
     * Format transcript as plain text
     */
    formatTXT(ticket, messages, helpers = {}) {
        const { userDisplay = (u) => u.id, channelDisplay = (c) => c.id } = helpers;
        let content = `TICKET #${ticket.ticketId} TRANSCRIPT\n`;
        content += `${'='.repeat(50)}\n\n`;
        content += `Ticket ID: ${ticket.ticketId}\n`;
        content += `Channel: ${ticket.channelName ? `${ticket.channelName} (${ticket.channelId})` : ticket.channelId}\n`;
        content += `User: ${ticket.username ? `${ticket.username} (${ticket.userId})` : ticket.userId}\n`;
        content += `Type: ${ticket.type}\n`;
        content += `Status: ${ticket.status}\n`;
        content += `Created: ${new Date(ticket.createdAt).toLocaleString()}\n`;
        if (ticket.assignedTo?.userId) {
            content += `Assigned To: ${ticket.assignedTo.username ? `${ticket.assignedTo.username} (${ticket.assignedTo.userId})` : ticket.assignedTo.userId}\n`;
        }
        if (ticket.tags && ticket.tags.length > 0) {
            content += `Tags: ${ticket.tags.join(', ')}\n`;
        }
        content += `Reason: ${ticket.reason}\n`;
        content += `\n${'='.repeat(50)}\n\n`;
        
        messages.forEach(msg => {
            content += `[${msg.createdAt.toLocaleString()}] ${userDisplay(msg.author)}: ${msg.content || '[No content]'}\n`;
            
            if (msg.attachments.size > 0) {
                msg.attachments.forEach(att => {
                    content += `  📎 Attachment: ${att.name}\n`;
                });
            }
            
            if (msg.embeds.length > 0) {
                msg.embeds.forEach(embed => {
                    content += `  📄 Embed: ${embed.title || embed.description || '[Embed]'}\n`;
                });
            }
            
            content += '\n';
        });
        
        content += `\n${'='.repeat(50)}\n`;
        content += `Transcript generated on ${new Date().toLocaleString()}`;
        
        return content;
    }

    /**
     * Format transcript as JSON
     */
    formatJSON(ticket, messages, helpers = {}) {
        const { userDisplay = (u) => u.id, channelDisplay = (c) => c.id } = helpers;
        const data = {
            ticket: {
                ticketId: ticket.ticketId,
                username: ticket.username,
                userId: ticket.userId,
                userDisplay: ticket.username ? `${ticket.username} (${ticket.userId})` : ticket.userId,
                type: ticket.type,
                status: ticket.status,
                reason: ticket.reason,
                createdAt: ticket.createdAt,
                assignedTo: ticket.assignedTo
                    ? {
                        ...ticket.assignedTo,
                        display: ticket.assignedTo.username
                            ? `${ticket.assignedTo.username} (${ticket.assignedTo.userId})`
                            : ticket.assignedTo.userId
                    }
                    : null,
                tags: ticket.tags,
                priority: ticket.priority,
                channelId: ticket.channelId,
                channelName: ticket.channelName,
                channelDisplay: ticket.channelName
                    ? `${ticket.channelName} (${ticket.channelId})`
                    : ticket.channelId
            },
            messages: messages.map(msg => ({
                id: msg.id,
                author: {
                    id: msg.author.id,
                    username: msg.author.username,
                    displayName: msg.author.displayName,
                    tag: msg.author.tag,
                    bot: msg.author.bot,
                    display: userDisplay(msg.author)
                },
                content: msg.content,
                createdAt: msg.createdAt,
                editedAt: msg.editedTimestamp,
                attachments: msg.attachments.map(att => ({
                    id: att.id,
                    name: att.name,
                    size: att.size,
                    url: att.url
                })),
                embeds: msg.embeds.map(embed => ({
                    title: embed.title,
                    description: embed.description,
                    color: embed.color,
                    timestamp: embed.timestamp
                }))
            })),
            generatedAt: new Date().toISOString()
        };
        
        return JSON.stringify(data, null, 2);
    }

    /**
     * Escape HTML characters
     */
    escapeHTML(text) {
        // Node.js environment fallback
        return text.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Clean up old transcript files
     */
    async cleanupOldTranscripts(daysOld = 30) {
        try {
            const files = await fs.readdir(this.transcriptDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            for (const file of files) {
                const filePath = path.join(this.transcriptDir, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime < cutoffDate) {
                    await fs.unlink(filePath);
                    console.log(`Cleaned up old transcript: ${file}`);
                }
            }
        } catch (error) {
            console.error('Error cleaning up transcripts:', error);
        }
    }
}

module.exports = TranscriptGenerator;
