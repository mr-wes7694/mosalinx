const express = require('express');

const {
    registerUser,
    getUserProfile,
} = require('../controllers/userController');

const { verifyFirebaseToken } = require('../middleware');

const router = express.Router();

// Register a new Mosalinx user after Firebase account creation.
router.post('/register', registerUser);

// Verify authenticated requests using a Firebase ID token.
router.get('/verify-auth', verifyFirebaseToken, (req, res) => {
    return res.status(200).json({
        message: 'Authentication verified',
        uid: req.user.uid,
    });
});

// Retrieve the authenticated user's Mosalinx profile.
router.get('/profile', verifyFirebaseToken, getUserProfile);

module.exports = router;
