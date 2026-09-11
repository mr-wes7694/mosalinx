const pool = require('../config/database');

// Maps API setting names to their corresponding MySQL columns.
const SETTING_COLUMNS = {
    notifyText: 'notify_text',
    notifyEmail: 'notify_email',
    notifyPush: 'notify_push',
    sidebarPosition: 'sidebar_position',
    theme: 'theme',
    fontSize: 'font_size',
    navSize: 'nav_size',
    altFont: 'alt_font',
    highlightedText: 'highlighted_text',
    highlightColor: 'highlight_color',
    highlightTextColor: 'highlight_text_color',
    moduleZoom: 'module_zoom',
    zoomShortcut: 'zoom_shortcut',
};

// Retrieve settings for the authenticated Mosalinx user.
const findUserSettingsByFirebaseUid = async (firebaseUid) => {
    const [rows] = await pool.query(
        `SELECT
            u.user_id,
            COALESCE(s.notify_text, FALSE) AS notify_text,
            COALESCE(s.notify_email, TRUE) AS notify_email,
            COALESCE(s.notify_push, FALSE) AS notify_push,
            COALESCE(s.sidebar_position, 'left') AS sidebar_position,
            COALESCE(s.theme, 'light') AS theme,
            COALESCE(s.font_size, 'Medium') AS font_size,
            COALESCE(s.nav_size, 'Small') AS nav_size,
            COALESCE(s.alt_font, 'Default') AS alt_font,
            COALESCE(s.highlighted_text, FALSE) AS highlighted_text,
            COALESCE(s.highlight_color, 'Yellow') AS highlight_color,
            COALESCE(s.highlight_text_color, 'Black') AS highlight_text_color,
            COALESCE(s.module_zoom, FALSE) AS module_zoom,
            COALESCE(s.zoom_shortcut, 'Ctrl + Click') AS zoom_shortcut
        FROM users u
        LEFT JOIN user_settings s
            ON s.user_id = u.user_id
        WHERE u.firebase_uid = ?
        LIMIT 1`,
        [firebaseUid]
    );

    return rows[0] || null;
};

// Create or partially update settings for the authenticated Mosalinx user.
const updateUserSettingsByFirebaseUid = async (firebaseUid, updates) => {
    const [userRows] = await pool.query(
        'SELECT user_id FROM users WHERE firebase_uid = ? LIMIT 1',
        [firebaseUid]
    );

    const user = userRows[0];

    if (!user) {
        return false;
    }

    const entries = Object.entries(updates);

    if (entries.length === 0) {
        return false;
    }

    const columns = ['user_id'];
    const placeholders = ['?'];
    const values = [user.user_id];
    const updateClauses = [];

    entries.forEach(([field, value]) => {
        const column = SETTING_COLUMNS[field];

        columns.push(column);
        placeholders.push('?');
        values.push(value);
        updateClauses.push(`${column} = VALUES(${column})`);
    });

    await pool.query(
        `INSERT INTO user_settings (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        ON DUPLICATE KEY UPDATE
            ${updateClauses.join(', ')}`,
        values
    );

    return true;
};

module.exports = {
    findUserSettingsByFirebaseUid,
    updateUserSettingsByFirebaseUid,
};
