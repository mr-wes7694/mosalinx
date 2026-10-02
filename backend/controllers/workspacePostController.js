const { findUserByFirebaseUid } = require('../models/userModel');
const { findProjectMemberRole } = require('../models/projectModel');
const {
    createWorkspacePost,
    findWorkspacePostById,
    updateWorkspacePost,
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

        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message: 'Mosalinx user not found.',
            });
        }

        const { projectId, postTitle, postContent } = req.body;

        if (!Number.isInteger(projectId) || projectId <= 0) {
            return res.status(400).json({
                message: 'A valid projectId is required.',
            });
        }

        if (
            typeof postContent !== 'string' ||
            !postContent.trim()
        ) {
            return res.status(400).json({
                message: 'Post content is required.',
            });
        }

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

        return res.status(201).json({ post });
    } catch (error) {
        console.error('Failed to create workspace post:', error);

        return res.status(500).json({
            message: 'Failed to create workspace post.',
        });
    }
};

// Update an existing workspace post.
const updatePost = async (req, res) => {
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

        const postId = Number(req.params.postId);

        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({
                message: 'A valid postId is required.',
            });
        }

        const { postTitle, postContent } = req.body;

        if (
            typeof postContent !== 'string' ||
            !postContent.trim()
        ) {
            return res.status(400).json({
                message: 'Post content is required.',
            });
        }

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

        const existingPost = await findWorkspacePostById(postId);

        if (!existingPost) {
            return res.status(404).json({
                message: 'Workspace post not found.',
            });
        }

        const memberRole = await findProjectMemberRole(
            existingPost.project_id,
            user.user_id
        );

        if (!memberRole) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        const isPostCreator =
            existingPost.created_by === user.user_id;

        const isProjectOwner = memberRole === 'owner';

        if (!isPostCreator && !isProjectOwner) {
            return res.status(403).json({
                message: 'You are not authorized to update this post.',
            });
        }

        await updateWorkspacePost(
            postId,
            trimmedTitle,
            postContent.trim()
        );

        const updatedPost = await findWorkspacePostById(postId);

        return res.status(200).json({
            post: updatedPost,
        });
    } catch (error) {
        console.error('Failed to update workspace post:', error);

        return res.status(500).json({
            message: 'Failed to update workspace post.',
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

        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message: 'Mosalinx user not found.',
            });
        }

        const postId = Number(req.params.postId);

        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({
                message: 'A valid postId is required.',
            });
        }

        const post = await findWorkspacePostById(postId);

        if (!post) {
            return res.status(404).json({
                message: 'Workspace post not found.',
            });
        }

        const memberRole = await findProjectMemberRole(
            post.project_id,
            user.user_id
        );

        if (!memberRole) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        const isPostCreator = post.created_by === user.user_id;
        const isProjectOwner = memberRole === 'owner';

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
    updatePost,
    deletePost,
};
