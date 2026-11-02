const express = require('express');

const multer = require('multer');

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

// Keep profile picture uploads in memory with a 5 MB size limit.
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const {
  uploadUserAvatar,
  getUserAvatar,
} = require('../controllers/userAvatarController');

// Register a new Mosalinx user after Firebase account creation.
router.post('/register', verifyFirebaseToken, registerUser);

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

// Upload a profile picture and return a clear error for oversized files.
router.post(
  '/profile/avatar',
  verifyFirebaseToken,
  (req, res, next) => {
    avatarUpload.single('file')(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        return res.status(400).json({
          message: error.code === 'LIMIT_FILE_SIZE'
            ? 'Profile pictures must be 5 MB or smaller.'
            : 'Invalid profile picture upload.',
        });
      }

      if (error) {
        return next(error);
      }

      next();
    });
  },
  uploadUserAvatar
);

// Retrieve a user's saved profile picture.
router.get(
  '/:userId/avatar',
  verifyFirebaseToken,
  getUserAvatar
);

// Retrieve account settings for the authenticated user.
router.get('/settings', verifyFirebaseToken, getUserSettings);

// Update supported account settings for the authenticated user.
router.patch('/settings', verifyFirebaseToken, updateUserSettings);

module.exports = router;
