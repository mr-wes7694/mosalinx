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

        // Create a temporary database record first.
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

        // Build the Firebase Storage path.
        const storagePath = buildResourceStoragePath(
            projectId,
            resource.resourceId,
            file.originalname
        );

        // Create a Firebase Storage file reference.
        firebaseFile = storageBucket.file(storagePath);

        // Upload the file to Firebase Storage.
        await firebaseFile.save(file.buffer, {
            metadata: {
                contentType: file.mimetype,
            },
        });

        // Save the Firebase Storage path in MySQL.
        await updateResourceStoragePath(
            resource.resourceId,
            storagePath
        );

        resource.storagePath = storagePath;

        return res.status(201).json({
            message: 'Resource uploaded successfully.',
            resource,
        });
    } catch (error) {
        console.error('Error uploading resource:', error);

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

        // Remove the Firebase file if it was created.
        if (firebaseFile) {
            try {
                await firebaseFile.delete();
            } catch (cleanupError) {
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

const downloadResource = async (req, res) => {
    const { resourceId } = req.params;

    if (!resourceId) {
        return res.status(400).json({
            message: 'resourceId is required.',
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

        // Make sure the resource has a Firebase Storage path.
        if (!resource.storage_path) {
            return res.status(404).json({
                message: 'Resource file is not available.',
            });
        }

        // Get the file from Firebase Storage.
        const firebaseFile = storageBucket.file(resource.storage_path);

        // Check that the file exists and get its metadata.
        const [exists] = await firebaseFile.exists();

        if (!exists) {
            return res.status(404).json({
                message: 'Resource file not found in storage.',
            });
        }

        const [metadata] = await firebaseFile.getMetadata();

        // Set the file information for the response.
        res.setHeader(
            'Content-Type',
            metadata.contentType || resource.resource_type || 'application/octet-stream'
        );

        if (metadata.size) {
            res.setHeader('Content-Length', metadata.size);
        }

        // Tell the browser to download the file using its original name.
        res.attachment(resource.resource_name);

        // Stream the file from Firebase Storage to the client.
        const downloadStream = firebaseFile.createReadStream();

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