const pool = require('../config/database');

// Find an existing Mosalinx user by email address.
const findUserByEmail = async (email) => {
    const [rows] = await pool.query(
        'SELECT user_id FROM users WHERE email = ? LIMIT 1',
        [email]
    );

    return rows[0] || null;
};

// Retrieve a Mosalinx user profile using the authenticated Firebase UID.
const findUserByFirebaseUid = async (firebaseUid) => {
    const [rows] = await pool.query(
        `SELECT
            user_id,
            display_name,
            email,
            profile_image_url,
            bio,
            created_at,
            updated_at
        FROM users
        WHERE firebase_uid = ?
        LIMIT 1`,
        [firebaseUid]
    );

    return rows[0] || null;
};

// Create a Mosalinx user record linked to a Firebase account.
const createUser = async (firebaseUid, displayName, email) => {
    const [result] = await pool.query(
        'INSERT INTO users (firebase_uid, display_name, email) VALUES (?, ?, ?)',
        [firebaseUid, displayName, email]
    );

    return {
        userId: result.insertId,
        firebaseUid,
        displayName,
        email,
    };
};

module.exports = {
    findUserByEmail,
    findUserByFirebaseUid,
    createUser,
};
