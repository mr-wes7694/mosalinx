const {
    findUserByEmail,
    findUserByFirebaseUid,
    updateUserProfileByFirebaseUid,
    createUser
} = require('../models/userModel');

// Register a new Mosalinx user after Firebase account creation.
const registerUser = async (req, res) => {
    const { firebaseUid, displayName, email } = req.body;

    if (!firebaseUid || !displayName || !email) {
        return res.status(400).json({
            message: 'Missing required fields'
        });
    }

    try {
        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            return res.status(409).json({
                message: 'User already exists'
            });
        }

        const user = await createUser(firebaseUid, displayName, email);

        return res.status(201).json({
            message: 'User registered successfully',
            user
        });
    } catch (error) {
        console.error('Error registering user:', error.message);

        return res.status(500).json({
            message: 'Internal server error'
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
            user: {
                userId: user.user_id,
                displayName: user.display_name,
                email: user.email,
                profileImageUrl: user.profile_image_url,
                bio: user.bio,
                createdAt: user.created_at,
                updatedAt: user.updated_at,
            }
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
    const allowedFields = ['displayName', 'profileImageUrl', 'bio'];
    const requestedFields = Object.keys(req.body);

    // Reject empty requests or attempts to modify protected/unsupported fields.
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

    const { displayName, profileImageUrl, bio } = req.body;

    // Validate supported profile values before applying database changes.
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
        profileImageUrl !== undefined &&
        profileImageUrl !== null &&
        (typeof profileImageUrl !== 'string' ||
            profileImageUrl.length > 500)
    ) {
        return res.status(400).json({
            message: 'Invalid profile image URL'
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
            profileImageUrl,
            bio,
        };

        await updateUserProfileByFirebaseUid(req.user.uid, updates);

        const updatedUser = await findUserByFirebaseUid(req.user.uid);

        return res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                userId: updatedUser.user_id,
                displayName: updatedUser.display_name,
                email: updatedUser.email,
                profileImageUrl: updatedUser.profile_image_url,
                bio: updatedUser.bio,
                createdAt: updatedUser.created_at,
                updatedAt: updatedUser.updated_at,
            }
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
