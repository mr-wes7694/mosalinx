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

// Find an invitation by ID with project and inviter information.
const findInvitationById = async (invitationId) => {
    const [rows] = await pool.query(
        'SELECT ' +
        'i.invitation_id, ' +
        'i.project_id, ' +
        'i.invited_by, ' +
        'i.invitee_email, ' +
        'i.role, ' +
        'i.status, ' +
        'i.created_at, ' +
        'i.updated_at, ' +
        'i.expires_at, ' +
        'p.project_name, ' +
        'p.description AS project_description, ' +
        'u.display_name AS inviter_name, ' +
        'u.email AS inviter_email ' +
        'FROM invitations i ' +
        'INNER JOIN projects p ON i.project_id = p.project_id ' +
        'INNER JOIN users u ON i.invited_by = u.user_id ' +
        'WHERE i.invitation_id = ? ' +
        'LIMIT 1',
        [invitationId]
    );

    return rows[0] || null;
};

// Find pending, non-expired invitations for a user.
const findPendingInvitationsByEmail = async (inviteeEmail) => {
    const [rows] = await pool.query(
        'SELECT ' +
        'i.invitation_id, ' +
        'i.project_id, ' +
        'i.invited_by, ' +
        'i.invitee_email, ' +
        'i.role, ' +
        'i.status, ' +
        'i.created_at, ' +
        'i.updated_at, ' +
        'i.expires_at, ' +
        'p.project_name, ' +
        'p.description AS project_description, ' +
        'u.display_name AS inviter_name, ' +
        'u.email AS inviter_email ' +
        'FROM invitations i ' +
        'INNER JOIN projects p ON i.project_id = p.project_id ' +
        'INNER JOIN users u ON i.invited_by = u.user_id ' +
        'WHERE i.invitee_email = ? ' +
        'AND LOWER(i.status) = ? ' +
        'AND (i.expires_at IS NULL OR i.expires_at > CURRENT_TIMESTAMP) ' +
        'ORDER BY i.created_at DESC',
        [inviteeEmail, 'pending']
    );

    return rows;
};

// Accept a pending invitation for the intended user.
const acceptInvitation = async (invitationId, inviteeEmail) => {
    const [result] = await pool.query(
        'UPDATE invitations ' +
        'SET status = ? ' +
        'WHERE invitation_id = ? ' +
        'AND invitee_email = ? ' +
        'AND LOWER(status) = ? ' +
        'AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)',
        ['accepted', invitationId, inviteeEmail, 'pending']
    );

    return result.affectedRows;
};

// Accept an invitation and create the project membership in one transaction.
const acceptInvitationWithMembership = async (
    invitationId,
    inviteeEmail,
    userId
) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Lock the invitation while it is being accepted.
        const [invitationRows] = await connection.query(
            'SELECT invitation_id, project_id, invitee_email, role, status, expires_at ' +
            'FROM invitations ' +
            'WHERE invitation_id = ? ' +
            'FOR UPDATE',
            [invitationId]
        );

        if (invitationRows.length === 0) {
            await connection.rollback();

            return {
                success: false,
                reason: 'not_found',
            };
        }

        const invitation = invitationRows[0];

        // Make sure the invitation belongs to the authenticated user.
        if (
            String(invitation.invitee_email).trim().toLowerCase() !==
            String(inviteeEmail).trim().toLowerCase()
        ) {
            await connection.rollback();

            return {
                success: false,
                reason: 'unauthorized',
            };
        }

        // Prevent an invitation from being accepted twice.
        if (invitation.status?.toLowerCase() !== 'pending') {
            await connection.rollback();

            return {
                success: false,
                reason: 'not_pending',
            };
        }

        // Prevent expired invitations from being accepted.
        if (
            invitation.expires_at &&
            new Date(invitation.expires_at) <= new Date()
        ) {
            await connection.rollback();

            return {
                success: false,
                reason: 'expired',
            };
        }

        // Check for an existing membership before inserting.
        const [memberRows] = await connection.query(
            'SELECT project_id, user_id, role ' +
            'FROM project_members ' +
            'WHERE project_id = ? AND user_id = ? ' +
            'LIMIT 1 ' +
            'FOR UPDATE',
            [invitation.project_id, userId]
        );

        if (memberRows.length > 0) {
            await connection.rollback();

            return {
                success: false,
                reason: 'already_member',
            };
        }

        // Add the accepted user to the project with the invitation role.
        await connection.query(
            'INSERT INTO project_members ' +
            '(project_id, user_id, role) ' +
            'VALUES (?, ?, ?)',
            [invitation.project_id, userId, invitation.role]
        );

        // Mark the invitation as accepted.
        const [updateResult] = await connection.query(
            'UPDATE invitations ' +
            'SET status = ? ' +
            'WHERE invitation_id = ? ' +
            'AND LOWER(status) = ?',
            ['accepted', invitationId, 'pending']
        );

        if (updateResult.affectedRows !== 1) {
            throw new Error('Invitation could not be marked as accepted.');
        }

        await connection.commit();

        return {
            success: true,
            projectId: invitation.project_id,
            role: invitation.role,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
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
    findInvitationById,
    findPendingInvitationsByEmail,
    acceptInvitation,
    acceptInvitationWithMembership,
    createInvitation,
};