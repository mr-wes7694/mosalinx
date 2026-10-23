const pool = require('../config/database');
const { createActivityLog } = require('./activityLogModel');

// Roles currently supported by Mosalinx projects.
const SUPPORTED_PROJECT_ROLES = [
    'owner',
    'collaborator',
];

// Find projects that the user belongs to.
const findProjectsByUserId = async (userId) => {
    const sql =
        'SELECT p.project_id, p.project_name, p.description, pm.role ' +
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


//Retrieve the users and roles for one project's current members. Only return profile fields needed by the team member interface.
const findProjectMembers = async (projectId) => {
    const sql =
        'SELECT u.user_id, u.display_name, u.profile_image_url, pm.role ' +
        'FROM project_members pm ' +
        'INNER JOIN users u ON pm.user_id = u.user_id ' +
        'WHERE pm.project_id = ? ' +
        'ORDER BY u.display_name';

    const [rows] = await pool.query(sql, [projectId]);

    return rows;
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

// Create a project, add its owner, and record the activity atomically.
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

        // Record project creation in the same transaction.
        await createActivityLog(
            projectId,
            userId,
            'project_created',
            `Project "${projectName}" was created.`,
            connection
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
        // Roll back the project, owner membership, and activity together.
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(
                'Failed to roll back project creation:',
                rollbackError
            );
        }

        throw error;
    } finally {
        connection.release();
    }
};

// Delete a project and its related database records in one transaction.
const deleteProjectWithOwner = async (projectId, userId) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Lock the project while checking permission and deleting records.
        const [projectRows] = await connection.query(
            'SELECT project_id FROM projects ' +
            'WHERE project_id = ? FOR UPDATE',
            [projectId]
        );

        if (projectRows.length === 0) {
            await connection.rollback();

            return {
                success: false,
                reason: 'not_found',
            };
        }

        // Check the requester's role inside the transaction.
        const [memberRows] = await connection.query(
            'SELECT role FROM project_members ' +
            'WHERE project_id = ? AND user_id = ? ' +
            'LIMIT 1 FOR UPDATE',
            [projectId, userId]
        );

        if (
            memberRows.length === 0 ||
            String(memberRows[0].role).toLowerCase() !== 'owner'
        ) {
            await connection.rollback();

            return {
                success: false,
                reason: 'forbidden',
            };
        }

        // Save file paths so Firebase files can be cleaned up after commit.
        const [resourceRows] = await connection.query(
            'SELECT storage_path FROM resources WHERE project_id = ?',
            [projectId]
        );

        const storagePaths = resourceRows
            .map((resource) => resource.storage_path)
            .filter(Boolean);

        // Delete dependent records before their parent records.
        await connection.query(
            'DELETE FROM messages WHERE project_id = ?',
            [projectId]
        );

        await connection.query(
            'DELETE FROM comments WHERE post_id IN ' +
            '(SELECT post_id FROM workspace_posts WHERE project_id = ?)',
            [projectId]
        );

        await connection.query(
            'DELETE FROM workspace_posts WHERE project_id = ?',
            [projectId]
        );

        await connection.query(
            'DELETE FROM tasks WHERE project_id = ?',
            [projectId]
        );

        await connection.query(
            'DELETE FROM ai_ideas WHERE project_id = ?',
            [projectId]
        );

        await connection.query(
            'DELETE FROM notifications WHERE project_id = ?',
            [projectId]
        );

        await connection.query(
            'DELETE FROM project_milestones WHERE project_id = ?',
            [projectId]
        );

        await connection.query(
            'DELETE FROM calendar_events WHERE project_id = ?',
            [projectId]
        );

        await connection.query(
            'DELETE FROM invitations WHERE project_id = ?',
            [projectId]
        );

        await connection.query(
            'DELETE FROM activity_logs WHERE project_id = ?',
            [projectId]
        );

        await connection.query(
            'DELETE FROM resources WHERE project_id = ?',
            [projectId]
        );

        // Messages have been removed, so their channels can be deleted.
        await connection.query(
            'DELETE FROM channels WHERE project_id = ?',
            [projectId]
        );

        await connection.query(
            'DELETE FROM project_members WHERE project_id = ?',
            [projectId]
        );

        // Remove the project after its dependent records are gone.
        const [deleteResult] = await connection.query(
            'DELETE FROM projects WHERE project_id = ?',
            [projectId]
        );

        if (deleteResult.affectedRows !== 1) {
            throw new Error('Project could not be deleted.');
        }

        await connection.commit();

        return {
            success: true,
            storagePaths,
        };
    }  catch (error) {
        // Try to undo database changes without hiding the original error.
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(
                'Failed to roll back project deletion:',
                rollbackError
            );
        }

        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    SUPPORTED_PROJECT_ROLES,
    findProjectsByUserId,
    findProjectById,
    findProjectMemberRole,
    findProjectMembers,
    updateProjectDetails,
    updateProjectMemberRole,
    createProjectWithOwner,
    deleteProjectWithOwner,
};
