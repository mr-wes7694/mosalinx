const test = require('node:test');
const assert = require('node:assert/strict');

const pool = require('../config/database');
const activityLogModel = require('../models/activityLogModel');

// Save the original functions before mocking them.
const originalCreateActivityLog = activityLogModel.createActivityLog;
const originalGetConnection = pool.getConnection;

// Track activity details without writing to the real database.
let activityDetails = null;

activityLogModel.createActivityLog = async (
projectId,
userId,
activityType,
activityDescription,
connection
) => {
activityDetails = {
projectId,
userId,
activityType,
activityDescription,
connection,
};

return 789;

};

// Load the project model after replacing its activity logger.
delete require.cache[require.resolve('../models/projectModel')];
const { createProjectWithOwner } = require('../models/projectModel');

test('successful project creation records activity and commits', async () => {
let commitCalled = false;
let rollbackCalled = false;
let releaseCalled = false;
const executedQueries = [];

const fakeConnection = {
    beginTransaction: async () => {},
    query: async (sql, values) => {
        executedQueries.push({ sql, values });

        if (sql.includes('INSERT INTO projects')) {
            return [{ insertId: 123 }];
        }

        if (sql.includes('INSERT INTO project_members')) {
            return [{ affectedRows: 1 }];
        }

        throw new Error(`Unexpected query: ${sql}`);
    },
    commit: async () => {
        commitCalled = true;
    },
    rollback: async () => {
        rollbackCalled = true;
    },
    release: () => {
        releaseCalled = true;
    },
};

pool.getConnection = async () => fakeConnection;

try {
    const project = await createProjectWithOwner(
        'Test Project',
        'Test description',
        7
    );

    assert.equal(project.projectId, 123);
    assert.equal(project.projectName, 'Test Project');
    assert.equal(project.description, 'Test description');
    assert.equal(project.role, 'owner');

    assert.equal(executedQueries.length, 2);
    assert.match(executedQueries[0].sql, /INSERT INTO projects/i);
    assert.match(executedQueries[1].sql, /INSERT INTO project_members/i);

    assert.deepEqual(activityDetails, {
        projectId: 123,
        userId: 7,
        activityType: 'project_created',
        activityDescription: 'Project "Test Project" was created.',
        connection: fakeConnection,
    });

    assert.equal(commitCalled, true);
    assert.equal(rollbackCalled, false);
    assert.equal(releaseCalled, true);
} finally {
    // Restore the database pool and logger.
    pool.getConnection = originalGetConnection;
    activityLogModel.createActivityLog = originalCreateActivityLog;
}

});