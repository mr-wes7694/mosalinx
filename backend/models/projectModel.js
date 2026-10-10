
const pool = require('../config/database');

// Roles currently supported by Mosalinx projects.
const SUPPORTED_PROJECT_ROLES = [
    'owner',
    'collaborator',
];

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

// Find a project by its ID.
const findProjectById = async (projectId) => {
    const [rows] = await pool.query(
        'SELECT project_id, project_name, description, created_at, updated_at ' +
        'FROM projects WHERE project_id = ? LIMIT 1',
        [projectId]
    );

    return rows[0] || null;
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

// Update only the project fields provided by the caller.
const updateProjectDetails = async (projectId, updates) => {
    const allowedFields = ['project_name', 'description'];
    const fields = Object.keys(updates).filter(
        (field) => allowedFields.includes(field)
    );

    if (fields.length === 0) {
        return findProjectById(projectId);
    }

    const assignments = fields
        .map((field) => `${field} = ?`)
        .join(', ');

    const values = fields.map((field) => updates[field]);
    values.push(projectId);

    await pool.query(
        `UPDATE projects SET ${assignments} WHERE project_id = ?`,
        values
    );

    return findProjectById(projectId);
};

// Update the role for an existing project member.
const updateProjectMemberRole = async (projectId, userId, role) => {
    if (!SUPPORTED_PROJECT_ROLES.includes(role)) {
        throw new Error(`Unsupported project role: ${role}`);
    }

    const sql =
        'UPDATE project_members ' +
        'SET role = ? ' +
        'WHERE project_id = ? AND user_id = ?';

    const [result] = await pool.query(sql, [
        role,
        projectId,
        userId,
    ]);

    if (result.affectedRows === 0) {
        return null;
    }

    return findProjectMemberRole(projectId, userId);
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
    findProjectById,
    findProjectMemberRole,
    updateProjectDetails,
    updateProjectMemberRole,
    createProjectWithOwner,
};