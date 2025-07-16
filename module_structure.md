# Project Module Structure (Discord.js Bot)

This document outlines the modular breakdown of the `/src` directory for a Discord.js bot, detailing the hierarchy of modules and the files contained within each.

## Module Listing:

### `/src` (Root Module)
- Files:
    - `/src/clear-commands.js`
    - `/src/deploy-commands-improved.js`
    - `/src/deploy-commands.js`
    - `/src/index-debug.js`
    - `/src/index.js`
    - `/src/reminderManager.js`
- Sub-modules:
    - `commands`
    - `config`
    - `events`
    - `handlers`
    - `interactionHandlers`
    - `schemas`
    - `utils`

### `commands` Module
- Sub-modules:
    - `ai`
    - `information`
    - `lfg`
    - `moderation`
    - `music`
    - `settings`
    - `tempvc`
    - `tickets`
    - `utility`

#### `ai` Sub-module (within `commands`)
- Files:
    - `/src/commands/ai/ask.js`
    - `/src/commands/ai/chatbot.js`

#### `information` Sub-module (within `commands`)
- Files:
    - `/src/commands/information/globalstats.js`
    - `/src/commands/information/help.js`
    - `/src/commands/information/linecount.js`
    - `/src/commands/information/selfrole-help.js`
    - `/src/commands/information/stats.js`

#### `lfg` Sub-module (within `commands`)
- Files:
    - `/src/commands/lfg/lfg-admin.js`
    - `/src/commands/lfg/lfg-channels.js`
    - `/src/commands/lfg/lfg-presets.js`
    - `/src/commands/lfg/lfg-setup.js`
    - `/src/commands/lfg/lfg-test.js`
    - `/src/commands/lfg/lfg.js`
    - `/src/commands/lfg/my-lfg.js`

#### `moderation` Sub-module (within `commands`)
- Files:
    - `/src/commands/moderation/appeal.js`
    - `/src/commands/moderation/ban.js`
    - `/src/commands/moderation/kick.js`
    - `/src/commands/moderation/lock.js`
    - `/src/commands/moderation/modhistory.js`
    - `/src/commands/moderation/mute.js`
    - `/src/commands/moderation/note.js`
    - `/src/commands/moderation/pardon.js`
    - `/src/commands/moderation/reason.js`
    - `/src/commands/moderation/setup-moderation.js`
    - `/src/commands/moderation/slowmode.js`
    - `/src/commands/moderation/softban.js`
    - `/src/commands/moderation/strike.js`
    - `/src/commands/moderation/unban.js`
    - `/src/commands/moderation/unlock.js`
    - `/src/commands/moderation/unmute.js`
    - `/src/commands/moderation/warn.js`
    - `/src/commands/moderation/warnlist.js`

#### `music` Sub-module (within `commands`)
- Files:
    - `/src/commands/music/filters.js`
    - `/src/commands/music/history.js`
    - `/src/commands/music/loop.js`
    - `/src/commands/music/nowplaying.js`
    - `/src/commands/music/pause.js`
    - `/src/commands/music/play.js`
    - `/src/commands/music/queue.js`
    - `/src/commands/music/resume.js`
    - `/src/commands/music/search.js`
    - `/src/commands/music/seek.js`
    - `/src/commands/music/skip.js`
    - `/src/commands/music/stop.js`
    - `/src/commands/music/volume.js`
    - `/src/utils/MusicPlayerManager.js`

#### `settings` Sub-module (within `commands`)
- Files:
    - `/src/commands/settings/autorole.js`
    - `/src/commands/settings/cleanup.js`
    - `/src/commands/settings/create-guild-data.js`
    - `/src/commands/settings/debug-welcome.js`
    - `/src/commands/settings/embed-builder.js`
    - `/src/commands/settings/modlog.js`
    - `/src/commands/settings/selfrole-advanced.js`
    - `/src/commands/settings/selfrole-setup.js`
    - `/src/commands/settings/selfrole.js`
    - `/src/commands/settings/settings.js`
    - `/src/commands/settings/templates.js`
    - `/src/commands/settings/test-welcome.js`
    - `/src/commands/settings/welcome.js`

#### `tempvc` Sub-module (within `commands`)
- Files:
    - `/src/commands/tempvc/list.js`
    - `/src/commands/tempvc/templates.js`
    - `/src/commands/tempvc/tempvc.js`
    - `/src/commands/tempvc/vc.js`

#### `tickets` Sub-module (within `commands`)
- Files:
    - `/src/commands/tickets/canned-response.js`
    - `/src/commands/tickets/config.js`
    - `/src/commands/tickets/dashboard.js`
    - `/src/commands/tickets/fix-tickets.js`
    - `/src/commands/tickets/mytickets.js`
    - `/src/commands/tickets/panel.js`
    - `/src/commands/tickets/ticket.js`

#### `utility` Sub-module (within `commands`)
- Files:
    - `/src/commands/utility/remind.js`
    - `/src/commands/utility/reminders.js`

### `config` Module
- Files:
    - `/src/config/bot.js`

### `events` Module
- Files:
    - `/src/events/guildCreate.js`
    - `/src/events/guildDelete.js`
    - `/src/events/guildMemberAdd.js`
    - `/src/events/guildMemberRemove.js`
    - `/src/events/guildMemberUpdate.js`
    - `/src/events/interactionCreate.js`
    - `/src/events/inviteCreate.js`
    - `/src/events/inviteDelete.js`
    - `/src/events/messageCreate.js`
    - `/src/events/messageDelete.js`
    - `/src/events/messageUpdate.js`
    - `/src/events/ready.js`
    - `/src/events/voiceStateUpdate.js`
- Sub-modules:
    - `modlog`
    - `tempvc`

#### `modlog` Sub-module (within `events`)
- Files:
    - `/src/events/modlog/channelCreate.js`
    - `/src/events/modlog/channelDelete.js`
    - `/src/events/modlog/channelUpdate.js`
    - `/src/events/modlog/emojiCreate.js`
    - `/src/events/modlog/emojiDelete.js`
    - `/src/events/modlog/guildBanAdd.js`
    - `/src/events/modlog/guildBanRemove.js`
    - `/src/events/modlog/guildMemberAdd.js`
    - `/src/events/modlog/guildMemberRemove.js`
    - `/src/events/modlog/guildMemberUpdate.js`
    - `/src/events/modlog/guildUpdate.js`
    - `/src/events/modlog/inviteCreate.js`
    - `/src/events/modlog/inviteDelete.js`
    - `/src/events/modlog/messageDelete.js`
    - `/src/events/modlog/messageDeleteBulk.js`
    - `/src/events/modlog/messageReactionAdd.js`
    - `/src/events/modlog/messageReactionRemove.js`
    - `/src/events/modlog/messageUpdate.js`
    - `/src/events/modlog/roleCreate.js`
    - `/src/events/modlog/roleDelete.js`
    - `/src/events/modlog/roleUpdate.js`
    - `/src/events/modlog/threadCreate.js`
    - `/src/events/modlog/threadDelete.js`
    - `/src/events/modlog/userUpdate.js`
    - `/src/events/modlog/voiceStateUpdate.js`

#### `tempvc` Sub-module (within `events`)
- Files:
    - `/src/events/tempvc/voiceStateUpdate.js`

### `handlers` Module
- Files:
    - `/src/handlers/commandHandler.js`
    - `/src/handlers/eventHandler.js`
- Sub-modules:
    - `lfg`

#### `lfg` Sub-module (within `handlers`)
- Files:
    - `/src/handlers/lfg/LFGCleanupTask.js`
    - `/src/handlers/lfg/LFGMessageHandler.js`

### `interactionHandlers` Module
- Files:
    - `/src/interactionHandlers/autocompleteHandler.js`
    - `/src/interactionHandlers/buttonInteractionHandler.js`
    - `/src/interactionHandlers/modalSubmitHandler.js`
    - `/src/interactionHandlers/selectMenuInteractionHandler.js`
    - `/src/interactionHandlers/slashCommandHandler.js`
    - `/src/interactionHandlers/ticketAssignModalHandler.js`
- Sub-modules:
    - `lfg`

#### `lfg` Sub-module (within `interactionHandlers`)
- Files:
    - `/src/interactionHandlers/lfg/LFGInteractionHandler.js`

### `schemas` Module
- Files:
    - `/src/schemas/Appeals.js`
    - `/src/schemas/EmbedTemplate.js`
    - `/src/schemas/Guild.js`
    - `/src/schemas/LFGCooldown.js`
    - `/src/schemas/LFGPost.js`
    - `/src/schemas/LFGSettings.js`
    - `/src/schemas/ModerationSettings.js`
    - `/src/schemas/ModLog.js`
    - `/src/schemas/PunishmentLog.js`
    - `/src/schemas/Reminder.js`
    - `/src/schemas/SelfRole.js`
    - `/src/schemas/TempVC.js`
    - `/src/schemas/TempVCInstance.js`
    - `/src/schemas/TempVCUserSettings.js`
    - `/src/schemas/Ticket.js`
    - `/src/schemas/TicketConfig.js`
    - `/src/schemas/User.js`
    - `/src/schemas/UserNotes.js`

### `utils` Module
- Files:
    - `/src/utils/AntiRaidModule.js`
    - `/src/utils/AutoRoleManager.js`
    - `/src/utils/ChatBot.js`
    - `/src/utils/deployCommands.js`
    - `/src/utils/EmbedBuilderHandler.js`
    - `/src/utils/LFGUtils.js`
    - `/src/utils/logger.js`
    - `/src/utils/ModerationUtils.js`
    - `/src/utils/ModLogManager.js`
    - `/src/utils/ProfanityFilter.js`
    - `/src/utils/SelfRoleManager.js`
    - `/src/utils/smartDeploy.js`
    - `/src/utils/TempVCControlHandlers.js`
    - `/src/utils/TempVCManager.js`
    - `/src/utils/TicketManager.js`
    - `/src/utils/timeParser.js`
    - `/src/utils/TranscriptGenerator.js`
    - `/src/utils/utils.js`
    - `/src/utils/WelcomeEmbedHandler.js`
    - `/src/utils/WelcomeSystem.js`
- Sub-modules:
    - `tempvc`

#### `tempvc` Sub-module (within `utils`)
- Files:
    - `/src/utils/tempvc/banUnbanHandlers.js`
    - `/src/utils/tempvc/bitrateHandler.js`
    - `/src/utils/tempvc/deleteResetHandlers.js`
    - `/src/utils/tempvc/kickHandlers.js`
    - `/src/utils/tempvc/lockHideHandlers.js`
    - `/src/utils/tempvc/menuHandler.js`
    - `/src/utils/tempvc/permissionManagementHandlers.js`
    - `/src/utils/tempvc/regionHandler.js`
    - `/src/utils/tempvc/renameHandler.js`
    - `/src/utils/tempvc/transferHandler.js`
    - `/src/utils/tempvc/userLimitHandler.js`
    
# Music Module Structure

## Commands
- `filters.js`: Handles audio filter application.
- `history.js`: Displays and interacts with user play history.
- `play.js`: Plays songs or playlists based on user input.
- `queue.js`: Displays the current music queue with pagination.
- `seek.js`: Seeks to a specific position in the current track.

## Utilities
- `MusicPlayerManager.js`: Manages music player instances and interactions.
- `utils.js`: Provides helper functions for formatting durations, permissions checks, and other common tasks.

## Schemas
- `Guild.js`: Stores guild-specific settings, including music configurations and premium features.
- `User.js`: Stores user data, including play history, preferences, and favorites.

## Observations
The module is well-structured but could benefit from additional abstraction and optimization for scalability. The schemas provide a solid foundation but require stricter validation rules to ensure data integrity.
