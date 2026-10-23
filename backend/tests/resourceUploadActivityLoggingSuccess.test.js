const test = require('node:test');
const assert = require('node:assert/strict');

const activityLogModel = require('../models/activityLogModel');
const resourceModel = require('../models/resourceModel');
const userModel = require('../models/userModel');
const firebaseAdmin = require('../config/firebaseAdmin');
const storageUtils = require('../utils/storage');

// Save the original functions so they can be restored after the test.
const originalCreateActivityLog = activityLogModel.createActivityLog;
const originalCreateResource = resourceModel.createResource;
const originalUpdateResourceStoragePath = resourceModel.updateResourceStoragePath;
const originalFindUserByFirebaseUid = userModel.findUserByFirebaseUid;
const originalIsProjectMember = resourceModel.isProjectMember;
const originalBuildResourceStoragePath = storageUtils.buildResourceStoragePath;
const originalBucketFile = firebaseAdmin.storageBucket.file;

let activityDetails = null;

test('successful resource upload records activity and returns 201', async () => {
let savedFilePath = null;
let responseStatus = null;
let responseBody = null;

activityLogModel.createActivityLog = async (
    projectId,
    userId,
    activityType,
    activityDescription
) => {
    activityDetails = {
        projectId,
        userId,
        activityType,
        activityDescription,
    };

    return 789;
};

resourceModel.createResource = async () => ({
    resourceId: 456,
    resourceName: 'test.txt',
});

resourceModel.updateResourceStoragePath = async () => {};

userModel.findUserByFirebaseUid = async () => ({
    user_id: 7,
});

resourceModel.isProjectMember = async () => true;

storageUtils.buildResourceStoragePath = () => 'test/path/456.txt';

firebaseAdmin.storageBucket.file = (filePath) => ({
    save: async () => {
        savedFilePath = filePath;
    },
    delete: async () => {},
});

// Load the controller after setting up all dependency mocks.
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

    assert.equal(savedFilePath, 'test/path/456.txt');
    assert.deepEqual(activityDetails, {
        projectId: '15',
        userId: 7,
        activityType: 'resource_uploaded',
        activityDescription: 'Resource "test.txt" was uploaded.',
    });

    assert.equal(responseStatus, 201);
    assert.equal(responseBody.message, 'Resource uploaded successfully.');
    assert.equal(responseBody.resource.resourceId, 456);
} finally {
    // Restore the original dependencies.
    activityLogModel.createActivityLog = originalCreateActivityLog;
    resourceModel.createResource = originalCreateResource;
    resourceModel.updateResourceStoragePath = originalUpdateResourceStoragePath;
    userModel.findUserByFirebaseUid = originalFindUserByFirebaseUid;
    resourceModel.isProjectMember = originalIsProjectMember;
    storageUtils.buildResourceStoragePath = originalBuildResourceStoragePath;
    firebaseAdmin.storageBucket.file = originalBucketFile;

    delete require.cache[require.resolve('../controllers/resourceController')];
}

});