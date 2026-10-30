
const test = require('node:test');
const assert = require('node:assert/strict');

const { createActivityLog } = require('../models/activityLogModel');

test('createActivityLog inserts the expected activity details', async () => {
    let receivedQuery;
    let receivedValues;

    // Simulate a database connection without connecting to MySQL.
    const fakeConnection = {
        query: async (sql, values) => {
            receivedQuery = sql;
            receivedValues = values;

            return [{ insertId: 42 }];
        },
    };

    const activityId = await createActivityLog(
        15,
        7,
        'project_created',
        'Project "Test Project" was created.',
        fakeConnection
    );

    assert.equal(activityId, 42);
    assert.match(receivedQuery, /INSERT INTO activity_logs/i);
    assert.deepEqual(receivedValues, [
        15,
        7,
        'project_created',
        'Project "Test Project" was created.',
    ]);
});

test('createActivityLog passes database errors to the caller', async () => {
    const expectedError = new Error('Database insert failed');

    const fakeConnection = {
        query: async () => {
            throw expectedError;
        },
    };

    await assert.rejects(
        createActivityLog(
            15,
            7,
            'project_created',
            'Project "Test Project" was created.',
            fakeConnection
        ),
        (error) => error === expectedError
    );
});

test('findActivityLogsByProjectId retrieves activity for one project', async () => {
    const {
        findActivityLogsByProjectId,
    } = require('../models/activityLogModel');

    let receivedQuery;
    let receivedValues;

    const pool = require('../config/database');
    const originalQuery = pool.query;
    const expectedRows = [
        {
            activity_id: 42,
            project_id: 15,
            user_id: 7,
            display_name: 'Test User',
            activity_type: 'project_created',
            activity_description: 'Project created.',
        },
    ];

    pool.query = async (sql, values) => {
        receivedQuery = sql;
        receivedValues = values;
        return [expectedRows];
    };

    try {
        const activities = await findActivityLogsByProjectId(15);

        assert.deepEqual(activities, expectedRows);
        assert.match(receivedQuery, /FROM activity_logs/i);
        assert.match(receivedQuery, /LEFT JOIN users/i);
        assert.match(receivedQuery, /WHERE activity_logs\.project_id = \?/i);
        assert.match(receivedQuery, /ORDER BY activity_logs\.created_at DESC/i);
        assert.deepEqual(receivedValues, [15, 50]);
    } finally {
        pool.query = originalQuery;
    }
});

test('findActivityLogsByProjectId applies a supplied limit', async () => {
    const {
        findActivityLogsByProjectId,
    } = require('../models/activityLogModel');

    const pool = require('../config/database');
    const originalQuery = pool.query;
    let receivedValues;

    pool.query = async (sql, values) => {
        receivedValues = values;
        return [[]];
    };

    try {
        const activities = await findActivityLogsByProjectId(15, 10);

        assert.deepEqual(activities, []);
        assert.deepEqual(receivedValues, [15, 10]);
    } finally {
        pool.query = originalQuery;
    }
});
