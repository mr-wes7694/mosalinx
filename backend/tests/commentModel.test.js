const test = require('node:test');
const assert = require('node:assert/strict');

// Mock the database pool so tests do not need MySQL.
const databasePath = require.resolve('../config/database');

const mocks = {
    query: null,
    rows: [],
    insertResult: { insertId: 100 },
};

require.cache[databasePath] = {
    id: databasePath,
    filename: databasePath,
    loaded: true,
    exports: {
        query: async (...args) => {
            mocks.query = args;

            if (args[0].includes('INSERT INTO comments')) {
                return [mocks.insertResult];
            }

            return [mocks.rows];
        },
    },
};

const {
    createComment,
    findCommentsByPostId,
} = require('../models/commentModel');

test('retrieves comments with creator details in chronological order', async () => {
    mocks.query = null;
    mocks.rows = [
        {
            comment_id: 1,
            post_id: 25,
            comment_content: 'First comment',
            created_at: '2026-11-13 10:00:00',
            creator_id: 7,
            creator_display_name: 'Test User',
            creator_profile_image_url: null,
        },
        {
            comment_id: 2,
            post_id: 25,
            comment_content: 'Second comment',
            created_at: '2026-11-13 10:05:00',
            creator_id: 8,
            creator_display_name: 'Another User',
            creator_profile_image_url: 'https://example.com/avatar.png',
        },
    ];

    const comments = await findCommentsByPostId(25);

    assert.deepEqual(mocks.query[1], [25]);
    assert.match(mocks.query[0], /FROM comments/i);
    assert.match(mocks.query[0], /INNER JOIN users/i);
    assert.match(mocks.query[0], /comments\.post_id = \?/i);
    assert.match(
        mocks.query[0],
        /ORDER BY comments\.created_at ASC,\s*comments\.comment_id ASC/i
    );

    assert.deepEqual(comments, [
        {
            commentId: 1,
            postId: 25,
            commentContent: 'First comment',
            createdAt: '2026-11-13 10:00:00',
            createdBy: {
                userId: 7,
                displayName: 'Test User',
                profileImageUrl: null,
            },
        },
        {
            commentId: 2,
            postId: 25,
            commentContent: 'Second comment',
            createdAt: '2026-11-13 10:05:00',
            createdBy: {
                userId: 8,
                displayName: 'Another User',
                profileImageUrl: 'https://example.com/avatar.png',
            },
        },
    ]);
});

test('returns an empty array when a post has no comments', async () => {
    mocks.query = null;
    mocks.rows = [];

    const comments = await findCommentsByPostId(25);

    assert.deepEqual(comments, []);
    assert.deepEqual(mocks.query[1], [25]);
});

test('preserves existing comment creation functionality', async () => {
    mocks.query = null;
    mocks.insertResult = { insertId: 100 };

    const comment = await createComment(
        25,
        7,
        'A newly created comment'
    );

    assert.match(mocks.query[0], /INSERT INTO comments/i);
    assert.deepEqual(mocks.query[1], [
        25,
        7,
        'A newly created comment',
    ]);

    assert.deepEqual(comment, {
        commentId: 100,
        postId: 25,
        createdBy: 7,
        commentContent: 'A newly created comment',
    });
});