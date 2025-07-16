const Guild = require('../schemas/Guild');
const ModLog = require('../schemas/ModLog');
const PunishmentLog = require('../schemas/PunishmentLog');
const TempVC = require('../schemas/TempVC');
const TempVCInstance = require('../schemas/TempVCInstance');
const TempVCUserSettings = require('../schemas/TempVCUserSettings');
const TicketConfig = require('../schemas/TicketConfig');
const UserNotes = require('../schemas/UserNotes');

async function cleanupGuildData(guildId, logger = console) {
    try {
        const results = await Promise.all([
            Guild.deleteOne({ guildId }),
            ModLog.deleteMany({ guildId }),
            PunishmentLog.deleteMany({ guildId }),
            TempVC.deleteMany({ guildId }),
            TempVCInstance.deleteMany({ guildId }),
            TempVCUserSettings.deleteMany({ guildId }),
            TicketConfig.deleteMany({ guildId }),
            UserNotes.deleteMany({ guildId }),
        ]);
        logger.info
            ? logger.info(`[GuildCleanup] Deleted all data for guild ${guildId}. Results:`, results)
            : console.log(`[GuildCleanup] Deleted all data for guild ${guildId}. Results:`, results);
    } catch (err) {
        logger.error
            ? logger.error(`[GuildCleanup] Error deleting data for guild ${guildId}:`, err)
            : console.error(`[GuildCleanup] Error deleting data for guild ${guildId}:`, err);
    }
}

module.exports = { cleanupGuildData };
