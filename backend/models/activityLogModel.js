const pool = require('../config/database');

// Record a successful action within a project.
const createActivityLog = async (
    projectId,
    userId,
    activityType,
    activityDescription,
    connection = pool
) => {
    const [result] = await connection.query(
        `INSERT INTO activity_logs
        (project_id, user_id, activity_type, activity_description)
        VALUES (?, ?, ?, ?)`,
        [
            projectId,
            userId,
            activityType,
            activityDescription,
        ]
    );

    return result.insertId;
};

// Retrieve the newest activity entries for a project.
const findActivityLogsByProjectId = async (
    projectId,
    limit = 50
) => {
    const [rows] = await pool.query(
        `SELECT
            activity_logs.activity_id,
            activity_logs.project_id,
            activity_logs.user_id,
            users.display_name,
            users.profile_image_url,
            activity_logs.activity_type,
            activity_logs.activity_description,
            activity_logs.created_at
        FROM activity_logs
        LEFT JOIN users
            ON activity_logs.user_id = users.user_id
        WHERE activity_logs.project_id = ?
        ORDER BY activity_logs.created_at DESC,
            activity_logs.activity_id DESC
        LIMIT ?`,
        [projectId, limit]
    );

    return rows;
};

module.exports = {
    createActivityLog,
    findActivityLogsByProjectId,
};