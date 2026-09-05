const {
    findUserByEmail,
    findUserByFirebaseUid,
    createUser,
} = require('../models/userModel');

const registerUser = async (req, res) => {
    const { displayName, email } = req.body || {};

    // Firebase middleware provides the authenticated user's UID.
    const firebaseUid = req.user?.uid;

    // Make sure the request is authenticated.
    if (!firebaseUid) {
        return res.status(401).json({
            message: 'Unauthorized.',
        });
    }

    // Make sure the required registration information was provided.
    if (!email) {
        return res.status(400).json({
            message: 'Email is required.',
        });
    }

    try {
        // Check whether this Firebase account is already registered.
        const existingFirebaseUser = await findUserByFirebaseUid(firebaseUid);

        if (existingFirebaseUser) {
            return res.status(409).json({
                message: 'User is already registered.',
                userId: existingFirebaseUser.user_id,
            });
        }

        // Check whether the email is already being used.
        const existingEmailUser = await findUserByEmail(email);

        if (existingEmailUser) {
            return res.status(409).json({
                message: 'Email is already registered.',
            });
        }

        // Create the MySQL user linked to the Firebase account.
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

module.exports = {
    registerUser,
};