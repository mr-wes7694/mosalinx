const test = require('node:test');
const assert = require('node:assert/strict');

const calls = {
  findUser: 0,
  updateProfile: 0,
};

const originalUser = {
  user_id: 7,
  display_name: 'Mosi Linx',
  email: 'mos126@test.com',
  profile_image_url: null,
  bio: 'Creative collaborator',
  birthdate: '2000-05-15',
  gender: 'Non-binary',
  pronouns: 'they/them',
  created_at: null,
  updated_at: null,
};

let currentUser = { ...originalUser };
let databaseError = null;
let lastUpdates = null;

function resetMocks() {
  calls.findUser = 0;
  calls.updateProfile = 0;
  currentUser = { ...originalUser };
  databaseError = null;
  lastUpdates = null;
}

const userModelPath = require.resolve('../models/userModel');

require.cache[userModelPath] = {
  id: userModelPath,
  filename: userModelPath,
  loaded: true,
  exports: {
    findUserByEmail: async () => null,

    findUserByFirebaseUid: async () => {
      calls.findUser++;
      return currentUser ? { ...currentUser } : null;
    },

    updateUserProfileByFirebaseUid: async (_uid, updates) => {
      calls.updateProfile++;
      lastUpdates = { ...updates };

      if (databaseError) {
        throw databaseError;
      }

      const fieldMap = {
        displayName: 'display_name',
        bio: 'bio',
        birthdate: 'birthdate',
        gender: 'gender',
        pronouns: 'pronouns',
      };

      Object.entries(fieldMap).forEach(([key, column]) => {
        if (updates[key] !== undefined) {
          currentUser[column] = updates[key];
        }
      });

      return 1;
    },

    createUser: async () => null,
  },
};

const controller = require('../controllers/userController');

const makeResponse = () => ({
  statusCode: 200,
  body: null,

  status(code) {
    this.statusCode = code;
    return this;
  },

  json(body) {
    this.body = body;
    return this;
  },
});

const makeRequest = (body = {}) => ({
  user: { uid: 'firebase-test-user' },
  body,
});

test('retrieves the authenticated user profile with personal fields', async () => {
  resetMocks();

  const res = makeResponse();

  await controller.getUserProfile(makeRequest(), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.userId, 7);
  assert.equal(res.body.user.birthdate, '2000-05-15');
  assert.equal(res.body.user.gender, 'Non-binary');
  assert.equal(res.body.user.pronouns, 'they/them');
  assert.equal(calls.findUser, 1);
});

test('returns 404 when the authenticated user profile does not exist', async () => {
  resetMocks();
  currentUser = null;

  const res = makeResponse();

  await controller.getUserProfile(makeRequest(), res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, 'User profile not found');
});

test('updates birthdate, gender, and pronouns', async () => {
  resetMocks();

  const res = makeResponse();

  await controller.updateUserProfile(
    makeRequest({
      birthdate: '1998-10-20',
      gender: 'Female',
      pronouns: 'she/her',
    }),
    res
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.birthdate, '1998-10-20');
  assert.equal(res.body.user.gender, 'Female');
  assert.equal(res.body.user.pronouns, 'she/her');
  assert.equal(calls.updateProfile, 1);
});

test('updates only the profile fields included in the request', async () => {
  resetMocks();

  const res = makeResponse();

  await controller.updateUserProfile(
    makeRequest({ pronouns: 'he/him' }),
    res
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.pronouns, 'he/him');
  assert.equal(res.body.user.birthdate, '2000-05-15');
  assert.equal(res.body.user.gender, 'Non-binary');
  assert.equal(lastUpdates.birthdate, undefined);
  assert.equal(lastUpdates.gender, undefined);
});

test('allows personal profile fields to be cleared', async () => {
  resetMocks();

  const res = makeResponse();

  await controller.updateUserProfile(
    makeRequest({
      birthdate: null,
      gender: '',
      pronouns: '   ',
    }),
    res
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.birthdate, null);
  assert.equal(res.body.user.gender, null);
  assert.equal(res.body.user.pronouns, null);
  assert.equal(lastUpdates.birthdate, null);
  assert.equal(lastUpdates.gender, null);
  assert.equal(lastUpdates.pronouns, null);
});

test('rejects an invalid calendar birthdate', async () => {
  resetMocks();

  const res = makeResponse();

  await controller.updateUserProfile(
    makeRequest({ birthdate: '2001-02-30' }),
    res
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Invalid birthdate');
  assert.equal(calls.updateProfile, 0);
});

test('rejects a future birthdate', async () => {
  resetMocks();

  const futureDate = new Date(Date.now() + 86400000)
    .toISOString()
    .slice(0, 10);

  const res = makeResponse();

  await controller.updateUserProfile(
    makeRequest({ birthdate: futureDate }),
    res
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Invalid birthdate');
  assert.equal(calls.updateProfile, 0);
});

test('rejects an unsupported gender value', async () => {
  resetMocks();

  const res = makeResponse();

  await controller.updateUserProfile(
    makeRequest({ gender: 'Other value' }),
    res
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Invalid gender');
  assert.equal(calls.updateProfile, 0);
});

test('rejects pronouns longer than 50 characters', async () => {
  resetMocks();

  const res = makeResponse();

  await controller.updateUserProfile(
    makeRequest({ pronouns: 'a'.repeat(51) }),
    res
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Invalid pronouns');
  assert.equal(calls.updateProfile, 0);
});

test('rejects an empty profile update', async () => {
  resetMocks();

  const res = makeResponse();

  await controller.updateUserProfile(makeRequest({}), res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'No profile updates provided');
  assert.equal(calls.updateProfile, 0);
});

test('returns 404 when updating a missing user profile', async () => {
  resetMocks();
  currentUser = null;

  const res = makeResponse();

  await controller.updateUserProfile(
    makeRequest({ pronouns: 'they/them' }),
    res
  );

  assert.equal(res.statusCode, 404);
  assert.equal(calls.updateProfile, 0);
});

test('returns 500 when the profile update fails', async () => {
  resetMocks();
  databaseError = new Error('Simulated database failure');

  const res = makeResponse();

  await controller.updateUserProfile(
    makeRequest({ pronouns: 'they/them' }),
    res
  );

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.message, 'Internal server error');
});
