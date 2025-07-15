const { DateTime } = require('luxon');
const crypto = require('crypto');

// Parse relative/absolute time strings to a UTC timestamp (ms)
function parseTime(input, timezone = 'UTC', now = new Date()) {
    input = input.trim();
    let dtNow = DateTime.fromJSDate(now, { zone: timezone });

    // Relative: "in 10m", "in 2h 30m", "in 1d"
    const relMatch = input.match(/^in\s+(.+)$/i);
    if (relMatch) {
        let totalMs = 0;
        const parts = relMatch[1].split(/\s+/);
        for (const part of parts) {
            const m = part.match(/^(\d+)([smhdw])$/i);
            if (!m) continue;
            const val = parseInt(m[1]);
            switch (m[2].toLowerCase()) {
                case 's': totalMs += val * 1000; break;
                case 'm': totalMs += val * 60 * 1000; break;
                case 'h': totalMs += val * 60 * 60 * 1000; break;
                case 'd': totalMs += val * 24 * 60 * 60 * 1000; break;
                case 'w': totalMs += val * 7 * 24 * 60 * 60 * 1000; break;
            }
        }
        if (totalMs > 0) {
            return {
                timestamp: dtNow.plus({ milliseconds: totalMs }).toMillis(),
                type: 'relative'
            };
        }
    }

    // Absolute: "on 2025-07-20 14:00", "on 07/25/2025 10:30 AM"
    const absMatch = input.match(/^on\s+(.+)$/i);
    if (absMatch) {
        let dateStr = absMatch[1].trim();

        // Try ISO: YYYY-MM-DD HH:MM
        let dt = DateTime.fromFormat(dateStr, 'yyyy-MM-dd HH:mm', { zone: timezone });
        if (!dt.isValid) {
            // Try US: MM/DD/YYYY HH:MM AM/PM
            dt = DateTime.fromFormat(dateStr, 'MM/dd/yyyy hh:mm a', { zone: timezone });
        }
        if (!dt.isValid) {
            // Try US: MM/DD/YYYY HH:MM
            dt = DateTime.fromFormat(dateStr, 'MM/dd/yyyy HH:mm', { zone: timezone });
        }
        if (!dt.isValid) {
            // Try ISO: YYYY-MM-DD
            dt = DateTime.fromFormat(dateStr, 'yyyy-MM-dd', { zone: timezone });
        }
        if (!dt.isValid) {
            // Try fallback: parse as ISO string
            dt = DateTime.fromISO(dateStr, { zone: timezone });
        }
        if (dt.isValid) {
            return {
                timestamp: dt.toMillis(),
                type: 'absolute'
            };
        }
    }

    // Fallback: try to parse as duration (e.g. "10m", "2h 30m")
    const fallbackRel = input.match(/^(\d+)([smhdw])(?:\s+(\d+)([smhdw]))?$/i);
    if (fallbackRel) {
        let totalMs = 0;
        for (let i = 1; i < fallbackRel.length; i += 2) {
            if (fallbackRel[i] && fallbackRel[i+1]) {
                const val = parseInt(fallbackRel[i]);
                switch (fallbackRel[i+1].toLowerCase()) {
                    case 's': totalMs += val * 1000; break;
                    case 'm': totalMs += val * 60 * 1000; break;
                    case 'h': totalMs += val * 60 * 60 * 1000; break;
                    case 'd': totalMs += val * 24 * 60 * 60 * 1000; break;
                    case 'w': totalMs += val * 7 * 24 * 60 * 60 * 1000; break;
                }
            }
        }
        if (totalMs > 0) {
            return {
                timestamp: dtNow.plus({ milliseconds: totalMs }).toMillis(),
                type: 'relative'
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
    return DateTime.local().zoneName ? DateTime.local().zoneNames : [];
}

module.exports = {
    parseTime,
    generateId,
    getTimezones
};
