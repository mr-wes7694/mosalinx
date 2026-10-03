const express = require('express');
const {
    createProjectInvitation,
    getPendingInvitations,
    acceptProjectInvitation,
} = require('../controllers/invitationController');
const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// Retrieve pending invitations for the authenticated user.
router.get('/pending', verifyFirebaseToken, getPendingInvitations);

// Accept a pending project invitation.
router.post(
    '/:invitationId/accept',
    verifyFirebaseToken,
    acceptProjectInvitation
);

// Create a project invitation.
router.post('/', verifyFirebaseToken, createProjectInvitation);

module.exports = router;