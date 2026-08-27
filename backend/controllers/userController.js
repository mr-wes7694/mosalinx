const { findUserByEmail, createUser } = require('../models/userModel');

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

module.exports = {
    registerUser,
};