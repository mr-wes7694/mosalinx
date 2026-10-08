const { findUserByFirebaseUid } = require('../models/userModel');
const {
    findProjectsByUserId,
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

module.exports = {
    getUserProjects,
    createProject,
};
