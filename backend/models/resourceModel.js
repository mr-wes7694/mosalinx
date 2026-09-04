const pool = require('../config/database');

const createResource = async (
    projectId,
    uploadedBy,
    resourceName,
    resourceType,
    fileSize,
    category,
    storagePath
) => {
    const sql =
        'INSERT INTO resources ' +
        '(project_id, uploaded_by, resource_name, resource_type, file_size, category, storage_path) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?)';

    const [result] = await pool.query(sql, [
        projectId,
        uploadedBy,
        resourceName,
        resourceType,
        fileSize,
        category,
        storagePath,
    ]);

    return {
        resourceId: result.insertId,
        projectId,
        uploadedBy,
        resourceName,
        resourceType,
        fileSize,
        category,
        storagePath,
    };
};

// Update the local storage path after the MySQL resource ID is created.
const updateResourceStoragePath = async (resourceId, storagePath) => {
    const sql =
        'UPDATE resources SET storage_path = ? WHERE resource_id = ?';

    await pool.query(sql, [storagePath, resourceId]);
};

// Delete a resource record if the file upload fails.
const deleteResourceById = async (resourceId) => {
    const sql = 'DELETE FROM resources WHERE resource_id = ?';

    await pool.query(sql, [resourceId]);
};

const findResourceById = async (resourceId) => {
    const sql =
        'SELECT resource_id, project_id, uploaded_by, resource_name, ' +
        'resource_type, file_size, category, storage_path, uploaded_at, updated_at ' +
        'FROM resources WHERE resource_id = ? LIMIT 1';

    const [rows] = await pool.query(sql, [resourceId]);

    return rows[0] || null;
};

const findResourcesByProject = async (projectId) => {
    const sql =
        'SELECT resource_id, project_id, uploaded_by, resource_name, ' +
        'resource_type, file_size, category, storage_path, uploaded_at, updated_at ' +
        'FROM resources WHERE project_id = ? ORDER BY uploaded_at DESC';

    const [rows] = await pool.query(sql, [projectId]);

    return rows;
};

module.exports = {
    createResource,
    updateResourceStoragePath,
    deleteResourceById,
    findResourceById,
    findResourcesByProject,
};
