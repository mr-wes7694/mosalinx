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

module.exports = {
    createActivityLog,
};
