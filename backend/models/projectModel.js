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

// Create a project and add the creator as the project owner.
const createProjectWithOwner = async (
    projectName,
    description,
    userId
) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Create the project.
        const [projectResult] = await connection.query(
            'INSERT INTO projects (project_name, description) VALUES (?, ?)',
            [projectName, description]
        );

        const projectId = projectResult.insertId;

        // Add the creator as the project owner.
        await connection.query(
            'INSERT INTO project_members (project_id, user_id, role) ' +
            'VALUES (?, ?, ?)',
            [projectId, userId, 'owner']
        );

        await connection.commit();

        return {
            projectId,
            projectName,
            description,
            userId,
            role: 'owner',
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    findProjectsByUserId,
    findProjectMemberRole,
    createProjectWithOwner,
};
