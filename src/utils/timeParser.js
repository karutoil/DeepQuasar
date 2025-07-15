const chrono = require('chrono-node');
const crypto = require('crypto');

/**
 * Parse natural language time strings to a UTC timestamp (ms)
 * Uses chrono-node for robust parsing.
 * Returns { timestamp, type } or null if invalid.
 */
function parseTime(input, timezone = 'UTC', now = new Date()) {
    input = input.trim();
    // Use chrono-node to parse
    const results = chrono.parse(input, now, { forwardDate: true });
    if (results && results.length > 0) {
        const result = results[0];
        let dt = result.date();
        // chrono-node already handles most formats and relative times.
        // If timezone is set, convert to that zone using luxon.
        if (timezone && timezone !== 'UTC') {
            try {
                const { DateTime } = require('luxon');
                dt = DateTime.fromJSDate(dt, { zone: timezone }).toJSDate();
            } catch (e) {
                // fallback: ignore timezone
            }
        }
        if (dt.getTime() > now.getTime()) {
            return {
                timestamp: dt.getTime(),
                type: result.start.isCertain('hour') ? 'absolute' : 'natural'
            };
        }
    }
    return null;
}

// Generate a unique reminder ID
function generateId() {
    return crypto.randomBytes(8).toString('hex');
}

// List of IANA timezones (for user selection, not exhaustive)
function getTimezones() {
    try {
        const { DateTime } = require('luxon');
        return DateTime.local().zoneName ? DateTime.local().zoneNames : [];
    } catch (e) {
        return [];
    }
}

module.exports = {
    parseTime,
    generateId,
    getTimezones
};
