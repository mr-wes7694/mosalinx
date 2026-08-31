const path = require('path');
const fs = require('fs');

const {
    createResource,
    findResourceById,
    findResourcesByProject,
} = require('../models/resourceModel');

const uploadResource = async (req, res) => {
    const { projectId, uploadedBy, category } = req.body;

    if (!projectId || !uploadedBy) {
        return res.status(400).json({
            message: 'projectId and uploadedBy are required.',
        });
    }

    if (!req.file) {
        return res.status(400).json({
            message: 'A file is required.',
        });
    }

    const file = req.file;

    try {
        const uploadDirectory = path.join(__dirname, '..', 'uploads');

        if (!fs.existsSync(uploadDirectory)) {
            fs.mkdirSync(uploadDirectory, { recursive: true });
        }

        const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFileName = Date.now() + '-' + safeFileName;
        const filePath = path.join(uploadDirectory, uniqueFileName);

        fs.writeFileSync(filePath, file.buffer);

        const storagePath = path.join('uploads', uniqueFileName).replace(/\\/g, '/');

        const resource = await createResource(
            projectId,
            uploadedBy,
            file.originalname,
            file.mimetype,
            file.size,
            category || null,
            storagePath
        );

        return res.status(201).json({
            message: 'Resource uploaded successfully.',
            resource,
        });
    } catch (error) {
        console.error('Error uploading resource:', error);

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
