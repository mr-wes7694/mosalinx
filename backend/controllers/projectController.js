const { findUserByFirebaseUid } = require('../models/userModel');
const {
    findProjectsByUserId,
    findProjectById,
    findProjectMemberRole,
    updateProjectDetails,
    createProjectWithOwner,
} = require('../models/projectModel');

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

// Update an existing project. Only project owners may edit its details.
const updateProject = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) {
            return res.status(401).json({
                message: 'Authentication required.',
            });
        }

        const projectId = req.params.projectId;

        // Require a positive whole-number project ID.
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

        // Reject unknown fields and requests with nothing to update.
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

        // Validate the name only if it was provided.
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

        // Allow null to clear the optional description.
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

        // Check existence before checking authorization.
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

module.exports = {
    getUserProjects,
    createProject,
    updateProject,
};