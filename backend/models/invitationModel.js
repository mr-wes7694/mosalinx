const pool = require('../config/database');

// Check whether a project exists.
const findProjectById = async (projectId) => {
    const [rows] = await pool.query(
        'SELECT project_id FROM projects WHERE project_id = ? LIMIT 1',
        [projectId]
    );

    return rows[0] || null;
};

// Check whether a user is already a member of a project.
const findProjectMember = async (projectId, userId) => {
    const [rows] = await pool.query(
        'SELECT project_id, user_id, role FROM project_members ' +
        'WHERE project_id = ? AND user_id = ? LIMIT 1',
        [projectId, userId]
    );

    return rows[0] || null;
};

// Find an existing invitation for the same project and email.
const findInvitationByProjectAndEmail = async (projectId, inviteeEmail) => {
    const [rows] = await pool.query(
        'SELECT invitation_id, project_id, invited_by, invitee_email, role, status, ' +
        'created_at, updated_at, expires_at ' +
        'FROM invitations ' +
        'WHERE project_id = ? AND invitee_email = ? ' +
        'ORDER BY created_at DESC LIMIT 1',
        [projectId, inviteeEmail]
    );

    return rows[0] || null;
};

// Create a new project invitation.
const createInvitation = async (
    projectId,
    invitedBy,
    inviteeEmail,
    role = 'collaborator'
) => {
    const [result] = await pool.query(
        'INSERT INTO invitations ' +
        '(project_id, invited_by, invitee_email, role, status) ' +
        'VALUES (?, ?, ?, ?, ?)',
        [projectId, invitedBy, inviteeEmail, role, 'pending']
    );

    return result.insertId;
};

module.exports = {
    findProjectById,
    findProjectMember,
    findInvitationByProjectAndEmail,
    createInvitation,
};
