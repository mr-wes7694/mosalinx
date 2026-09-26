const express = require('express');

const {
    createPostComment,
} = require('../controllers/commentController');
const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// Create a comment on a workspace post.
router.post(
    '/:postId/comments',
    verifyFirebaseToken,
    createPostComment
);

module.exports = router;
