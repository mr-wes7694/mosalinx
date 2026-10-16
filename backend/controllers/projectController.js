const {
    findUserByFirebaseUid,
    findUserById,
} = require('../models/userModel');
const {
    findProjectsByUserId,
    findProjectById,
    findProjectMemberRole,
    findProjectMembers,
    updateProjectDetails,
    updateProjectMemberRole,
    createProjectWithOwner,
    deleteProjectWithOwner,
} = require('../models/projectModel');
const { deleteResourceStorageFile } = require('../utils/storage');

// Get projects that belong to the authenticated user.
const getUserProjects = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) {
            return res.status(401).json({
                message: 'Authentication required.',
            });
        }

        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message: 'Mosalinx user not found.',
            });
        }

        const projects = await findProjectsByUserId(user.user_id);

        return res.status(200).json({ projects });
    } catch (error) {
        console.error('Failed to get user projects:', error);

        return res.status(500).json({
            message: 'Failed to retrieve projects.',
        });
    }
};

// Create a project and add the authenticated user as its owner.
const createProject = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) {
            return res.status(401).json({
                message: 'Authentication required.',
            });
        }

        const { project_name, description } = req.body || {};

        if (
            typeof project_name !== 'string' ||
            !project_name.trim()
        ) {
            return res.status(400).json({
                message: 'Project name is required.',
            });
        }

        const projectName = project_name.trim();

        if (projectName.length > 150) {
            return res.status(400).json({
                message: 'Project name must be 150 characters or fewer.',
            });
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== 'string'
        ) {
            return res.status(400).json({
                message: 'Project description must be text.',
            });
        }

        const projectDescription =
            typeof description === 'string'
                ? description.trim()
                : null;

        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message: 'Mosalinx user not found.',
            });
        }

        const project = await createProjectWithOwner(
            projectName,
            projectDescription,
            user.user_id
        );

        return res.status(201).json({
            project: {
                project_id: project.projectId,
                project_name: project.projectName,
                description: project.description,
                role: project.role,
            },
        });
    } catch (error) {
        console.error('Failed to create project:', error);

        return res.status(500).json({
            message: 'Failed to create project.',
        });
    }
};

// Update project details. Only project owners may edit them.
const updateProject = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) {
            return res.status(401).json({
                message: 'Authentication required.',
            });
        }

        const projectId = req.params.projectId;

        if (!/^[1-9]\d*$/.test(projectId || '')) {
            return res.status(400).json({
                message: 'A valid project ID is required.',
            });
        }

        const body = req.body;

        if (
            !body ||
            typeof body !== 'object' ||
            Array.isArray(body)
        ) {
            return res.status(400).json({
                message: 'A valid request body is required.',
            });
        }

        const allowedFields = ['project_name', 'description'];
        const providedFields = Object.keys(body);

        if (
            providedFields.length === 0 ||
            providedFields.some(
                (field) => !allowedFields.includes(field)
            )
        ) {
            return res.status(400).json({
                message: 'Provide project_name, description, or both.',
            });
        }

        const updates = {};

        if (Object.hasOwn(body, 'project_name')) {
            if (
                typeof body.project_name !== 'string' ||
                !body.project_name.trim()
            ) {
                return res.status(400).json({
                    message: 'Project name must be non-empty text.',
                });
            }

            const projectName = body.project_name.trim();

            if (projectName.length > 150) {
                return res.status(400).json({
                    message: 'Project name must be 150 characters or fewer.',
                });
            }

            updates.project_name = projectName;
        }

        if (Object.hasOwn(body, 'description')) {
            if (
                body.description !== null &&
                typeof body.description !== 'string'
            ) {
                return res.status(400).json({
                    message: 'Project description must be text or null.',
                });
            }

            updates.description =
                typeof body.description === 'string'
                    ? body.description.trim()
                    : null;
        }

        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message: 'Mosalinx user not found.',
            });
        }

        const existingProject = await findProjectById(projectId);

        if (!existingProject) {
            return res.status(404).json({
                message: 'Project not found.',
            });
        }

        const role = await findProjectMemberRole(
            projectId,
            user.user_id
        );

        if (role !== 'owner') {
            return res.status(403).json({
                message: 'Only project owners can update project details.',
            });
        }

        const updatedProject = await updateProjectDetails(
            projectId,
            updates
        );

        if (!updatedProject) {
            return res.status(404).json({
                message: 'Project not found.',
            });
        }

        return res.status(200).json({
            project: updatedProject,
        });
    } catch (error) {
        console.error('Failed to update project:', error);

        return res.status(500).json({
            message: 'Failed to update project.',
        });
    }
};

// Update the role of an existing project member. Only project owners may manage member roles.
const assignProjectMemberRole = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) {
            return res.status(401).json({
                message: 'Authentication required.',
            });
        }

        const rawProjectId = req.params.projectId;
        const rawUserId = req.params.userId;

        // Require positive, safe integer IDs.
        if (
            typeof rawProjectId !== 'string' ||
            !/^[1-9]\d*$/.test(rawProjectId) ||
            !Number.isSafeInteger(Number(rawProjectId)) ||
            typeof rawUserId !== 'string' ||
            !/^[1-9]\d*$/.test(rawUserId) ||
            !Number.isSafeInteger(Number(rawUserId))
        ) {
            return res.status(400).json({
                message: 'Valid project and target user IDs are required.',
            });
        }

        const projectId = Number(rawProjectId);
        const targetUserId = Number(rawUserId);
        const { role } = req.body || {};

        // Accept only the roles currently supported by Mosalinx.
        const supportedRoles = ['owner', 'collaborator'];

        if (
            typeof role !== 'string' ||
            !supportedRoles.includes(role)
        ) {
            return res.status(400).json({
                message: 'Role must be owner or collaborator.',
            });
        }

        const requester = await findUserByFirebaseUid(firebaseUid);

        if (!requester) {
            return res.status(404).json({
                message: 'Mosalinx user not found.',
            });
        }

        const project = await findProjectById(projectId);

        if (!project) {
            return res.status(404).json({
                message: 'Project not found.',
            });
        }

        // Only an existing project owner may change member roles.
        const requesterRole = await findProjectMemberRole(
            projectId,
            requester.user_id
        );

        if (requesterRole !== 'owner') {
            return res.status(403).json({
                message: 'Only project owners can manage member roles.',
            });
        }

        const targetUser = await findUserById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({
                message: 'Target user not found.',
            });
        }

        const targetRole = await findProjectMemberRole(
            projectId,
            targetUserId
        );

        if (!targetRole) {
            return res.status(404).json({
                message: 'Target user is not a member of this project.',
            });
        }

        // Prevent the requester from demoting their own owner role.
        if (
            requester.user_id === targetUserId &&
            role !== 'owner'
        ) {
            return res.status(400).json({
                message: 'You cannot change your own owner role.',
            });
        }

        const updatedRole = await updateProjectMemberRole(
            projectId,
            targetUserId,
            role
        );

        if (!updatedRole) {
            return res.status(404).json({
                message: 'Project membership not found.',
            });
        }

        return res.status(200).json({
            message: 'Project member role updated successfully.',
            project_id: projectId,
            user_id: targetUserId,
            role: updatedRole,
        });
    } catch (error) {
        console.error('Failed to assign project member role:', error);

        return res.status(500).json({
            message: 'Failed to update project member role.',
        });
    }
};


// Delete a project after verifying the authenticated user is its owner.
const deleteProject = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) {
            return res.status(401).json({
                message: 'Authentication required.',
            });
        }

        const rawProjectId = req.params.projectId;

        if (
            typeof rawProjectId !== 'string' ||
            !/^[1-9]\d*$/.test(rawProjectId) ||
            !Number.isSafeInteger(Number(rawProjectId))
        ) {
            return res.status(400).json({
                message: 'A valid project ID is required.',
            });
        }

        const projectId = Number(rawProjectId);
        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message: 'Mosalinx user not found.',
            });
        }

        const result = await deleteProjectWithOwner(
            projectId,
            user.user_id
        );

        if (!result.success && result.reason === 'not_found') {
            return res.status(404).json({
                message: 'Project not found.',
            });
        }

        if (!result.success && result.reason === 'forbidden') {
            return res.status(403).json({
                message: 'Only the project owner can delete this project.',
            });
        }

        // Remove stored resource files after the database deletion succeeds.
        const cleanupResults = await Promise.allSettled(
            result.storagePaths.map((storagePath) =>
                deleteResourceStorageFile(storagePath)
            )
        );

        const failedCleanups = cleanupResults.filter(
            (cleanup) => cleanup.status === 'rejected'
        );

        if (failedCleanups.length > 0) {
            console.error(
                `Project ${projectId} was deleted, but ` +
                `${failedCleanups.length} Firebase file(s) could not be removed.`
            );
        }

        return res.status(200).json({
            message: 'Project deleted successfully.',
            storageCleanupComplete: failedCleanups.length === 0,
        });
    } catch (error) {
        console.error('Failed to delete project:', error);

        return res.status(500).json({
            message: 'Failed to delete project.',
        });
    }
};


//Retrieve all current members of a project. Only users who belong to the project can view its member list.
const getProjectMembers = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) {
            return res.status(401).json({
                message: 'Authentication required.',
            });
        }

        const rawProjectId = req.params.projectId;

        if (
            typeof rawProjectId !== 'string' ||
            !/^[1-9]\d*$/.test(rawProjectId) ||
            !Number.isSafeInteger(Number(rawProjectId))
        ) {
            return res.status(400).json({
                message: 'A valid project ID is required.',
            });
        }

        const projectId = Number(rawProjectId);
        const requester = await findUserByFirebaseUid(firebaseUid);

        if (!requester) {
            return res.status(404).json({
                message: 'Mosalinx user not found.',
            });
        }

        const project = await findProjectById(projectId);

        if (!project) {
            return res.status(404).json({
                message: 'Project not found.',
            });
        }

        // Require project membership before returning any member data.
        const requesterRole = await findProjectMemberRole(
            projectId,
            requester.user_id
        );

        if (!requesterRole) {
            return res.status(403).json({
                message: 'You must be a project member to view its members.',
            });
        }

        const members = await findProjectMembers(projectId);

        return res.status(200).json({
            project_id: projectId,
            members,
        });
    } catch (error) {
        console.error('Failed to retrieve project members:', error);

        return res.status(500).json({
            message: 'Failed to retrieve project members.',
        });
    }
};

module.exports = {
    getUserProjects,
    createProject,
    updateProject,
    deleteProject,
    assignProjectMemberRole,
    getProjectMembers,
};
