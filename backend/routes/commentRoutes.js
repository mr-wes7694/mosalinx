const express = require('express');

const {
    getPostComments,
    createPostComment,
} = require('../controllers/commentController');
const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// Retrieve comments for an authorized workspace post.
router.get(
    '/:postId/comments',
    verifyFirebaseToken,
    getPostComments
);

// Create a comment on a workspace post.
router.post(
    '/:postId/comments',
    verifyFirebaseToken,
    createPostComment
);

module.exports = router;
