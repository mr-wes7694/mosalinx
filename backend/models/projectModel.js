const pool = require('../config/database');

// Find projects that the user belongs to.
const findProjectsByUserId = async (userId) => {
    const sql =
        'SELECT p.project_id, p.project_name, p.description ' +
        'FROM projects p ' +
        'INNER JOIN project_members pm ON p.project_id = pm.project_id ' +
        'WHERE pm.user_id = ? ' +
        'ORDER BY p.project_name';

    const [rows] = await pool.query(sql, [userId]);

    return rows;
};

// Find a user's role within a project.
const findProjectMemberRole = async (projectId, userId) => {
    const sql =
        'SELECT role FROM project_members ' +
        'WHERE project_id = ? AND user_id = ? ' +
        'LIMIT 1';

    const [rows] = await pool.query(sql, [
        projectId,
        userId,
    ]);

    return rows[0]?.role || null;
};

module.exports = {
    findProjectsByUserId,
    findProjectMemberRole,
};