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

// Find a workspace post by ID.
const findWorkspacePostById = async (postId) => {
    const [rows] = await pool.query(
        `SELECT
            post_id,
            project_id,
            created_by,
            post_title,
            post_content,
            created_at,
            updated_at
        FROM workspace_posts
        WHERE post_id = ?
        LIMIT 1`,
        [postId]
    );

    return rows[0] || null;
};

// Delete a workspace post.
const deleteWorkspacePost = async (postId) => {
    const [result] = await pool.query(
        `DELETE FROM workspace_posts
        WHERE post_id = ?`,
        [postId]
    );

    return result.affectedRows > 0;
};

module.exports = {
    createWorkspacePost,
    findWorkspacePostById,
    deleteWorkspacePost,
};
