const path = require('path');

const { storageBucket } = require('../config/firebaseAdmin');

function sanitizeFileName(fileName) {
  return path
    .basename(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildResourceStoragePath(projectId, resourceId, fileName) {
  if (!projectId || !resourceId || !fileName) {
    throw new Error('projectId, resourceId, and fileName are required.');
  }

  const safeFileName = sanitizeFileName(fileName);

  return 'projects/' + projectId + '/resources/' + resourceId + '_' + safeFileName;
}

// Delete the Firebase Storage object for a resource.
const deleteResourceStorageFile = async (storagePath) => {
  if (!storagePath) {
    throw new Error('storagePath is required.');
  }

  const file = storageBucket.file(storagePath);

  try {
    await file.delete();
  } catch (error) {
    // Firebase returns this code when the file is already missing.
    if (error.code === 404) {
      return false;
    }

    throw error;
  }

  return true;
};

// Build a unique Firebase Storage path for a user's profile picture.
function buildAvatarStoragePath(userId, fileExtension) {
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error('A valid userId is required.');
  }

  const allowedExtensions = ['jpg', 'png', 'webp'];

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error('Unsupported avatar file extension.');
  }

  const uniqueId = require('crypto').randomUUID();

  return `users/${userId}/avatars/${uniqueId}.${fileExtension}`;
}

module.exports = {
  sanitizeFileName,
  buildResourceStoragePath,
  buildAvatarStoragePath,
  deleteResourceStorageFile,
};
