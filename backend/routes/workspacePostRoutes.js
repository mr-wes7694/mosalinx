const express = require('express');

const {
    createPost,
} = require('../controllers/workspacePostController');
const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// Create a workspace post for a project.
router.post(
    '/',
    verifyFirebaseToken,
    createPost
);

module.exports = router;
