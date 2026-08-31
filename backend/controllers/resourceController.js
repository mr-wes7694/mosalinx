const path = require('path');
const fs = require('fs');

const { createResource } = require('../models/resourceModel');

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

module.exports = {
    uploadResource,
};
