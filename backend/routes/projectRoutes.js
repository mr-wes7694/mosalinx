const express = require('express');

const { getUserProjects } = require('../controllers/projectController');
const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// Get projects that belong to the authenticated user.
router.get(
    '/',
    verifyFirebaseToken,
    getUserProjects
);

module.exports = router;