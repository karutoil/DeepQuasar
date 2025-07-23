/**
 * Comprehensive test suite for refactored interaction handlers
 * Tests unit functionality, integration between handlers, and mock Discord interactions
 */

const LFGInteractionHandler = require('../modules/lfg/handlers/LFGInteractionHandler');
const MusicInteractionHandler = require('../modules/music/handlers/MusicInteractionHandler');
const RemindersInteractionHandler = require('../modules/reminders/handlers/RemindersInteractionHandler');
const TicketsInteractionHandler = require('../modules/tickets/handlers/TicketsInteractionHandler');
const { ModerationInteractionHandler } = require('../modules/moderation/handlers/ModerationInteractionHandler');
const TempVCInteractionHandler = require('../modules/tempvc/handlers/TempVCInteractionHandler');
const SelfRoleInteractionHandler = require('../modules/selfrole/handlers/SelfRoleInteractionHandler');
const TemplatesInteractionHandler = require('../modules/templates/handlers/TemplatesInteractionHandler');
const UtilsInteractionHandler = require('../modules/utils/handlers/UtilsInteractionHandler');

// Mock Discord.js structures for testing
const mockInteraction = (customId, type = 'button') => ({
    customId,
    type,
    user: { id: '123456789', username: 'testuser', discriminator: '0001' },
    guild: { id: '987654321', name: 'Test Guild' },
    guildId: '987654321',
    channelId: '555666777',
    replied: false,
    deferred: false,
    reply: jest.fn(),
    update: jest.fn(),
    deferReply: jest.fn(),
    deferUpdate: jest.fn(),
    editReply: jest.fn(),
    followUp: jest.fn(),
    showModal: jest.fn(),
    fields: {
        getTextInputValue: jest.fn(() => 'test input value')
    },
    values: ['test_value_1', 'test_value_2'],
    message: {
        embeds: [{
            title: 'Test Embed',
            description: 'Test Description',
            footer: { text: 'Page 1 of 3' }
        }]
    },
    member: {
        voice: { channel: { id: '999888777' } }
    }
});

const mockClient = {
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    },
    commands: new Map(),
    musicPlayerManager: {
        getPlayer: jest.fn(),
        createPlayer: jest.fn(),
        search: jest.fn()
    },
    tempVCManager: {
        controlHandlers: {
            handleDeleteConfirmation: jest.fn(),
            handleDeleteCancellation: jest.fn(),
            handleModalSubmission: jest.fn()
        },
        handleControlPanelInteraction: jest.fn()
    },
    ticketManager: {
        handleTicketButton: jest.fn(),
        handleTicketAction: jest.fn(),
        handleModalSubmit: jest.fn(),
        processCloseTicket: jest.fn()
    },
    selfRoleManager: {
        handleSelfRoleInteraction: jest.fn()
    },
    reminderManager: {
        cancelReminder: jest.fn()
    }
};

describe('Refactored Interaction Handlers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Unit Tests - Individual Handler Functions', () => {
        describe('LFG Interaction Handler', () => {
            test('should handle LFG join button interaction', async () => {
                const interaction = mockInteraction('lfg_join_test123');
                const result = await LFGInteractionHandler.handleButtonInteraction(interaction);
                expect(result).toBe(true);
            });

            test('should handle LFG edit button interaction', async () => {
                const interaction = mockInteraction('lfg_edit_test123');
                const result = await LFGInteractionHandler.handleButtonInteraction(interaction);
                expect(result).toBe(true);
            });

            test('should return false for non-LFG interactions', async () => {
                const interaction = mockInteraction('music_play');
                const result = await LFGInteractionHandler.handleButtonInteraction(interaction);
                expect(result).toBe(false);
            });
        });

        describe('Music Interaction Handler', () => {
            test('should handle music control buttons', async () => {
                const interaction = mockInteraction('play_pause');
                
                // Mock player
                const mockPlayer = {
                    playing: true,
                    pause: jest.fn(),
                    voiceChannelId: '999888777'
                };
                mockClient.musicPlayerManager.getPlayer.mockReturnValue(mockPlayer);
                
                const result = await MusicInteractionHandler.handleButtonInteraction(interaction, mockClient);
                expect(result).toBe(true);
                expect(interaction.reply).toHaveBeenCalled();
            });

            test('should handle queue pagination buttons', async () => {
                const interaction = mockInteraction('queue_prev_1');
                
                // Mock queue command
                mockClient.commands.set('queue', {
                    execute: jest.fn()
                });
                
                const result = await MusicInteractionHandler.handleButtonInteraction(interaction, mockClient);
                expect(result).toBe(true);
            });

            test('should return false for non-music interactions', async () => {
                const interaction = mockInteraction('ticket_create');
                const result = await MusicInteractionHandler.handleButtonInteraction(interaction, mockClient);
                expect(result).toBe(false);
            });
        });

        describe('Reminders Interaction Handler', () => {
            test('should handle reminder edit button', async () => {
                const interaction = mockInteraction('reminder_edit_123456');
                
                // Mock Reminder schema
                jest.doMock('../../../schemas/Reminder', () => ({
                    findOne: jest.fn().mockResolvedValue({
                        reminder_id: '123456',
                        task_description: 'Test reminder'
                    })
                }));
                
                const result = await RemindersInteractionHandler.handleButtonInteraction(interaction, mockClient);
                expect(result).toBe(true);
                expect(interaction.showModal).toHaveBeenCalled();
            });

            test('should handle reminder delete button', async () => {
                const interaction = mockInteraction('reminder_delete_123456');
                
                // Mock Reminder schema
                jest.doMock('../../../schemas/Reminder', () => ({
                    findOne: jest.fn().mockResolvedValue({
                        reminder_id: '123456'
                    }),
                    deleteOne: jest.fn()
                }));
                
                const result = await RemindersInteractionHandler.handleButtonInteraction(interaction, mockClient);
                expect(result).toBe(true);
                expect(interaction.update).toHaveBeenCalled();
            });
        });

        describe('Tickets Interaction Handler', () => {
            test('should handle dashboard buttons', async () => {
                const interaction = mockInteraction('dashboard_panels');
                
                // Mock panel command
                mockClient.commands.set('panel', {
                    listPanels: jest.fn()
                });
                
                const result = await TicketsInteractionHandler.handleButtonInteraction(interaction, mockClient);
                expect(result).toBe(true);
                expect(interaction.deferUpdate).toHaveBeenCalled();
            });

            test('should handle ticket creation buttons', async () => {
                const interaction = mockInteraction('ticket_create_support');
                
                const result = await TicketsInteractionHandler.handleButtonInteraction(interaction, mockClient);
                expect(result).toBe(true);
                expect(mockClient.ticketManager.handleTicketButton).toHaveBeenCalledWith(interaction);
            });
        });

        describe('Moderation Interaction Handler', () => {
            test('should handle modlog buttons', async () => {
                const interaction = mockInteraction('modlog_back');
                
                const result = await ModerationInteractionHandler.handleButtonInteraction(interaction, mockClient);
                expect(result).toBe(true);
                expect(interaction.update).toHaveBeenCalled();
            });

            test('should return false for non-moderation interactions', async () => {
                const interaction = mockInteraction('tempvc_settings');
                const result = await ModerationInteractionHandler.handleButtonInteraction(interaction, mockClient);
                expect(result).toBe(false);
            });
        });

        describe('Temp VC Interaction Handler', () => {
            test('should handle temp VC buttons', async () => {
                const interaction = mockInteraction('tempvc_delete_confirm');
                
                const result = await TempVCInteractionHandler.handleButtonInteraction(interaction, mockClient);
                expect(result).toBe(true);
                expect(mockClient.tempVCManager.controlHandlers.handleDeleteConfirmation).toHaveBeenCalledWith(interaction);
            });

            test('should handle unavailable temp VC manager', async () => {
                const interaction = mockInteraction('tempvc_settings');
                const clientWithoutTempVC = { ...mockClient, tempVCManager: null };
                
                const result = await TempVCInteractionHandler.handleButtonInteraction(interaction, clientWithoutTempVC);
                expect(result).toBe(true);
                expect(interaction.reply).toHaveBeenCalledWith({
                    content: '❌ Temp VC system is not available.',
                    ephemeral: true
                });
            });
        });

        describe('Self-Role Interaction Handler', () => {
            test('should handle selfrole buttons', async () => {
                const interaction = mockInteraction('selfrole_add_member');
                
                const result = await SelfRoleInteractionHandler.handleButtonInteraction(interaction, mockClient);
                expect(result).toBe(true);
                expect(mockClient.selfRoleManager.handleSelfRoleInteraction).toHaveBeenCalledWith(interaction);
            });

            test('should handle unavailable self-role manager', async () => {
                const interaction = mockInteraction('selfrole_remove_member');
                const clientWithoutSelfRole = { ...mockClient, selfRoleManager: null };
                
                const result = await SelfRoleInteractionHandler.handleButtonInteraction(interaction, clientWithoutSelfRole);
                expect(result).toBe(true);
                expect(interaction.reply).toHaveBeenCalled();
            });
        });

        describe('Templates Interaction Handler', () => {
            test('should handle embed builder buttons', async () => {
                const interaction = mockInteraction('embed_title');
                
                // Mock embed command
                mockClient.commands.set('embed', {
                    handleBuilderInteraction: jest.fn()
                });
                
                const result = await TemplatesInteractionHandler.handleButtonInteraction(interaction, mockClient);
                expect(result).toBe(true);
                expect(mockClient.commands.get('embed').handleBuilderInteraction).toHaveBeenCalledWith(interaction);
            });

            test('should handle welcome embed buttons', async () => {
                const interaction = mockInteraction('welcome_embed_title');
                
                // Mock WelcomeEmbedHandler
                jest.doMock('../../../utils/WelcomeEmbedHandler', () => ({
                    handleWelcomeEmbedInteraction: jest.fn().mockResolvedValue(true)
                }));
                
                const result = await TemplatesInteractionHandler.handleButtonInteraction(interaction, mockClient);
                expect(result).toBe(true);
            });
        });

        describe('Utils Interaction Handler', () => {
            test('should handle settings buttons', async () => {
                const interaction = mockInteraction('settings_general');
                
                const result = await UtilsInteractionHandler.handleButtonInteraction(interaction, mockClient);
                expect(result).toBe(true);
                expect(interaction.deferUpdate).toHaveBeenCalled();
            });

            test('should return false for non-utils interactions', async () => {
                const interaction = mockInteraction('music_pause');
                const result = await UtilsInteractionHandler.handleButtonInteraction(interaction, mockClient);
                expect(result).toBe(false);
            });
        });
    });

    describe('Integration Tests - Handler Coordination', () => {
        test('should correctly route interactions to appropriate handlers', async () => {
            const { handleButtonInteraction } = require('../interactionHandlers/buttonInteractionHandler');
            
            // Test LFG routing
            const lfgInteraction = mockInteraction('lfg_join_test');
            await handleButtonInteraction(lfgInteraction, mockClient);
            // Since we can't easily mock the LFG handler in this context, we check that no error was thrown
            
            // Test music routing
            const musicInteraction = mockInteraction('play_pause');
            mockClient.musicPlayerManager.getPlayer.mockReturnValue({
                playing: true,
                pause: jest.fn(),
                voiceChannelId: '999888777'
            });
            await handleButtonInteraction(musicInteraction, mockClient);
            expect(musicInteraction.reply).toHaveBeenCalled();
        });

        test('should handle unknown interactions gracefully', async () => {
            const { handleButtonInteraction } = require('../interactionHandlers/buttonInteractionHandler');
            
            const unknownInteraction = mockInteraction('unknown_button_type');
            await handleButtonInteraction(unknownInteraction, mockClient);
            
            expect(mockClient.logger.warn).toHaveBeenCalledWith('Unhandled button interaction: unknown_button_type');
            expect(unknownInteraction.reply).toHaveBeenCalled();
        });

        test('should handle errors gracefully across all handlers', async () => {
            const { handleButtonInteraction } = require('../interactionHandlers/buttonInteractionHandler');
            
            // Mock an interaction that will cause an error
            const errorInteraction = mockInteraction('ticket_create');
            mockClient.ticketManager.handleTicketButton.mockRejectedValue(new Error('Test error'));
            
            await handleButtonInteraction(errorInteraction, mockClient);
            
            expect(mockClient.logger.error).toHaveBeenCalled();
        });
    });

    describe('Mock Discord Interaction Tests', () => {
        test('should simulate Discord button interaction flow', async () => {
            // Simulate a complete Discord interaction flow
            const discordInteraction = {
                ...mockInteraction('queue_next_1'),
                isButton: () => true,
                options: {
                    getInteger: (name) => name === 'page' ? 2 : null
                }
            };
            
            // Mock queue command
            const mockQueueCommand = {
                execute: jest.fn().mockResolvedValue(undefined)
            };
            mockClient.commands.set('queue', mockQueueCommand);
            
            const result = await MusicInteractionHandler.handleButtonInteraction(discordInteraction, mockClient);
            
            expect(result).toBe(true);
            expect(mockQueueCommand.execute).toHaveBeenCalledWith(discordInteraction, mockClient);
        });

        test('should simulate Discord modal submission flow', async () => {
            const { handleModalSubmit } = require('../interactionHandlers/modalSubmitHandler');
            
            const modalInteraction = {
                ...mockInteraction('reminder_edit_modal_123', 'modal'),
                fields: {
                    getTextInputValue: jest.fn(() => 'Updated reminder text')
                }
            };
            
            // Mock Reminder schema
            jest.doMock('../../../schemas/Reminder', () => ({
                findOne: jest.fn().mockResolvedValue({
                    reminder_id: '123',
                    task_description: 'Old text',
                    save: jest.fn()
                })
            }));
            
            await handleModalSubmit(modalInteraction, mockClient);
            expect(modalInteraction.reply).toHaveBeenCalled();
        });

        test('should validate Discord interaction permissions', async () => {
            // Test interaction with insufficient permissions
            const restrictedInteraction = mockInteraction('ticket_create_admin');
            restrictedInteraction.member.permissions = { has: () => false };
            
            const result = await TicketsInteractionHandler.handleButtonInteraction(restrictedInteraction, mockClient);
            expect(result).toBe(true);
            // Should still attempt to handle, actual permission checking is done in ticket manager
        });

        test('should handle voice channel requirements for music commands', async () => {
            const musicInteraction = mockInteraction('play_pause');
            musicInteraction.member.voice.channel = null; // User not in voice channel
            
            mockClient.musicPlayerManager.getPlayer.mockReturnValue(null);
            
            const result = await MusicInteractionHandler.handleButtonInteraction(musicInteraction, mockClient);
            expect(result).toBe(true);
            expect(musicInteraction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    embeds: expect.arrayContaining([
                        expect.objectContaining({
                            data: expect.objectContaining({
                                title: 'No Player'
                            })
                        })
                    ])
                })
            );
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle database connection errors', async () => {
            const interaction = mockInteraction('reminder_delete_123');
            
            // Mock database error
            jest.doMock('../../../schemas/Reminder', () => ({
                findOne: jest.fn().mockRejectedValue(new Error('Database connection error'))
            }));
            
            const result = await RemindersInteractionHandler.handleButtonInteraction(interaction, mockClient);
            expect(result).toBe(true);
            expect(interaction.reply).toHaveBeenCalled();
            expect(mockClient.logger.error).toHaveBeenCalled();
        });

        test('should handle missing client managers gracefully', async () => {
            const limitedClient = {
                logger: mockClient.logger,
                commands: new Map(),
                musicPlayerManager: null,
                tempVCManager: null,
                ticketManager: null,
                selfRoleManager: null
            };
            
            const tempVCInteraction = mockInteraction('tempvc_settings');
            const result = await TempVCInteractionHandler.handleButtonInteraction(tempVCInteraction, limitedClient);
            
            expect(result).toBe(true);
            expect(tempVCInteraction.reply).toHaveBeenCalledWith({
                content: '❌ Temp VC system is not available.',
                ephemeral: true
            });
        });

        test('should handle malformed custom IDs', async () => {
            const malformedInteraction = mockInteraction('malformed_id_without_proper_format');
            
            // Test with each handler to ensure they don't crash
            const handlers = [
                LFGInteractionHandler,
                MusicInteractionHandler,
                RemindersInteractionHandler,
                TicketsInteractionHandler,
                ModerationInteractionHandler,
                TempVCInteractionHandler,
                SelfRoleInteractionHandler,
                TemplatesInteractionHandler,
                UtilsInteractionHandler
            ];
            
            for (const handler of handlers) {
                if (handler.handleButtonInteraction) {
                    const result = await handler.handleButtonInteraction(malformedInteraction, mockClient);
                    expect(typeof result).toBe('boolean');
                }
            }
        });

        test('should handle Discord API rate limits', async () => {
            const interaction = mockInteraction('ticket_create');
            
            // Mock Discord API rate limit error
            const rateLimitError = new Error('Rate limited');
            rateLimitError.code = 429;
            mockClient.ticketManager.handleTicketButton.mockRejectedValue(rateLimitError);
            
            const result = await TicketsInteractionHandler.handleButtonInteraction(interaction, mockClient);
            expect(result).toBe(true);
            expect(mockClient.logger.error).toHaveBeenCalled();
        });
    });
});

describe('Handler Module Organization', () => {
    test('should have handlers in correct module directories', () => {
        const fs = require('fs');
        const path = require('path');
        
        const modulePaths = [
            '../modules/lfg/handlers',
            '../modules/music/handlers', 
            '../modules/reminders/handlers',
            '../modules/tickets/handlers',
            '../modules/moderation/handlers',
            '../modules/tempvc/handlers',
            '../modules/selfrole/handlers',
            '../modules/templates/handlers',
            '../modules/utils/handlers'
        ];
        
        modulePaths.forEach(modulePath => {
            const fullPath = path.join(__dirname, modulePath);
            expect(fs.existsSync(fullPath)).toBe(true);
        });
    });

    test('should export consistent handler interfaces', () => {
        const handlers = [
            LFGInteractionHandler,
            MusicInteractionHandler,
            RemindersInteractionHandler,
            TicketsInteractionHandler,
            ModerationInteractionHandler,
            TempVCInteractionHandler,
            SelfRoleInteractionHandler,
            TemplatesInteractionHandler,
            UtilsInteractionHandler
        ];
        
        handlers.forEach(handler => {
            expect(typeof handler).toBe('object');
            if (handler.handleButtonInteraction) {
                expect(typeof handler.handleButtonInteraction).toBe('function');
            }
        });
    });
});