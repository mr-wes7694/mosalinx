const pool = require('../config/database');
const { createActivityLog } = require('./activityLogModel');

// Create a workspace post and its activity record together.
const createWorkspacePost = async (
    projectId,
    createdBy,
    postTitle,
    postContent
) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
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

        // Record the post creation in the same transaction.
        await createActivityLog(
            projectId,
            createdBy,
            'workspace_post_created',
            postTitle
                ? `Workspace post "${postTitle}" was created.`
                : 'A workspace post was created.',
            connection
        );

        await connection.commit();

        return {
            postId: result.insertId,
            projectId,
            createdBy,
            postTitle,
            postContent,
        };
    } catch (error) {
        // Keep the post and activity log consistent.
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(
                'Failed to roll back workspace post creation:',
                rollbackError
            );
        }

        throw error;
    } finally {
        connection.release();
    }
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

// Update a workspace post.
const updateWorkspacePost = async (
    postId,
    postTitle,
    postContent
) => {
    const [result] = await pool.query(
        `UPDATE workspace_posts
        SET
            post_title = ?,
            post_content = ?
        WHERE post_id = ?`,
        [
            postTitle,
            postContent,
            postId,
        ]
    );

    return result.affectedRows > 0;
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
    updateWorkspacePost,
    deleteWorkspacePost,
};
