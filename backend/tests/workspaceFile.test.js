
const test = require('node:test');
const assert = require('node:assert/strict');

// Track calls to make sure invalid requests stop before database access.
const calls = {
    findUser: 0,
    isProjectMember: 0,
    createFile: 0,
};

// Mock the resource model.
const resourceModelPath = require.resolve('../models/resourceModel');

require.cache[resourceModelPath] = {
    id: resourceModelPath,
    filename: resourceModelPath,
    loaded: true,
    exports: {
        createWorkspaceFile: async (...args) => {
            calls.createFile++;
            return {
                resourceId: 101,
                projectId: args[0],
                uploadedBy: args[1],
                resourceName: args[2],
                resourceType: `workspace_${args[3]}`,
                fileSize: args[4],
                category: args[5],
                storagePath: args[6],
            };
        },
        updateResourceStoragePath: async () => {},
        findWorkspaceFileById: async (resourceId) => {
    if (String(resourceId) !== '101') {
        return null;
    }

    return {
        resource_id: 101,
        project_id: 1,
        uploaded_by: 8,
        resource_name: 'Meeting Notes',
        resource_type: 'workspace_document',
        file_size: 25,
        category: 'Documents',
        storage_path: 'projects/1/workspace/101_Meeting_Notes.json',
    };
},
        findWorkspaceFilesByProject: async () => [],
        updateWorkspaceFile: async () => true,
        deleteResourceById: async () => {},
        isProjectMember: async (...args) => {
            calls.isProjectMember++;
            return args[0] === '1' || args[0] === 1;
        },
    },
};

// Mock the user model.
const userModelPath = require.resolve('../models/userModel');

require.cache[userModelPath] = {
    id: userModelPath,
    filename: userModelPath,
    loaded: true,
    exports: {

findUserByFirebaseUid: async (firebaseUid) => {
    calls.findUser++;

    let userId = 7;

    if (firebaseUid === 'firebase-uploader') {
        userId = 8;
    } else if (firebaseUid === 'firebase-another-user') {
        userId = 9;
    }

    return {
        user_id: userId,
        email: 'test@example.com',
    };
},

    },
};

// Mock project permission checks.
const permissionsPath = require.resolve('../utils/projectPermissions');

require.cache[permissionsPath] = {
    id: permissionsPath,
    filename: permissionsPath,
    loaded: true,
    exports: {

checkProjectPermission: async (projectId, userId) => ({
    allowed: true,
    role: Number(userId) === 7
        ? 'owner'
        : 'collaborator',
}),

    },
};

// Mock Firebase Storage.
const firebaseAdminPath = require.resolve('../config/firebaseAdmin');

require.cache[firebaseAdminPath] = {
    id: firebaseAdminPath,
    filename: firebaseAdminPath,
    loaded: true,
    exports: {
        storageBucket: {
            file: () => ({
                save: async () => {},
                exists: async () => [true],
                download: async () => [
                    Buffer.from(JSON.stringify({ text: 'saved content' })),
                ],
                delete: async () => {},
            }),
        },
    },
};

// Mock storage helpers.
const storagePath = require.resolve('../utils/storage');

require.cache[storagePath] = {
    id: storagePath,
    filename: storagePath,
    loaded: true,
    exports: {
        buildResourceStoragePath: () => 'test/path.json',
        deleteResourceStorageFile: async () => {},
    },
};

const controller = require('../controllers/workspaceFileController');

// Build simple request and response objects for controller tests.
const makeResponse = () => {
    const res = {
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
    };

    return res;
};

const makeRequest = (body = {}, params = {}, uid = 'firebase-test-user') => ({
    body,
    params,
    user: uid ? { uid } : undefined,
});

// Invalid project ID is rejected before user or database lookup.
test('rejects Workspace creation with an invalid project ID', async () => {
    calls.findUser = 0;
    calls.isProjectMember = 0;
    calls.createFile = 0;

    const req = makeRequest({
        projectId: 'abc',
        name: 'Notes',
        fileType: 'document',
        category: 'Documents',
        content: 'Hello',
    });

    const res = makeResponse();

    await controller.createWorkspaceFileRecord(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(calls.findUser, 0);
    assert.equal(calls.isProjectMember, 0);
    assert.equal(calls.createFile, 0);
});

// Unsupported file types are rejected.
test('rejects an unsupported Workspace file type', async () => {
    const req = makeRequest({
        projectId: 1,
        name: 'Notes',
        fileType: 'unknown',
        category: 'Documents',
        content: 'Hello',
    });

    const res = makeResponse();

    await controller.createWorkspaceFileRecord(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Unsupported Workspace file type.');
});

// Unsupported folder categories are rejected.
test('rejects an unsupported Workspace folder category', async () => {
    const req = makeRequest({
        projectId: 1,
        name: 'Notes',
        fileType: 'document',
        category: 'CustomFolder',
        content: 'Hello',
    });

    const res = makeResponse();

    await controller.createWorkspaceFileRecord(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(
        res.body.message,
        'Unsupported Workspace folder category.'
    );
});

// Missing content is rejected.
test('rejects Workspace creation when content is missing', async () => {
    const req = makeRequest({
        projectId: 1,
        name: 'Notes',
        fileType: 'document',
        category: 'Documents',
    });

    const res = makeResponse();

    await controller.createWorkspaceFileRecord(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'File content is required.');
});

// Missing names are rejected.
test('rejects Workspace creation when the file name is empty', async () => {
    const req = makeRequest({
        projectId: 1,
        name: '   ',
        fileType: 'document',
        category: 'Documents',
        content: 'Hello',
    });

    const res = makeResponse();

    await controller.createWorkspaceFileRecord(req, res);

    assert.equal(res.statusCode, 400);
});

test('rejects Workspace creation when the user is not authenticated', async () => {
    calls.findUser = 0;

    const req = makeRequest({
        projectId: 1,
        name: 'Notes',
        fileType: 'document',
        category: 'Documents',
        content: 'Hello',
    }, {}, null);

    const res = makeResponse();

    await controller.createWorkspaceFileRecord(req, res);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, 'Unauthorized.');
    assert.equal(calls.findUser, 0);
});

test('rejects Workspace creation when the user is not a project member', async () => {
    const req = makeRequest({
        projectId: 2,
        name: 'Notes',
        fileType: 'document',
        category: 'Documents',
        content: 'Hello',
    });

    const res = makeResponse();

    await controller.createWorkspaceFileRecord(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(
        res.body.message,
        'You are not a member of this project.'
    );
});

test('creates a Workspace file and returns its saved content', async () => {
    const req = makeRequest({
        projectId: 1,
        name: 'Meeting Notes',
        fileType: 'document',
        category: 'Documents',
        content: { text: 'Plan the next sprint' },
    });

    const res = makeResponse();

    await controller.createWorkspaceFileRecord(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(
        res.body.message,
        'Workspace file created successfully.'
    );
    assert.equal(res.body.file.resourceId, 101);
    assert.equal(res.body.file.resourceType, 'workspace_document');
    assert.deepEqual(
        res.body.file.content,
        { text: 'Plan the next sprint' }
    );
    assert.match(res.body.file.storagePath, /workspace/);
});

test('rejects Workspace retrieval when the resource ID is invalid', async () => {
    const req = makeRequest({}, { resourceId: 'invalid' });
    const res = makeResponse();

    await controller.getWorkspaceFile(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'A valid resourceId is required.');
});

test('returns 404 when the requested Workspace file does not exist', async () => {
    const req = makeRequest({}, { resourceId: '999' });
    const res = makeResponse();

    await controller.getWorkspaceFile(req, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Workspace file not found.');
});

test('rejects Workspace listing when the project ID is invalid', async () => {
    const req = makeRequest({}, { projectId: 'invalid' });
    const res = makeResponse();

    await controller.listWorkspaceFiles(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'A valid projectId is required.');
});

test('returns an empty list when a member has no Workspace files', async () => {
    const req = makeRequest({}, { projectId: '1' });
    const res = makeResponse();

    await controller.listWorkspaceFiles(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.files, []);
});

test('retrieves saved Workspace content for a project member', async () => {
    const req = makeRequest({}, { resourceId: '101' }, 'firebase-uploader');
    const res = makeResponse();

    await controller.getWorkspaceFile(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.file.resource_id, 101);
    assert.equal(res.body.file.resource_type, 'workspace_document');
    assert.deepEqual(
        res.body.file.content,
        { text: 'saved content' }
    );
});

test('allows the original uploader to update a Workspace file', async () => {
    const req = makeRequest({
        name: 'Updated Notes',
        content: { text: 'Updated sprint notes' },
    }, { resourceId: '101' });

    const res = makeResponse();

    await controller.updateWorkspaceFileRecord(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(
        res.body.message,
        'Workspace file updated successfully.'
    );
    assert.equal(res.body.file.resource_name, 'Meeting Notes');
    assert.deepEqual(
        res.body.file.content,
        { text: 'Updated sprint notes' }
    );
});

test('denies a collaborator who is not the uploader from editing a Workspace file', async () => {
    const req = makeRequest({
        name: 'Changed by Another User',
        content: { text: 'Unauthorized edit' },
    }, { resourceId: '101', }, 'firebase-another-user');

    const res = makeResponse();

    await controller.updateWorkspaceFileRecord(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(
        res.body.message,
        'Only the original uploader or project owner can edit this file.'
    );
});

test('allows a project owner to edit a Workspace file uploaded by another member', async () => {
    const req = makeRequest({
        name: 'Owner Updated Notes',
        content: { text: 'Owner approved changes' },
    }, { resourceId: '101' });

    const res = makeResponse();

    await controller.updateWorkspaceFileRecord(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(
        res.body.message,
        'Workspace file updated successfully.'
    );
});
