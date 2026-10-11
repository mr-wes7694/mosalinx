const express = require('express');

const {
    getUserProjects,
    createProject,
    updateProject,
} = require('../controllers/projectController');
const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// Get projects that belong to the authenticated user.
router.get(
    '/',
    verifyFirebaseToken,
    getUserProjects
);

// Create a project for the authenticated user.
router.post(
    '/',
    verifyFirebaseToken,
    createProject
);

// Update an existing project.
router.patch(
    '/:projectId',
    verifyFirebaseToken,
    updateProject
);

module.exports = router;
