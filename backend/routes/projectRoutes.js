const express = require('express');

const {
    getUserProjects,
    createProject,
    updateProject,
    deleteProject,
    assignProjectMemberRole,
    getProjectMembers,
} = require('../controllers/projectController');

const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// Get projects for the authenticated user.
router.get('/', verifyFirebaseToken, getUserProjects);

// Create a project for the authenticated user.
router.post('/', verifyFirebaseToken, createProject);

// Update project details.
router.patch('/:projectId', verifyFirebaseToken, updateProject);

// Delete a project after authentication and owner verification.
router.delete('/:projectId', verifyFirebaseToken, deleteProject);

// Update the role of an existing project member.
router.patch(
    '/:projectId/members/:userId/role',
    verifyFirebaseToken,
    assignProjectMemberRole
);

// Get members of a project after authentication.
router.get(
    '/:projectId/members',
    verifyFirebaseToken,
    getProjectMembers
);

module.exports = router;
