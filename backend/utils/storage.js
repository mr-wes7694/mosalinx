const path = require('path');

const { storageBucket } = require('../config/firebaseAdmin');

function sanitizeFileName(fileName) {
    return path
        .basename(fileName)
        .replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildResourceStoragePath(projectId, resourceId, fileName) {
    if (!projectId || !resourceId || !fileName) {
        throw new Error('projectId, resourceId, and fileName are required.');
    }

    const safeFileName = sanitizeFileName(fileName);

    return 'projects/' + projectId + '/resources/' + resourceId + '_' + safeFileName;
}

// Delete the Firebase Storage object for a resource.
const deleteResourceStorageFile = async (storagePath) => {
    if (!storagePath) {
        throw new Error('storagePath is required.');
    }

    const file = storageBucket.file(storagePath);

    try {
        await file.delete();
    } catch (error) {
        // Firebase returns this code when the file is already missing.
        if (error.code === 404) {
            return false;
        }

        throw error;
    }

    return true;
};

module.exports = {
    sanitizeFileName,
    buildResourceStoragePath,
    deleteResourceStorageFile,
};
