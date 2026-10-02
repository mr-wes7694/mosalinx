const express = require('express');

const {
    createPost,
    updatePost,
    deletePost,
} = require('../controllers/workspacePostController');
const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// Create a workspace post for a project.
router.post(
    '/',
    verifyFirebaseToken,
    createPost
);

// Update an existing workspace post.
router.put(
    '/:postId',
    verifyFirebaseToken,
    updatePost
);

// Delete an existing workspace post.
router.delete(
    '/:postId',
    verifyFirebaseToken,
    deletePost
);

module.exports = router;
