
const {
    createWorkspaceFile,
    updateResourceStoragePath,
    findWorkspaceFileById,
    findWorkspaceFilesByProject,
    updateWorkspaceFile,
    deleteResourceById,
    isProjectMember,
} = require('../models/resourceModel');

const { findUserByFirebaseUid } = require('../models/userModel');
const { checkProjectPermission } = require('../utils/projectPermissions');
const { storageBucket } = require('../config/firebaseAdmin');

const { deleteResourceStorageFile } = require('../utils/storage');

const FILE_TYPES = [
    'document',
    'spreadsheet',
    'presentation',
    'sql',
    'code',
];

const FOLDER_CATEGORIES = [
    'Documents',
    'Spreadsheets',
    'Presentations',
    'Database',
    'Source',
];

const getAuthenticatedUser = async (req, res) => {
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
        res.status(401).json({ message: 'Unauthorized.' });
        return null;
    }

    const user = await findUserByFirebaseUid(firebaseUid);

    if (!user) {
        res.status(404).json({
            message: 'Authenticated user is not registered in the database.',
        });
        return null;
    }

    return user;
};

const isValidId = (value) =>
    typeof value === 'string' && /^[1-9]\d*$/.test(value);

const isValidFileName = (value) =>
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= 255;

const getStoragePath = (projectId, resourceId, fileName) =>
    `projects/${projectId}/workspace/${resourceId}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}.json`;

const uploadJsonContent = async (storagePath, content) => {
    const file = storageBucket.file(storagePath);

    await file.save(Buffer.from(JSON.stringify(content), 'utf8'), {
        resumable: false,
        metadata: {
            contentType: 'application/json; charset=utf-8',
        },
    });
};

const readJsonContent = async (storagePath) => {
    const file = storageBucket.file(storagePath);
    const [exists] = await file.exists();

    if (!exists) {
        const error = new Error('Workspace file content was not found.');
        error.status = 404;
        throw error;
    }

    const [buffer] = await file.download();
    return JSON.parse(buffer.toString('utf8'));
};

// Create a Workspace file and save its initial content.
const createWorkspaceFileRecord = async (req, res) => {
    const { projectId, name, fileType, category, content } = req.body || {};

    if (!isValidId(String(projectId ?? ''))) {
        return res.status(400).json({
            message: 'A valid projectId is required.',
        });
    }

    if (!isValidFileName(name)) {
        return res.status(400).json({
            message: 'A valid file name of up to 255 characters is required.',
        });
    }

    if (!FILE_TYPES.includes(fileType)) {
        return res.status(400).json({
            message: 'Unsupported Workspace file type.',
        });
    }

    if (!FOLDER_CATEGORIES.includes(category)) {
        return res.status(400).json({
            message: 'Unsupported Workspace folder category.',
        });
    }

    if (content === undefined) {
        return res.status(400).json({
            message: 'File content is required.',
        });
    }

    let resource = null;
    let storagePath = null;
    let uploaded = false;

    try {
        const user = await getAuthenticatedUser(req, res);
        if (!user) return;

        const member = await isProjectMember(projectId, user.user_id);

        if (!member) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        // Create a database record first to obtain its ID.
        resource = await createWorkspaceFile(
            Number(projectId),
            user.user_id,
            name.trim(),
            fileType,
            Buffer.byteLength(JSON.stringify(content), 'utf8'),
            category,
            'pending/workspace'
        );

        storagePath = getStoragePath(projectId, resource.resourceId, name);

        await uploadJsonContent(storagePath, content);
        uploaded = true;

        await updateResourceStoragePath(resource.resourceId, storagePath);

        return res.status(201).json({
            message: 'Workspace file created successfully.',
            file: {
                ...resource,
                storagePath,
                content,
            },
        });
    } catch (error) {
        console.error('Error creating Workspace file:', error);

        if (uploaded && storagePath) {
            try {
                await deleteResourceStorageFile(storagePath);
            } catch (cleanupError) {
                console.error('Workspace storage cleanup failed:', cleanupError);
            }
        }

        if (resource?.resourceId) {
            try {
                await deleteResourceById(resource.resourceId);
            } catch (cleanupError) {
                console.error('Workspace record cleanup failed:', cleanupError);
            }
        }

        return res.status(500).json({
            message: 'Failed to create Workspace file.',
        });
    }
};

// List Workspace files in a project.
const listWorkspaceFiles = async (req, res) => {
    const { projectId } = req.params;

    if (!isValidId(projectId)) {
        return res.status(400).json({
            message: 'A valid projectId is required.',
        });
    }

    try {
        const user = await getAuthenticatedUser(req, res);
        if (!user) return;

        const member = await isProjectMember(projectId, user.user_id);

        if (!member) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        const files = await findWorkspaceFilesByProject(projectId);

        return res.status(200).json({ files });
    } catch (error) {
        console.error('Error listing Workspace files:', error);

        return res.status(500).json({
            message: 'Failed to list Workspace files.',
        });
    }
};

// Retrieve metadata and saved content for a Workspace file.
const getWorkspaceFile = async (req, res) => {
    const { resourceId } = req.params;

    if (!isValidId(resourceId)) {
        return res.status(400).json({
            message: 'A valid resourceId is required.',
        });
    }

    try {
        const user = await getAuthenticatedUser(req, res);
        if (!user) return;

        const file = await findWorkspaceFileById(resourceId);

        if (!file) {
            return res.status(404).json({
                message: 'Workspace file not found.',
            });
        }

        const member = await isProjectMember(file.project_id, user.user_id);

        if (!member) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        const content = await readJsonContent(file.storage_path);

        return res.status(200).json({
            file: {
                ...file,
                content,
            },
        });
    } catch (error) {
        console.error('Error retrieving Workspace file:', error);

        return res.status(error.status || 500).json({
            message: error.status ? error.message : 'Failed to retrieve Workspace file.',
        });
    }
};

// Update Workspace content and metadata.
const updateWorkspaceFileRecord = async (req, res) => {
    const { resourceId } = req.params;
    const { name, category, content } = req.body || {};

    if (!isValidId(resourceId)) {
        return res.status(400).json({
            message: 'A valid resourceId is required.',
        });
    }

    if (name !== undefined && !isValidFileName(name)) {
        return res.status(400).json({
            message: 'A valid file name of up to 255 characters is required.',
        });
    }

    if (category !== undefined && !FOLDER_CATEGORIES.includes(category)) {
        return res.status(400).json({
            message: 'Unsupported Workspace folder category.',
        });
    }

    if (name === undefined && category === undefined && content === undefined) {
        return res.status(400).json({
            message: 'At least one field to update is required.',
        });
    }

    try {
        const user = await getAuthenticatedUser(req, res);
        if (!user) return;

        const file = await findWorkspaceFileById(resourceId);

        if (!file) {
            return res.status(404).json({
                message: 'Workspace file not found.',
            });
        }

        const permission = await checkProjectPermission(
            file.project_id,
            user.user_id,
            ['owner', 'collaborator']
        );

        if (!permission.allowed) {
            return res.status(403).json({
                message: 'You are not a member of this project.',
            });
        }

        const isOwner = permission.role === 'owner';
        const isUploader = Number(file.uploaded_by) === Number(user.user_id);

        if (!isOwner && !isUploader) {
            return res.status(403).json({
                message: 'Only the original uploader or project owner can edit this file.',
            });
        }

        const updatedName = name === undefined ? file.resource_name : name.trim();
        const updatedCategory = category === undefined ? file.category : category;

        let updatedContent;

        if (content !== undefined) {
            updatedContent = content;

            // Keep the original path stable so updates replace the same object.
            await uploadJsonContent(
                file.storage_path,
                updatedContent
            );
        }

        const currentContent = content === undefined
            ? await readJsonContent(file.storage_path)
            : updatedContent;

        const metadataUpdated = await updateWorkspaceFile(
            resourceId,
            updatedName,
            Buffer.byteLength(JSON.stringify(currentContent), 'utf8'),
            updatedCategory
        );

        if (!metadataUpdated) {
            const error = new Error('Workspace file metadata could not be updated.');
            error.status = 404;
            throw error;
        }

        const updatedFile = await findWorkspaceFileById(resourceId);

        return res.status(200).json({
            message: 'Workspace file updated successfully.',
            file: {
                ...updatedFile,
                content: currentContent,
            },
        });
    } catch (error) {
        console.error('Error updating Workspace file:', error);

        return res.status(error.status || 500).json({
            message: error.status ? error.message : 'Failed to update Workspace file.',
        });
    }
};

module.exports = {
    createWorkspaceFileRecord,
    listWorkspaceFiles,
    getWorkspaceFile,
    updateWorkspaceFileRecord,
};
