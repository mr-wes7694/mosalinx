const { findUserByFirebaseUid } = require('../models/userModel');
const { checkProjectPermission } = require('../utils/projectPermissions');
const { findWorkspacePostById } = require('../models/workspacePostModel');
const {
    createComment,
    findCommentsByPostId,
} = require('../models/commentModel');

// Retrieve comments for an authorized workspace post.
const getPostComments = async (req, res) => {
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

        if (!Number.isSafeInteger(postId) || postId <= 0) {
            return res.status(400).json({
                message: 'A valid postId is required.',
            });
        }

        const existingPost = await findWorkspacePostById(postId);

        if (!existingPost) {
            return res.status(404).json({
                message: 'Workspace post not found.',
            });
        }

        const permission = await checkProjectPermission(
            existingPost.project_id,
            user.user_id,
            ['owner', 'collaborator']
        );

        if (!permission.allowed) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        const comments = await findCommentsByPostId(postId);

        return res.status(200).json({
            comments,
        });
    } catch (error) {
        console.error('Failed to retrieve post comments:', error);

        return res.status(500).json({
            message: 'Failed to retrieve comments.',
        });
    }
};

// Create a comment on an existing workspace post.
const createPostComment = async (req, res) => {
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

        const { commentContent } = req.body;

        if (
            typeof commentContent !== 'string' ||
            !commentContent.trim()
        ) {
            return res.status(400).json({
                message: 'Comment content is required.',
            });
        }

        const existingPost = await findWorkspacePostById(postId);

        if (!existingPost) {
            return res.status(404).json({
                message: 'Workspace post not found.',
            });
        }

        const permission = await checkProjectPermission(
            existingPost.project_id,
            user.user_id,
            ['owner', 'collaborator']
        );

        if (!permission.allowed) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        const comment = await createComment(
            postId,
            user.user_id,
            commentContent.trim()
        );

        return res.status(201).json({
            comment,
        });
    } catch (error) {
        console.error('Failed to create comment:', error);

        return res.status(500).json({
            message: 'Failed to create comment.',
        });
    }
};

module.exports = {
    getPostComments,
    createPostComment,
};
