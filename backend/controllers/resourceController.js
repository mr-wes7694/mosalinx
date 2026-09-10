const {
    createResource,
    updateResourceStoragePath,
    deleteResourceById,
    findResourceById,
    findResourcesByProject,
    isProjectMember,
} = require('../models/resourceModel');

const { findUserByFirebaseUid } = require('../models/userModel');

const { storageBucket } = require('../config/firebaseAdmin');

const {
    buildResourceStoragePath,
} = require('../utils/storage');

const uploadResource = async (req, res) => {
    // Multer provides req.body for multipart/form-data.
    const body = req.body || {};

    const { projectId, category } = body;

    // The Firebase middleware provides the authenticated user.
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
        return res.status(401).json({
            message: 'Unauthorized.',
        });
    }

    if (!projectId) {
        return res.status(400).json({
            message: 'projectId is required.',
        });
    }

    if (!req.file) {
        return res.status(400).json({
            message: 'A file is required.',
        });
    }

    let resource = null;
    let firebaseStoragePath = null;

    try {
        // Find the MySQL user connected to the Firebase account.
            const user = await findUserByFirebaseUid(firebaseUid);

            if (!user) {
                return res.status(404).json({
                    message: 'Authenticated user is not registered in the database.',
                });
            }

        // Verify that the user belongs to the project.
        const isMember = await isProjectMember(
            projectId,
            user.user_id
        );

        if (!isMember) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        const file = req.file;

        // Create the database record first so we have the resource ID.
        resource = await createResource(
            projectId,
            user.user_id,
            file.originalname,
            file.mimetype,
            file.size,
            category || null,
            'pending/resource'
        );

        // Build the required Firebase Storage path.
        firebaseStoragePath = buildResourceStoragePath(
            projectId,
            resource.resourceId,
            file.originalname
        );

        // Get the Firebase Storage file reference.
        const storageFile = storageBucket.file(firebaseStoragePath);

        // Upload the file buffer to Firebase Storage.
        await storageFile.save(file.buffer, {
            metadata: {
                contentType:
                    file.mimetype || 'application/octet-stream',
            },
        });

        // Save the Firebase Storage path in MySQL.
        await updateResourceStoragePath(
            resource.resourceId,
            firebaseStoragePath
        );

        resource.storagePath = firebaseStoragePath;

        return res.status(201).json({
            message: 'Resource uploaded successfully.',
            resource,
        });
    } catch (error) {
        console.error('Error uploading resource:', error);

        // Remove the Firebase file if it was created.
        if (firebaseStoragePath) {
            try {
                await storageBucket
                    .file(firebaseStoragePath)
                    .delete();
            } catch (cleanupError) {
                console.error(
                    'Error cleaning up Firebase Storage file:',
                    cleanupError
                );
            }
        }

        // Remove the database record if the upload failed.
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

const downloadResource = async (req, res) => {
    const { resourceId } = req.params;

    if (!resourceId) {
        return res.status(400).json({
            message: 'resourceId is required.',
        });
    }

    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
        return res.status(401).json({
            message: 'Unauthorized.',
        });
    }

    try {
        // Find the resource in MySQL.
        const resource = await findResourceById(resourceId);

        if (!resource) {
            return res.status(404).json({
                message: 'Resource not found.',
            });
        }

        // Find the MySQL user connected to the Firebase account.
        const user = await findUserByFirebaseUid(firebaseUid);

        if (!user) {
            return res.status(404).json({
                message: 'Authenticated user is not registered in the database.',
            });
        }

        // Verify that the user belongs to the resource's project.
        const isMember = await isProjectMember(
            resource.project_id,
            user.user_id
        );

        if (!isMember) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        // Make sure the resource has a Firebase Storage path.
        if (!resource.storage_path) {
            return res.status(404).json({
                message: 'Resource file is not available.',
            });
        }

        // Get the Firebase Storage file reference.
        const storageFile = storageBucket.file(
            resource.storage_path
        );

        // Check that the file exists in Firebase Storage.
        const [exists] = await storageFile.exists();

        if (!exists) {
            return res.status(404).json({
                message: 'Resource file not found in storage.',
            });
        }

        // Set the file type.
        res.setHeader(
            'Content-Type',
            resource.resource_type || 'application/octet-stream'
        );

        // Tell the browser to download the file using its original name.
        res.attachment(resource.resource_name);

        // Stream the Firebase Storage file to the client.
        const downloadStream = storageFile.createReadStream();

        downloadStream.on('error', (error) => {
            console.error('Error downloading resource:', error);

            if (!res.headersSent) {
                return res.status(500).json({
                    message: 'Failed to download resource.',
                });
            }

            res.end();
        });

        downloadStream.pipe(res);
    } catch (error) {
        console.error('Error downloading resource:', error);

        if (!res.headersSent) {
            return res.status(500).json({
                message: 'Failed to download resource.',
            });
        }

        res.end();
    }
};

module.exports = {
    uploadResource,
    getResourcesByProject,
    getResourceById,
    downloadResource,
};