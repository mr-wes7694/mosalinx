
const test = require('node:test');
const assert = require('node:assert/strict');

const activityLogModel = require('../models/activityLogModel');
const resourceModel = require('../models/resourceModel');
const userModel = require('../models/userModel');
const projectModel = require('../models/projectModel');
const firebaseAdmin = require('../config/firebaseAdmin');
const storageUtils = require('../utils/storage');

const originalCreateActivityLog = activityLogModel.createActivityLog;
const originalCreateResource = resourceModel.createResource;
const originalUpdateResourceStoragePath = resourceModel.updateResourceStoragePath;
const originalDeleteResourceById = resourceModel.deleteResourceById;
const originalFindUserByFirebaseUid = userModel.findUserByFirebaseUid;
const originalIsProjectMember = resourceModel.isProjectMember;
const originalBuildResourceStoragePath = storageUtils.buildResourceStoragePath;
const originalBucketFile = firebaseAdmin.storageBucket.file;

test('failed upload activity logging triggers resource cleanup', async () => {
    let firebaseDeleteCalled = false;
    let databaseDeleteId = null;
    let responseStatus = null;
    let responseBody = null;

    activityLogModel.createActivityLog = async () => {
        throw new Error('Activity log insert failed');
    };

    resourceModel.createResource = async () => ({
        resourceId: 456,
        resourceName: 'test.txt',
    });

    resourceModel.updateResourceStoragePath = async () => {};
    resourceModel.deleteResourceById = async (resourceId) => {
        databaseDeleteId = resourceId;
    };

    userModel.findUserByFirebaseUid = async () => ({
        user_id: 7,
    });

    resourceModel.isProjectMember = async () => true;

    storageUtils.buildResourceStoragePath = () => 'test/path/456.txt';

    firebaseAdmin.storageBucket.file = () => ({
        save: async () => {},
        delete: async () => {
            firebaseDeleteCalled = true;
        },
    });

    // Load the controller after setting up its dependency mocks.
    delete require.cache[require.resolve('../controllers/resourceController')];
    const { uploadResource } = require('../controllers/resourceController');

    const req = {
        body: {
            projectId: '15',
            category: 'document',
        },
        user: {
            uid: 'test-firebase-user',
        },
        file: {
            originalname: 'test.txt',
            mimetype: 'text/plain',
            size: 4,
            buffer: Buffer.from('test'),
        },
    };

    const res = {
        status(code) {
            responseStatus = code;
            return this;
        },
        json(body) {
            responseBody = body;
            return this;
        },
    };

    try {
        await uploadResource(req, res);

        assert.equal(firebaseDeleteCalled, true);
        assert.equal(databaseDeleteId, 456);
        assert.equal(responseStatus, 500);
        assert.equal(responseBody.message, 'Failed to upload resource.');
    } finally {
        // Restore mocked dependencies.
        activityLogModel.createActivityLog = originalCreateActivityLog;
        resourceModel.createResource = originalCreateResource;
        resourceModel.updateResourceStoragePath = originalUpdateResourceStoragePath;
        resourceModel.deleteResourceById = originalDeleteResourceById;
        userModel.findUserByFirebaseUid = originalFindUserByFirebaseUid;
        resourceModel.isProjectMember = originalIsProjectMember;
        storageUtils.buildResourceStoragePath = originalBuildResourceStoragePath;
        firebaseAdmin.storageBucket.file = originalBucketFile;

        delete require.cache[require.resolve('../controllers/resourceController')];
    }
});
