const { findUserByFirebaseUid } = require('../models/userModel');
const { findProjectMemberRole } = require('../models/projectModel');
const {
    createWorkspacePost,
    findWorkspacePostById,
    deleteWorkspacePost,
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

// Delete a workspace post.
const deletePost = async (req, res) => {
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

        // Validate the post ID.
        const postId = Number(req.params.postId);

        if (
            !Number.isInteger(postId) ||
            postId <= 0
        ) {
            return res.status(400).json({
                message: 'A valid postId is required.',
            });
        }

        // Make sure the post exists before attempting deletion.
        const post = await findWorkspacePostById(postId);

        if (!post) {
            return res.status(404).json({
                message: 'Workspace post not found.',
            });
        }

        // Check that the user belongs to the post's project.
        const memberRole = await findProjectMemberRole(
            post.project_id,
            user.user_id
        );

        if (!memberRole) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        // Only the post creator or project owner can delete the post.
        const isPostCreator =
            post.created_by === user.user_id;

        const isProjectOwner =
            memberRole === 'owner';

        if (!isPostCreator && !isProjectOwner) {
            return res.status(403).json({
                message: 'You are not authorized to delete this post.',
            });
        }

        const deleted = await deleteWorkspacePost(postId);

        if (!deleted) {
            return res.status(404).json({
                message: 'Workspace post not found.',
            });
        }

        return res.status(200).json({
            message: 'Workspace post deleted successfully.',
        });
    } catch (error) {
        console.error('Failed to delete workspace post:', error);

        return res.status(500).json({
            message: 'Failed to delete workspace post.',
        });
    }
};

module.exports = {
    createPost,
    deletePost,
};
