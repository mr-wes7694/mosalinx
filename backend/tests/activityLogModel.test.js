
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
