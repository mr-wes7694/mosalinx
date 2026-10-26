const test = require('node:test');
const assert = require('node:assert/strict');

// Track database and storage operations.
const calls = {
findResource: 0,
findUser: 0,
deleteStorage: 0,
deleteRecord: 0,
storageFile: 0,
stream: 0,
};

let resourceToReturn;
let deleteRecordResult = true;
let storageExists = true;

// Mock the resource model.
const resourceModelPath = require.resolve('../models/resourceModel');

require.cache[resourceModelPath] = {
id: resourceModelPath,
filename: resourceModelPath,
loaded: true,
exports: {
findResourceById: async () => {
calls.findResource++;
return resourceToReturn;
},
deleteResourceRecord: async () => {
calls.deleteRecord++;
return deleteRecordResult;
},
isProjectMember: async () => true,
createResource: async () => ({}),
updateResourceStoragePath: async () => {},
updateResourceCategory: async () => true,
deleteResourceById: async () => {},
findResourcesByProject: async () => [],
searchResourcesByProject: async () => [],
},
};

// Mock the user model.
const userModelPath = require.resolve('../models/userModel');

require.cache[userModelPath] = {
id: userModelPath,
filename: userModelPath,
loaded: true,
exports: {
findUserByFirebaseUid: async () => {
calls.findUser++;
return { user_id: 7 };
},
},
};

// Mock project permissions.
const projectModelPath = require.resolve('../models/projectModel');

require.cache[projectModelPath] = {
id: projectModelPath,
filename: projectModelPath,
loaded: true,
exports: {
findProjectMemberRole: async () => 'owner',
},
};

const permissionsPath = require.resolve('../utils/projectPermissions');

require.cache[permissionsPath] = {
id: permissionsPath,
filename: permissionsPath,
loaded: true,
exports: {
checkProjectPermission: async () => ({
allowed: true,
role: 'owner',
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
file: () => {
calls.storageFile++;

            return {
                exists: async () => [storageExists],
                createReadStream: () => {
                    calls.stream++;

                    const { EventEmitter } = require('node:events');
                    const stream = new EventEmitter();

                    stream.pipe = (res) => {
                        res.piped = true;
                        return res;
                    };

                    return stream;
                },
            };
        },
    },
},

};

// Mock storage helper functions.
const storagePath = require.resolve('../utils/storage');

require.cache[storagePath] = {
id: storagePath,
filename: storagePath,
loaded: true,
exports: {
buildResourceStoragePath: () => 'test/path',
deleteResourceStorageFile: async () => {
calls.deleteStorage++;
return true;
},
},
};

const controller = require('../controllers/resourceController');

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
setHeader(name, value) {
this.headers[name] = value;
},
attachment(name) {
this.attachmentName = name;
return this;
},
end() {
this.ended = true;
},
});

const makeRequest = (resourceId = '10') => ({
params: { resourceId },
user: { uid: 'firebase-test-user' },
});

const ordinaryResource = () => ({
resource_id: 10,
project_id: 1,
uploaded_by: 7,
resource_name: 'notes.txt',
resource_type: 'text/plain',
file_size: 12,
storage_path: 'projects/1/resources/10_notes.txt',
});

const workspaceResource = () => ({
...ordinaryResource(),
resource_type: 'workspace_document',
storage_path: 'projects/1/workspace/10_notes.json',
});

const reset = (resource) => {
Object.keys(calls).forEach((key) => {
calls[key] = 0;
});

resourceToReturn = resource;
deleteRecordResult = true;
storageExists = true;

};

// Workspace downloads must be rejected before Storage access.
test('ordinary resource download rejects Workspace files', async () => {
reset(workspaceResource());

const res = makeResponse();

await controller.downloadResource(makeRequest(), res);

assert.equal(res.statusCode, 404);
assert.equal(calls.storageFile, 0);
assert.equal(calls.stream, 0);

});

// Ordinary resource downloads should still work.
test('ordinary resource download streams a normal resource', async () => {
reset(ordinaryResource());

const res = makeResponse();

await controller.downloadResource(makeRequest(), res);

assert.equal(res.statusCode, 200);
assert.equal(calls.storageFile, 1);
assert.equal(calls.stream, 1);
assert.equal(res.piped, true);

});

// Workspace deletion must not touch Storage or the database.
test('ordinary resource delete rejects Workspace files without deleting them', async () => {
reset(workspaceResource());

const res = makeResponse();

await controller.deleteResource(makeRequest(), res);

assert.equal(res.statusCode, 404);
assert.equal(calls.deleteStorage, 0);
assert.equal(calls.deleteRecord, 0);

});

// Ordinary resource deletion should still work.
test('ordinary resource delete removes a normal resource', async () => {
reset(ordinaryResource());

const res = makeResponse();

await controller.deleteResource(makeRequest(), res);

assert.equal(res.statusCode, 200);
assert.equal(calls.deleteStorage, 1);
assert.equal(calls.deleteRecord, 1);
assert.equal(res.body.message, 'Resource deleted successfully.');

});

// A missing database record must not be reported as deleted.
test('ordinary resource delete returns 404 when the database record was not deleted', async () => {
reset(ordinaryResource());
deleteRecordResult = false;

const res = makeResponse();

await controller.deleteResource(makeRequest(), res);

assert.equal(res.statusCode, 404);
assert.equal(calls.deleteStorage, 0);
assert.equal(calls.deleteRecord, 1);

});