const { findUserByFirebaseUid } = require('../models/userModel');
const { findProjectMemberRole } = require('../models/projectModel');
const {
    createWorkspacePost,
} = require('../models/workspacePostModel');

// Create a workspace post for a project.
const createPost = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) {
            return res.status(401).json({
                message: 'Authentication required.',
            });
        }

        // Find the Mosalinx user linked to Firebase.
        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message: 'Mosalinx user not found.',
            });
        }

        const { projectId, postTitle, postContent } = req.body;

        // Validate the project ID.
        if (
            !Number.isInteger(projectId) ||
            projectId <= 0
        ) {
            return res.status(400).json({
                message: 'A valid projectId is required.',
            });
        }

        // Post content is required.
        if (
            typeof postContent !== 'string' ||
            !postContent.trim()
        ) {
            return res.status(400).json({
                message: 'Post content is required.',
            });
        }

        // Validate the optional title.
        if (
            postTitle !== undefined &&
            postTitle !== null &&
            typeof postTitle !== 'string'
        ) {
            return res.status(400).json({
                message: 'Post title must be a string.',
            });
        }

        const trimmedTitle =
            typeof postTitle === 'string'
                ? postTitle.trim()
                : null;

        if (trimmedTitle && trimmedTitle.length > 255) {
            return res.status(400).json({
                message: 'Post title must be 255 characters or fewer.',
            });
        }

        // Check that the user belongs to the project.
        const memberRole = await findProjectMemberRole(
            projectId,
            user.user_id
        );

        if (!memberRole) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        const post = await createWorkspacePost(
            projectId,
            user.user_id,
            trimmedTitle,
            postContent.trim()
        );

        return res.status(201).json({
            post,
        });
    } catch (error) {
        console.error('Failed to create workspace post:', error);

        return res.status(500).json({
            message: 'Failed to create workspace post.',
        });
    }
};

module.exports = {
    createPost,
};
