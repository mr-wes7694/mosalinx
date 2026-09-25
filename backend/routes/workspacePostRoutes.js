const express = require('express');

const {
    createPost,
    updatePost,
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

module.exports = router;
