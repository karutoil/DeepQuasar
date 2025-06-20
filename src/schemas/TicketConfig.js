const mongoose = require('mongoose');

const ticketConfigSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    
    // Channel configuration
    channels: {
        openCategory: {
            type: String,
            default: null
        },
        closedCategory: {
            type: String,
            default: null
        },
        modLogChannel: {
            type: String,
            default: null
        },
        archiveChannel: {
            type: String,
            default: null
        }
    },
    
    // Ticket naming configuration
    naming: {
        pattern: {
            type: String,
            enum: ['ticket-username', 'ticket-####', 'username-ticket', '####-ticket', 'custom'],
            default: 'ticket-username'
        },
        customPattern: {
            type: String,
            default: null // e.g., "support-{username}-{id}"
        },
        counter: {
            type: Number,
            default: 1
        }
    },
    
    // Staff roles configuration
    staffRoles: [{
        roleId: {
            type: String,
            required: true
        },
        roleName: {
            type: String,
            required: true
        },
        permissions: {
            canView: {
                type: Boolean,
                default: true
            },
            canAssign: {
                type: Boolean,
                default: true
            },
            canClose: {
                type: Boolean,
                default: true
            },
            canDelete: {
                type: Boolean,
                default: false
            },
            canReopen: {
                type: Boolean,
                default: true
            },
            canManagePanel: {
                type: Boolean,
                default: false
            }
        }
    }],
    
    // Ticket panel configuration
    panels: [{
        panelId: {
            type: String,
            required: true
        },
        channelId: {
            type: String,
            required: true
        },
        messageId: {
            type: String,
            required: true
        },
        title: {
            type: String,
            default: '🎫 Support Tickets'
        },
        description: {
            type: String,
            default: 'Click a button below to create a support ticket.'
        },
        color: {
            type: String,
            default: '#5865F2'
        },
        buttons: [{
            customId: {
                type: String,
                required: true
            },
            label: {
                type: String,
                required: true
            },
            emoji: {
                type: String,
                default: null
            },
            style: {
                type: String,
                enum: ['Primary', 'Secondary', 'Success', 'Danger'],
                default: 'Primary'
            },
            ticketType: {
                type: String,
                required: true
            },
            description: {
                type: String,
                default: null
            }
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Modal configuration per ticket type
    modalConfig: {
        type: Map,
        of: {
            title: {
                type: String,
                required: true
            },
            questions: [{
                id: {
                    type: String,
                    required: true
                },
                label: {
                    type: String,
                    required: true
                },
                placeholder: {
                    type: String,
                    default: null
                },
                required: {
                    type: Boolean,
                    default: true
                },
                maxLength: {
                    type: Number,
                    default: 1000
                },
                minLength: {
                    type: Number,
                    default: 10
                },
                style: {
                    type: String,
                    enum: ['Short', 'Paragraph'],
                    default: 'Paragraph'
                }
            }]
        },
        default: function() {
            return new Map([
                ['support', {
                    title: 'Support Request',
                    questions: [{
                        id: 'reason',
                        label: 'What do you need help with?',
                        placeholder: 'Please describe your issue in detail...',
                        required: true,
                        maxLength: 1000,
                        minLength: 10,
                        style: 'Paragraph'
                    }]
                }],
                ['bug', {
                    title: 'Bug Report',
                    questions: [{
                        id: 'description',
                        label: 'Bug Description',
                        placeholder: 'Describe the bug you encountered...',
                        required: true,
                        maxLength: 1000,
                        minLength: 10,
                        style: 'Paragraph'
                    }, {
                        id: 'steps',
                        label: 'Steps to Reproduce',
                        placeholder: '1. First step\n2. Second step\n3. Bug occurs',
                        required: true,
                        maxLength: 500,
                        minLength: 10,
                        style: 'Paragraph'
                    }]
                }],
                ['partnership', {
                    title: 'Partnership Request',
                    questions: [{
                        id: 'details',
                        label: 'Partnership Details',
                        placeholder: 'Tell us about your server/project and partnership proposal...',
                        required: true,
                        maxLength: 1000,
                        minLength: 50,
                        style: 'Paragraph'
                    }]
                }]
            ]);
        }
    },
    
    // Rate limiting configuration
    rateLimiting: {
        enabled: {
            type: Boolean,
            default: true
        },
        maxTicketsPerUser: {
            type: Number,
            default: 3
        },
        cooldownMinutes: {
            type: Number,
            default: 30
        },
        rateLimitBypass: [{
            type: String // Role IDs that can bypass rate limits
        }]
    },
    
    // Auto-close configuration
    autoClose: {
        enabled: {
            type: Boolean,
            default: false
        },
        inactivityHours: {
            type: Number,
            default: 24
        },
        warningHours: {
            type: Number,
            default: 20 // Warn 4 hours before auto-close
        },
        excludeRoles: [{
            type: String // Role IDs to exclude from auto-close
        }]
    },
    
    // DM notifications configuration
    dmNotifications: {
        onOpen: {
            type: Boolean,
            default: true
        },
        onClose: {
            type: Boolean,
            default: true
        },
        onAssign: {
            type: Boolean,
            default: false
        },
        onResponse: {
            type: Boolean,
            default: false
        }
    },
    
    // Transcript configuration
    transcripts: {
        enabled: {
            type: Boolean,
            default: true
        },
        format: {
            type: String,
            enum: ['html', 'txt', 'json'],
            default: 'html'
        },
        includeImages: {
            type: Boolean,
            default: true
        },
        saveToChannel: {
            type: Boolean,
            default: true
        },
        deleteAfterDays: {
            type: Number,
            default: 30
        }
    },
    
    // Tagging system
    tags: [{
        name: {
            type: String,
            required: true
        },
        color: {
            type: String,
            default: '#99AAB5'
        },
        description: {
            type: String,
            default: null
        }
    }],
    
    // Logging configuration
    logging: {
        enabled: {
            type: Boolean,
            default: true
        },
        events: {
            ticketCreate: {
                type: Boolean,
                default: true
            },
            ticketClose: {
                type: Boolean,
                default: true
            },
            ticketDelete: {
                type: Boolean,
                default: true
            },
            ticketAssign: {
                type: Boolean,
                default: true
            },
            ticketReopen: {
                type: Boolean,
                default: true
            }
        }
    },
    
    // System settings
    settings: {
        maxOpenTicketsPerUser: {
            type: Number,
            default: 5
        },
        requireReason: {
            type: Boolean,
            default: true
        },
        pingStaffOnCreate: {
            type: Boolean,
            default: true
        },
        deleteClosedAfterDays: {
            type: Number,
            default: 7
        }
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field on save
ticketConfigSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('TicketConfig', ticketConfigSchema);
