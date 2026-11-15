const test = require('node:test');
const assert = require('node:assert/strict');

// Mock controller dependencies so tests do not need a database.
const userModelPath = require.resolve('../models/userModel');
const workspacePostModelPath = require.resolve('../models/workspacePostModel');
const commentModelPath = require.resolve('../models/commentModel');
const permissionsPath = require.resolve('../utils/projectPermissions');

const mocks = {
    user: { user_id: 7 },
    post: { post_id: 25, project_id: 15 },
    permission: { allowed: true, role: 'owner' },
    comments: [
        {
            commentId: 1,
            postId: 25,
            commentContent: 'First comment',
            createdAt: '2026-11-13 10:00:00',
            createdBy: {
                userId: 7,
                displayName: 'Test User',
                profileImageUrl: null,
            },
        },
    ],
    calls: {},
    errors: {},
};

require.cache[userModelPath] = {
    id: userModelPath,
    filename: userModelPath,
    loaded: true,
    exports: {
        findUserByFirebaseUid: async (...args) => {
            mocks.calls.findUserByFirebaseUid = args;

            if (mocks.errors.findUserByFirebaseUid) {
                throw mocks.errors.findUserByFirebaseUid;
            }

            return mocks.user;
        },
    },
};

require.cache[workspacePostModelPath] = {
    id: workspacePostModelPath,
    filename: workspacePostModelPath,
    loaded: true,
    exports: {
        findWorkspacePostById: async (...args) => {
            mocks.calls.findWorkspacePostById = args;

            if (mocks.errors.findWorkspacePostById) {
                throw mocks.errors.findWorkspacePostById;
            }

            return mocks.post;
        },
    },
};

require.cache[commentModelPath] = {
    id: commentModelPath,
    filename: commentModelPath,
    loaded: true,
    exports: {
        createComment: async () => {},
        findCommentsByPostId: async (...args) => {
            mocks.calls.findCommentsByPostId = args;

            if (mocks.errors.findCommentsByPostId) {
                throw mocks.errors.findCommentsByPostId;
            }

            return mocks.comments;
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

            if (mocks.errors.checkProjectPermission) {
                throw mocks.errors.checkProjectPermission;
            }

            return mocks.permission;
        },
    },
};

const { getPostComments } = require('../controllers/commentController');

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
    params: { postId: '25' },
    ...overrides,
});

const resetMocks = () => {
    mocks.user = { user_id: 7 };
    mocks.post = { post_id: 25, project_id: 15 };
    mocks.permission = { allowed: true, role: 'owner' };
    mocks.comments = [
        {
            commentId: 1,
            postId: 25,
            commentContent: 'First comment',
            createdAt: '2026-11-13 10:00:00',
            createdBy: {
                userId: 7,
                displayName: 'Test User',
                profileImageUrl: null,
            },
        },
    ];
    mocks.calls = {};
    mocks.errors = {};
};

test('returns 401 when the request has no authenticated user', async () => {
    resetMocks();
    const response = createResponse();

    await getPostComments(
        createRequest({ user: undefined }),
        response
    );

    assert.equal(response.statusCode, 401);
    assert.equal(response.body.message, 'Authentication required.');
    assert.equal(mocks.calls.findUserByFirebaseUid, undefined);
});

test('returns 404 when the Mosalinx user does not exist', async () => {
    resetMocks();
    mocks.user = null;
    const response = createResponse();

    await getPostComments(createRequest(), response);

    assert.equal(response.statusCode, 404);
    assert.equal(response.body.message, 'Mosalinx user not found.');
    assert.equal(mocks.calls.findWorkspacePostById, undefined);
});

test('returns 400 for an invalid post ID', async (t) => {
    const invalidIds = ['0', '-1', 'abc', '1.5', ''];

    for (const postId of invalidIds) {
        await t.test(`rejects post ID "${postId}"`, async () => {
            resetMocks();
            const response = createResponse();

            await getPostComments(
                createRequest({ params: { postId } }),
                response
            );

            assert.equal(response.statusCode, 400);
            assert.equal(
                response.body.message,
                'A valid postId is required.'
            );
            assert.equal(mocks.calls.findWorkspacePostById, undefined);
        });
    }
});

test('returns 404 when the workspace post does not exist', async () => {
    resetMocks();
    mocks.post = null;
    const response = createResponse();

    await getPostComments(createRequest(), response);

    assert.equal(response.statusCode, 404);
    assert.equal(response.body.message, 'Workspace post not found.');
    assert.equal(mocks.calls.checkProjectPermission, undefined);
    assert.equal(mocks.calls.findCommentsByPostId, undefined);
});

test('returns 403 when the user is not a project member', async () => {
    resetMocks();
    mocks.permission = { allowed: false, role: null };
    const response = createResponse();

    await getPostComments(createRequest(), response);

    assert.equal(response.statusCode, 403);
    assert.equal(
        response.body.message,
        'You are not a member of this project.'
    );
    assert.equal(mocks.calls.findCommentsByPostId, undefined);
});

test('returns comments for an authorized project member', async () => {
    resetMocks();
    const response = createResponse();

    await getPostComments(createRequest(), response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, {
        comments: mocks.comments,
    });
    assert.deepEqual(mocks.calls.findWorkspacePostById, [25]);
    assert.deepEqual(
        mocks.calls.checkProjectPermission,
        [15, 7, ['owner', 'collaborator']]
    );
    assert.deepEqual(mocks.calls.findCommentsByPostId, [25]);
});

test('returns an empty comments array when the post has no comments', async () => {
    resetMocks();
    mocks.comments = [];
    const response = createResponse();

    await getPostComments(createRequest(), response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { comments: [] });
});

test('returns 500 when user lookup fails', async () => {
    resetMocks();
    mocks.errors.findUserByFirebaseUid = new Error('Database unavailable');
    const response = createResponse();

    await getPostComments(createRequest(), response);

    assert.equal(response.statusCode, 500);
    assert.equal(response.body.message, 'Failed to retrieve comments.');
});

test('returns 500 when workspace post lookup fails', async () => {
    resetMocks();
    mocks.errors.findWorkspacePostById = new Error('Database unavailable');
    const response = createResponse();

    await getPostComments(createRequest(), response);

    assert.equal(response.statusCode, 500);
    assert.equal(response.body.message, 'Failed to retrieve comments.');
});

test('returns 500 when project permission lookup fails', async () => {
    resetMocks();
    mocks.errors.checkProjectPermission = new Error('Database unavailable');
    const response = createResponse();

    await getPostComments(createRequest(), response);

    assert.equal(response.statusCode, 500);
    assert.equal(response.body.message, 'Failed to retrieve comments.');
});

test('returns 500 when comment retrieval fails', async () => {
    resetMocks();
    mocks.errors.findCommentsByPostId = new Error('Database unavailable');
    const response = createResponse();

    await getPostComments(createRequest(), response);

    assert.equal(response.statusCode, 500);
    assert.equal(response.body.message, 'Failed to retrieve comments.');
});