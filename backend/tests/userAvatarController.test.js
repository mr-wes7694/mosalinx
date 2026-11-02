const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');

// Track mocked database and Firebase Storage operations.
const calls = {
  findUser: 0,
  findAvatar: 0,
  shareProject: 0,
  updateProfile: 0,
  uploadStorage: 0,
  deleteStorage: 0,
  readStorage: 0,
};

const originalUser = {
  user_id: 7,
  display_name: 'Mosi Linx',
  email: 'mos126@test.com',
  profile_image_url: null,
  bio: null,
};

let currentUser = { ...originalUser };
let uploadError = null;
let databaseError = null;
let sharedProject = true;
let avatarReadStream = null;

// Reset mock state before individual test scenarios.
function resetMocks() {
  Object.keys(calls).forEach((key) => {
    calls[key] = 0;
  });

  currentUser = { ...originalUser };
  uploadError = null;
  databaseError = null;
  sharedProject = true;
  avatarReadStream = null;
}

// Mock user lookups, profile updates, and shared-project permissions.
const userModelPath = require.resolve('../models/userModel');

require.cache[userModelPath] = {
  id: userModelPath,
  filename: userModelPath,
  loaded: true,
  exports: {
    findUserByFirebaseUid: async () => {
      calls.findUser++;
      return currentUser ? { ...currentUser } : null;
    },
    findUserAvatarById: async (userId) => {
      calls.findAvatar++;
      return userId === currentUser.user_id
        ? { ...currentUser }
        : null;
    },
    usersShareProject: async () => {
      calls.shareProject++;
      return sharedProject;
    },
    updateUserProfileByFirebaseUid: async (_uid, updates) => {
      calls.updateProfile++;

      if (databaseError) {
        throw databaseError;
      }

      currentUser = {
        ...currentUser,
        profile_image_url: updates.profileImageUrl,
      };

      return 1;
    },
  },
};

// Mock Firebase Storage uploads and image retrieval.
const firebaseAdminPath = require.resolve('../config/firebaseAdmin');

require.cache[firebaseAdminPath] = {
  id: firebaseAdminPath,
  filename: firebaseAdminPath,
  loaded: true,
  exports: {
    storageBucket: {
      file: () => ({
        save: async () => {
          calls.uploadStorage++;

          if (uploadError) {
            throw uploadError;
          }
        },
        createReadStream: () => {
          calls.readStorage++;

          avatarReadStream = new EventEmitter();

          avatarReadStream.pipe = (res) => {
            res.piped = true;
            return res;
          };

          return avatarReadStream;
        },
      }),
    },
  },
};

// Mock avatar path generation and Storage file cleanup.
const storagePath = require.resolve('../utils/storage');

require.cache[storagePath] = {
  id: storagePath,
  filename: storagePath,
  loaded: true,
  exports: {
    buildAvatarStoragePath: (userId, extension) =>
      `users/${userId}/avatars/test-avatar.${extension}`,
    deleteResourceStorageFile: async () => {
      calls.deleteStorage++;
      return true;
    },
  },
};

// Load the avatar controller after its dependencies have been mocked.
const controller = require('../controllers/userAvatarController');

// Create a mock Express response for checking status codes and returned data.
const makeResponse = () => ({
  statusCode: 200,
  body: null,
  headers: {},
  headersSent: false,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  set(headers) {
    Object.assign(this.headers, headers);
    return this;
  },
  destroy(error) {
    this.destroyed = true;
    this.destroyError = error;
  },
});

// Create a mock authenticated request with a valid PNG upload.
const makeUploadRequest = () => ({
  user: { uid: 'firebase-test-user' },
  file: {
    buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    size: 8,
    mimetype: 'image/png',
  },
});

// Create a mock authenticated request for retrieving an avatar.
const makeAvatarRequest = (userId = '7') => ({
  params: { userId },
  user: { uid: 'firebase-test-user' },
});

// Verify that a valid avatar is uploaded and its Storage path is saved.
test('uploads a valid profile picture and updates the user profile', async () => {
  resetMocks();

  const req = makeUploadRequest();
  const res = makeResponse();

  await controller.uploadUserAvatar(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(calls.uploadStorage, 1);
  assert.equal(calls.updateProfile, 1);
  assert.equal(calls.deleteStorage, 0);

  assert.equal(
    currentUser.profile_image_url,
    'users/7/avatars/test-avatar.png'
  );

  assert.equal(
    res.body.user.profileImageUrl,
    'users/7/avatars/test-avatar.png'
  );

  assert.equal(
    res.body.message,
    'Profile picture updated successfully.'
  );
});

// Reject files whose contents do not match a supported image format.
test('rejects invalid profile picture files', async () => {
  resetMocks();

  const req = makeUploadRequest();
  req.file.buffer = Buffer.from('This is not an image.');
  req.file.size = req.file.buffer.length;

  const res = makeResponse();

  await controller.uploadUserAvatar(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(calls.uploadStorage, 0);
  assert.equal(calls.updateProfile, 0);

  assert.equal(
    res.body.message,
    'Please upload a valid JPEG, PNG, or WebP image under 5 MB.'
  );
});


// Verify that failed Storage uploads do not update the user profile.
test('handles Firebase Storage upload failures safely', async () => {
  resetMocks();
  uploadError = new Error('Simulated Firebase Storage failure');

  const res = makeResponse();
  await controller.uploadUserAvatar(makeUploadRequest(), res);

  assert.equal(res.statusCode, 500);
  assert.equal(calls.uploadStorage, 1);
  assert.equal(calls.updateProfile, 0);
  assert.equal(calls.deleteStorage, 1);
  assert.equal(currentUser.profile_image_url, null);
  assert.equal(res.body.message, 'Failed to upload profile picture.');
});

// Verify that a failed database update triggers cleanup of the new image.
test('cleans up uploaded image when database update fails', async () => {
  resetMocks();
  databaseError = new Error('Simulated database failure');

  const res = makeResponse();
  await controller.uploadUserAvatar(makeUploadRequest(), res);

  assert.equal(res.statusCode, 500);
  assert.equal(calls.uploadStorage, 1);
  assert.equal(calls.updateProfile, 1);
  assert.equal(calls.deleteStorage, 1);
  assert.equal(currentUser.profile_image_url, null);
});

// Verify that replacing an avatar removes the previous managed file.
test('deletes previous avatar after successful replacement', async () => {
  resetMocks();
  currentUser.profile_image_url = 'users/7/avatars/old-avatar.jpg';

  const res = makeResponse();
  await controller.uploadUserAvatar(makeUploadRequest(), res);

  assert.equal(res.statusCode, 200);
  assert.equal(calls.uploadStorage, 1);
  assert.equal(calls.updateProfile, 1);
  assert.equal(calls.deleteStorage, 1);
  assert.equal(currentUser.profile_image_url, 'users/7/avatars/test-avatar.png');
});

// Verify that unsupported file types are rejected.
test('rejects files with mismatched MIME types', async () => {
  resetMocks();

  const req = makeUploadRequest();
  req.file.mimetype = 'application/pdf';

  const res = makeResponse();
  await controller.uploadUserAvatar(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(calls.uploadStorage, 0);
  assert.equal(calls.updateProfile, 0);
});

// Verify that oversized images are rejected.
test('rejects profile pictures larger than 5 MB', async () => {
  resetMocks();

  const req = makeUploadRequest();
  req.file.size = 5 * 1024 * 1024 + 1;

  const res = makeResponse();
  await controller.uploadUserAvatar(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(calls.uploadStorage, 0);
  assert.equal(calls.updateProfile, 0);
});

// Verify that missing database profiles cannot upload avatars.
test('rejects avatar uploads for missing user profiles', async () => {
  resetMocks();
  currentUser = null;

  const res = makeResponse();
  await controller.uploadUserAvatar(makeUploadRequest(), res);

  assert.equal(res.statusCode, 404);
  assert.equal(calls.uploadStorage, 0);
  assert.equal(calls.updateProfile, 0);
});

// Verify that users can retrieve their own saved avatars.
test('retrieves an authenticated user avatar', async () => {
  resetMocks();
  currentUser.profile_image_url = 'users/7/avatars/test-avatar.png';

  const res = makeResponse();
  await controller.getUserAvatar(makeAvatarRequest(), res);

  assert.equal(res.statusCode, 200);
  assert.equal(calls.readStorage, 1);
  assert.equal(res.piped, true);
  assert.equal(res.headers['Content-Type'], 'image/png');
  assert.equal(res.headers['Cache-Control'], 'private, no-store');
  assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
});

// Verify that unauthorized users cannot retrieve another user's avatar.
test('rejects avatar retrieval without shared project access', async () => {
  resetMocks();
  sharedProject = false;

  const res = makeResponse();
  await controller.getUserAvatar(makeAvatarRequest('8'), res);

  assert.equal(res.statusCode, 403);
  assert.equal(calls.shareProject, 1);
  assert.equal(calls.readStorage, 0);
});

// Verify that invalid user IDs are rejected.
test('rejects invalid avatar user IDs', async () => {
  resetMocks();

  const res = makeResponse();
  await controller.getUserAvatar(makeAvatarRequest('invalid'), res);

  assert.equal(res.statusCode, 400);
  assert.equal(calls.findUser, 0);
  assert.equal(calls.readStorage, 0);
});

// Verify that missing avatar references return a 404 response.
test('returns 404 when a user has no saved avatar', async () => {
  resetMocks();

  const res = makeResponse();
  await controller.getUserAvatar(makeAvatarRequest(), res);

  assert.equal(res.statusCode, 404);
  assert.equal(calls.readStorage, 0);
});

// Verify that unsupported avatar storage paths are rejected.
test('rejects avatar paths outside the user storage directory', async () => {
  resetMocks();
  currentUser.profile_image_url = 'projects/1/resources/private.png';

  const res = makeResponse();
  await controller.getUserAvatar(makeAvatarRequest(), res);

  assert.equal(res.statusCode, 404);
  assert.equal(calls.readStorage, 0);
});

// Verify that unsupported stored image extensions are rejected.
test('rejects unsupported stored avatar formats', async () => {
  resetMocks();
  currentUser.profile_image_url = 'users/7/avatars/avatar.gif';

  const res = makeResponse();
  await controller.getUserAvatar(makeAvatarRequest(), res);

  assert.equal(res.statusCode, 404);
  assert.equal(calls.readStorage, 0);
});

// Return a server error when Firebase Storage fails before sending the image.
test('handles avatar stream errors before response headers are sent', async () => {
  resetMocks();
  currentUser.profile_image_url = 'users/7/avatars/test-avatar.png';

  const res = makeResponse();
  await controller.getUserAvatar(makeAvatarRequest(), res);

  assert.ok(avatarReadStream);

  avatarReadStream.emit('error', new Error('Simulated Storage read failure'));

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.message, 'Failed to retrieve profile picture.');
  assert.equal(res.destroyed, undefined);
});

// Close the response if Firebase Storage fails after streaming has started.
test('handles avatar stream errors after response headers are sent', async () => {
  resetMocks();
  currentUser.profile_image_url = 'users/7/avatars/test-avatar.png';

  const res = makeResponse();
  await controller.getUserAvatar(makeAvatarRequest(), res);

  assert.ok(avatarReadStream);

  res.headersSent = true;

  const streamError = new Error('Simulated interrupted Storage stream');
  avatarReadStream.emit('error', streamError);

  assert.equal(res.destroyed, true);
  assert.equal(res.destroyError, streamError);
});
