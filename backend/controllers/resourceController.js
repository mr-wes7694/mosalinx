const fs = require('fs');
const path = require('path');

const {
    createResource,
    updateResourceStoragePath,
    deleteResourceById,
    findResourceById,
    findResourcesByProject,
} = require('../models/resourceModel');

const { findUserByFirebaseUid } = require('../models/userModel');

// Store uploaded files in the backend/uploads folder.
const uploadsDirectory = path.join(__dirname, '../uploads');

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
    let localFilePath = null;

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

        // Create a folder for this project's resources.
        const projectUploadsDirectory = path.join(
            uploadsDirectory,
            String(projectId),
            'resources'
        );

        await fs.promises.mkdir(projectUploadsDirectory, {
            recursive: true,
        });

        // Add the resource ID to help keep uploaded filenames unique.
        const safeFileName = path.basename(file.originalname);

        const storageFileName = `${resource.resourceId}_${safeFileName}`;

        localFilePath = path.join(
            projectUploadsDirectory,
            storageFileName
        );

        // Save the uploaded file to the local backend storage folder.
        await fs.promises.writeFile(
            localFilePath,
            file.buffer
        );

        // Store a relative path in MySQL instead of a Firebase Storage path.
        const storagePath = path
            .join(
                'uploads',
                String(projectId),
                'resources',
                storageFileName
            )
            .replace(/\\/g, '/');

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

        // Remove the local file if it was created.
        if (localFilePath) {
            try {
                await fs.promises.unlink(localFilePath);
            } catch (cleanupError) {
                if (cleanupError.code !== 'ENOENT') {
                    console.error(
                        'Error cleaning up local file:',
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

        // Make sure the resource has a storage path.
        if (!resource.storage_path) {
            return res.status(404).json({
                message: 'Resource file is not available.',
            });
        }

        // Convert the database path into a local file path.
        const localFilePath = path.join(
            __dirname,
            '..',
            resource.storage_path
        );

        // Check that the local file exists.
        try {
            await fs.promises.access(localFilePath, fs.constants.F_OK);
        } catch {
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

        // Stream the local file to the client.
        const downloadStream = fs.createReadStream(localFilePath);

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