const express = require('express');

const {
    registerUser,
    getUserProfile,
    updateUserProfile,
} = require('../controllers/userController');

const {
    getUserSettings,
    updateUserSettings,
} = require('../controllers/userSettingsController');

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

// Update supported profile fields for the authenticated user.
router.patch('/profile', verifyFirebaseToken, updateUserProfile);

// Retrieve account settings for the authenticated user.
router.get('/settings', verifyFirebaseToken, getUserSettings);

// Update supported account settings for the authenticated user.
router.patch('/settings', verifyFirebaseToken, updateUserSettings);

module.exports = router;
