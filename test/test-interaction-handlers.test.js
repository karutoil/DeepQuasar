const { execute } = require('../src/events/interactionCreate');

// Mock the individual handler modules
jest.mock('../src/events/interactions/slashCommandHandler', () => ({
    handleSlashCommand: jest.fn(),
}));
jest.mock('../src/events/interactions/autocompleteHandler', () => ({
    handleAutocomplete: jest.fn(),
}));
jest.mock('../src/events/interactions/buttonInteractionHandler', () => ({
    handleButtonInteraction: jest.fn(),
}));
jest.mock('../src/events/interactions/selectMenuInteractionHandler', () => ({
    handleSelectMenuInteraction: jest.fn(),
}));
jest.mock('../src/events/interactions/modalSubmitHandler', () => ({
    handleModalSubmit: jest.fn(),
}));

// Import the mocked functions
const { handleSlashCommand } = require('../src/events/interactions/slashCommandHandler');
const { handleAutocomplete } = require('../src/events/interactions/autocompleteHandler');
const { handleButtonInteraction } = require('../src/events/interactions/buttonInteractionHandler');
const { handleSelectMenuInteraction } = require('../src/events/interactions/selectMenuInteractionHandler');
const { handleModalSubmit } = require('../src/events/interactions/modalSubmitHandler');

describe('interactionCreate event handler', () => {
    let mockClient;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Basic mock client object
        mockClient = {
            commands: new Map(),
            logger: {
                command: jest.fn(),
                error: jest.fn(),
                debug: jest.fn(),
            },
            musicPlayerManager: {}, // Add if needed by specific handlers
            ticketManager: {}, // Add if needed by specific handlers
            tempVCManager: {}, // Add if needed by specific handlers
            config: {
                bot: {
                    premiumCommandCooldown: 0,
                    commandCooldown: 0,
                }
            },
            searchResults: new Map(),
        };

        // Mock Utils functions if handleSlashCommand needs them
        // This mock needs to be outside of the test case if it's used by multiple tests
        // or if the module is imported before the test case runs.
        // For simplicity, I'll put it here, but in a real scenario, it might be better
        // to mock it globally or per describe block if it's a common dependency.
        jest.mock('../src/utils/utils', () => ({
            createErrorEmbed: jest.fn(() => ({ type: 'error' })),
            createWarningEmbed: jest.fn(() => ({ type: 'warning' })),
            getGuildData: jest.fn(() => ({
                isPremium: () => false,
                commandSettings: { disabledCommands: [], commandChannels: [] },
                incrementStats: jest.fn(),
                save: jest.fn(),
            })),
            getUserData: jest.fn(() => ({
                stats: { commandsUsed: 0, lastActive: new Date() },
                save: jest.fn(),
            })),
            checkPermissions: jest.fn(() => ({ hasPermission: true })),
            checkCooldown: jest.fn(() => ({ onCooldown: false })),
            createEmbed: jest.fn(),
            createInfoEmbed: jest.fn(),
            createSuccessEmbed: jest.fn(),
            checkVoiceChannel: jest.fn(() => ({ inVoice: true, channel: { id: 'voiceChannelId' } })),
        }));
    });

    test('should call handleSlashCommand for chat input commands', async () => {
        const mockInteraction = {
            isChatInputCommand: () => true,
            isAutocomplete: () => false,
            isButton: () => false,
            isAnySelectMenu: () => false,
            isModalSubmit: () => false,
            commandName: 'testCommand',
            user: { id: '123', username: 'testuser', discriminator: '0000' },
            guildId: '456',
            guild: { name: 'testguild' },
            options: { data: [] },
            inGuild: () => true,
            reply: jest.fn(),
            deferred: false,
            replied: false,
        };

        // Mock a command for handleSlashCommand to find
        mockClient.commands.set('testCommand', {
            execute: jest.fn(),
            permissions: [],
        });

        await execute(mockInteraction, mockClient);

        expect(handleSlashCommand).toHaveBeenCalledTimes(1);
        expect(handleSlashCommand).toHaveBeenCalledWith(mockInteraction, mockClient);
        expect(handleAutocomplete).not.toHaveBeenCalled();
        expect(handleButtonInteraction).not.toHaveBeenCalled();
        expect(handleSelectMenuInteraction).not.toHaveBeenCalled();
        expect(handleModalSubmit).not.toHaveBeenCalled();
    });

    test('should call handleAutocomplete for autocomplete interactions', async () => {
        const mockInteraction = {
            isChatInputCommand: () => false,
            isAutocomplete: () => true,
            isButton: () => false,
            isAnySelectMenu: () => false,
            isModalSubmit: () => false,
            commandName: 'testAutocomplete',
            respond: jest.fn(),
            responded: false,
            deferred: false,
        };

        mockClient.commands.set('testAutocomplete', {
            autocomplete: jest.fn(),
        });

        await execute(mockInteraction, mockClient);

        expect(handleAutocomplete).toHaveBeenCalledTimes(1);
        expect(handleAutocomplete).toHaveBeenCalledWith(mockInteraction, mockClient);
        expect(handleSlashCommand).not.toHaveBeenCalled();
        expect(handleButtonInteraction).not.toHaveBeenCalled();
        expect(handleSelectMenuInteraction).not.toHaveBeenCalled();
        expect(handleModalSubmit).not.toHaveBeenCalled();
    });

    test('should call handleButtonInteraction for button interactions', async () => {
        const mockInteraction = {
            isChatInputCommand: () => false,
            isAutocomplete: () => false,
            isButton: () => true,
            isAnySelectMenu: () => false,
            isModalSubmit: () => false,
            customId: 'testButton',
            reply: jest.fn(),
            deferred: false,
            replied: false,
        };

        await execute(mockInteraction, mockClient);

        expect(handleButtonInteraction).toHaveBeenCalledTimes(1);
        expect(handleButtonInteraction).toHaveBeenCalledWith(mockInteraction, mockClient);
        expect(handleSlashCommand).not.toHaveBeenCalled();
        expect(handleAutocomplete).not.toHaveBeenCalled();
        expect(handleSelectMenuInteraction).not.toHaveBeenCalled();
        expect(handleModalSubmit).not.toHaveBeenCalled();
    });

    test('should call handleSelectMenuInteraction for select menu interactions', async () => {
        const mockInteraction = {
            isChatInputCommand: () => false,
            isAutocomplete: () => false,
            isButton: () => false,
            isAnySelectMenu: () => true,
            isModalSubmit: () => false,
            customId: 'testSelectMenu',
            reply: jest.fn(),
            deferred: false,
            replied: false,
        };

        await execute(mockInteraction, mockClient);

        expect(handleSelectMenuInteraction).toHaveBeenCalledTimes(1);
        expect(handleSelectMenuInteraction).toHaveBeenCalledWith(mockInteraction, mockClient);
        expect(handleSlashCommand).not.toHaveBeenCalled();
        expect(handleAutocomplete).not.toHaveBeenCalled();
        expect(handleButtonInteraction).not.toHaveBeenCalled();
        expect(handleModalSubmit).not.toHaveBeenCalled();
    });

    test('should call handleModalSubmit for modal submissions', async () => {
        const mockInteraction = {
            isChatInputCommand: () => false,
            isAutocomplete: () => false,
            isButton: () => false,
            isAnySelectMenu: () => false,
            isModalSubmit: () => true,
            customId: 'testModal',
            reply: jest.fn(),
            deferred: false,
            replied: false,
        };

        await execute(mockInteraction, mockClient);

        expect(handleModalSubmit).toHaveBeenCalledTimes(1);
        expect(handleModalSubmit).toHaveBeenCalledWith(mockInteraction, mockClient);
        expect(handleSlashCommand).not.toHaveBeenCalled();
        expect(handleAutocomplete).not.toHaveBeenCalled();
        expect(handleButtonInteraction).not.toHaveBeenCalled();
        expect(handleSelectMenuInteraction).not.toHaveBeenCalled();
    });
});