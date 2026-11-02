// Dependencies for user profile management and Firebase avatar storage.
const {
  findUserByFirebaseUid,
  findUserAvatarById,
  usersShareProject,
  updateUserProfileByFirebaseUid,
} = require('../models/userModel');

const { storageBucket } = require('../config/firebaseAdmin');

const {
  buildAvatarStoragePath,
  deleteResourceStorageFile,
} = require('../utils/storage');

// Validate the uploaded image using its actual file signature.
function validateAvatarFile(file) {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    return null;
  }

  if (file.size > 5 * 1024 * 1024 || file.size === 0) {
    return null;
  }

  const buffer = file.buffer;

  const isJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  const isPng =
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    );

  const isWebp =
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';

  if (isJpeg && file.mimetype === 'image/jpeg') {
    return 'jpg';
  }

  if (isPng && file.mimetype === 'image/png') {
    return 'png';
  }

  if (isWebp && file.mimetype === 'image/webp') {
    return 'webp';
  }

  return null;
}

// Upload a validated avatar and safely replace the user's previous picture.
const uploadUserAvatar = async (req, res) => {
  const fileExtension = validateAvatarFile(req.file);

  if (!fileExtension) {
    return res.status(400).json({
      message: 'Please upload a valid JPEG, PNG, or WebP image under 5 MB.',
    });
  }

  let newStoragePath = null;

  try {
    const user = await findUserByFirebaseUid(req.user.uid);

    if (!user) {
      return res.status(404).json({
        message: 'User profile not found.',
      });
    }

    const previousStoragePath = user.profile_image_url;
    newStoragePath = buildAvatarStoragePath(user.user_id, fileExtension);

    const storageFile = storageBucket.file(newStoragePath);

    const contentTypes = {
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };

    // Clean up a partially uploaded file if Firebase Storage reports a failure.
    try {
      await storageFile.save(req.file.buffer, {
        metadata: {
          contentType: contentTypes[fileExtension],
          cacheControl: 'private, max-age=3600',
        },
      });
    } catch (uploadError) {
      try {
        await deleteResourceStorageFile(newStoragePath);
      } catch (cleanupError) {
        console.error('Failed to clean up incomplete avatar upload:', cleanupError);
      }

      throw uploadError;
    }

    try {
      await updateUserProfileByFirebaseUid(req.user.uid, {
        profileImageUrl: newStoragePath,
      });
    } catch (databaseError) {
      // Check whether MySQL committed the new reference before removing the file.
      try {
        const currentUser = await findUserByFirebaseUid(req.user.uid);

        if (currentUser?.profile_image_url !== newStoragePath) {
          await deleteResourceStorageFile(newStoragePath);
        }
      } catch (cleanupError) {
        console.error('Failed to verify or clean up avatar upload:', cleanupError);
      }

      throw databaseError;
    }

    // Remove the previous managed avatar after the replacement is saved.
    if (
      previousStoragePath &&
      previousStoragePath.startsWith(`users/${user.user_id}/avatars/`) &&
      previousStoragePath !== newStoragePath
    ) {
      try {
        await deleteResourceStorageFile(previousStoragePath);
      } catch (cleanupError) {
        console.error('Failed to delete previous avatar:', cleanupError);
      }
    }

    const updatedUser = await findUserByFirebaseUid(req.user.uid);

    return res.status(200).json({
      message: 'Profile picture updated successfully.',
      user: {
        userId: updatedUser.user_id,
        displayName: updatedUser.display_name,
        email: updatedUser.email,
        profileImageUrl: updatedUser.profile_image_url,
        bio: updatedUser.bio,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
      },
    });
  } catch (error) {
    console.error('Error uploading user avatar:', error);

    return res.status(500).json({
      message: 'Failed to upload profile picture.',
    });
  }
};

// Retrieve a user's saved avatar through an authenticated request.
const getUserAvatar = async (req, res) => {
  const userId = Number(req.params.userId);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(400).json({
      message: 'Invalid user ID.',
    });
  }

  try {
    const requester = await findUserByFirebaseUid(req.user.uid);

    if (!requester) {
      return res.status(404).json({
        message: 'Mosalinx user not found.',
      });
    }

    // Allow access to personal avatars and those of shared project members.
    if (requester.user_id !== userId) {
      const sharesProject = await usersShareProject(
        requester.user_id,
        userId
      );

      if (!sharesProject) {
        return res.status(403).json({
          message: 'You do not have permission to view this profile picture.',
        });
      }
    }

    const user = await findUserAvatarById(userId);

    if (!user || !user.profile_image_url) {
      return res.status(404).json({
        message: 'Profile picture not found.',
      });
    }

    const storagePath = user.profile_image_url;
    const expectedPrefix = `users/${userId}/avatars/`;

    // Only retrieve images from the requested user's avatar directory.
    if (!storagePath.startsWith(expectedPrefix)) {
      return res.status(404).json({
        message: 'Profile picture not found.',
      });
    }

    const extension = storagePath.split('.').pop();
    const contentTypes = {
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };

    const contentType = contentTypes[extension];

    if (!contentType) {
      return res.status(404).json({
        message: 'Unsupported profile picture format.',
      });
    }

    const storageFile = storageBucket.file(storagePath);

    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });

    // Stream the stored image without exposing Firebase Storage credentials.
    const stream = storageFile.createReadStream();

    stream.on('error', (error) => {
      console.error('Error reading user avatar:', error);

      if (!res.headersSent) {
        res.status(500).json({
          message: 'Failed to retrieve profile picture.',
        });
      } else {
        res.destroy(error);
      }
    });

    stream.pipe(res);
  } catch (error) {
    console.error('Error retrieving user avatar:', error);

    return res.status(500).json({
      message: 'Failed to retrieve profile picture.',
    });
  }
};

module.exports = {
  uploadUserAvatar,
  getUserAvatar,
};
