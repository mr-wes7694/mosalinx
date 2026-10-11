
const { findUserByFirebaseUid } = require('../models/userModel');
const {
    findProjectsByUserId,
    createProjectWithOwner,
    deleteProjectWithOwner,
} = require('../models/projectModel');
const {
    deleteResourceStorageFile,
} = require('../utils/storage');

// Get projects that belong to the authenticated user.
const getUserProjects = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) {
            return res.status(401).json({
                message: 'Authentication required.',
            });
        }

        // Find the Mosalinx user linked to the Firebase account.
        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message: 'Mosalinx user not found.',
            });
        }

        // Only return projects where the user is a member.
        const projects = await findProjectsByUserId(user.user_id);

        return res.status(200).json({
            projects,
        });
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

        // Validate the required project name.
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

        // Description is optional, but must be a string when provided.
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

        // Find the Mosalinx user linked to the Firebase account.
        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message: 'Mosalinx user not found.',
            });
        }

        // Create the project and owner membership in one transaction.
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

// Delete a project after verifying the authenticated user is its owner.
const deleteProject = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) {
            return res.status(401).json({
                message: 'Authentication required.',
            });
        }

        // Reject missing, invalid, or unsafe project IDs.
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

        // Find the Mosalinx user linked to the Firebase account.
        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message: 'Mosalinx user not found.',
            });
        }

        // The model checks ownership and deletes related records transactionally.
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

        // Clean up Firebase files after the database transaction succeeds.
        const cleanupResults = await Promise.allSettled(
            result.storagePaths.map((storagePath) =>
                deleteResourceStorageFile(storagePath)
            )
        );

        const failedCleanups = cleanupResults.filter(
            (cleanup) => cleanup.status === 'rejected'
        );

        if (failedCleanups.length > 0) {
            // The project is deleted from MySQL; log any files needing cleanup.
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

module.exports = {
    getUserProjects,
    createProject,
    deleteProject,
};
