const express = require('express');
const {
    createProjectInvitation,
    getPendingInvitations,
} = require('../controllers/invitationController');
const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// Retrieve pending invitations for the authenticated user.
router.get('/pending', verifyFirebaseToken, getPendingInvitations);

// Create a project invitation.
router.post('/', verifyFirebaseToken, createProjectInvitation);

module.exports = router;
