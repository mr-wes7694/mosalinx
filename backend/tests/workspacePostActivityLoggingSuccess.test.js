
const test = require('node:test');
const assert = require('node:assert/strict');

const pool = require('../config/database');
const activityLogModel = require('../models/activityLogModel');

// Save the original functions before mocking them.
const originalCreateActivityLog = activityLogModel.createActivityLog;
const originalGetConnection = pool.getConnection;

let activityDetails = null;

// Mock activity logging before loading the workspace post model.
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

delete require.cache[require.resolve('../models/workspacePostModel')];
const { createWorkspacePost } = require('../models/workspacePostModel');

test('successful workspace post records activity and commits', async () => {
    let commitCalled = false;
    let rollbackCalled = false;
    let releaseCalled = false;
    let insertQuery = null;

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
        const post = await createWorkspacePost(
            15,
            7,
            'Test Announcement',
            'This is test content.'
        );

        assert.deepEqual(post, {
            postId: 456,
            projectId: 15,
            createdBy: 7,
            postTitle: 'Test Announcement',
            postContent: 'This is test content.',
        });

        assert.match(insertQuery.sql, /INSERT INTO workspace_posts/i);
        assert.deepEqual(insertQuery.values, [
            15,
            7,
            'Test Announcement',
            'This is test content.',
        ]);

        assert.deepEqual(activityDetails, {
            projectId: 15,
            userId: 7,
            activityType: 'workspace_post_created',
            activityDescription:
                'Workspace post "Test Announcement" was created.',
            connection: fakeConnection,
        });

        assert.equal(commitCalled, true);
        assert.equal(rollbackCalled, false);
        assert.equal(releaseCalled, true);
    } finally {
        // Restore the original database and logging functions.
        pool.getConnection = originalGetConnection;
        activityLogModel.createActivityLog = originalCreateActivityLog;
    }
});
