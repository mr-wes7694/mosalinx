const express = require('express');
const { createProjectInvitation } = require('../controllers/invitationController');
const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// Create a project invitation.
router.post('/', verifyFirebaseToken, createProjectInvitation);

module.exports = router;
