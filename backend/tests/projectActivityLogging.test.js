
const test = require('node:test');
const assert = require('node:assert/strict');

const pool = require('../config/database');
const activityLogModel = require('../models/activityLogModel');

// Replace the logger before loading projectModel, which imports it.
const originalCreateActivityLog = activityLogModel.createActivityLog;
const originalGetConnection = pool.getConnection;

activityLogModel.createActivityLog = async () => {
    throw new Error('Activity log insert failed');
};

const { createProjectWithOwner } = require('../models/projectModel');

test('project creation rolls back if activity logging fails', async () => {
    let rollbackCalled = false;
    let commitCalled = false;
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
        await assert.rejects(
            createProjectWithOwner('Test Project', 'Test description', 7),
            /Activity log insert failed/
        );

        assert.equal(executedQueries.length, 2);
        assert.match(executedQueries[0].sql, /INSERT INTO projects/i);
        assert.match(executedQueries[1].sql, /INSERT INTO project_members/i);
        assert.equal(rollbackCalled, true);
        assert.equal(commitCalled, false);
        assert.equal(releaseCalled, true);
    } finally {
        // Restore the original database and logging functions.
        pool.getConnection = originalGetConnection;
        activityLogModel.createActivityLog = originalCreateActivityLog;
    }
});
