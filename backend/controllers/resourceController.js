const {
    createResource,
    updateResourceStoragePath,
    deleteResourceById,
    findResourceById,
    findResourcesByProject,
} = require('../models/resourceModel');

const { findUserByFirebaseUid } = require('../models/userModel');
const { storageBucket } = require('../config/firebaseAdmin');
const { buildResourceStoragePath } = require('../utils/storage');

const uploadResource = async (req, res) => {
    // Multer provides req.body for multipart/form-data.
    // Use an empty object if the body is missing.
    const body = req.body || {};

    const { projectId, category } = body;

    // The Firebase middleware should provide the authenticated user.
    const firebaseUid = req.user?.uid;

    // Validate the authenticated user.
    if (!firebaseUid) {
        return res.status(401).json({
            message: 'Unauthorized.',
        });
    }

    // Validate the project ID.
    if (!projectId) {
        return res.status(400).json({
            message: 'projectId is required.',
        });
    }

    // Validate the uploaded file.
    if (!req.file) {
        return res.status(400).json({
            message: 'A file is required.',
        });
    }

    let resource = null;
    let firebaseFile = null;

    try {
        // Find the MySQL user connected to the authenticated Firebase account.
        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message: 'Authenticated user is not registered in the database.',
            });
        }

        const file = req.file;

        // Create a temporary database record first so MySQL gives us
        // the resource ID needed for the Firebase Storage path.
        const temporaryStoragePath = 'pending/resource';

        resource = await createResource(
            projectId,
            user.user_id,
            file.originalname,
            file.mimetype,
            file.size,
            category || null,
            temporaryStoragePath
        );

        // Build the required Firebase Storage path.
        const storagePath = buildResourceStoragePath(
            projectId,
            resource.resourceId,
            file.originalname
        );

        // Create a Firebase Storage file reference.
        firebaseFile = storageBucket.file(storagePath);

        // Upload the file buffer to Firebase Storage.
        await firebaseFile.save(file.buffer, {
            metadata: {
                contentType: file.mimetype,
            },
        });

        // Save the actual Firebase Storage path in MySQL.
        await updateResourceStoragePath(
            resource.resourceId,
            storagePath
        );

        // Return the completed resource information.
        resource.storagePath = storagePath;

        return res.status(201).json({
            message: 'Resource uploaded successfully.',
            resource,
        });
    } catch (error) {
        console.error('Error uploading resource:', error);

        // If a database record was created but the upload failed,
        // remove the incomplete resource record.
        if (resource?.resourceId) {
            try {
                await deleteResourceById(resource.resourceId);
            } catch (cleanupError) {
                console.error(
                    'Error cleaning up resource record:',
                    cleanupError
                );
            }
        }

        // If the Firebase file was created but a later database
        // operation failed, remove the Firebase file as well.
        if (firebaseFile) {
            try {
                await firebaseFile.delete();
            } catch (cleanupError) {
                // Ignore "file not found" cleanup errors.
                if (cleanupError.code !== 404) {
                    console.error(
                        'Error cleaning up Firebase file:',
                        cleanupError
                    );
                }
            }
        }

        return res.status(500).json({
            message: 'Failed to upload resource.',
        });
    }
};

const getResourcesByProject = async (req, res) => {
    const { projectId } = req.params;

    if (!projectId) {
        return res.status(400).json({
            message: 'projectId is required.',
        });
    }

    try {
        const resources = await findResourcesByProject(projectId);

        return res.status(200).json({
            resources,
        });
    } catch (error) {
        console.error('Error retrieving resources:', error);

        return res.status(500).json({
            message: 'Failed to retrieve resources.',
        });
    }
};

const getResourceById = async (req, res) => {
    const { resourceId } = req.params;

    if (!resourceId) {
        return res.status(400).json({
            message: 'resourceId is required.',
        });
    }

    try {
        const resource = await findResourceById(resourceId);

        if (!resource) {
            return res.status(404).json({
                message: 'Resource not found.',
            });
        }

        return res.status(200).json({
            resource,
        });
    } catch (error) {
        console.error('Error retrieving resource:', error);

        return res.status(500).json({
            message: 'Failed to retrieve resource.',
        });
    }
};

module.exports = {
    uploadResource,
    getResourcesByProject,
    getResourceById,
};