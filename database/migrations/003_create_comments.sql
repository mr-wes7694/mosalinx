-- Creates comments associated with Workspace Posts.
CREATE TABLE comments (
    comment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT UNSIGNED NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    comment_content TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (post_id)
        REFERENCES workspace_posts(post_id)
        ON DELETE CASCADE,

    FOREIGN KEY (created_by)
        REFERENCES users(user_id)
);
