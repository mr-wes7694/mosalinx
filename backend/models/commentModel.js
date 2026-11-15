const pool = require('../config/database');

// Create a new comment on a workspace post.
const createComment = async (
    postId,
    createdBy,
    commentContent
) => {
    const [result] = await pool.query(
        `INSERT INTO comments
        (post_id, created_by, comment_content)
        VALUES (?, ?, ?)`,
        [
            postId,
            createdBy,
            commentContent,
        ]
    );

    return {
        commentId: result.insertId,
        postId,
        createdBy,
        commentContent,
    };
};

// Retrieve comments for a workspace post in chronological order.
const findCommentsByPostId = async (postId) => {
    const [rows] = await pool.query(
        `SELECT
            comments.comment_id,
            comments.post_id,
            comments.comment_content,
            comments.created_at,
            users.user_id AS creator_id,
            users.display_name AS creator_display_name,
            users.profile_image_url AS creator_profile_image_url
        FROM comments
        INNER JOIN users
            ON comments.created_by = users.user_id
        WHERE comments.post_id = ?
        ORDER BY comments.created_at ASC, comments.comment_id ASC`,
        [postId]
    );

    return rows.map((row) => ({
        commentId: row.comment_id,
        postId: row.post_id,
        commentContent: row.comment_content,
        createdAt: row.created_at,
        createdBy: {
            userId: row.creator_id,
            displayName: row.creator_display_name,
            profileImageUrl: row.creator_profile_image_url,
        },
    }));
};

module.exports = {
    createComment,
    findCommentsByPostId,
};
