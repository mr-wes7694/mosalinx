const pool = require('../config/database');

const findUserByEmail = async (email) => {
    const [rows] = await pool.query(
        'SELECT user_id FROM users WHERE email = ? LIMIT 1',
        [email]
    );

    return rows[0] || null;
};

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
    createUser,
};