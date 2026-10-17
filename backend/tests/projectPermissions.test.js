const test = require('node:test');
const assert = require('node:assert/strict');

// Use mock memberships so these tests do not need a database.
const projectModelPath = require.resolve('../models/projectModel');

const memberships = new Map([
    ['20:7', 'owner'],
    ['10:8', 'collaborator'],
]);

require.cache[projectModelPath] = {
    id: projectModelPath,
    filename: projectModelPath,
    loaded: true,
    exports: {
        SUPPORTED_PROJECT_ROLES: ['owner', 'collaborator'],
        findProjectMemberRole: async (projectId, userId) =>
            memberships.get(`${projectId}:${userId}`) || null,
    },
};

const { checkProjectPermission } = require('../utils/projectPermissions');

test('allows an owner to perform owner-only actions', async () => {
    const result = await checkProjectPermission(20, 7, ['owner']);

    assert.deepEqual(result, { allowed: true, role: 'owner' });
});

test('allows a collaborator when their role is permitted', async () => {
    const result = await checkProjectPermission(
        10, 8, ['owner', 'collaborator']
    );

    assert.deepEqual(result, {
        allowed: true,
        role: 'collaborator',
    });
});

test('denies a collaborator owner-only actions', async () => {
    const result = await checkProjectPermission(10, 8, ['owner']);

    assert.equal(result.allowed, false);
});

test('denies a user who is not a member of the requested project', async () => {
    const result = await checkProjectPermission(
        10, 7, ['owner', 'collaborator']
    );

    assert.equal(result.allowed, false);
});

test('recognizes a role change on the next permission check', async () => {
    memberships.set('10:8', 'owner');

    const result = await checkProjectPermission(10, 8, ['owner']);

    assert.equal(result.allowed, true);
    assert.equal(result.role, 'owner');
});

test('denies access after project membership is removed', async () => {
    memberships.delete('10:8');

    const result = await checkProjectPermission(
        10, 8, ['owner', 'collaborator']
    );

    assert.equal(result.allowed, false);
});

test('rejects invalid IDs and unsupported permission rules', async () => {
    assert.equal(
        (await checkProjectPermission(0, 7, ['owner'])).allowed,
        false
    );
    assert.equal(
        (await checkProjectPermission(20, 7, ['admin'])).allowed,
        false
    );
    assert.equal(
        (await checkProjectPermission(20, 7, [])).allowed,
        false
    );
});
