-- Creates persistent application settings for Mosalinx users.
CREATE TABLE user_settings (
    user_id BIGINT UNSIGNED PRIMARY KEY,

    notify_text BOOLEAN NOT NULL DEFAULT FALSE,
    notify_email BOOLEAN NOT NULL DEFAULT TRUE,
    notify_push BOOLEAN NOT NULL DEFAULT FALSE,

    sidebar_position VARCHAR(20) NOT NULL DEFAULT 'left',

    theme VARCHAR(20) NOT NULL DEFAULT 'light',
    font_size VARCHAR(20) NOT NULL DEFAULT 'Medium',
    nav_size VARCHAR(20) NOT NULL DEFAULT 'Small',

    alt_font VARCHAR(100) NOT NULL DEFAULT 'Default',
    highlighted_text BOOLEAN NOT NULL DEFAULT FALSE,
    highlight_color VARCHAR(20) NOT NULL DEFAULT 'Yellow',
    highlight_text_color VARCHAR(20) NOT NULL DEFAULT 'Black',
    module_zoom BOOLEAN NOT NULL DEFAULT FALSE,
    zoom_shortcut VARCHAR(100) NOT NULL DEFAULT 'Ctrl + Click',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);
