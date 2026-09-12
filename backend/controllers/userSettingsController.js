const {
    findUserSettingsByFirebaseUid,
    updateUserSettingsByFirebaseUid,
} = require('../models/userSettingsModel');

// Supported account settings and their accepted values.
const SETTING_RULES = {
    notifyText: (value) => typeof value === 'boolean',
    notifyEmail: (value) => typeof value === 'boolean',
    notifyPush: (value) => typeof value === 'boolean',

    sidebarPosition: (value) =>
        ['left', 'right', 'top', 'bottom'].includes(value),

    theme: (value) =>
        ['light', 'dark', 'teal', 'night'].includes(value),

    fontSize: (value) =>
        ['Small', 'Medium', 'Large'].includes(value),

    navSize: (value) =>
        ['Small', 'Medium', 'Large'].includes(value),

    altFont: (value) =>
        ['Default', 'Times New Roman', 'Comic Sans', 'Eras Bold'].includes(value),

    highlightedText: (value) => typeof value === 'boolean',

    highlightColor: (value) =>
        ['Black', 'White', 'Yellow', 'Red', 'Blue', 'Green'].includes(value),

    highlightTextColor: (value) =>
        ['Black', 'White', 'Yellow', 'Red', 'Blue', 'Green'].includes(value),

    moduleZoom: (value) => typeof value === 'boolean',

    zoomShortcut: (value) =>
        typeof value === 'string' &&
        value.trim().length > 0 &&
        value.length <= 100,
};

// Convert MySQL setting fields into the camelCase format used by the API.
const formatSettings = (settings) => ({
    notifyText: Boolean(settings.notify_text),
    notifyEmail: Boolean(settings.notify_email),
    notifyPush: Boolean(settings.notify_push),
    sidebarPosition: settings.sidebar_position,
    theme: settings.theme,
    fontSize: settings.font_size,
    navSize: settings.nav_size,
    altFont: settings.alt_font,
    highlightedText: Boolean(settings.highlighted_text),
    highlightColor: settings.highlight_color,
    highlightTextColor: settings.highlight_text_color,
    moduleZoom: Boolean(settings.module_zoom),
    zoomShortcut: settings.zoom_shortcut,
});

// Retrieve settings for the authenticated Mosalinx user.
const getUserSettings = async (req, res) => {
    try {
        const settings = await findUserSettingsByFirebaseUid(req.user.uid);

        if (!settings) {
            return res.status(404).json({
                message: 'User account not found',
            });
        }

        return res.status(200).json({
            settings: formatSettings(settings),
        });
    } catch (error) {
        console.error('Error retrieving user settings:', error.message);

        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};

// Validate and update supported settings for the authenticated Mosalinx user.
const updateUserSettings = async (req, res) => {
    // Reject requests that do not contain a valid settings object.
    if (
        !req.body ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
    ) {
        return res.status(400).json({
            message: 'Invalid settings request',
        });
    }

    const requestedFields = Object.keys(req.body);

    if (requestedFields.length === 0) {
        return res.status(400).json({
            message: 'No settings updates provided',
        });
    }

    const unsupportedFields = requestedFields.filter(
        (field) => !Object.hasOwn(SETTING_RULES, field)
    );

    if (unsupportedFields.length > 0) {
        return res.status(400).json({
            message: 'Unsupported settings field',
        });
    }

    const invalidFields = requestedFields.filter(
        (field) => !SETTING_RULES[field](req.body[field])
    );

    if (invalidFields.length > 0) {
        return res.status(400).json({
            message: 'Invalid settings value',
        });
    }

    try {
        const existingUser = await findUserSettingsByFirebaseUid(req.user.uid);

        if (!existingUser) {
            return res.status(404).json({
                message: 'User account not found',
            });
        }

        await updateUserSettingsByFirebaseUid(req.user.uid, req.body);

        const updatedSettings = await findUserSettingsByFirebaseUid(
            req.user.uid
        );

        return res.status(200).json({
            message: 'Settings updated successfully',
            settings: formatSettings(updatedSettings),
        });
    } catch (error) {
        console.error('Error updating user settings:', error.message);

        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};

module.exports = {
    getUserSettings,
    updateUserSettings,
};
