
const { findUserByFirebaseUid } = require('../models/userModel');
const {
    findProjectById,
} = require('../models/projectModel');
const {
    findActivityLogsByProjectId,
} = require('../models/activityLogModel');
const {
    checkProjectPermission,
} = require('../utils/projectPermissions');

// Retrieve the activity feed for a project member.
const getProjectActivity = async (req, res) => {
    try {
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) {
            return res.status(401).json({
                message: 'Authentication required.',
            });
        }

        const rawProjectId = req.params.projectId;

        if (
            typeof rawProjectId !== 'string' ||
            !/^[1-9]\d*$/.test(rawProjectId) ||
            !Number.isSafeInteger(Number(rawProjectId))
        ) {
            return res.status(400).json({
                message: 'A valid project ID is required.',
            });
        }

        const projectId = Number(rawProjectId);
        const rawLimit = req.query?.limit;
        let limit = 50;

        if (rawLimit !== undefined) {
            if (
                typeof rawLimit !== 'string' ||
                !/^[1-9]\d*$/.test(rawLimit) ||
                !Number.isSafeInteger(Number(rawLimit)) ||
                Number(rawLimit) > 100
            ) {
                return res.status(400).json({
                    message: 'Limit must be an integer between 1 and 100.',
                });
            }

            limit = Number(rawLimit);
        }

        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message: 'Mosalinx user not found.',
            });
        }

        const project = await findProjectById(projectId);

        if (!project) {
            return res.status(404).json({
                message: 'Project not found.',
            });
        }

        const permission = await checkProjectPermission(
            projectId,
            user.user_id,
            ['owner', 'collaborator']
        );

        if (!permission.allowed) {
            return res.status(403).json({
                message: 'You do not have access to this project.',
            });
        }

        const activities = await findActivityLogsByProjectId(
            projectId,
            limit
        );

        return res.status(200).json({ activities });
    } catch (error) {
        console.error('Failed to retrieve project activity:', error);

        return res.status(500).json({
            message: 'Failed to retrieve project activity.',
        });
    }
};

module.exports = {
    getProjectActivity,
};
