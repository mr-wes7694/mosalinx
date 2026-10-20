
const test = require('node:test');
const assert = require('node:assert/strict');

const pool = require('../config/database');
const activityLogModel = require('../models/activityLogModel');

// Replace the logger before loading workspacePostModel.
const originalCreateActivityLog = activityLogModel.createActivityLog;
const originalGetConnection = pool.getConnection;

activityLogModel.createActivityLog = async () => {
    throw new Error('Activity log insert failed');
};

const { createWorkspacePost } = require('../models/workspacePostModel');

test('workspace post creation rolls back if activity logging fails', async () => {
    let rollbackCalled = false;
    let commitCalled = false;
    let releaseCalled = false;
    let insertQuery;

    const fakeConnection = {
        beginTransaction: async () => {},
        query: async (sql, values) => {
            insertQuery = { sql, values };
            return [{ insertId: 456 }];
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
        await assert.rejects(
            createWorkspacePost(
                15,
                7,
                'Test Announcement',
                'This is test content.'
            ),
            /Activity log insert failed/
        );

        assert.match(insertQuery.sql, /INSERT INTO workspace_posts/i);
        assert.deepEqual(insertQuery.values, [
            15,
            7,
            'Test Announcement',
            'This is test content.',
        ]);
        assert.equal(rollbackCalled, true);
        assert.equal(commitCalled, false);
        assert.equal(releaseCalled, true);
    } finally {
        // Restore the original functions after the test.
        pool.getConnection = originalGetConnection;
        activityLogModel.createActivityLog = originalCreateActivityLog;
    }
});
