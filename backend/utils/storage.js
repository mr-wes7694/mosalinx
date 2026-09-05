const path = require('path');

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

module.exports = {
    sanitizeFileName,
    buildResourceStoragePath,
};
