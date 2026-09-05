const {
    findUserByEmail,
    findUserByFirebaseUid,
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

module.exports = {
    registerUser,
    getUserProfile,
};