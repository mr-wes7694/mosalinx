const { findUserByFirebaseUid } = require('../models/userModel');
const { findProjectMemberRole } = require('../models/projectModel');
const { findWorkspacePostById } = require('../models/workspacePostModel');
const { createComment } = require('../models/commentModel');

// Create a comment on an existing workspace post.
const createPostComment = async (req, res) => {
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

        const postId = Number(req.params.postId);

        // Validate the post ID.
        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({
                message: 'A valid postId is required.',
            });
        }

        const { commentContent } = req.body;

        // Comment content is required.
        if (
            typeof commentContent !== 'string' ||
            !commentContent.trim()
        ) {
            return res.status(400).json({
                message: 'Comment content is required.',
            });
        }

        // Find the post before creating the comment.
        const existingPost = await findWorkspacePostById(postId);

        if (!existingPost) {
            return res.status(404).json({
                message: 'Workspace post not found.',
            });
        }

        // Check that the user belongs to the post's project.
        const memberRole = await findProjectMemberRole(
            existingPost.project_id,
            user.user_id
        );

        if (!memberRole) {
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
    createPostComment,
};
