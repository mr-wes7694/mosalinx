const express = require('express');

const {
  getPostsByProject,
  createPost,
  updatePost,
  deletePost,
} = require('../controllers/workspacePostController');
const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// Retrieve saved posts for an authorized project member.
router.get(
  '/project/:projectId',
  verifyFirebaseToken,
  getPostsByProject
);

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
