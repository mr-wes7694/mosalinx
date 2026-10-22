const test = require('node:test');
const assert = require('node:assert/strict');

const activityLogModel = require('../models/activityLogModel');
const resourceModel = require('../models/resourceModel');
const userModel = require('../models/userModel');
const firebaseAdmin = require('../config/firebaseAdmin');

const originalCreateActivityLog = activityLogModel.createActivityLog;
const originalCreateResource = resourceModel.createResource;
const originalFindUserByFirebaseUid = userModel.findUserByFirebaseUid;
const originalIsProjectMember = resourceModel.isProjectMember;
const originalBucketFile = firebaseAdmin.storageBucket.file;

test('unauthorized project upload does not create resource or activity log', async () => {
    let activityLogCalled = false;
    let resourceCreationCalled = false;
    let firebaseFileCalled = false;
    let responseStatus = null;
    let responseBody = null;

    activityLogModel.createActivityLog = async () => {
        activityLogCalled = true;
    };

    resourceModel.createResource = async () => {
        resourceCreationCalled = true;
    };

    userModel.findUserByFirebaseUid = async () => ({
        user_id: 7,
    });

    resourceModel.isProjectMember = async () => false;

    firebaseAdmin.storageBucket.file = () => {
        firebaseFileCalled = true;
        throw new Error('Firebase Storage should not be accessed');
    };

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
            originalname: 'private.txt',
            mimetype: 'text/plain',
            size: 7,
            buffer: Buffer.from('private'),
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

        assert.equal(responseStatus, 403);
        assert.equal(
            responseBody.message,
            'You are not a member of this project.'
        );
        assert.equal(resourceCreationCalled, false);
        assert.equal(firebaseFileCalled, false);
        assert.equal(activityLogCalled, false);
    } finally {
        activityLogModel.createActivityLog = originalCreateActivityLog;
        resourceModel.createResource = originalCreateResource;
        userModel.findUserByFirebaseUid = originalFindUserByFirebaseUid;
        resourceModel.isProjectMember = originalIsProjectMember;
        firebaseAdmin.storageBucket.file = originalBucketFile;

        delete require.cache[require.resolve('../controllers/resourceController')];
    }
});
