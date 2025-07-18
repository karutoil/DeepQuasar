const cron = require('node-cron');
const LFGUtils = require('../../utils/LFGUtils');

class LFGCleanupTask {
    /**
     * Initialize the cleanup task
     */
    static init(client) {
        console.log('🧹 Initializing LFG cleanup task...');

        // Run cleanup every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            try {
                await LFGUtils.cleanupExpiredPosts(client);
            } catch (error) {
                console.error('Error in LFG cleanup task:', error);
            }
        });

        console.log('✅ LFG cleanup task initialized');
    }

    /**
     * Run cleanup immediately (for testing or manual cleanup)
     */
    static async runCleanup(client) {
        console.log('🧹 Running manual LFG cleanup...');
        await LFGUtils.cleanupExpiredPosts(client);
        console.log('✅ Manual LFG cleanup completed');
    }
}

module.exports = LFGCleanupTask;
