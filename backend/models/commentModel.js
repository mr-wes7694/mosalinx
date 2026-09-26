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

module.exports = {
    createComment,
};
