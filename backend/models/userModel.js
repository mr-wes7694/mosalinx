const pool = require('../config/database');

// Find an existing Mosalinx user by database ID.
const findUserById = async (userId) => {
  const [rows] = await pool.query(
    'SELECT user_id FROM users WHERE user_id = ? LIMIT 1',
    [userId]
  );

  return rows[0] || null;
};

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
            birthdate,
            gender,
            pronouns,
            created_at,
            updated_at
        FROM users
        WHERE firebase_uid = ?
        LIMIT 1`,
    [firebaseUid]
  );

  return rows[0] || null;
};

// Update only the supported profile fields provided by the authenticated user.
const updateUserProfileByFirebaseUid = async (firebaseUid, updates) => {
  const fields = [];
  const values = [];

  if (updates.displayName !== undefined) {
    fields.push('display_name = ?');
    values.push(updates.displayName);
  }

  if (updates.profileImageUrl !== undefined) {
    fields.push('profile_image_url = ?');
    values.push(updates.profileImageUrl);
  }

  if (updates.bio !== undefined) {
    fields.push('bio = ?');
    values.push(updates.bio);
  }

  if (updates.birthdate !== undefined) {
    fields.push('birthdate = ?');
    values.push(updates.birthdate);
  }

  if (updates.gender !== undefined) {
    fields.push('gender = ?');
    values.push(updates.gender);
  }

  if (updates.pronouns !== undefined) {
    fields.push('pronouns = ?');
    values.push(updates.pronouns);
  }

  if (fields.length === 0) {
    return 0;
  }

  values.push(firebaseUid);

  const [result] = await pool.query(
    `UPDATE users
        SET ${fields.join(', ')}
        WHERE firebase_uid = ?`,
    values
  );

  return result.affectedRows;
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

// Retrieve a user's saved profile picture reference by database ID.
const findUserAvatarById = async (userId) => {
  const [rows] = await pool.query(
    `SELECT user_id, profile_image_url
         FROM users
         WHERE user_id = ?
         LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
};

// Check whether two users share membership in at least one project.
const usersShareProject = async (requesterId, targetUserId) => {
  const [rows] = await pool.query(
    `SELECT 1
     FROM project_members requester
     INNER JOIN project_members target
       ON requester.project_id = target.project_id
     WHERE requester.user_id = ?
       AND target.user_id = ?
     LIMIT 1`,
    [requesterId, targetUserId]
  );

  return rows.length > 0;
};

module.exports = {
  findUserById,
  findUserByEmail,
  findUserByFirebaseUid,
  findUserAvatarById,
  usersShareProject,
  updateUserProfileByFirebaseUid,
  createUser,
};
