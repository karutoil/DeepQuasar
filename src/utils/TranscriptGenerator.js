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
        switch (format) {
            case 'html':
                return this.formatHTML(ticket, messages);
            case 'txt':
                return this.formatTXT(ticket, messages);
            case 'json':
                return this.formatJSON(ticket, messages);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    /**
     * Format transcript as HTML
     */
    formatHTML(ticket, messages) {
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket #${ticket.ticketId} Transcript</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #36393f;
            color: #dcddde;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: #2f3136;
            border-radius: 8px;
            padding: 20px;
        }
        .header {
            border-bottom: 1px solid #40444b;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .ticket-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .info-item {
            background-color: #40444b;
            padding: 10px;
            border-radius: 4px;
        }
        .info-label {
            font-weight: bold;
            color: #b9bbbe;
            font-size: 12px;
            text-transform: uppercase;
        }
        .info-value {
            margin-top: 5px;
            color: #dcddde;
        }
        .message {
            margin-bottom: 15px;
            padding: 10px;
            background-color: #40444b;
            border-radius: 4px;
            border-left: 4px solid #5865f2;
        }
        .message-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }
        .author {
            font-weight: bold;
            color: #ffffff;
            margin-right: 10px;
        }
        .timestamp {
            color: #72767d;
            font-size: 12px;
        }
        .message-content {
            color: #dcddde;
            line-height: 1.375;
            word-wrap: break-word;
        }
        .attachment {
            background-color: #2f3136;
            border: 1px solid #202225;
            border-radius: 4px;
            padding: 10px;
            margin-top: 8px;
        }
        .embed {
            background-color: #2f3136;
            border-left: 4px solid #5865f2;
            padding: 10px;
            margin-top: 8px;
            border-radius: 0 4px 4px 0;
        }
        .system-message {
            border-left-color: #faa61a;
            background-color: #413f3f;
        }
        .bot-message {
            border-left-color: #5865f2;
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
            ${messages.map(msg => this.formatHTMLMessage(msg)).join('')}
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #40444b; text-align: center; color: #72767d; font-size: 12px;">
            Transcript generated on ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`;
        
        return htmlContent;
    }

    /**
     * Format a single message for HTML
     */
    formatHTMLMessage(message) {
        const isBot = message.author.bot;
        const isSystem = message.type !== 0;
        const classes = ['message'];
        
        if (isBot) classes.push('bot-message');
        if (isSystem) classes.push('system-message');
        
        let content = message.content || '';
        content = this.escapeHTML(content);
        
        // Handle attachments
        let attachments = '';
        if (message.attachments.size > 0) {
            attachments = message.attachments.map(att => 
                `<div class="attachment">📎 ${this.escapeHTML(att.name)} (${att.size} bytes)</div>`
            ).join('');
        }
        
        // Handle embeds
        let embeds = '';
        if (message.embeds.length > 0) {
            embeds = message.embeds.map(embed => 
                `<div class="embed">
                    ${embed.title ? `<strong>${this.escapeHTML(embed.title)}</strong><br>` : ''}
                    ${embed.description ? this.escapeHTML(embed.description) : ''}
                </div>`
            ).join('');
        }
        
        return `
            <div class="${classes.join(' ')}">
                <div class="message-header">
                    <span class="author">${this.escapeHTML(message.author.displayName || message.author.username)}</span>
                    <span class="timestamp">${message.createdAt.toLocaleString()}</span>
                </div>
                <div class="message-content">${content}</div>
                ${attachments}
                ${embeds}
            </div>
        `;
    }

    /**
     * Format transcript as plain text
     */
    formatTXT(ticket, messages) {
        let content = `TICKET #${ticket.ticketId} TRANSCRIPT\n`;
        content += `${'='.repeat(50)}\n\n`;
        content += `Ticket ID: ${ticket.ticketId}\n`;
        content += `User: ${ticket.username}\n`;
        content += `Type: ${ticket.type}\n`;
        content += `Status: ${ticket.status}\n`;
        content += `Created: ${new Date(ticket.createdAt).toLocaleString()}\n`;
        if (ticket.assignedTo.userId) {
            content += `Assigned To: ${ticket.assignedTo.username}\n`;
        }
        if (ticket.tags.length > 0) {
            content += `Tags: ${ticket.tags.join(', ')}\n`;
        }
        content += `Reason: ${ticket.reason}\n`;
        content += `\n${'='.repeat(50)}\n\n`;
        
        messages.forEach(msg => {
            content += `[${msg.createdAt.toLocaleString()}] ${msg.author.displayName || msg.author.username}: ${msg.content || '[No content]'}\n`;
            
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
    formatJSON(ticket, messages) {
        const data = {
            ticket: {
                ticketId: ticket.ticketId,
                username: ticket.username,
                type: ticket.type,
                status: ticket.status,
                reason: ticket.reason,
                createdAt: ticket.createdAt,
                assignedTo: ticket.assignedTo,
                tags: ticket.tags,
                priority: ticket.priority
            },
            messages: messages.map(msg => ({
                id: msg.id,
                author: {
                    id: msg.author.id,
                    username: msg.author.username,
                    displayName: msg.author.displayName,
                    bot: msg.author.bot
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
