const {
  findUserByEmail,
  findUserByFirebaseUid,
  updateUserProfileByFirebaseUid,
  createUser
} = require('../models/userModel');

const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Prefer not to say',
];

// Return dates in the format required by HTML date inputs.
const formatBirthdate = (birthdate) => {
  if (!birthdate) return null;

  if (birthdate instanceof Date) {
    return birthdate.toISOString().slice(0, 10);
  }

  return String(birthdate).slice(0, 10);
};

// Keep personal profile fields in the authenticated user's response.
const formatUserProfile = (user) => ({
  userId: user.user_id,
  displayName: user.display_name,
  email: user.email,
  profileImageUrl: user.profile_image_url,
  bio: user.bio,
  birthdate: formatBirthdate(user.birthdate),
  gender: user.gender,
  pronouns: user.pronouns,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

// Validate a real calendar date and prevent future birthdates.
const isValidBirthdate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value &&
    value <= new Date().toISOString().slice(0, 10)
  );
};

// Register a new Mosalinx user after Firebase account creation.
const registerUser = async (req, res) => {
  const { displayName, email } = req.body || {};

  const firebaseUid = req.user?.uid;

  if (!firebaseUid) {
    return res.status(401).json({
      message: 'Unauthorized.',
    });
  }

  if (!email) {
    return res.status(400).json({
      message: 'Email is required.',
    });
  }

  try {
    const existingFirebaseUser = await findUserByFirebaseUid(firebaseUid);

    if (existingFirebaseUser) {
      return res.status(409).json({
        message: 'User is already registered.',
        userId: existingFirebaseUser.user_id,
      });
    }

    const existingEmailUser = await findUserByEmail(email);

    if (existingEmailUser) {
      return res.status(409).json({
        message: 'Email is already registered.',
      });
    }

    const user = await createUser(
      firebaseUid,
      displayName || null,
      email
    );

    return res.status(201).json({
      message: 'User registered successfully.',
      user,
    });
  } catch (error) {
    console.error('Error registering user:', error);

    return res.status(500).json({
      message: 'Failed to register user.',
    });
  }
};

// Retrieve the authenticated user's Mosalinx profile.
const getUserProfile = async (req, res) => {
  try {
    const user = await findUserByFirebaseUid(req.user.uid);

    if (!user) {
      return res.status(404).json({
        message: 'User profile not found'
      });
    }

    return res.status(200).json({
      user: formatUserProfile(user),
    });
  } catch (error) {
    console.error('Error retrieving user profile:', error.message);

    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};

// Update supported profile fields for the authenticated Mosalinx user.
const updateUserProfile = async (req, res) => {
  const body = req.body || {};
  const allowedFields = [
    'displayName',
    'bio',
    'birthdate',
    'gender',
    'pronouns',
  ];
  const requestedFields = Object.keys(body);

  if (requestedFields.length === 0) {
    return res.status(400).json({
      message: 'No profile updates provided'
    });
  }

  const unsupportedFields = requestedFields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (unsupportedFields.length > 0) {
    return res.status(400).json({
      message: 'Unsupported profile field'
    });
  }

  const { displayName, bio, birthdate, gender, pronouns } = body;

  if (
    displayName !== undefined &&
    (typeof displayName !== 'string' ||
      displayName.trim().length === 0 ||
      displayName.length > 100)
  ) {
    return res.status(400).json({
      message: 'Invalid display name'
    });
  }

  if (
    bio !== undefined &&
    bio !== null &&
    (typeof bio !== 'string' || bio.length > 500)
  ) {
    return res.status(400).json({
      message: 'Invalid bio'
    });
  }

  let normalizedBirthdate = birthdate;

  if (birthdate !== undefined) {
    if (birthdate === null || birthdate === '') {
      normalizedBirthdate = null;
    } else {
      normalizedBirthdate =
        typeof birthdate === 'string' ? birthdate.trim() : birthdate;

      if (!isValidBirthdate(normalizedBirthdate)) {
        return res.status(400).json({
          message: 'Invalid birthdate'
        });
      }
    }
  }

  let normalizedGender = gender;

  if (gender !== undefined) {
    if (gender === null || gender === '') {
      normalizedGender = null;
    } else if (
      typeof gender !== 'string' ||
      !GENDER_OPTIONS.includes(gender.trim())
    ) {
      return res.status(400).json({
        message: 'Invalid gender'
      });
    } else {
      normalizedGender = gender.trim();
    }
  }

  let normalizedPronouns = pronouns;

  if (pronouns !== undefined) {
    if (pronouns === null || pronouns === '') {
      normalizedPronouns = null;
    } else if (typeof pronouns !== 'string') {
      return res.status(400).json({
        message: 'Invalid pronouns'
      });
    } else {
      normalizedPronouns = pronouns.trim();

      if (normalizedPronouns.length > 50) {
        return res.status(400).json({
          message: 'Invalid pronouns'
        });
      }

      if (normalizedPronouns.length === 0) {
        normalizedPronouns = null;
      }
    }
  }

  try {
    const existingUser = await findUserByFirebaseUid(req.user.uid);

    if (!existingUser) {
      return res.status(404).json({
        message: 'User profile not found'
      });
    }

    const updates = {
      displayName:
        displayName !== undefined ? displayName.trim() : undefined,
      bio,
      birthdate: normalizedBirthdate,
      gender: normalizedGender,
      pronouns: normalizedPronouns,
    };

    await updateUserProfileByFirebaseUid(req.user.uid, updates);

    const updatedUser = await findUserByFirebaseUid(req.user.uid);

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: formatUserProfile(updatedUser),
    });
  } catch (error) {
    console.error('Error updating user profile:', error.message);

    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};

module.exports = {
  registerUser,
  getUserProfile,
  updateUserProfile,
};
