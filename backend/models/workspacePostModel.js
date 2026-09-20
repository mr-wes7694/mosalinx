const pool = require('../config/database');

// Create a new workspace post.
const createWorkspacePost = async (
    projectId,
    createdBy,
    postTitle,
    postContent
) => {
    const [result] = await pool.query(
        `INSERT INTO workspace_posts
        (project_id, created_by, post_title, post_content)
        VALUES (?, ?, ?, ?)`,
        [
            projectId,
            createdBy,
            postTitle,
            postContent,
        ]
    );

    return {
        postId: result.insertId,
        projectId,
        createdBy,
        postTitle,
        postContent,
    };
};

module.exports = {
    createWorkspacePost,
};
