const { findUserByFirebaseUid } = require('../models/userModel');
const { findProjectsByUserId } = require('../models/projectModel');

// Get projects that belong to the authenticated user.
const getUserProjects = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) {
            return res.status(401).json({
                message: 'Authentication required.',
            });
        }

        // Find the Mosalinx user linked to the Firebase account.
        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message: 'Mosalinx user not found.',
            });
        }

        // Only return projects where the user is a member.
        const projects = await findProjectsByUserId(user.user_id);

        return res.status(200).json({
            projects,
        });
    } catch (error) {
        console.error('Failed to get user projects:', error);

        return res.status(500).json({
            message: 'Failed to retrieve projects.',
        });
    }
};

module.exports = {
    getUserProjects,
};