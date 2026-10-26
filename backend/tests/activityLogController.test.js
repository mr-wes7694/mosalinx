
const test = require('node:test');
const assert = require('node:assert/strict');

// Mock the controller dependencies so these tests do not need a database.
const userModelPath = require.resolve('../models/userModel');
const projectModelPath = require.resolve('../models/projectModel');
const activityLogModelPath = require.resolve('../models/activityLogModel');
const permissionsPath = require.resolve('../utils/projectPermissions');

const mocks = {
    user: { user_id: 7 },
    project: { project_id: 15 },
    permission: { allowed: true, role: 'owner' },
    activities: [
        {
            activity_id: 1,
            project_id: 15,
            user_id: 7,
            display_name: 'Test User',
            activity_type: 'project_created',
            activity_description: 'Created a project',
        },
    ],
    calls: {},
};

require.cache[userModelPath] = {
    id: userModelPath,
    filename: userModelPath,
    loaded: true,
    exports: {
        findUserByFirebaseUid: async (...args) => {
            mocks.calls.findUserByFirebaseUid = args;
            return mocks.user;
        },
    },
};

require.cache[projectModelPath] = {
    id: projectModelPath,
    filename: projectModelPath,
    loaded: true,
    exports: {
        findProjectById: async (...args) => {
            mocks.calls.findProjectById = args;
            return mocks.project;
        },
    },
};

require.cache[activityLogModelPath] = {
    id: activityLogModelPath,
    filename: activityLogModelPath,
    loaded: true,
    exports: {
        findActivityLogsByProjectId: async (...args) => {
            mocks.calls.findActivityLogsByProjectId = args;
            return mocks.activities;
        },
    },
};

require.cache[permissionsPath] = {
    id: permissionsPath,
    filename: permissionsPath,
    loaded: true,
    exports: {
        checkProjectPermission: async (...args) => {
            mocks.calls.checkProjectPermission = args;
            return mocks.permission;
        },
    },
};

const { getProjectActivity } = require('../controllers/activityLogController');

const createResponse = () => {
    const response = {
        statusCode: 200,
        body: null,
    };

    response.status = (code) => {
        response.statusCode = code;
        return response;
    };

    response.json = (body) => {
        response.body = body;
        return response;
    };

    return response;
};

const createRequest = (overrides = {}) => ({
    user: { uid: 'firebase-user-123' },
    params: { projectId: '15' },
    query: {},
    ...overrides,
});

const resetMocks = () => {
    mocks.user = { user_id: 7 };
    mocks.project = { project_id: 15 };
    mocks.permission = { allowed: true, role: 'owner' };
    mocks.activities = [
        {
            activity_id: 1,
            project_id: 15,
            user_id: 7,
            display_name: 'Test User',
            activity_type: 'project_created',
            activity_description: 'Created a project',
        },
    ];
    mocks.calls = {};
};

test('returns 401 when the request has no authenticated user', async () => {
    resetMocks();
    const response = createResponse();

    await getProjectActivity(
        createRequest({ user: undefined }),
        response
    );

    assert.equal(response.statusCode, 401);
    assert.equal(response.body.message, 'Authentication required.');
    assert.equal(mocks.calls.findUserByFirebaseUid, undefined);
});

test('returns 400 for an invalid project ID', async () => {
    resetMocks();
    const response = createResponse();

    await getProjectActivity(
        createRequest({ params: { projectId: '0' } }),
        response
    );

    assert.equal(response.statusCode, 400);
    assert.equal(mocks.calls.findUserByFirebaseUid, undefined);
});

test('returns 400 when the requested limit is outside 1 to 100', async () => {
    resetMocks();
    const response = createResponse();

    await getProjectActivity(
        createRequest({ query: { limit: '101' } }),
        response
    );

    assert.equal(response.statusCode, 400);
    assert.equal(mocks.calls.findActivityLogsByProjectId, undefined);
});

test('returns 404 when the local user does not exist', async () => {
    resetMocks();
    mocks.user = null;
    const response = createResponse();

    await getProjectActivity(createRequest(), response);

    assert.equal(response.statusCode, 404);
    assert.equal(response.body.message, 'Mosalinx user not found.');
});

test('returns 404 when the project does not exist', async () => {
    resetMocks();
    mocks.project = null;
    const response = createResponse();

    await getProjectActivity(createRequest(), response);

    assert.equal(response.statusCode, 404);
    assert.equal(response.body.message, 'Project not found.');
    assert.equal(mocks.calls.findActivityLogsByProjectId, undefined);
});

test('returns 403 when the user is not a project member', async () => {
    resetMocks();
    mocks.permission = { allowed: false, role: null };
    const response = createResponse();

    await getProjectActivity(createRequest(), response);

    assert.equal(response.statusCode, 403);
    assert.equal(
        response.body.message,
        'You do not have access to this project.'
    );
    assert.equal(mocks.calls.findActivityLogsByProjectId, undefined);
});

test('returns activity for an authorized member with the default limit', async () => {
    resetMocks();
    const response = createResponse();

    await getProjectActivity(createRequest(), response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { activities: mocks.activities });
    assert.deepEqual(
        mocks.calls.findActivityLogsByProjectId,
        [15, 50]
    );
    assert.deepEqual(
        mocks.calls.checkProjectPermission,
        [15, 7, ['owner', 'collaborator']]
    );
});

test('uses a valid requested limit and returns an empty activity list', async () => {
    resetMocks();
    mocks.activities = [];
    const response = createResponse();

    await getProjectActivity(
        createRequest({ query: { limit: '10' } }),
        response
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { activities: [] });
    assert.deepEqual(
        mocks.calls.findActivityLogsByProjectId,
        [15, 10]
    );
});
