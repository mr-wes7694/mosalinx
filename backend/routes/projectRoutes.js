const express = require('express');

const {
    getUserProjects,
    createProject,
    updateProject,
    deleteProject,
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

module.exports = router;