const { findUserByFirebaseUid, findUserByEmail } = require('../models/userModel');
const { findProjectMemberRole } = require('../models/projectModel');
const {
    findProjectById,
    findProjectMember,
    findInvitationByProjectAndEmail,
    createInvitation,
} = require('../models/invitationModel');

// Create a project invitation for an existing Mosalinx user.
const createProjectInvitation = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) {
            return res.status(401).json({
                message: 'Authentication required.',
            });
        }

        // Find the authenticated Mosalinx user.
        const sender = await findUserByFirebaseUid(firebaseUid);

        if (!sender) {
            return res.status(404).json({
                message: 'Mosalinx user not found.',
            });
        }

        const { projectId, inviteeEmail } = req.body;

        // Validate the required request fields.
        if (
            projectId === undefined ||
            projectId === null ||
            inviteeEmail === undefined ||
            inviteeEmail === null
        ) {
            return res.status(400).json({
                message: 'Project ID and invitee email are required.',
            });
        }

        const normalizedProjectId = Number(projectId);
        const normalizedEmail = String(inviteeEmail).trim().toLowerCase();

        if (
            !Number.isSafeInteger(normalizedProjectId) ||
            normalizedProjectId <= 0
        ) {
            return res.status(400).json({
                message: 'Project ID must be a positive integer.',
            });
        }

        // Validate the recipient email format.
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({
                message: 'A valid invitee email address is required.',
            });
        }

        // Make sure the target project exists.
        const project = await findProjectById(normalizedProjectId);

        if (!project) {
            return res.status(404).json({
                message: 'Project not found.',
            });
        }

        // Only project owners can send invitations.
        const senderRole = await findProjectMemberRole(
            normalizedProjectId,
            sender.user_id
        );

        if (!senderRole || senderRole.toLowerCase() !== 'owner') {
            return res.status(403).json({
                message: 'Only project owners can send invitations.',
            });
        }

        // The recipient must already have a Mosalinx account.
        const invitee = await findUserByEmail(normalizedEmail);

        if (!invitee) {
            return res.status(404).json({
                message: 'Invitee is not a registered Mosalinx user.',
            });
        }

        // Do not create an invitation for an existing project member.
        const existingMember = await findProjectMember(
            normalizedProjectId,
            invitee.user_id
        );

        if (existingMember) {
            return res.status(409).json({
                message: 'User is already a member of this project.',
            });
        }

        // Do not create a duplicate invitation for the same project and email.
        const existingInvitation = await findInvitationByProjectAndEmail(
            normalizedProjectId,
            normalizedEmail
        );

        if (
            existingInvitation &&
            existingInvitation.status?.toLowerCase() === 'pending'
        ) {
            return res.status(409).json({
                message: 'A pending invitation already exists for this user.',
            });
        }

        const invitationId = await createInvitation(
            normalizedProjectId,
            sender.user_id,
            normalizedEmail
        );

        return res.status(201).json({
            message: 'Invitation created successfully.',
            invitation: {
                invitation_id: invitationId,
                project_id: normalizedProjectId,
                invited_by: sender.user_id,
                invitee_email: normalizedEmail,
                role: 'collaborator',
                status: 'pending',
            },
        });
    } catch (error) {
        console.error('Failed to create project invitation:', error);

        return res.status(500).json({
            message: 'Failed to create project invitation.',
        });
    }
};

module.exports = {
    createProjectInvitation,
};
